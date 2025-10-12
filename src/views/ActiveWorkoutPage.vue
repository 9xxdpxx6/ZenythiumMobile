<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button></ion-back-button>
        </ion-buttons>
        <ion-title>{{ workout?.plan?.name || 'Тренировка' }}</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="finishWorkout" :disabled="finishing">
            <ion-icon :icon="checkmarkOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <div v-if="loading" class="loading-state">
        <ion-spinner name="crescent"></ion-spinner>
        <p>Загрузка тренировки...</p>
      </div>

      <div v-else-if="workout && exercises.length > 0">
        <ion-list>
          <ion-item-group v-for="exercise in exercises" :key="exercise.id">
            <ion-item-divider>
              <ion-label>{{ exercise.name }}</ion-label>
            </ion-item-divider>

            <!-- Existing sets -->
            <ion-item
              v-for="set in getExerciseSets(exercise.id)"
              :key="set.id"
            >
              <ion-label>
                <p>{{ set.weight }} кг × {{ set.reps }} повторений</p>
                <p>Отдых: {{ set.rest_seconds }} сек</p>
              </ion-label>
            </ion-item>

            <!-- Add new set form -->
            <ion-item>
              <ion-label position="stacked">Вес (кг)</ion-label>
              <ion-input
                v-model="newSets[exercise.id].weight"
                type="number"
                placeholder="0"
              ></ion-input>
            </ion-item>

            <ion-item>
              <ion-label position="stacked">Повторения</ion-label>
              <ion-input
                v-model="newSets[exercise.id].reps"
                type="number"
                placeholder="0"
              ></ion-input>
            </ion-item>

            <ion-item>
              <ion-label position="stacked">Отдых (сек)</ion-label>
              <ion-input
                v-model="newSets[exercise.id].rest_seconds"
                type="number"
                placeholder="60"
              ></ion-input>
            </ion-item>

            <ion-item>
              <ion-button
                expand="block"
                @click="addSet(exercise.id)"
                :disabled="addingSet"
              >
                <ion-spinner v-if="addingSet" name="crescent"></ion-spinner>
                <span v-else>Добавить подход</span>
              </ion-button>
            </ion-item>
          </ion-item-group>
        </ion-list>

        <div class="ion-padding">
          <ion-button
            expand="block"
            color="success"
            @click="finishWorkout"
            :disabled="finishing"
          >
            <ion-spinner v-if="finishing" name="crescent"></ion-spinner>
            <span v-else>Завершить тренировку</span>
          </ion-button>
        </div>
      </div>

      <div v-else class="empty-state">
        <ion-icon :icon="fitnessOutline" size="large"></ion-icon>
        <h2>Тренировка не найдена</h2>
        <p>Возможно, тренировка была удалена</p>
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
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonButton,
  IonIcon,
  IonList,
  IonItem,
  IonItemGroup,
  IonItemDivider,
  IonLabel,
  IonInput,
  IonSpinner,
  IonToast,
} from '@ionic/vue';
import {
  checkmarkOutline,
  fitnessOutline,
} from 'ionicons/icons';
import apiClient from '@/services/api';
import { 
  Workout, 
  Exercise, 
  WorkoutSet, 
  FinishWorkoutResponse, 
  ApiError 
} from '@/types/api';

const route = useRoute();
const router = useRouter();
const workoutId = computed(() => Number(route.params.id));

const workout = ref<Workout | null>(null);
const exercises = ref<Exercise[]>([]);
const loading = ref(false);
const addingSet = ref(false);
const finishing = ref(false);
const error = ref<string | null>(null);

const newSets = ref<Record<number, { weight: number; reps: number; rest_seconds: number }>>({});

const fetchWorkout = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    const response = await apiClient.get<Workout>(`/api/v1/workouts/${workoutId.value}`);
    workout.value = response.data;
    
    if (workout.value.plan_id) {
      await fetchExercises(workout.value.plan_id);
    }
  } catch (err) {
    error.value = (err as ApiError).message;
  } finally {
    loading.value = false;
  }
};

const fetchExercises = async (planId: number) => {
  try {
    const response = await apiClient.get<Exercise[]>(`/api/v1/plans/${planId}/exercises`);
    exercises.value = response.data;
    
    // Initialize new sets for each exercise
    exercises.value.forEach(exercise => {
      newSets.value[exercise.id] = {
        weight: 0,
        reps: 0,
        rest_seconds: 60,
      };
    });
  } catch (err) {
    error.value = (err as ApiError).message;
  }
};

const getExerciseSets = (exerciseId: number) => {
  return workout.value?.sets?.filter(set => set.exercise_id === exerciseId) || [];
};

const addSet = async (exerciseId: number) => {
  const setData = newSets.value[exerciseId];
  
  if (!setData.weight || !setData.reps) {
    error.value = 'Заполните вес и повторения';
    return;
  }

  addingSet.value = true;
  error.value = null;
  
  try {
    await apiClient.post('/api/v1/workout-sets', {
      workout_id: workoutId.value,
      exercise_id: exerciseId,
      weight: setData.weight,
      reps: setData.reps,
      rest_seconds: setData.rest_seconds,
    });
    
    // Reset form
    newSets.value[exerciseId] = {
      weight: 0,
      reps: 0,
      rest_seconds: 60,
    };
    
    // Refresh workout data
    await fetchWorkout();
  } catch (err) {
    error.value = (err as ApiError).message;
  } finally {
    addingSet.value = false;
  }
};

const finishWorkout = async () => {
  finishing.value = true;
  error.value = null;
  
  try {
    await apiClient.post<FinishWorkoutResponse>(`/api/v1/workouts/${workoutId.value}/finish`);
    router.push('/tabs/workouts');
  } catch (err) {
    error.value = (err as ApiError).message;
  } finally {
    finishing.value = false;
  }
};

const clearError = () => {
  error.value = null;
};

onMounted(() => {
  fetchWorkout();
});
</script>

<style scoped>
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
</style>
