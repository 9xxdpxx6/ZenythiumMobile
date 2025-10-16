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
                    v-for="groupedSet in groupAndFormatSets(historyItem.sets)" 
                    :key="`${groupedSet.weight}-${groupedSet.reps}-${groupedSet.count}`"
                    class="set-item"
                  >
                    <div class="vertical-fraction">
                      <div class="numerator">{{ formatWeight(groupedSet.weight) }}</div>
                      <div class="denominator">{{ groupedSet.reps }}</div>
                    </div>
                    <span v-if="groupedSet.count > 1" class="multiplier">× {{ groupedSet.count }}</span>
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
                v-for="groupedSet in groupAndFormatSets(getCurrentSets(exercise.id))" 
                :key="`${groupedSet.weight}-${groupedSet.reps}-${groupedSet.count}`"
                class="current-set-item"
              >
                <div class="vertical-fraction">
                  <div class="numerator">{{ formatWeight(groupedSet.weight) }}</div>
                  <div class="denominator">{{ groupedSet.reps }}</div>
                </div>
                <span v-if="groupedSet.count > 1" class="multiplier">× {{ groupedSet.count }}</span>
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
                  :placeholder="getPlaceholderValue(exercise.id, 'weight')"
                  class="weight-input"
                  @input="validateInput($event, exercise.id, 'weight')"
                ></ion-input>
              </div>
              <div class="input-field">
                <label>Повт</label>
                <ion-input
                  v-model="newSets[exercise.id].reps"
                  type="number"
                  :placeholder="getPlaceholderValue(exercise.id, 'reps')"
                  class="reps-input"
                  @input="validateInput($event, exercise.id, 'reps')"
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

const newSets = ref<Record<number, { weight: number | null; reps: number | null }>>({});

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
        
        // Проверяем, есть ли текущая тренировка в истории
        const currentWorkoutHistory = exercise.history?.find((h: any) => h.workout_id === workoutId.value);
        if (currentWorkoutHistory) {
          console.log(`📊 ActiveWorkoutPage: Found current workout history for ${exercise.exercise.name}:`, currentWorkoutHistory);
        } else {
          console.log(`⚠️ ActiveWorkoutPage: No current workout history found for ${exercise.exercise.name}`);
        }
      });
      
      // Initialize new sets for each exercise
      exercises.value.forEach(exercise => {
        newSets.value[exercise.id] = {
          weight: null,
          reps: null,
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
    
    if (currentWorkoutHistory) {
      console.log(`📊 ActiveWorkoutPage: Found ${currentWorkoutHistory.sets.length} sets for current workout`);
      return currentWorkoutHistory.sets || [];
    } else {
      console.log(`⚠️ ActiveWorkoutPage: No current workout history found in getCurrentSets`);
    }
  }
  return [];
};

const getLastHistoricalSet = (exerciseId: number) => {
  const exercise = exercises.value.find(ex => ex.id === exerciseId);
  if (exercise && exercise.history) {
    // Получаем историю предыдущих тренировок (исключая текущую)
    const previousHistory = exercise.history
      .filter((h: any) => h.workout_id !== workoutId.value)
      .sort((a: any, b: any) => new Date(b.workout_date).getTime() - new Date(a.workout_date).getTime()); // Сортируем по убыванию даты
    
    // Возвращаем последний подход из самой новой тренировки
    if (previousHistory.length > 0 && previousHistory[0].sets.length > 0) {
      return previousHistory[0].sets[previousHistory[0].sets.length - 1]; // Последний подход
    }
  }
  return null;
};

const getLastCurrentSet = (exerciseId: number) => {
  const exercise = exercises.value.find(ex => ex.id === exerciseId);
  if (!exercise?.history) return null;
  
  // Ищем текущую тренировку
  const currentWorkoutHistory = exercise.history.find((h: any) => h.workout_id === workoutId.value);
  if (!currentWorkoutHistory?.sets || currentWorkoutHistory.sets.length === 0) return null;
  
  // Возвращаем последний подход из текущей тренировки
  return currentWorkoutHistory.sets[currentWorkoutHistory.sets.length - 1];
};

const getPlaceholderValue = (exerciseId: number, field: 'weight' | 'reps') => {
  const lastSet = getLastHistoricalSet(exerciseId);
  if (lastSet) {
    if (field === 'weight') {
      return formatWeight(lastSet[field]);
    }
    return lastSet[field].toString();
  }
  return '';
};

const getPreviousSets = (exerciseId: number) => {
  const exercise = exercises.value.find(ex => ex.id === exerciseId);
  if (exercise && exercise.history) {
    // Возвращаем историю предыдущих тренировок (исключая текущую)
    // Сортируем по дате: старые сверху, новые снизу
    return exercise.history
      .filter((h: any) => h.workout_id !== workoutId.value)
      .sort((a: any, b: any) => new Date(a.workout_date).getTime() - new Date(b.workout_date).getTime());
  }
  return [];
};

const groupAndFormatSets = (sets: any[]) => {
  if (!sets || sets.length === 0) return [];
  
  // Группируем подходы по весу и повторениям
  const grouped = sets.reduce((acc, set) => {
    const key = `${set.weight}x${set.reps}`;
    if (!acc[key]) {
      acc[key] = {
        weight: set.weight,
        reps: set.reps,
        count: 0
      };
    }
    acc[key].count++;
    return acc;
  }, {} as Record<string, { weight: number; reps: number; count: number }>);
  
  // Преобразуем в массив и форматируем
  return Object.values(grouped).map((group) => {
    const typedGroup = group as { weight: number; reps: number; count: number };
    return {
      weight: typedGroup.weight,
      reps: typedGroup.reps,
      count: typedGroup.count,
      formatted: typedGroup.count === 1 
        ? `${formatWeight(typedGroup.weight)}/${typedGroup.reps}` // Одиночный подход как дробь
        : `${formatWeight(typedGroup.weight)}/${typedGroup.reps} × ${typedGroup.count}` // Группа с количеством
    };
  });
};

const formatWeight = (weight: number) => {
  // Округляем до целого, если после запятой только нули
  const rounded = Math.round(weight);
  if (Math.abs(weight - rounded) < 0.001) {
    return rounded.toString();
  }
  // Иначе показываем с десятичной частью
  return weight.toString();
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
  
  if (!setData.weight || !setData.reps || setData.weight <= 0 || setData.reps <= 0) {
    console.log('⚠️ ActiveWorkoutPage: Missing or invalid weight or reps');
    error.value = 'Заполните вес и повторения (положительные числа)';
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
    
    const response = await apiClient.post('/api/v1/workout-sets', {
      workout_id: workoutId.value,
      plan_exercise_id: exerciseId,
      weight: setData.weight,
      reps: setData.reps,
    });
    
    console.log('✅ ActiveWorkoutPage: Set added successfully');
    console.log('📊 ActiveWorkoutPage: API response:', response.data);
    
    // Получаем созданный подход из ответа
    const newSet = response.data.data;
    
    // Находим упражнение и обновляем его историю
    const exercise = exercises.value.find(ex => ex.id === exerciseId);
    if (exercise) {
      // Находим или создаем запись для текущей тренировки в истории
      let currentWorkoutHistory = exercise.history.find((h: any) => h.workout_id === workoutId.value);
      
      if (!currentWorkoutHistory) {
        // Создаем новую запись для текущей тренировки
        currentWorkoutHistory = {
          workout_id: workoutId.value,
          workout_date: workout.value?.started_at || new Date().toISOString(),
          sets: []
        };
        exercise.history.push(currentWorkoutHistory);
      }
      
      // Добавляем новый подход
      currentWorkoutHistory.sets.push({
        id: newSet.id,
        weight: newSet.weight,
        reps: newSet.reps
      });
      
      console.log('✅ ActiveWorkoutPage: Updated local state with new set');
    }
    
    // Reset form - устанавливаем значения из последнего текущего подхода или null для плейсхолдеров
    const lastCurrentSet = getLastCurrentSet(exerciseId);
    if (lastCurrentSet) {
      // Если есть сегодняшние подходы, используем значения последнего
      newSets.value[exerciseId] = {
        weight: lastCurrentSet.weight,
        reps: lastCurrentSet.reps,
      };
    } else {
      // Если нет сегодняшних подходов, оставляем null для плейсхолдеров
      newSets.value[exerciseId] = {
        weight: null,
        reps: null,
      };
    }
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

const validateInput = (event: any, exerciseId: number, field: 'weight' | 'reps') => {
  const value = event.target.value;
  
  // Разрешаем только цифры, запятую и точку
  const validPattern = /^[0-9.,]*$/;
  if (!validPattern.test(value)) {
    event.target.value = value.replace(/[^0-9.,]/g, '');
    return;
  }
  
  // Заменяем запятую на точку для корректного парсинга
  const normalizedValue = value.replace(',', '.');
  const numValue = parseFloat(normalizedValue);
  
  // Проверяем на отрицательные значения и ноль
  if (numValue < 0) {
    event.target.value = '';
    newSets.value[exerciseId][field] = null;
    return;
  }
  
  // Если значение валидно, обновляем состояние
  if (!isNaN(numValue) && numValue > 0) {
    newSets.value[exerciseId][field] = numValue;
  } else if (value === '') {
    newSets.value[exerciseId][field] = null;
  }
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
  display: flex;
  align-items: center;
  gap: 4px;
}

/* Vertical Fraction Styles */
.vertical-fraction {
  display: flex;
  flex-direction: column;
  align-items: center;
  line-height: 2;
  position: relative;
}

.numerator {
  font-size: 1.1rem;
  font-weight: 600;
}

.denominator {
  font-size: 1.1rem;
  font-weight: 500;
  opacity: 0.8;
}

.vertical-fraction::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background-color: currentColor;
  opacity: 0.6;
}

.multiplier {
  font-size: 1.1rem;
  font-weight: 500;
  opacity: 0.8;
}

/* Current Sets */
.current-sets {
  margin-bottom: 20px;
}

.current-label {
  font-size: 0.9rem;
  color: white;
  margin: 0 0 8px 0;
  font-weight: 600;
}

.current-sets-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.current-set-item {
  background: transparent;
  border: 2px solid var(--ion-color-primary);
  color: white;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 4px;
}

.current-set-item .vertical-fraction {
  display: flex;
  flex-direction: column;
  align-items: center;
  line-height: 2;
  position: relative;
}

.current-set-item .numerator {
  font-size: 1.1rem;
  font-weight: 600;
  color: white;
}

.current-set-item .denominator {
  font-size: 1.1rem;
  font-weight: 500;
  opacity: 0.9;
  color: white;
}

.current-set-item .vertical-fraction::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background-color: white;
  opacity: 0.8;
}

.current-set-item .multiplier {
  font-size: 1.1rem;
  font-weight: 500;
  opacity: 0.9;
  color: white;
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
