<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button></ion-back-button>
        </ion-buttons>
        <ion-title>Начать тренировку</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <div v-if="loading" class="loading-state">
        <ion-spinner name="crescent"></ion-spinner>
        <p>Подготовка тренировки...</p>
      </div>

      <div v-else class="start-workout-content">
        <div class="workout-info">
          <i class="fas fa-dumbbell workout-icon"></i>
          <h2>Готовы начать тренировку?</h2>
          <p>Система автоматически выберет подходящий план на основе вашего прогресса и активного цикла.</p>
        </div>

        <div class="ion-padding">
          <ion-button
            expand="block"
            :disabled="starting"
            @click="startWorkout"
            size="large"
          >
            <ion-spinner v-if="starting" name="crescent"></ion-spinner>
            <span v-else>Начать тренировку</span>
          </ion-button>
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
import { useRouter, useRoute } from 'vue-router';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonButton,
  IonSpinner,
  IonToast,
} from '@ionic/vue';
import apiClient from '@/services/api';
import { StartWorkoutResponse, ApiError } from '@/types/api';

const router = useRouter();
const route = useRoute();
const loading = ref(false);
const starting = ref(false);
const error = ref<string | null>(null);

const startWorkout = async () => {
  console.log('🚀 SelectPlanPage: Starting workout creation');
  
  starting.value = true;
  error.value = null;
  
  try {
    console.log('📡 SelectPlanPage: Sending POST request to /api/v1/workouts/start');
    const response = await apiClient.post<StartWorkoutResponse>('/api/v1/workouts/start', {});
    
    console.log('📡 SelectPlanPage: API response:', response);
    console.log('📡 SelectPlanPage: Response data:', response.data);
    console.log('💾 SelectPlanPage: Created workout:', response.data.data);
    console.log('🔍 SelectPlanPage: Workout structure:', JSON.stringify(response.data.data, null, 2));
    console.log('🔍 SelectPlanPage: Workout plan_id:', response.data.data?.plan_id);
    console.log('🔍 SelectPlanPage: Workout plan:', response.data.data?.plan);
    
    const workoutId = response.data.data.id;
    console.log('🔗 SelectPlanPage: Navigating to workout page with ID:', workoutId);
    
    router.push(`/workout/${workoutId}`);
  } catch (err) {
    console.error('❌ SelectPlanPage: Error creating workout:', err);
    error.value = (err as ApiError).message;
  } finally {
    starting.value = false;
  }
};

const clearError = () => {
  error.value = null;
};

onMounted(() => {
  console.log('🚀 SelectPlanPage: Component mounted');
  console.log('🔍 SelectPlanPage: Route params:', route.params);
  // Страница готова к запуску тренировки
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
.start-workout-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
  color: var(--ion-color-medium);
}

.workout-info {
  margin-bottom: 2rem;
}

.workout-icon {
  font-size: 4rem;
  color: var(--ion-color-primary);
  margin-bottom: 1rem;
}

.workout-info h2 {
  color: var(--ion-color-dark);
  margin-bottom: 1rem;
}

.workout-info p {
  color: var(--ion-color-medium);
  line-height: 1.5;
}

.loading-state ion-spinner {
  margin-bottom: 1rem;
}

.empty-state i {
  font-size: 4rem;
  margin-bottom: 1rem;
}
</style>
