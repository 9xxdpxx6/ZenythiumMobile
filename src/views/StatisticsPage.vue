<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/"></ion-back-button>
        </ion-buttons>
        <ion-title>Статистика</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="refreshAllData" :disabled="loading">
            <ion-icon :icon="refreshOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-refresher slot="fixed" @ionRefresh="handleRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <PageContainer>
        <LoadingState v-if="loading && !statistics" message="Загрузка статистики..." />

        <div v-else-if="statistics">
          <!-- KPI Cards Section -->
          <KPICardsWidget
            :statistics="statistics"
            :personal-records="records?.data?.personal_records"
          />

          <!-- Filters -->
          <StatisticsFilters
            v-model:date-from="filterDateFrom"
            v-model:date-to="filterDateTo"
            @change="handleFilterChange"
            @reset="handleFilterReset"
          />

          <!-- Charts Section -->
          <section class="stats-section" v-if="timeAnalytics">
            <h2 class="section-title">Аналитика</h2>
            
            <WorkoutVolumeChart
              :monthly-trends="timeAnalytics.monthly_trends"
            />

            <MuscleGroupDistributionChart
              :personal-records="records?.data?.personal_records"
              :balance-recommendation="balanceRecommendation"
            />

            <ProgressByExerciseChart
              :exercises="exerciseProgressData"
            />
          </section>

          <!-- Personal Records Table -->
          <section class="stats-section">
            <h2 class="section-title">Детальная статистика</h2>
            <PersonalRecordsTable
              :personal-records="records?.data?.personal_records"
              :limit="10"
            />
          </section>
        </div>

        <div v-else class="empty-state">
          <i class="fas fa-chart-bar" style="font-size: 3rem;"></i>
          <h2>Статистика недоступна</h2>
          <p>Начните тренировки для просмотра статистики</p>
        </div>
      </PageContainer>
    </ion-content>

    <ion-toast
      :is-open="!!error"
      :message="error"
      duration="3000"
      @didDismiss="clearError"
    ></ion-toast>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonToast,
  IonRefresher,
  IonRefresherContent,
  IonButton,
  IonButtons,
  IonIcon,
  IonBackButton,
} from '@ionic/vue';
import { refreshOutline } from 'ionicons/icons';
import { useDataFetching } from '@/composables/useDataFetching';
import { statisticsService } from '@/services/statistics.service';
import apiClient from '@/services/api';
import { statisticsApi } from '@/services/api';
import PageContainer from '@/components/ui/PageContainer.vue';
import LoadingState from '@/components/ui/LoadingState.vue';
import StatisticsFilters from '@/components/filters/StatisticsFilters.vue';
import KPICardsWidget from '@/components/widgets/KPICardsWidget.vue';
import WorkoutVolumeChart from '@/components/charts/WorkoutVolumeChart.vue';
import MuscleGroupDistributionChart from '@/components/charts/MuscleGroupDistributionChart.vue';
import PersonalRecordsTable from '@/components/shared/PersonalRecordsTable.vue';
import ProgressByExerciseChart from '@/components/charts/ProgressByExerciseChart.vue';
import type { 
  Statistics, 
  StatisticsResponse,
  ApiError, 
  TimeAnalytics, 
  RecordsResponse
} from '@/types/api';

const loading = ref(false);
const error = ref<string | null>(null);
const filterDateFrom = ref<Date | null>(null);
const filterDateTo = ref<Date | null>(null);

// Fetch statistics
const { data: statisticsData, loading: statsLoading, execute: fetchStatistics } = useDataFetching(
  async () => {
    const response = await apiClient.get<StatisticsResponse>('/api/v1/user/statistics');
    const processedData = {
      ...response.data.data,
      total_volume: typeof response.data.data.total_volume === 'string' 
        ? parseFloat(response.data.data.total_volume) || 0 
        : response.data.data.total_volume,
      weight_change_30_days: response.data.data.weight_change_30_days || 0,
    };
    return processedData;
  },
  { immediate: true }
);

const statistics = computed(() => statisticsData.value);

// Fetch time analytics
const { data: timeAnalyticsData, execute: fetchTimeAnalytics } = useDataFetching(
  async () => {
    const response = await statisticsApi.getTimeAnalytics();
    return response.data;
  },
  { immediate: true }
);

const timeAnalytics = computed(() => timeAnalyticsData.value);

// Fetch records
const { data: recordsData, execute: fetchRecords } = useDataFetching(
  async () => {
    const response = await statisticsApi.getRecords();
    return response;
  },
  { immediate: true }
);

const records = computed(() => recordsData.value);

// Computed properties
const balanceRecommendation = computed(() => {
  return timeAnalytics.value?.balance_analysis?.recommendations?.[0] || null;
});

const exerciseProgressData = computed(() => {
  if (!records.value?.data?.personal_records) return [];
  
  return records.value.data.personal_records.slice(0, 5).map((record: any) => ({
    name: record.exercise_name,
    data: [{
      date: record.achieved_date,
      weight: record.max_weight,
      reps: record.max_reps,
    }]
  }));
});

watch(statsLoading, (isLoading) => {
  loading.value = isLoading;
});

const refreshAllData = async () => {
  loading.value = true;
  try {
    await Promise.all([
      fetchStatistics(),
      fetchTimeAnalytics(),
      fetchRecords(),
    ]);
  } catch (err) {
    console.error('Error refreshing data:', err);
    error.value = (err as ApiError).message;
  } finally {
    loading.value = false;
  }
};

const handleRefresh = async (event: CustomEvent) => {
  await refreshAllData();
  event.detail.complete();
};

const handleFilterChange = () => {
  refreshAllData();
};

const handleFilterReset = () => {
  filterDateFrom.value = null;
  filterDateTo.value = null;
  refreshAllData();
};

const clearError = () => {
  error.value = null;
};

onMounted(() => {
  refreshAllData();
});
</script>

<style scoped>
.stats-section {
  margin-bottom: 32px;
}

.empty-state {
  text-align: center;
  padding: 48px 24px;
  color: var(--ion-color-medium);
}

.empty-state h2 {
  margin: 16px 0 8px 0;
  color: #ffffff;
}

.empty-state p {
  margin: 0;
  color: var(--ion-color-medium);
}
</style>