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
            <i class="fas fa-check"></i>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <div v-if="loading" class="loading-state">
        <ion-spinner name="crescent"></ion-spinner>
        <p>Загрузка тренировки...</p>
      </div>

      <div v-else-if="workout && exercises.length > 0" class="workout-container">
        <div 
          v-for="exercise in exercises" 
          :key="exercise.id"
          class="exercise-card"
        >
          <!-- Exercise Header -->
          <div class="exercise-header">
            <h3 class="exercise-title">{{ exercise.exercise.name }}</h3>
          </div>

          <!-- Previous Sets -->
          <div v-if="getPreviousSets(exercise.id).length > 0" class="previous-sets">
            <p class="previous-label">Предыдущие тренировки:</p>
            <div class="sets-list">
              <div 
                v-for="historyItem in getPreviousSets(exercise.id)" 
                :key="historyItem.workout_id"
                class="history-item"
              >
                <div class="history-date">{{ formatDate(historyItem.workout_date) }}</div>
                <div class="history-sets">
                  <span 
                    v-for="set in historyItem.sets" 
                    :key="set.id"
                    class="set-item"
                  >
                    {{ set.weight }}×{{ set.reps }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Current Sets -->
          <div v-if="getCurrentSets(exercise.id).length > 0" class="current-sets">
            <p class="current-label">Сегодня:</p>
            <div class="current-sets-list">
              <span 
                v-for="set in getCurrentSets(exercise.id)" 
                :key="set.id"
                class="current-set-item"
              >
                {{ set.weight }}×{{ set.reps }}
              </span>
            </div>
          </div>

          <!-- Today's Input -->
          <div class="today-input">
            <p class="today-label">Добавить подход:</p>
            <div class="input-row">
              <div class="input-field">
                <label>Вес</label>
                <ion-input
                  v-model="newSets[exercise.id].weight"
                  type="number"
                  placeholder="0"
                  class="weight-input"
                ></ion-input>
              </div>
              <div class="input-field">
                <label>Повт</label>
                <ion-input
                  v-model="newSets[exercise.id].reps"
                  type="number"
                  placeholder="0"
                  class="reps-input"
                ></ion-input>
              </div>
            </div>
            <ion-button 
              @click="addSet(exercise.id)" 
              :disabled="addingSet"
              expand="block"
              class="add-set-button"
            >
              <ion-spinner v-if="addingSet" name="crescent"></ion-spinner>
              <span v-else>Добавить подход</span>
            </ion-button>
          </div>
        </div>

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
        <i class="fas fa-dumbbell" style="font-size: 3rem;"></i>
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
  IonInput,
  IonSpinner,
  IonToast,
} from '@ionic/vue';
import apiClient from '@/services/api';
import { 
  Workout, 
  WorkoutSet, 
  PlanExercise,
  ExerciseHistory,
  FinishWorkoutResponse, 
  ApiError 
} from '@/types/api';

const route = useRoute();
const router = useRouter();
const workoutId = computed(() => Number(route.params.id));

const workout = ref<Workout | null>(null);
const exercises = ref<PlanExercise[]>([]);
const loading = ref(false);
const addingSet = ref(false);
const finishing = ref(false);
const error = ref<string | null>(null);

// Debug reactive state changes
console.log('🔧 ActiveWorkoutPage: Initial state:', {
  workoutId: workoutId.value,
  workout: workout.value,
  exercises: exercises.value,
  loading: loading.value,
  error: error.value
});

const newSets = ref<Record<number, { weight: number; reps: number }>>({});

const fetchWorkout = async () => {
  loading.value = true;
  error.value = null;
  
  console.log('🔍 ActiveWorkoutPage: Starting to fetch workout with ID:', workoutId.value);
  
  try {
    const response = await apiClient.get(`/api/v1/workouts/${workoutId.value}`);
    console.log('📡 ActiveWorkoutPage: API response:', response);
    console.log('📡 ActiveWorkoutPage: Response data:', response.data);
    
    // API возвращает WorkoutResource в поле data
    workout.value = response.data.data;
    console.log('💾 ActiveWorkoutPage: Parsed workout:', workout.value);
    console.log('🔍 ActiveWorkoutPage: Workout structure:', JSON.stringify(workout.value, null, 2));
    console.log('🔍 ActiveWorkoutPage: Workout plan_id:', workout.value?.plan_id);
    console.log('🔍 ActiveWorkoutPage: Workout plan:', workout.value?.plan);
    
    // Используем упражнения из ответа API
    if (workout.value?.exercises && workout.value.exercises.length > 0) {
      console.log('📋 ActiveWorkoutPage: Found exercises in workout response:', workout.value.exercises);
      exercises.value = workout.value.exercises || [];
      
      // Debug each exercise
      exercises.value.forEach(exercise => {
        console.log(`🔍 ActiveWorkoutPage: Exercise ${exercise.exercise.name}:`, {
          id: exercise.id,
          history: exercise.history,
          historyLength: exercise.history?.length || 0
        });
      });
      
      // Initialize new sets for each exercise
      exercises.value.forEach(exercise => {
        newSets.value[exercise.id] = {
          weight: 0,
          reps: 0,
        };
      });
      console.log('✅ ActiveWorkoutPage: Initialized exercises and new sets');
    } else {
      console.log('❌ ActiveWorkoutPage: No exercises found in workout');
      error.value = 'Тренировка не содержит упражнений';
    }
  } catch (err) {
    console.error('❌ ActiveWorkoutPage: Error fetching workout:', err);
    error.value = (err as ApiError).message;
  } finally {
    loading.value = false;
  }
};


const getExerciseSets = (exerciseId: number) => {
  // Получаем упражнение из списка
  const exercise = exercises.value.find(ex => ex.id === exerciseId);
  if (exercise && exercise.history) {
    // Возвращаем последние подходы из истории (текущая тренировка)
    const currentWorkoutHistory = exercise.history.find((h: any) => h.workout_id === workoutId.value);
    return currentWorkoutHistory?.sets || [];
  }
  
  // Fallback: ищем в старом формате
  return workout.value?.sets?.filter(set => (set as any).plan_exercise_id === exerciseId) || [];
};

const getCurrentSets = (exerciseId: number) => {
  const exercise = exercises.value.find(ex => ex.id === exerciseId);
  console.log(`🔍 ActiveWorkoutPage: getCurrentSets for exercise ${exerciseId}:`, {
    exercise: exercise?.exercise.name,
    history: exercise?.history,
    currentWorkoutId: workoutId.value
  });
  
  if (exercise && exercise.history) {
    // Возвращаем подходы текущей тренировки
    const currentWorkoutHistory = exercise.history.find((h: any) => h.workout_id === workoutId.value);
    console.log(`📊 ActiveWorkoutPage: Current workout history:`, currentWorkoutHistory);
    return currentWorkoutHistory?.sets || [];
  }
  return [];
};

const getPreviousSets = (exerciseId: number) => {
  const exercise = exercises.value.find(ex => ex.id === exerciseId);
  if (exercise && exercise.history) {
    // Возвращаем историю предыдущих тренировок (исключая текущую)
    return exercise.history.filter((h: any) => h.workout_id !== workoutId.value);
  }
  return [];
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
  });
};

const addSet = async (exerciseId: number) => {
  console.log('➕ ActiveWorkoutPage: Adding set for exercise:', exerciseId);
  
  const setData = newSets.value[exerciseId];
  console.log('📊 ActiveWorkoutPage: Set data:', setData);
  
  if (!setData.weight || !setData.reps) {
    console.log('⚠️ ActiveWorkoutPage: Missing weight or reps');
    error.value = 'Заполните вес и повторения';
    return;
  }

  addingSet.value = true;
  error.value = null;
  
  try {
    console.log('📡 ActiveWorkoutPage: Sending set data to API:', {
      workout_id: workoutId.value,
      plan_exercise_id: exerciseId,
      weight: setData.weight,
      reps: setData.reps,
    });
    
    await apiClient.post('/api/v1/workout-sets', {
      workout_id: workoutId.value,
      plan_exercise_id: exerciseId,
      weight: setData.weight,
      reps: setData.reps,
    });
    
    console.log('✅ ActiveWorkoutPage: Set added successfully');
    
    // Reset form
    newSets.value[exerciseId] = {
      weight: 0,
      reps: 0,
    };
    
    // Refresh workout data to get updated history
    await fetchWorkout();
  } catch (err) {
    console.error('❌ ActiveWorkoutPage: Error adding set:', err);
    error.value = (err as ApiError).message;
  } finally {
    addingSet.value = false;
  }
};

const finishWorkout = async () => {
  console.log('🏁 ActiveWorkoutPage: Finishing workout:', workoutId.value);
  
  finishing.value = true;
  error.value = null;
  
  try {
    console.log('📡 ActiveWorkoutPage: Sending finish request to API');
    await apiClient.post<FinishWorkoutResponse>(`/api/v1/workouts/${workoutId.value}/finish`);
    
    console.log('✅ ActiveWorkoutPage: Workout finished successfully');
    console.log('🔗 ActiveWorkoutPage: Navigating to workouts page');
    router.push('/tabs/workouts');
  } catch (err) {
    console.error('❌ ActiveWorkoutPage: Error finishing workout:', err);
    error.value = (err as ApiError).message;
  } finally {
    finishing.value = false;
  }
};

const clearError = () => {
  error.value = null;
};

onMounted(() => {
  console.log('🚀 ActiveWorkoutPage: Component mounted');
  console.log('🔍 ActiveWorkoutPage: Route params:', route.params);
  console.log('🔍 ActiveWorkoutPage: Workout ID from route:', workoutId.value);
  fetchWorkout();
});
</script>

<style scoped>
/* Container */
.workout-container {
  padding: 16px;
  max-width: 100%;
  background: var(--ion-background-color);
}

/* Exercise Card */
.exercise-card {
  background: var(--ion-card-background);
  border-radius: var(--ion-card-border-radius);
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

/* Exercise Header */
.exercise-header {
  margin-bottom: 16px;
}

.exercise-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--ion-text-color);
  margin: 0;
}

/* Previous Sets */
.previous-sets {
  margin-bottom: 20px;
}

.previous-label {
  font-size: 0.9rem;
  color: var(--ion-color-medium);
  margin: 0 0 8px 0;
  font-weight: 500;
}

.sets-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.set-item {
  font-size: 0.95rem;
  color: var(--ion-text-color);
  padding: 4px 0;
}

.history-item {
  margin-bottom: 8px;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.history-item:last-child {
  border-bottom: none;
}

.history-date {
  font-size: 0.85rem;
  color: var(--ion-color-medium);
  margin-bottom: 4px;
  font-weight: 500;
}

.history-sets {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.history-sets .set-item {
  background: rgba(255, 255, 255, 0.1);
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 0.9rem;
  color: var(--ion-text-color);
}

/* Current Sets */
.current-sets {
  margin-bottom: 20px;
}

.current-label {
  font-size: 0.9rem;
  color: var(--ion-color-primary);
  margin: 0 0 8px 0;
  font-weight: 600;
}

.current-sets-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.current-set-item {
  background: var(--ion-color-primary);
  color: white;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
}

/* Today's Input */
.today-input {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.today-label {
  font-size: 0.9rem;
  color: var(--ion-color-medium);
  margin: 0;
  font-weight: 500;
}

.input-row {
  display: flex;
  gap: 12px;
}

.input-field {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-field label {
  font-size: 0.8rem;
  color: var(--ion-color-medium);
  font-weight: 500;
}

.input-field ion-input {
  --background: rgba(255, 255, 255, 0.05);
  --color: var(--ion-text-color);
  --placeholder-color: var(--ion-color-medium);
  --padding-start: 12px;
  --padding-end: 12px;
  --padding-top: 12px;
  --padding-bottom: 12px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 1.1rem;
  font-weight: 600;
}

.input-field ion-input:focus-within {
  border-color: var(--ion-color-primary);
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
}

.add-set-button {
  --background: var(--ion-color-primary);
  --color: white;
  --border-radius: 12px;
  --padding-top: 12px;
  --padding-bottom: 12px;
  font-weight: 600;
  margin-top: 8px;
  box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.1);
}

/* Loading and Empty States */
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
  font-size: 4rem;
  margin-bottom: 1rem;
}

/* Finish Button */
.ion-padding {
  padding: 16px;
}

.ion-padding ion-button {
  --border-radius: 12px;
  --padding-top: 12px;
  --padding-bottom: 12px;
  font-weight: 600;
  box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.1);
}
</style>
