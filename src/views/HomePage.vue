<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>Главная</ion-title>
      </ion-toolbar>
    </ion-header>

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
          :active-cycles="(statistics as any)?.active_cycles_count"
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
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onActivated, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonRefresher,
  IonRefresherContent,
} from '@ionic/vue';
import { useDataFetching } from '@/composables/useDataFetching';
import { useModal } from '@/composables/useModal';
import apiClient from '@/services/api';
import { statisticsService } from '@/services/statistics.service';
import { workoutsService } from '@/services/workouts.service';
import PageContainer from '@/components/PageContainer.vue';
import LoadingState from '@/components/LoadingState.vue';
import DashboardHeader from '@/components/DashboardHeader.vue';
import QuickStatsWidget from '@/components/QuickStatsWidget.vue';
import ProgressChartWidget from '@/components/ProgressChartWidget.vue';
import AdditionalStatsWidget from '@/components/AdditionalStatsWidget.vue';
import MetricFormModal from '@/components/MetricFormModal.vue';
import type { Workout } from '@/types/models/workout.types';
import type { Statistics } from '@/types/api';
import type { MetricFormData } from '@/composables/useMetrics';

const router = useRouter();

const isInitialLoading = ref(true);
const isSavingMetric = ref(false);
const metricError = ref('');
const metricModal = useModal();
const metricFormData = ref<MetricFormData>({
  date: new Date(),
  weight: '',
  note: '',
});

// Fetch workouts
const { data: workoutsData, loading: workoutsLoading, execute: fetchWorkouts } = useDataFetching(
  async () => {
    const result = await workoutsService.getPaginated({ limit: 100, page: 1 });
    return result.data || [];
  },
  { immediate: true }
);

const workouts = computed(() => workoutsData.value as Workout[] || []);

// Fetch statistics
const { data: statisticsData, loading: statsLoading } = useDataFetching(
  () => statisticsService.getOverview(),
  { immediate: true }
);

const statistics = computed(() => statisticsData.value);

// Computed for total volume - convert string to number
const totalVolume = computed(() => {
  const volume = (statistics.value as any)?.total_volume;
  if (!volume) return 0;
  return typeof volume === 'string' ? parseFloat(volume) || 0 : volume;
});

// Fetch personal records
const { data: recordsData } = useDataFetching(
  async () => {
    try {
      const response = await apiClient.get('/user/records');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching records:', error);
      return null;
    }
  },
  { immediate: true }
);

// Fetch muscle group stats
const { data: muscleGroupStats } = useDataFetching(
  async () => {
    try {
      const response = await apiClient.get('/user/muscle-group-statistics');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching muscle group stats:', error);
      return null;
    }
  },
  { immediate: true }
);

const bestPersonalRecord = computed(() => {
  if (!recordsData.value?.personal_records || recordsData.value.personal_records.length === 0) {
    return null;
  }
  const sortedRecords = recordsData.value.personal_records.sort((a: any, b: any) => 
    (b.max_weight || 0) - (a.max_weight || 0)
  );
  return sortedRecords[0] || null;
});

const balanceAnalysis = computed(() => {
  return muscleGroupStats.value?.balance_analysis || null;
});

// Watch loading states
import { watch } from 'vue';
watch([workoutsLoading, statsLoading], ([workouts, stats]) => {
  isInitialLoading.value = workouts || stats;
});

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
    const selectedDate = new Date(metricFormData.value.date as any);
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
      date: selectedDate.toISOString().split('T')[0],
      weight: weight.toFixed(2),
      note: metricFormData.value.note || null
    };
    
    await apiClient.post('/metrics', metricData);
    
    window.dispatchEvent(new CustomEvent('metric-added'));
    await refreshAllData();
    handleCloseMetricModal();
  } catch (error: any) {
    console.error('Error saving metric:', error);
    if (error.response?.status === 422) {
      const errorData = error.response.data;
      if (errorData.errors?.date) {
        metricError.value = Array.isArray(errorData.errors.date) 
          ? errorData.errors.date[0] 
          : String(errorData.errors.date);
      } else {
        metricError.value = errorData.message || 'Ошибка валидации данных';
      }
    } else {
      metricError.value = 'Произошла ошибка при сохранении метрики';
    }
  } finally {
    isSavingMetric.value = false;
  }
};

const refreshAllData = async () => {
  await fetchWorkouts();
  window.dispatchEvent(new CustomEvent('homepage-refresh'));
};

const handleRefresh = async (event: CustomEvent) => {
  await refreshAllData();
  event.detail.complete();
};

// Event listeners
const handleWorkoutStarted = () => refreshAllData();
const handleWorkoutFinished = () => refreshAllData();
const handleWorkoutUpdated = () => refreshAllData();
const handleMetricAdded = () => refreshAllData();
const handleMetricUpdated = () => refreshAllData();
const handleVisibilityChange = () => {
  if (!document.hidden) refreshAllData();
};

onMounted(() => {
  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('workout-started', handleWorkoutStarted);
  window.addEventListener('workout-finished', handleWorkoutFinished);
  window.addEventListener('workout-updated', handleWorkoutUpdated);
  window.addEventListener('metric-added', handleMetricAdded);
  window.addEventListener('metric-updated', handleMetricUpdated);
});

onActivated(() => {
  refreshAllData();
});

onBeforeUnmount(() => {
  document.removeEventListener('visibilitychange', handleVisibilityChange);
  window.removeEventListener('workout-started', handleWorkoutStarted);
  window.removeEventListener('workout-finished', handleWorkoutFinished);
  window.removeEventListener('workout-updated', handleWorkoutUpdated);
  window.removeEventListener('metric-added', handleMetricAdded);
  window.removeEventListener('metric-updated', handleMetricUpdated);
});
</script>

<style scoped>
/* Минимальные стили - основная стилизация в компонентах */
</style>