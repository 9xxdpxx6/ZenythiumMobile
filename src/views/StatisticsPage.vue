<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>Статистика</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-refresher slot="fixed" @ionRefresh="handleRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <div class="page-content">
        <h1 class="page-title">Статистика</h1>

        <div v-if="loading" class="loading-state">
          <ion-spinner name="crescent"></ion-spinner>
          <p>Загрузка статистики...</p>
        </div>

        <div v-else-if="statistics">
          <div class="stats-grid">
            <div class="stat-card modern-card">
              <h3>Всего тренировок</h3>
              <div class="stat-value">{{ statistics.total_workouts }}</div>
            </div>

            <div class="stat-card modern-card">
              <h3>Время тренировок</h3>
              <div class="stat-value">{{ formatTime(statistics.total_training_time) }}</div>
            </div>

            <div class="stat-card modern-card">
              <h3>Активные циклы</h3>
              <div class="stat-value">{{ statistics.active_cycles_count }}</div>
            </div>

            <div class="stat-card modern-card">
              <h3>Частота тренировок (4 недели)</h3>
              <div class="stat-value">{{ statistics.training_frequency_4_weeks }} в неделю</div>
            </div>

            <div class="stat-card modern-card">
              <h3>Изменение веса (30 дней)</h3>
              <div class="stat-value" :class="getWeightChangeClass(statistics.weight_change_30_days)">
                {{ formatWeightChange(statistics.weight_change_30_days) }}
              </div>
            </div>
          </div>
        </div>

        <div v-else class="empty-state">
          <ion-icon :icon="statsChartOutline" size="large"></ion-icon>
          <h2>Статистика недоступна</h2>
          <p>Начните тренировки для просмотра статистики</p>
        </div>
      </div>
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
import { ref, onMounted } from 'vue';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonGrid,
  IonRow,
  IonCol,
  IonSpinner,
  IonToast,
  IonIcon,
  IonRefresher,
  IonRefresherContent,
} from '@ionic/vue';
import { statsChartOutline } from 'ionicons/icons';
import apiClient from '@/services/api';
import { Statistics, ApiError } from '@/types/api';

const statistics = ref<Statistics | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);

const fetchStatistics = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    const response = await apiClient.get<Statistics>('/api/v1/user/statistics');
    statistics.value = response.data;
  } catch (err) {
    error.value = (err as ApiError).message;
  } finally {
    loading.value = false;
  }
};

const handleRefresh = async (event: CustomEvent) => {
  await fetchStatistics();
  event.detail.complete();
};

const formatTime = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}ч ${minutes}м`;
  }
  return `${minutes}м`;
};

const formatWeightChange = (change: number) => {
  if (change > 0) {
    return `+${change.toFixed(1)} кг`;
  } else if (change < 0) {
    return `${change.toFixed(1)} кг`;
  }
  return '0 кг';
};

const getWeightChangeClass = (change: number) => {
  if (change > 0) {
    return 'weight-increase';
  } else if (change < 0) {
    return 'weight-decrease';
  }
  return '';
};

const clearError = () => {
  error.value = null;
};

onMounted(() => {
  fetchStatistics();
});
</script>

<style scoped>
/* Balanced layout with increased spacing - same as HomePage */
.page-content {
  padding: 16px !important;
  margin: 0 !important;
  padding-top: 12px !important;
  padding-bottom: 80px !important; /* Add space for tab bar (60px) + extra margin */
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
  color: var(--ion-color-medium);
}

.loading-state ion-spinner {
  margin-bottom: 1rem;
}

.empty-state ion-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.stat-value {
  font-size: 2rem;
  font-weight: bold;
  text-align: center;
  margin: 1rem 0;
}

.weight-increase {
  color: var(--ion-color-danger);
}

.weight-decrease {
  color: var(--ion-color-success);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
  margin-top: 16px;
}

.stat-card {
  text-align: center;
  padding: 24px !important;
}

.stat-card h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--ion-color-medium);
}

.stat-value {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--ion-color-primary);
  margin: 0;
}
</style>
