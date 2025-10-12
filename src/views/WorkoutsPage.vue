<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>Тренировки</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-refresher slot="fixed" @ionRefresh="handleRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <div class="workouts-page">
        <h1 class="page-title">Тренировки</h1>
        
        <ion-button
          expand="block"
          @click="$router.push('/select-plan')"
          class="modern-button ion-margin-bottom"
          size="large"
        >
          <i class="fas fa-plus" slot="start"></i>
          Начать тренировку
        </ion-button>

        <ion-list v-if="workouts.length > 0">
          <ion-item
            v-for="workout in workouts"
            :key="workout.id"
            button
            @click="handleWorkoutClick(workout)"
            class="workout-card"
          >
            <ion-label>
              <h2>{{ formatDate(workout.started_at) }}</h2>
              <p>{{ workout.plan?.name || 'План не найден' }}</p>
              <ion-chip
                :color="workout.status === 'active' ? 'warning' : 'success'"
              >
                {{ workout.status === 'active' ? 'Активна' : 'Завершена' }}
              </ion-chip>
            </ion-label>
            <i 
              :class="workout.status === 'active' ? 'fas fa-play' : 'fas fa-check-circle'"
              slot="end"
            ></i>
          </ion-item>
        </ion-list>

        <div v-else-if="!loading" class="empty-state modern-card">
          <i class="fas fa-dumbbell empty-icon"></i>
          <h2>Нет тренировок</h2>
          <p>Начните свою первую тренировку!</p>
        </div>

        <div v-if="loading" class="loading-state">
          <ion-spinner name="crescent"></ion-spinner>
          <p>Загрузка тренировок...</p>
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
import { useRouter } from 'vue-router';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonList,
  IonItem,
  IonLabel,
  IonChip,
  IonSpinner,
  IonToast,
  IonRefresher,
  IonRefresherContent,
} from '@ionic/vue';
import apiClient from '@/services/api';
import { Workout, ApiError } from '@/types/api';

const router = useRouter();
const workouts = ref<Workout[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

const fetchWorkouts = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    const response = await apiClient.get('/api/v1/workouts');
    // API может возвращать данные в разных форматах
    workouts.value = response.data.data || response.data || [];
  } catch (err) {
    console.error('Workouts fetch error:', err);
    error.value = (err as ApiError).message;
  } finally {
    loading.value = false;
  }
};

const handleRefresh = async (event: CustomEvent) => {
  await fetchWorkouts();
  event.detail.complete();
};

const handleWorkoutClick = (workout: Workout) => {
  if (workout.status === 'active') {
    router.push(`/workout/${workout.id}`);
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const clearError = () => {
  error.value = null;
};

onMounted(() => {
  fetchWorkouts();
});
</script>

<style scoped>
/* Balanced layout with increased spacing - same as HomePage */
.workouts-page {
  padding: 16px !important;
  margin: 0 !important;
  padding-top: 12px !important;
  padding-bottom: 80px !important; /* Add space for tab bar (60px) + extra margin */
}

.empty-state,
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
  color: var(--ion-color-medium);
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  color: var(--ion-color-primary);
}

.loading-state ion-spinner {
  margin-bottom: 1rem;
}
</style>
