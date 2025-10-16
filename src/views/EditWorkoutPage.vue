<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/tabs/workouts"></ion-back-button>
        </ion-buttons>
        <ion-title>Редактировать тренировку</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <div class="page-content">
        <div v-if="loading && !workout" class="loading-state">
          <ion-spinner name="crescent"></ion-spinner>
          <p>Загрузка тренировки...</p>
        </div>

        <div v-else-if="workout">
          <!-- Информация о тренировке -->
          <div class="workout-info">
            <h2>{{ workout.plan?.name || 'Тренировка' }}</h2>
            <p class="workout-date">{{ formatDate(workout.started_at) }}</p>
          </div>

          <!-- Поля редактирования -->
          <div class="edit-fields">
            <!-- Дата и время начала -->
            <div class="field-group">
              <label class="field-label">Дата и время начала</label>
              <VueDatePicker
                v-model="editData.started_at"
                format="dd.MM.yyyy HH:mm"
                :enable-time-picker="true"
                auto-apply
                :dark="true"
                locale="ru"
                :week-start="1"
                :month-name-format="'long'"
                :year-range="[2020, 2030]"
              />
            </div>

            <!-- Дата и время окончания -->
            <div class="field-group">
              <label class="field-label">Дата и время окончания</label>
              <VueDatePicker
                v-model="editData.finished_at"
                format="dd.MM.yyyy HH:mm"
                :enable-time-picker="true"
                auto-apply
                :dark="true"
                :min-date="editData.started_at || undefined"
                locale="ru"
                :week-start="1"
                :month-name-format="'long'"
                :year-range="[2020, 2030]"
              />
            </div>
          </div>

          <!-- Подходы -->
          <div class="sets-section">
            <div class="section-header">
              <h3>Подходы</h3>
            </div>

            <div v-if="Object.keys(groupedSets).length === 0" class="empty-sets">
              <p>Нет подходов</p>
            </div>

            <div v-else class="sets-list">
              <div
                v-for="(exerciseSets, exerciseName) in groupedSets"
                :key="exerciseName"
                class="exercise-group"
              >
                <div class="exercise-header">
                  <h4>{{ exerciseName }}</h4>
                  <ion-button
                    @click="addSetToExercise(String(exerciseName))"
                    fill="clear"
                    color="primary"
                    size="small"
                  >
                    <ion-icon :icon="addOutline"></ion-icon>
                  </ion-button>
                </div>
                
                <div class="sets-in-exercise">
                  <div
                    v-for="(set, index) in exerciseSets"
                    :key="set.id || `new-${index}`"
                    class="set-item"
                  >
                    <div class="set-info">
                      <div class="set-values">
                        <CustomInput
                          :model-value="set.weight?.toString() || ''"
                          @update:model-value="set.weight = $event && !isNaN(parseFloat($event)) ? parseFloat($event) : null"
                          type="number"
                          placeholder="Вес"
                          class="weight-input"
                        />
                        <span class="separator">x</span>
                        <CustomInput
                          :model-value="set.reps?.toString() || ''"
                          @update:model-value="set.reps = $event && !isNaN(parseInt($event)) ? parseInt($event) : null"
                          type="number"
                          placeholder="Повт."
                          class="reps-input"
                        />
                      </div>
                    </div>
                    <div class="set-actions">
                      <ion-button
                        @click="deleteSet(String(exerciseName), index)"
                        fill="clear"
                        color="danger"
                        size="small"
                      >
                        <ion-icon :icon="trashOutline"></ion-icon>
                      </ion-button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="error-state">
          <i class="fas fa-exclamation-triangle"></i>
          <h2>Ошибка загрузки</h2>
          <p>Не удалось загрузить тренировку</p>
          <CustomButton @click="loadWorkout">
            Попробовать снова
          </CustomButton>
        </div>
      </div>
    </ion-content>

    <!-- Hotbar with action buttons -->
    <div class="form-actions">
      <button
        v-if="setsToDelete.length > 0 || sets.some(set => set.id === 0)"
        type="button"
        class="modern-button warning-button"
        @click="restoreDeletedSets"
        :disabled="loading"
      >
        <i class="fas fa-undo"></i>
        Отменить изменения
      </button>

      <button
        type="button"
        class="modern-button primary-button"
        @click="saveWorkout"
        :disabled="loading"
      >
        <ion-spinner v-if="loading" name="crescent"></ion-spinner>
        <span v-else>
          <i class="fas fa-save"></i>
          Сохранить
        </span>
      </button>
    </div>

    <CustomToast
      :is-open="!!error"
      :message="error || ''"
      color="danger"
      @didDismiss="clearError"
    />
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
  IonSpinner,
  IonButtons,
  IonBackButton,
  IonButton,
  IonIcon,
} from '@ionic/vue';
import { trashOutline, addOutline } from 'ionicons/icons';
import CustomButton from '@/components/CustomButton.vue';
import CustomInput from '@/components/CustomInput.vue';
import CustomToast from '@/components/CustomToast.vue';
import VueDatePicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';
import apiClient from '@/services/api';
import { Workout, WorkoutSet, ApiError } from '@/types/api';

const route = useRoute();
const router = useRouter();

const workout = ref<Workout | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);

// Данные для редактирования
const editData = ref({
  started_at: null as Date | null,
  finished_at: null as Date | null,
});

// Подходы
const sets = ref<WorkoutSet[]>([]);
const setsToDelete = ref<number[]>([]); // Массив ID подходов для удаления

const workoutId = computed(() => {
  const id = route.params.id;
  return typeof id === 'string' ? parseInt(id) : null;
});

// Группировка подходов по упражнениям
const groupedSets = computed(() => {
  const groups: { [key: string]: WorkoutSet[] } = {};
  
  sets.value.forEach(set => {
    const exerciseName = set.exercise?.name || 'Неизвестное упражнение';
    if (!groups[exerciseName]) {
      groups[exerciseName] = [];
    }
    groups[exerciseName].push(set);
  });
  
  return groups;
});

const loadWorkout = async () => {
  if (!workoutId.value) return;
  
  loading.value = true;
  error.value = null;
  
  try {
    // Загружаем тренировку (она уже содержит упражнения с историей подходов)
    const response = await apiClient.get(`/api/v1/workouts/${workoutId.value}`);
    workout.value = response.data.data;
    
    // Инициализируем данные для редактирования
    if (workout.value) {
      editData.value.started_at = workout.value.started_at ? new Date(workout.value.started_at) : null;
      editData.value.finished_at = workout.value.finished_at ? new Date(workout.value.finished_at) : null;
    }
    
    // Извлекаем подходы из exercises.history
    // Структура: exercises -> history (массив тренировок) -> sets (подходы)
    const allSets: WorkoutSet[] = [];
    
    if (workout.value && workout.value.exercises) {
      workout.value.exercises.forEach((planExercise: any) => {
        if (planExercise.history && planExercise.history.length > 0) {
          // Ищем текущую тренировку в истории (где workout_id совпадает с текущей тренировкой)
          const currentWorkoutHistory = planExercise.history.find(
            (h: any) => h.workout_id === workoutId.value
          );
          
          if (currentWorkoutHistory && currentWorkoutHistory.sets) {
            currentWorkoutHistory.sets.forEach((set: any) => {
              allSets.push({
                id: set.id,
                workout_id: workoutId.value || 0,
                plan_exercise_id: planExercise.id,
                weight: set.weight,
                reps: set.reps,
                created_at: '',
                updated_at: '',
                exercise: planExercise.exercise
              });
            });
          }
        }
      });
    }
    
    sets.value = allSets;
    
    console.log('Loaded workout:', workout.value);
    console.log('Loaded sets:', sets.value);
  } catch (err) {
    console.error('Load workout error:', err);
    error.value = (err as ApiError).message;
  } finally {
    loading.value = false;
  }
};

const saveWorkout = async () => {
  if (!workoutId.value) return;
  
  loading.value = true;
  error.value = null;
  
  try {
    // Обновляем тренировку
    const workoutData: any = {
      plan_id: workout.value?.plan?.id // Передаем ID существующего плана
    };
    
    if (editData.value.started_at) {
      workoutData.started_at = editData.value.started_at.toISOString();
    }
    
    if (editData.value.finished_at) {
      workoutData.finished_at = editData.value.finished_at.toISOString();
    }
    
    await apiClient.put(`/api/v1/workouts/${workoutId.value}`, workoutData);
    
    // Удаляем помеченные подходы
    for (const setId of setsToDelete.value) {
      await apiClient.delete(`/api/v1/workout-sets/${setId}`);
    }
    
    // Обновляем подходы
    for (const set of sets.value) {
      if (set.id && set.id > 0) {
        // Обновляем существующий подход
        await apiClient.put(`/api/v1/workout-sets/${set.id}`, {
          weight: set.weight || 0, // Если null, то 0
          reps: set.reps || 0, // Если null, то 0
        });
      } else {
        // Создаем новый подход
        await apiClient.post('/api/v1/workout-sets', {
          workout_id: workoutId.value,
          plan_exercise_id: set.plan_exercise_id,
          weight: set.weight || 0, // Если null, то 0
          reps: set.reps || 0, // Если null, то 0
        });
      }
    }
    
    // Возвращаемся к списку тренировок
    router.push('/tabs/workouts');
  } catch (err) {
    console.error('Save workout error:', err);
    error.value = (err as ApiError).message;
  } finally {
    loading.value = false;
  }
};

const addSet = () => {
  // Показываем сообщение о том, что добавление новых подходов не поддерживается
  error.value = 'Добавление новых подходов пока не поддерживается. Можно редактировать только существующие подходы.';
};

const addSetToExercise = (exerciseName: string) => {
  // Находим упражнение в списке подходов
  const exerciseSets = sets.value.filter(set => set.exercise?.name === exerciseName);
  
  if (exerciseSets.length > 0) {
    // Берем данные из первого подхода этого упражнения
    const firstSet = exerciseSets[0];
    
    // Создаем новый подход
    const newSet: WorkoutSet = {
      id: 0, // Временный ID для новых подходов
      workout_id: workoutId.value || 0,
      plan_exercise_id: firstSet.plan_exercise_id,
      weight: null, // Пустое значение вместо 0
      reps: null, // Пустое значение вместо 0
      created_at: '',
      updated_at: '',
      exercise: firstSet.exercise
    };
    
    // Добавляем новый подход в конец списка подходов этого упражнения
    const lastIndex = sets.value.findLastIndex(set => set.exercise?.name === exerciseName);
    sets.value.splice(lastIndex + 1, 0, newSet);
  }
};

const deleteSet = (exerciseName: string, setIndex: number) => {
  // Находим все подходы этого упражнения
  const exerciseSets = sets.value.filter(set => set.exercise?.name === exerciseName);
  
  if (exerciseSets.length > 0 && setIndex < exerciseSets.length) {
    const setToDelete = exerciseSets[setIndex];
    
    // Если это существующий подход (с ID), добавляем его в список для удаления
    if (setToDelete.id && setToDelete.id > 0) {
      setsToDelete.value.push(setToDelete.id);
    }
    
    // Удаляем подход из локального списка (визуально)
    const globalIndex = sets.value.findIndex(set => 
      set.exercise?.name === exerciseName && 
      set.id === setToDelete.id &&
      set.weight === setToDelete.weight &&
      set.reps === setToDelete.reps
    );
    
    if (globalIndex !== -1) {
      sets.value.splice(globalIndex, 1);
    }
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

const restoreDeletedSets = () => {
  // Очищаем список для удаления
  setsToDelete.value = [];
  
  // Перезагружаем тренировку для восстановления удаленных подходов
  loadWorkout();
};

const handleBack = () => {
  // Если есть несохраненные изменения, показываем предупреждение
  if (setsToDelete.value.length > 0 || sets.value.some(set => set.id === 0)) {
    if (confirm('У вас есть несохраненные изменения. Вы уверены, что хотите покинуть страницу?')) {
      router.push('/tabs/workouts');
    }
  } else {
    router.push('/tabs/workouts');
  }
};

onMounted(() => {
  loadWorkout();
});
</script>

<style scoped>
.page-content {
  padding: 20px;
  padding-bottom: 140px; /* Увеличил отступ для хотбара */
}

.loading-state,
.error-state {
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

.error-state i {
  font-size: 4rem;
  margin-bottom: 1rem;
  color: var(--ion-color-warning);
}

.error-state h2 {
  margin: 0 0 8px 0;
  font-size: 1.5rem;
  color: var(--ion-text-color);
}

.error-state p {
  margin: 0 0 24px 0;
  font-size: 1rem;
}

.workout-info {
  margin-bottom: 24px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.workout-info h2 {
  margin: 0 0 8px 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--ion-text-color);
}

.workout-date {
  margin: 0;
  font-size: 1rem;
  color: var(--ion-color-medium);
}

.edit-fields {
  margin-bottom: 32px;
}

.field-group {
  margin-bottom: 20px;
}

.field-label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--ion-text-color);
}

/* Vue Datepicker стили */
:deep(.dp__input_wrap) {
  position: relative !important;
  display: flex !important;
  align-items: center !important;
}

:deep(.dp__input) {
  background: rgba(255, 255, 255, 0.05) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  border-radius: 12px !important;
  color: var(--ion-text-color) !important;
  padding: 12px 40px 12px 40px !important;
  height: 48px !important;
  font-size: 16px !important;
  width: 100% !important;
  box-sizing: border-box !important;
}

:deep(.dp__input::placeholder) {
  color: var(--ion-color-medium) !important;
}

:deep(.dp__input:focus) {
  border-color: var(--ion-color-primary) !important;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2) !important;
}

:deep(.dp__input_icon) {
  position: absolute !important;
  left: 6px !important;
  top: 50% !important;
  transform: translateY(-50%) !important;
  z-index: 2 !important;
  pointer-events: none !important;
}

:deep(.dp__input_clear) {
  position: absolute !important;
  right: 12px !important;
  top: 50% !important;
  transform: translateY(-50%) !important;
  z-index: 2 !important;
}

:deep(.dp__menu) {
  background: var(--ion-background-color) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  border-radius: 12px !important;
}

:deep(.dp__calendar_header) {
  background: var(--ion-background-color) !important;
}

:deep(.dp__calendar_header_item) {
  color: var(--ion-text-color) !important;
}

:deep(.dp__calendar_item) {
  color: var(--ion-text-color) !important;
}

:deep(.dp__date_selected) {
  background: var(--ion-color-primary) !important;
  color: white !important;
}

.sets-section {
  margin-bottom: 90px; /* Увеличил отступ снизу для хотбара */
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--ion-text-color);
}

.empty-sets {
  text-align: center;
  padding: 2rem;
  color: var(--ion-color-medium);
}

.sets-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.exercise-group {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
}

.exercise-header {
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.08);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.exercise-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--ion-text-color);
}

.sets-in-exercise {
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.set-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.set-info {
  flex: 1;
}

.set-values {
  display: flex;
  align-items: center;
  gap: 8px;
}

.weight-input,
.reps-input {
  width: 80px;
}

.separator {
  color: var(--ion-color-medium);
  font-weight: 600;
}

.set-actions {
  margin-left: 12px;
}

/* Hotbar styles */
.form-actions {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--ion-background-color);
  padding: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: row;
  gap: 12px;
  z-index: 1000;
}

.modern-button {
  background: var(--ion-color-primary);
  color: white;
  border: none;
  border-radius: 12px;
  padding: 14px 24px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 48px;
}

/* Когда есть изменения - кнопки делят ширину пополам */
.form-actions:has(.warning-button) .modern-button {
  flex: 1;
}

/* Когда нет изменений - кнопка "Сохранить" на всю ширину */
.form-actions:not(:has(.warning-button)) .modern-button {
  width: 100%;
}

.modern-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.modern-button.primary-button {
  background: var(--ion-color-primary);
}

.modern-button.secondary-button {
  background: rgba(255, 255, 255, 0.1);
  color: var(--ion-text-color);
}

.modern-button.warning-button {
  background: var(--ion-color-warning);
  color: white;
}

.modern-button i {
  font-size: 16px;
}

.modern-button ion-spinner {
  width: 20px;
  height: 20px;
}
</style>
