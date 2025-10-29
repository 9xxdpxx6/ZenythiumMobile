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
      <PageContainer>
        <LoadingState v-if="loading && !workout" message="Загрузка тренировки..." />

        <div v-else-if="workout">
          <WorkoutBasicInfo
            :workout-name="workout.plan?.name || 'Тренировка'"
            :workout-date="formatDate(workout.started_at)"
            :started-at="editData.started_at"
            :finished-at="editData.finished_at"
            @update:startedAt="editData.started_at = $event"
            @update:finishedAt="editData.finished_at = $event"
          />

          <WorkoutSetsEditor
            :sets="sets"
            :grouped-sets="groupedSets"
            :has-exercises="!!workout?.exercises && workout.exercises.length > 0"
            @add-set="addSetToExercise"
            @delete-set="deleteSet"
          />
        </div>

        <div v-else class="error-state">
          <i class="fas fa-exclamation-triangle"></i>
          <h2>Ошибка загрузки</h2>
          <p>Не удалось загрузить тренировку</p>
          <CustomButton @click="loadWorkout">
            Попробовать снова
          </CustomButton>
        </div>
      </PageContainer>
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
import PageContainer from '@/components/ui/PageContainer.vue';
import LoadingState from '@/components/ui/LoadingState.vue';
import CustomButton from '@/components/ui/CustomButton.vue';
import CustomToast from '@/components/ui/CustomToast.vue';
import WorkoutBasicInfo from '@/components/workout/WorkoutBasicInfo.vue';
import WorkoutSetsEditor from '@/components/workout/WorkoutSetsEditor.vue';
import { workoutsService } from '@/services/workouts.service';
import { useToast } from '@/composables/useToast';
import { Workout, WorkoutSet, ApiError } from '@/types/api';

const route = useRoute();
const router = useRouter();
const { showSuccess, showError } = useToast();

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
  
  // Сначала добавляем все упражнения из плана тренировки
  if (workout.value?.exercises) {
    workout.value.exercises.forEach((planExercise: any) => {
      const exerciseName = planExercise.exercise?.name || 'Неизвестное упражнение';
      groups[exerciseName] = [];
    });
  }
  
  // Затем добавляем существующие подходы
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
    workout.value = await workoutsService.getById(workoutId.value.toString()) as any;
    
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
    
  } catch (err) {
    console.error('Load workout error:', err);
    error.value = (err as ApiError).message;
  } finally {
    loading.value = false;
  }
};

const formatLocalDateTime = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
};

const saveWorkout = async () => {
  if (!workoutId.value) return;
  
  // Валидация: время окончания не может быть раньше времени начала
  if (editData.value.started_at && editData.value.finished_at && 
      editData.value.finished_at < editData.value.started_at) {
    error.value = 'Время окончания не может быть раньше времени начала';
    return;
  }
  
  loading.value = true;
  error.value = null;
  
  try {
    // Обновляем тренировку
    const workoutData: any = {
      plan_id: workout.value?.plan?.id // Передаем ID существующего плана
    };
    
    if (editData.value.started_at) {
      workoutData.started_at = formatLocalDateTime(editData.value.started_at);
    }
    
    if (editData.value.finished_at) {
      workoutData.finished_at = formatLocalDateTime(editData.value.finished_at);
    }
    
    await workoutsService.update(workoutId.value.toString(), workoutData);
    
    // Удаляем помеченные подходы
    for (const setId of setsToDelete.value) {
      await workoutsService.deleteSet(setId);
    }
    
    // Обновляем подходы
    for (const set of sets.value) {
      if (set.id && set.id > 0) {
        // Обновляем существующий подход
        await workoutsService.updateSet(set.id, {
          weight: set.weight || 0,
          reps: set.reps || 0,
        });
      } else {
        // Создаем новый подход
        await workoutsService.createSet({
          workout_id: workoutId.value,
          plan_exercise_id: set.plan_exercise_id,
          weight: set.weight || 0,
          reps: set.reps || 0,
        });
      }
    }
    
    // Уведомляем другие страницы об обновлении тренировки
    window.dispatchEvent(new CustomEvent('workout-updated', { 
      detail: { workoutId: workoutId.value } 
    }));
    
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
  // Находим упражнение в плане тренировки
  const planExercise = workout.value?.exercises?.find((pe: any) => 
    pe.exercise?.name === exerciseName
  );
  
  if (planExercise) {
    // Создаем новый подход
    const newSet: WorkoutSet = {
      id: 0, // Временный ID для новых подходов
      workout_id: workoutId.value || 0,
      plan_exercise_id: planExercise.id,
      weight: null, // Пустое значение вместо 0
      reps: null, // Пустое значение вместо 0
      created_at: '',
      updated_at: '',
      exercise: planExercise.exercise
    };
    
    // Добавляем новый подход в конец списка подходов этого упражнения
    const lastIndex = sets.value.findLastIndex(set => set.exercise?.name === exerciseName);
    if (lastIndex !== -1) {
      sets.value.splice(lastIndex + 1, 0, newSet);
    } else {
      // Если подходов к этому упражнению еще нет, добавляем в конец
      sets.value.push(newSet);
    }
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
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
  color: var(--ion-color-medium);
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

.no-sets-message {
  text-align: center;
  padding: 20px;
  color: var(--ion-color-medium);
  font-style: italic;
}

.no-sets-message p {
  margin: 0;
  font-size: 14px;
}

/* Hotbar styles - unique styles for EditWorkoutPage */

/* Когда есть изменения - кнопки делят ширину пополам */
.form-actions:has(.warning-button) .modern-button {
  flex: 1;
}

/* Когда нет изменений - кнопка "Сохранить" на всю ширину */
.form-actions:not(:has(.warning-button)) .modern-button {
  width: 100%;
}

.modern-button.warning-button {
  background: var(--ion-color-warning);
  color: white;
}

.modern-button.warning-button:hover:not(:disabled) {
  background: var(--ion-color-warning-shade);
}
</style>
