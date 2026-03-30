<template>
  <ion-page>
    <PageHeader title="Главная" />

    <ion-content :fullscreen="true">
      <ion-refresher slot="fixed" @ionRefresh="handleRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <PageContainer>
        <DashboardHeader @navigate="handleNavigate" />

        <QuickStatsWidget :workouts="workouts" />

        <ProgressChartWidget
          @view-metrics="handleViewMetrics"
          @add-metric="handleAddMetric"
        />

        <AdditionalStatsWidget
          :total-volume="totalVolume"
          :active-cycles="(statistics as ApiStatistics | null)?.active_cycles_count"
          :best-personal-record="bestPersonalRecord"
          :balance-analysis="balanceAnalysis"
        />

        <LoadingState v-if="isInitialLoading" message="Загрузка данных..." />
      </PageContainer>
    </ion-content>

    <MetricFormModal
      :is-open="metricModal.isOpen.value"
      v-model:form-data="metricFormData"
      :is-editing="false"
      :is-saving="isSavingMetric"
      :error="metricError"
      @close="handleCloseMetricModal"
      @save="handleSaveMetric"
    />

    <BasePackOfferModal
      :is-open="basePackModal.isOpen.value"
      :is-installing="isInstallingBasePack"
      @install="handleInstallBasePack"
      @skip="handleSkipBasePack"
    />
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage,
  IonContent,
  IonRefresher,
  IonRefresherContent,
} from '@ionic/vue';
import { useDataFetching } from '@/composables/useDataFetching';
import { useModal } from '@/composables/useModal';
import { useToast } from '@/composables/useToast';
import { metricsService } from '@/services/metrics.service';
import { statisticsService } from '@/services/statistics.service';
import { workoutsService } from '@/services/workouts.service';
import { exercisesService } from '@/services/exercises.service';
import PageContainer from '@/components/ui/PageContainer.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import LoadingState from '@/components/ui/LoadingState.vue';
import DashboardHeader from '@/components/widgets/DashboardHeader.vue';
import QuickStatsWidget from '@/components/widgets/QuickStatsWidget.vue';
import ProgressChartWidget from '@/components/widgets/ProgressChartWidget.vue';
import AdditionalStatsWidget from '@/components/widgets/AdditionalStatsWidget.vue';
import MetricFormModal from '@/components/modals/MetricFormModal.vue';
import BasePackOfferModal from '@/components/modals/BasePackOfferModal.vue';
import type { Workout } from '@/types/models/workout.types';
import type { Statistics as ApiStatistics } from '@/types/api';
import type { MetricFormData } from '@/composables/useMetrics';
import { formatLocalDate } from '@/utils/local-date';

const router = useRouter();
const { showSuccess, showError } = useToast();

const isInitialLoading = ref(true);
const isSavingMetric = ref(false);
const metricError = ref('');
const metricModal = useModal();

// Base pack offer (shown after registration)
const basePackModal = useModal();
const isInstallingBasePack = ref(false);
const metricFormData = ref<MetricFormData>({
  date: new Date(),
  weight: '',
  note: '',
});

// Fetch workouts
const { data: workoutsData, loading: workoutsLoading, execute: fetchWorkouts } = useDataFetching(
  async () => {
    const result = await workoutsService.getPaginated({ per_page: 100, page: 1 });
    return result.data || [];
  },
  { immediate: true, skipIfDataExists: true, cacheKey: 'homepage_workouts' }
);

const workouts = computed(() => workoutsData.value as Workout[] || []);

// Fetch statistics (overview: total_volume, active_cycles_count, …)
const { data: statisticsData, loading: statsLoading, execute: fetchStatistics } = useDataFetching(
  () => statisticsService.getOverview(),
  { immediate: true, skipIfDataExists: true, cacheKey: 'homepage_statistics' }
);

const statistics = computed(() => statisticsData.value);

// Computed for total volume - convert string to number
const totalVolume = computed(() => {
  const volume = (statistics.value as any)?.total_volume;
  if (!volume) return 0;
  return typeof volume === 'string' ? parseFloat(volume) || 0 : volume;
});

// Fetch personal records
const { data: recordsData, loading: recordsLoading, execute: fetchPersonalRecords } = useDataFetching(
  () => statisticsService.getPersonalRecords(),
  { immediate: true, skipIfDataExists: true, cacheKey: 'homepage_personal_records' }
);

// Fetch muscle group stats
const { data: muscleGroupStats, loading: muscleGroupsLoading, execute: fetchMuscleGroupStats } = useDataFetching(
  () => statisticsService.getMuscleGroupStatistics(),
  { immediate: true, skipIfDataExists: true, cacheKey: 'homepage_muscle_groups' }
);

const bestPersonalRecord = computed(() => {
  const records = (recordsData.value as any) || [];
  if (!Array.isArray(records) || records.length === 0) return null;
  const sorted = [...records].sort((a: any, b: any) => (b.max_weight || 0) - (a.max_weight || 0));
  return sorted[0] || null;
});

const balanceAnalysis = computed(() => muscleGroupStats.value?.balance_analysis || null);

// Watch loading states — пока все блоки главной не загрузились, показываем общий LoadingState
import { watch } from 'vue';
watch(
  [workoutsLoading, statsLoading, recordsLoading, muscleGroupsLoading],
  ([w, s, r, m]) => {
    isInitialLoading.value = w || s || r || m;
  }
);

const handleNavigate = (path: string) => {
  router.push(path);
};

const handleViewMetrics = () => {
  router.push('/metrics');
};

const handleAddMetric = () => {
  metricFormData.value = {
    date: new Date(),
    weight: '',
    note: '',
  };
  metricError.value = '';
  metricModal.open();
};

const handleCloseMetricModal = () => {
  metricModal.close();
  metricError.value = '';
  metricFormData.value = {
    date: null,
    weight: '',
    note: '',
  };
};

const handleSaveMetric = async () => {
  if (!metricFormData.value.weight || !metricFormData.value.date) return;
  
  metricError.value = '';
  isSavingMetric.value = true;
  
  try {
    const selectedDate = metricFormData.value.date as Date;
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    if (selectedDate > today) {
      metricError.value = 'Дата не может быть в будущем';
      return;
    }
    
    const weight = parseFloat(metricFormData.value.weight);
    if (isNaN(weight) || weight <= 0 || weight > 1000) {
      metricError.value = 'Вес должен быть от 0 до 1000 кг';
      return;
    }
    
    const metricData = {
      date: formatLocalDate(selectedDate),
      weight: weight.toFixed(2),
      note: metricFormData.value.note || null
    };
    
    await metricsService.create(metricData as any);
    
    window.dispatchEvent(new CustomEvent('metric-added'));
    await refreshAllData();
    handleCloseMetricModal();
  } catch (error: any) {
    console.error('Error saving metric:', error);
    // Our interceptor transforms errors to { message, errors }
    if (error?.response?.status === 422 && error.response?.data) {
      const errorData = error.response.data;
      if (errorData.errors?.date) {
        metricError.value = Array.isArray(errorData.errors.date)
          ? errorData.errors.date[0]
          : String(errorData.errors.date);
      } else {
        metricError.value = errorData.message || 'Ошибка валидации данных';
      }
    } else if (error?.message) {
      metricError.value = String(error.message);
    } else {
      metricError.value = 'Произошла ошибка при сохранении метрики';
    }
  } finally {
    isSavingMetric.value = false;
  }
};

// ── Base pack offer handlers ──
const checkBasePackOffer = async () => {
  const shouldShow = localStorage.getItem('show_base_pack_offer');
  if (!shouldShow) return;

  try {
    const status = await exercisesService.getBasePackStatus();
    if (!status.data.installed) {
      basePackModal.open();
    } else {
      localStorage.removeItem('show_base_pack_offer');
    }
  } catch {
    // Non-critical — silently skip if the check fails
    localStorage.removeItem('show_base_pack_offer');
  }
};

const handleInstallBasePack = async () => {
  isInstallingBasePack.value = true;
  try {
    const result = await exercisesService.installBasePack();
    const created = result.data.created;
    await showSuccess(`Установлено ${created} упражнений`);
    localStorage.removeItem('show_base_pack_offer');
    basePackModal.close();
  } catch {
    await showError('Не удалось установить базовый набор');
  } finally {
    isInstallingBasePack.value = false;
  }
};

const handleSkipBasePack = () => {
  localStorage.removeItem('show_base_pack_offer');
  basePackModal.close();
};

const refreshAllData = async () => {
  await Promise.all([
    fetchWorkouts(),
    fetchStatistics(),
    fetchPersonalRecords(),
    fetchMuscleGroupStats(),
  ]);
  // Виджеты (например ProgressChartWidget) могут подписаться на своё обновление
  window.dispatchEvent(new CustomEvent('homepage-refresh'));
};

const handleRefresh = async (event: CustomEvent) => {
  await refreshAllData();
  event.detail.complete();
};

// ── Throttled event handler ──
// Multiple events (workout-finished, visibilitychange, metric-added…) can fire
// almost simultaneously. We coalesce them into a single refreshAllData() call.
let refreshTimer: NodeJS.Timeout | null = null;
const REFRESH_THROTTLE_MS = 500;

const throttledRefresh = () => {
  if (refreshTimer) return; // already scheduled
  refreshTimer = setTimeout(async () => {
    refreshTimer = null;
    await refreshAllData();
  }, REFRESH_THROTTLE_MS);
};

const handleVisibilityChange = () => {
  if (!document.hidden) throttledRefresh();
};

onMounted(() => {
  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('workout-started', throttledRefresh);
  window.addEventListener('workout-finished', throttledRefresh);
  window.addEventListener('workout-updated', throttledRefresh);
  window.addEventListener('metric-added', throttledRefresh);
  window.addEventListener('metric-updated', throttledRefresh);

  // Show base pack offer for newly registered users
  checkBasePackOffer();
});

onBeforeUnmount(() => {
  if (refreshTimer) { clearTimeout(refreshTimer); refreshTimer = null; }
  document.removeEventListener('visibilitychange', handleVisibilityChange);
  window.removeEventListener('workout-started', throttledRefresh);
  window.removeEventListener('workout-finished', throttledRefresh);
  window.removeEventListener('workout-updated', throttledRefresh);
  window.removeEventListener('metric-added', throttledRefresh);
  window.removeEventListener('metric-updated', throttledRefresh);
});
</script>

<style scoped>
/* Минимальные стили - основная стилизация в компонентах */
</style>