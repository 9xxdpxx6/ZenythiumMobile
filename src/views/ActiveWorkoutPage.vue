<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button @click="router.back()">
            <i class="fas fa-arrow-left"></i>
          </ion-button>
        </ion-buttons>
        <ion-title>Активная тренировка</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <div v-if="loading" class="loading-state">
        <ion-spinner name="crescent"></ion-spinner>
        <p>Загрузка тренировки...</p>
      </div>

      <div v-else-if="workout && exercises.length > 0" class="workout-container">
        <!-- Workout Title -->
        <div class="workout-title-section">
          <h1 class="workout-title">{{ workout?.plan?.name || 'Тренировка' }}</h1>
          <p class="workout-start-time">{{ formatStartTime(workout?.started_at) }}</p>
        </div>

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
                    <div v-if="groupedSet.isSimple" class="simple-reps">
                      {{ groupedSet.reps }}<span v-if="groupedSet.count > 1"> × {{ groupedSet.count }}</span>
                    </div>
                    <div v-else class="vertical-fraction">
                      <div class="numerator">{{ formatWeight(groupedSet.weight) }}</div>
                      <div class="denominator">{{ groupedSet.reps }}</div>
                    </div>
                    <span v-if="!groupedSet.isSimple && groupedSet.count > 1" class="multiplier">× {{ groupedSet.count }}</span>
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
                  <div v-if="groupedSet.isSimple" class="simple-reps">
                    {{ groupedSet.reps }}<span v-if="groupedSet.count > 1"> × {{ groupedSet.count }}</span>
                  </div>
                  <div v-else class="vertical-fraction">
                    <div class="numerator">{{ formatWeight(groupedSet.weight) }}</div>
                    <div class="denominator">{{ groupedSet.reps }}</div>
                  </div>
                  <span v-if="!groupedSet.isSimple && groupedSet.count > 1" class="multiplier">× {{ groupedSet.count }}</span>
                  <button 
                    @click="deleteLastSetFromGroup(exercise.id, groupedSet)"
                    class="delete-button"
                    type="button"
                  >
                    <i class="fas fa-times delete-icon"></i>
                  </button>
                </span>
            </div>
          </div>

          <!-- Today's Input -->
          <div class="today-input">
            <p class="today-label">Добавить подход:</p>
            <div class="input-row">
              <div class="input-field">
                <CustomInput
                  :modelValue="newSets[exercise.id].weight?.toString() || ''"
                  label="Вес"
                  type="number"
                  :placeholder="getPlaceholderValue(exercise.id, 'weight')"
                  @update:modelValue="(value) => validateInput(value, exercise.id, 'weight')"
                />
              </div>
              <div class="input-field">
                <CustomInput
                  :modelValue="newSets[exercise.id].reps?.toString() || ''"
                  label="Повт"
                  type="number"
                  :placeholder="getPlaceholderValue(exercise.id, 'reps')"
                  @update:modelValue="(value) => validateInput(value, exercise.id, 'reps')"
                />
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
            :disabled="finishing || !canFinishWorkout"
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
  IonSpinner,
  IonToast,
} from '@ionic/vue';
import CustomInput from '@/components/CustomInput.vue';
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

const newSets = ref<Record<number, { weight: number | null; reps: number | null }>>({});

// Проверяем, есть ли подходы во всех упражнениях
const canFinishWorkout = computed(() => {
  if (exercises.value.length === 0) return false;
  
  return exercises.value.every(exercise => {
    const currentSets = getCurrentSets(exercise.id);
    return currentSets.length > 0;
  });
});

const fetchWorkout = async () => {
  loading.value = true;
  error.value = null;
  
  
  try {
    const response = await apiClient.get(`/api/v1/workouts/${workoutId.value}`);
    
    // API возвращает WorkoutResource в поле data
    workout.value = response.data.data;
    
    // Используем упражнения из ответа API
    if (workout.value?.exercises && workout.value.exercises.length > 0) {
      exercises.value = workout.value.exercises || [];
      
      // Debug each exercise
      exercises.value.forEach(exercise => {
        // Проверяем, есть ли текущая тренировка в истории
        const currentWorkoutHistory = exercise.history?.find((h: any) => h.workout_id === workoutId.value);
      });
      
      // Initialize new sets for each exercise
      exercises.value.forEach(exercise => {
        newSets.value[exercise.id] = {
          weight: null,
          reps: null,
        };
      });
    } else {
      error.value = 'Тренировка не содержит упражнений';
    }
  } catch (err) {
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
  
  if (exercise && exercise.history) {
    // Возвращаем подходы текущей тренировки
    const currentWorkoutHistory = exercise.history.find((h: any) => h.workout_id === workoutId.value);
    
    if (currentWorkoutHistory) {
      return currentWorkoutHistory.sets || [];
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
  
  // Сортируем подходы по ID (от старых к новым)
  const sortedSets = [...sets].sort((a, b) => (a.id || 0) - (b.id || 0));
  
  // Группируем подходы по весу и повторениям
  const grouped = sortedSets.reduce((acc, set) => {
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
    const isSimple = Number(typedGroup.weight) === 0;
    
    return {
      weight: typedGroup.weight,
      reps: typedGroup.reps,
      count: typedGroup.count,
      isSimple: isSimple,
      formatted: isSimple 
        ? (typedGroup.count === 1 
            ? `${typedGroup.reps}` // Простой формат для одиночного подхода
            : `${typedGroup.reps} × ${typedGroup.count}`) // Простой формат с количеством
        : (typedGroup.count === 1 
            ? `${formatWeight(typedGroup.weight)}/${typedGroup.reps}` // Обычная дробь для одиночного подхода
            : `${formatWeight(typedGroup.weight)}/${typedGroup.reps} × ${typedGroup.count}`) // Обычная дробь с количеством
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

const formatStartTime = (dateString: string | undefined) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const addSet = async (exerciseId: number) => {
  const setData = newSets.value[exerciseId];
  
  if (setData.weight === null || setData.weight === undefined || !setData.reps || setData.weight < 0 || setData.reps <= 0) {
    error.value = 'Заполните вес (≥0) и повторения (положительные числа)';
    return;
  }

  addingSet.value = true;
  error.value = null;
  
  try {
    const response = await apiClient.post('/api/v1/workout-sets', {
      workout_id: workoutId.value,
      plan_exercise_id: exerciseId,
      weight: setData.weight,
      reps: setData.reps,
    });
    
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
    error.value = (err as ApiError).message;
  } finally {
    addingSet.value = false;
  }
};

const deleteSet = async (exerciseId: number, setId: number) => {
  try {
    await apiClient.delete(`/api/v1/workout-sets/${setId}`);
    
    // Находим упражнение и удаляем подход из истории
    const exercise = exercises.value.find(ex => ex.id === exerciseId);
    if (exercise) {
      const currentWorkoutHistory = exercise.history.find((h: any) => h.workout_id === workoutId.value);
      if (currentWorkoutHistory) {
        // Удаляем подход из массива sets
        const setIndex = currentWorkoutHistory.sets.findIndex((s: any) => s.id === setId);
        if (setIndex !== -1) {
          currentWorkoutHistory.sets.splice(setIndex, 1);
        }
      }
    }
    
    // Обновляем значения в инпутах после удаления
    const lastCurrentSet = getLastCurrentSet(exerciseId);
    if (lastCurrentSet) {
      newSets.value[exerciseId] = {
        weight: lastCurrentSet.weight,
        reps: lastCurrentSet.reps,
      };
    } else {
      newSets.value[exerciseId] = {
        weight: null,
        reps: null,
      };
    }
  } catch (err) {
    error.value = (err as ApiError).message;
  }
};

const deleteLastSetFromGroup = async (exerciseId: number, groupedSet: { weight: number; reps: number; count: number }) => {
  // Находим упражнение и текущую тренировку
  const exercise = exercises.value.find(ex => ex.id === exerciseId);
  if (!exercise) return;
  
  const currentWorkoutHistory = exercise.history.find((h: any) => h.workout_id === workoutId.value);
  if (!currentWorkoutHistory) return;
  
  // Находим последний подход с такими же весом и повторениями
  const matchingSets = currentWorkoutHistory.sets.filter((s: any) => 
    s.weight === groupedSet.weight && s.reps === groupedSet.reps
  );
  
  if (matchingSets.length === 0) return;
  
  // Берем последний подход из группы
  const lastSet = matchingSets[matchingSets.length - 1];
  
  // Удаляем подход
  await deleteSet(exerciseId, lastSet.id);
};

const finishWorkout = async () => {
  finishing.value = true;
  error.value = null;
  
  try {
    await apiClient.post<FinishWorkoutResponse>(`/api/v1/workouts/${workoutId.value}/finish`);
    
    // Уведомляем другие страницы о завершении тренировки
    window.dispatchEvent(new CustomEvent('workout-finished', { 
      detail: { workoutId: workoutId.value } 
    }));
    
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

const validateInput = (value: string, exerciseId: number, field: 'weight' | 'reps') => {
  // Разрешаем только цифры, запятую и точку
  const validPattern = /^[0-9.,]*$/;
  if (!validPattern.test(value)) {
    return;
  }
  
  // Заменяем запятую на точку для корректного парсинга
  const normalizedValue = value.replace(',', '.');
  const numValue = parseFloat(normalizedValue);
  
  // Проверяем на отрицательные значения
  if (numValue < 0) {
    newSets.value[exerciseId][field] = null;
    return;
  }
  
  // Для повторений запрещаем 0, для веса разрешаем
  if (field === 'reps' && numValue === 0) {
    newSets.value[exerciseId][field] = null;
    return;
  }
  
  // Если значение валидно, обновляем состояние
  if (!isNaN(numValue) && (field === 'weight' ? numValue >= 0 : numValue > 0)) {
    newSets.value[exerciseId][field] = numValue;
  } else if (value === '') {
    newSets.value[exerciseId][field] = null;
  }
};

onMounted(() => {
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

/* Workout Title */
.workout-title-section {
  margin-bottom: 24px;
  text-align: left;
  padding-left: 0;
}

.workout-title {
  font-size: 22px !important;
  font-weight: 700 !important;
  color: var(--ion-text-color) !important;
  margin: 0 0 6px 0 !important;
  padding-left: 0 !important;
}

.workout-start-time {
  font-size: 14px !important;
  color: var(--ion-color-medium) !important;
  margin: 0 !important;
  padding-left: 0 !important;
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

.simple-reps {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--ion-text-color);
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

.current-set-item .simple-reps {
  font-size: 1.1rem;
  font-weight: 600;
  color: white;
}

.delete-button {
  background: transparent;
  border: none;
  padding: 4px;
  margin-left: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.delete-icon {
  font-size: 16px;
  color: #ff4444;
  font-weight: bold;
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

/* Убираем стили для ion-input, так как теперь используем CustomInput */
.input-field CustomInput {
  margin: 0;
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

/* Back Button */
ion-toolbar ion-button i {
  font-size: 20px;
  color: white;
}
</style>
