<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button @click="router.back()">
            <i class="fas fa-arrow-left"></i>
          </ion-button>
        </ion-buttons>
        <ion-title>Упражнения</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <div class="page-content">
        <div v-if="loading" class="loading-state">
          <ion-spinner name="crescent"></ion-spinner>
          <p>Загрузка упражнений...</p>
        </div>

        <div v-else-if="exercises.length > 0" class="exercises-container">
          <div class="exercises-header">
            <h1>Мои упражнения</h1>
            <p>{{ exercises.length }} упражнений</p>
          </div>

          <div class="exercises-list">
            <div 
              v-for="exercise in exercises" 
              :key="exercise.id"
              class="exercise-card modern-card"
            >
              <div class="exercise-header">
                <div class="exercise-icon">
                  <i class="fas fa-dumbbell"></i>
                </div>
                <div class="exercise-info">
                  <h3 class="exercise-name">{{ exercise.name }}</h3>
                  <div class="exercise-muscle-group">
                    {{ exercise.muscle_group.name }}
                  </div>
                </div>
              </div>
              
              <div v-if="exercise.description" class="exercise-description">
                {{ exercise.description }}
              </div>
            </div>
          </div>
        </div>

        <div v-else class="empty-state">
          <i class="fas fa-dumbbell empty-icon"></i>
          <h2>Нет упражнений</h2>
          <p>У вас пока нет созданных упражнений</p>
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
  IonButtons,
  IonButton,
  IonSpinner,
  IonToast,
} from '@ionic/vue';
import { DataService } from '@/services/data';
import { ExerciseResource } from '@/types/api';

const router = useRouter();
const exercises = ref<ExerciseResource[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

const clearError = () => {
  error.value = null;
};

const fetchExercises = async () => {
  loading.value = true;
  try {
    const response = await DataService.getExercises();
    exercises.value = response.data;
  } catch (err: any) {
    error.value = err.message || 'Ошибка загрузки упражнений';
    console.error('Failed to fetch exercises:', err);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchExercises();
});
</script>

<style scoped>
.page-content {
  padding: 4px !important;
  margin: 0 !important;
  padding-top: 4px !important;
  padding-bottom: 80px !important;
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

.empty-state i {
  font-size: 3rem;
  margin-bottom: 0.5rem;
  color: var(--ion-color-primary);
}

.empty-state h2 {
  margin: 0 0 6px 0;
  font-size: 1.3rem;
  color: var(--ion-text-color);
}

.empty-state p {
  margin: 0;
  font-size: 0.9rem;
}

.exercises-container {
  padding: 0 12px;
}

.exercises-header {
  margin-bottom: 20px;
}

.exercises-header h1 {
  margin: 0 0 4px 0;
  font-size: 1.5rem;
  color: var(--ion-text-color);
}

.exercises-header p {
  margin: 0;
  color: var(--ion-color-medium);
  font-size: 0.9rem;
}

.exercises-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.exercise-card {
  margin: 0 !important;
}

.exercise-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.exercise-icon {
  width: 40px;
  height: 40px;
  background: var(--ion-color-primary);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
}

.exercise-icon i {
  font-size: 16px;
  color: white;
}

.exercise-info {
  flex: 1;
}

.exercise-name {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--ion-text-color);
}

.exercise-muscle-group {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: var(--ion-color-medium);
}

.exercise-muscle-group i {
  font-size: 12px;
}

.exercise-description {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 14px;
  color: var(--ion-color-medium);
  line-height: 1.4;
}
</style>
