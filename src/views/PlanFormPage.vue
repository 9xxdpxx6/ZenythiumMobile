<template>
  <BasePage :swipe-back-options="{ onBeforeBack: handleSwipeBack }">
    <PageHeader :title="isEditMode ? 'Редактировать план' : 'Создать план'">
      <template #start>
          <ion-button @click="handleBack">
            <i class="fas fa-arrow-left"></i>
          </ion-button>
      </template>
    </PageHeader>

    <ion-content :fullscreen="true">
      <PageContainer>
        <h1 class="page-title">{{ isEditMode ? 'Редактирование плана' : 'Новый план' }}</h1>
        <p class="page-subtitle">{{ isEditMode ? 'Обновите информацию о плане тренировок' : 'Создайте новый план тренировок' }}</p>

        <LoadingState v-if="loading" message="Загрузка..." />

        <form v-else @submit.prevent="handleSubmit" class="plan-form">
          <PlanBasicInfo
            v-model:name="formData.name"
            v-model:isActive="formData.is_active"
            :errors="errors"
            @update:name="formData.name = $event"
            @update:isActive="formData.is_active = $event"
          />

          <PlanExercisesList
            :exercises="exercises"
            :is-edit-mode="!!isEditMode"
            @add-exercise="openExerciseModal"
            @reorder="handleExerciseReorder"
            @delete="showDeleteExerciseConfirmation"
          />

          <div class="form-actions">
            <button
              type="button"
              class="modern-button secondary-button"
              @click="handleBack"
              :disabled="submitting"
            >
              <i class="fas fa-times"></i>
              Отмена
            </button>

            <button
              type="submit"
              class="modern-button primary-button"
              :disabled="submitting"
            >
              <ion-spinner v-if="submitting" name="crescent"></ion-spinner>
              <span v-else>
                <i :class="isEditMode ? 'fas fa-save' : 'fas fa-plus'"></i>
                {{ isEditMode ? 'Сохранить' : 'Создать' }}
              </span>
            </button>
          </div>

          <!-- Delete Plan Button - только в режиме редактирования -->
          <div v-if="isEditMode" class="delete-plan-section">
            <button
              type="button"
              class="delete-plan-button"
              @click="showDeletePlanConfirmation"
              :disabled="submitting"
            >
              <i class="fas fa-trash"></i>
              Удалить план
            </button>
          </div>
        </form>
      </PageContainer>
    </ion-content>

    <!-- Exercise Selection Modal -->
    <ExerciseSelectionModal
      :is-open="exerciseModal.isOpen.value"
      :available-exercises="availableExercises"
      :loading-exercises="loadingExercises"
      @close="closeExerciseModal"
      @select-exercise="addExerciseToPlan"
      @create-new-exercise="createNewExercise"
      @search="handleExerciseSearch"
    />

    <!-- Delete Exercise Confirmation Dialog -->
    <DeleteConfirmationModal
      :is-open="deleteExerciseModal.isOpen.value"
      title="Подтверждение удаления"
      message="Вы уверены, что хотите удалить упражнение"
      :item-name="deleteExerciseModal.data.value?.name"
      warning-text="Это действие нельзя отменить."
      @confirm="confirmDeleteExercise"
      @cancel="cancelDeleteExercise"
    />

    <!-- Delete Plan Confirmation Dialog -->
    <DeleteConfirmationModal
      :is-open="deletePlanModal.isOpen.value"
      title="Подтверждение удаления"
      message="Вы уверены, что хотите удалить план"
      :item-name="formData.name"
      warning-text="Это действие нельзя отменить."
      :is-deleting="submitting"
      @confirm="confirmDeletePlan"
      @cancel="cancelDeletePlan"
    />

    <!-- Unsaved Changes Confirmation Dialog -->
    <UnsavedChangesModal
      :is-open="unsavedChangesModal.isOpen.value"
      @confirm="confirmLeave"
      @cancel="cancelLeave"
    />
  </BasePage>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import { useRouter, useRoute, onBeforeRouteLeave } from 'vue-router';
import {
  IonPage,
  IonContent,
  IonButton,
  IonSpinner,
} from '@ionic/vue';
import PageContainer from '@/components/ui/PageContainer.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import LoadingState from '@/components/ui/LoadingState.vue';
import PlanBasicInfo from '@/components/plan/PlanBasicInfo.vue';
import PlanExercisesList from '@/components/plan/PlanExercisesList.vue';
import ExerciseSelectionModal from '@/components/modals/ExerciseSelectionModal.vue';
import DeleteConfirmationModal from '@/components/modals/DeleteConfirmationModal.vue';
import UnsavedChangesModal from '@/components/modals/UnsavedChangesModal.vue';
import { plansService } from '@/services/plans.service';
import { useToast, useModal } from '@/composables';
import { ApiError, Exercise } from '@/types/api';

interface PlanFormData {
  name: string;
  is_active: boolean;
}

interface AvailableExercise {
  id: number;
  name: string;
  description?: string;
  muscle_group?: {
    id: number;
    name: string;
  };
  created_at: string;
  updated_at: string;
}

interface ValidationErrors {
  name?: string | string[];
}

const router = useRouter();
const route = useRoute();
const { showSuccess, showError, showWarning } = useToast();

const planId = computed(() => route.params.id as string);
const isEditMode = computed(() => planId.value && planId.value !== 'new');

const loading = ref(false);
const submitting = ref(false);
const errors = ref<ValidationErrors>({});

// Exercise management
const exercises = ref<Exercise[]>([]);
const availableExercises = ref<AvailableExercise[]>([]);
const exerciseModal = useModal();
const loadingExercises = ref(false);
const exerciseSearchTimeout = ref<NodeJS.Timeout | null>(null);
// Флаг hasExercisesChanged больше не нужен - порядок передается через массив exercise_ids

// Delete confirmation dialogs
const deletePlanModal = useModal();
const deleteExerciseModal = useModal<{ index: number; name: string }>();

// Unsaved changes confirmation
const unsavedChangesModal = useModal();
const pendingNavigation = ref<any>(null);
const hasUnsavedChanges = ref(false);
const initialFormData = ref<PlanFormData>({ name: '', is_active: true });
const initialExercises = ref<Exercise[]>([]);
const isLeaving = ref(false); // Флаг для предотвращения повторных проверок

// Swipe back handler for unsaved changes check
const handleSwipeBack = async (): Promise<boolean> => {
  if (checkForUnsavedChanges()) {
    pendingNavigation.value = () => router.back();
    unsavedChangesModal.open();
    return false; // Cancel navigation, show modal
  }
  return true; // Allow navigation
};

const formData = ref<PlanFormData>({
  name: '',
  is_active: true,
});

// Функция для получения первой ошибки из массива
const getFirstError = (error: string | string[] | undefined): string => {
  if (!error) return '';
  if (Array.isArray(error)) {
    return error[0] || '';
  }
  return error;
};

const validateForm = (): boolean => {
  errors.value = {};
  let isValid = true;

  if (!formData.value.name || formData.value.name.trim().length === 0) {
    errors.value.name = 'Название плана обязательно';
    isValid = false;
  } else if (formData.value.name.trim().length < 3) {
    errors.value.name = 'Название должно содержать минимум 3 символа';
    isValid = false;
  }

  return isValid;
};

const handleSubmit = async () => {
  if (!validateForm()) {
    showWarning('Пожалуйста, исправьте ошибки в форме');
    return;
  }

  submitting.value = true;
  errors.value = {};

  try {
    const payload: any = {
      name: formData.value.name.trim(),
      order: null,
      is_active: formData.value.is_active,
      exercise_ids: exercises.value.map(exercise => exercise.id),
    };

    if (isEditMode.value) {
      await plansService.update(planId.value, payload);
      showSuccess('План успешно обновлен');
    } else {
      await plansService.create(payload);
      showSuccess('План успешно создан');
    }

    initialFormData.value = { ...formData.value };
    initialExercises.value = [...exercises.value];

    window.dispatchEvent(new CustomEvent('plans-updated'));

    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    router.back();
  } catch (err) {
    console.error('Failed to save plan:', err);
    const apiError = err as ApiError;
    
    if (apiError.errors) {
      const processedErrors: ValidationErrors = {};
      Object.keys(apiError.errors).forEach(key => {
        const errorArray = apiError.errors![key];
        if (errorArray && errorArray.length > 0) {
          processedErrors[key as keyof ValidationErrors] = errorArray;
        }
      });
      errors.value = processedErrors;
    }

    showError(apiError.message || `Не удалось ${isEditMode.value ? 'обновить' : 'создать'} план`);
  } finally {
    submitting.value = false;
  }
};

// Функция для проверки наличия несохраненных изменений
const checkForUnsavedChanges = (): boolean => {
  // Если уже покидаем страницу, не проверяем изменения
  if (isLeaving.value) return false;
  
  // Проверяем изменения в форме
  const formChanged = 
    formData.value.name !== initialFormData.value.name ||
    formData.value.is_active !== initialFormData.value.is_active;
  
  // Проверяем изменения в упражнениях
  const exercisesChanged = 
    exercises.value.length !== initialExercises.value.length ||
    exercises.value.some((exercise, index) => {
      const initialExercise = initialExercises.value[index];
      return !initialExercise || 
             exercise.id !== initialExercise.id ||
             exercise.order !== initialExercise.order;
    });
  
  return formChanged || exercisesChanged;
};

// Функция для полного сброса состояния формы при создании нового плана
const resetFormState = () => {
  formData.value = {
    name: '',
    is_active: true,
  };
  exercises.value = [];
  errors.value = {};
  initialFormData.value = { name: '', is_active: true };
  initialExercises.value = [];
  
  // Закрываем все модальные окна
  exerciseModal.close();
  deleteExerciseModal.close();
  deletePlanModal.close();
  unsavedChangesModal.close();
  pendingNavigation.value = null;
};

const handleBack = () => {
  if (checkForUnsavedChanges()) {
    pendingNavigation.value = () => router.back();
    unsavedChangesModal.open();
  } else {
    // Убираем фокус с текущего элемента перед навигацией
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    router.back();
  }
};

// Функции для обработки диалога несохраненных изменений
const confirmLeave = () => {
  isLeaving.value = true; // Устанавливаем флаг перед навигацией
  unsavedChangesModal.close();
  if (pendingNavigation.value) {
    pendingNavigation.value();
    pendingNavigation.value = null;
  }
};

const cancelLeave = () => {
  unsavedChangesModal.close();
  pendingNavigation.value = null;
};

// Exercise management functions
const fetchAvailableExercises = async (searchTerm: string = '') => {
  loadingExercises.value = true;
  try {
    const { exercisesService } = await import('@/services/exercises.service');
    const allExercises = await exercisesService.getAll({ search: searchTerm.trim() }) as any[] || [];
    
    // Фильтруем упражнения на клиенте:
    // Исключаем неактивные упражнения и те, что уже добавлены в текущий план
    const addedExerciseIds = exercises.value.map(ex => ex.id);
    const availableExercisesFiltered = allExercises.filter((exercise: any) => {
      const isActive = exercise.is_active === true || (exercise.is_active as any) === 1;
      const notAdded = !addedExerciseIds.includes(exercise.id);
      return isActive && notAdded;
    });
    
    availableExercises.value = availableExercisesFiltered;
  } catch (err) {
    console.error('Failed to fetch exercises:', err);
    showError('Не удалось загрузить упражнения');
  } finally {
    loadingExercises.value = false;
  }
};

const openExerciseModal = async () => {
  // Очищаем таймер поиска при открытии модалки
  if (exerciseSearchTimeout.value) {
    clearTimeout(exerciseSearchTimeout.value);
    exerciseSearchTimeout.value = null;
  }
  
  if (availableExercises.value.length === 0) {
    await fetchAvailableExercises('');
  }
  exerciseModal.open();
};

const closeExerciseModal = () => {
  // Очищаем таймер поиска при закрытии модалки
  if (exerciseSearchTimeout.value) {
    clearTimeout(exerciseSearchTimeout.value);
    exerciseSearchTimeout.value = null;
  }
  exerciseModal.close();
};

const addExerciseToPlan = async (exercise: AvailableExercise) => {
  // Просто добавляем упражнение в локальный массив
  // На сервер отправится только при нажатии "Сохранить"
  const newExercise: Exercise = {
    id: exercise.id,
    plan_id: isEditMode.value ? parseInt(planId.value) : 0, // Для новых планов plan_id будет 0
    name: exercise.name,
    order: exercises.value.length + 1,
    description: exercise.description || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  
  exercises.value.push(newExercise);
  
  exerciseModal.close();
  
  // Обновляем список доступных упражнений, чтобы исключить только что добавленное
  fetchAvailableExercises();
};

const handleExerciseReorder = (reorderedExercises: Exercise[]) => {
  // Обновляем только локальное состояние
  // Порядок элементов массива = порядок упражнений в плане
  exercises.value = reorderedExercises;
};

const showDeleteExerciseConfirmation = (index: number) => {
  const exercise = exercises.value[index];
  deleteExerciseModal.open({ index, name: exercise.name });
};

const confirmDeleteExercise = async () => {
  if (deleteExerciseModal.data.value?.index === undefined) return;
  
  // Просто удаляем из локального массива
  // На сервер отправится только при нажатии "Сохранить"
  exercises.value.splice(deleteExerciseModal.data.value.index, 1);
  
  deleteExerciseModal.close();
  
  // Обновляем список доступных упражнений
  fetchAvailableExercises();
};

const cancelDeleteExercise = () => {
  deleteExerciseModal.close();
};

const handleExerciseSearch = (value: string) => {
  // Очищаем предыдущий таймер debounce
  if (exerciseSearchTimeout.value) {
    clearTimeout(exerciseSearchTimeout.value);
  }
  
  // Устанавливаем новый таймер для debounce (300ms)
  exerciseSearchTimeout.value = setTimeout(() => {
    // Выполняем поиск на сервере
    fetchAvailableExercises(value);
    exerciseSearchTimeout.value = null;
  }, 300);
};

const createNewExercise = async () => {
  // Закрываем модал выбора упражнений
  closeExerciseModal();
  
  // Переходим на страницу упражнений с параметром для открытия модалки создания
  router.push({ path: '/exercises', query: { create: 'true' } });
};

// Delete plan functions
const showDeletePlanConfirmation = () => {
  deletePlanModal.open();
};

const confirmDeletePlan = async () => {
  if (!isEditMode.value) return;
  
  submitting.value = true;
  
  try {
    await plansService.delete(planId.value);
    showSuccess('План успешно удален');
    window.dispatchEvent(new CustomEvent('plans-updated'));
    
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    router.back();
  } catch (err) {
    console.error('Failed to delete plan:', err);
    const apiError = err as ApiError;
    showError(apiError.message || 'Не удалось удалить план');
  } finally {
    submitting.value = false;
    deletePlanModal.close();
  }
};

const cancelDeletePlan = () => {
  deletePlanModal.close();
};

const fetchPlanData = async () => {
  if (!isEditMode.value) return;

  loading.value = true;
  try {
    const plan = await plansService.getById(planId.value) as any;
    const planData = plan as any;
    
    formData.value = {
      name: planData.name || '',
      is_active: planData.is_active !== undefined ? planData.is_active : true,
    };
    
    // Сохраняем начальные значения для отслеживания изменений
    initialFormData.value = { ...formData.value };
    
    // Правильно обрабатываем вложенную структуру упражнений согласно API docs
    if (planData.exercises && Array.isArray(planData.exercises)) {
      exercises.value = planData.exercises.map((planExercise: any) => ({
        id: planExercise.exercise.id,
        plan_id: parseInt(planId.value),
        name: planExercise.exercise.name || '',
        order: planExercise.order || 1,
        description: planExercise.exercise.description || null,
        created_at: planExercise.exercise.created_at || new Date().toISOString(),
        updated_at: planExercise.exercise.updated_at || new Date().toISOString(),
      }));
    } else {
      exercises.value = [];
    }
    
    // Сохраняем начальные упражнения для отслеживания изменений
    initialExercises.value = [...exercises.value];
  } catch (err) {
    console.error('Failed to fetch plan:', err);
    const apiError = err as ApiError;
    
    showError(apiError.message || 'Не удалось загрузить данные плана');
    
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    router.back();
  } finally {
    loading.value = false;
  }
};

// Сбрасываем состояние при переходе в режим создания нового плана
watch(isEditMode, (newMode, oldMode) => {
  // Если переходим из режима редактирования в режим создания
  if (oldMode !== undefined && !newMode && oldMode) {
    resetFormState();
    hasUnsavedChanges.value = false;
  }
}, { immediate: false });

// Также отслеживаем прямой переход на страницу создания
watch(() => route.params.id, (newId) => {
  // Если переходим на создание нового плана
  if (!newId || newId === 'new') {
    if (!isEditMode.value) {
      resetFormState();
      hasUnsavedChanges.value = false;
      // Сохраняем начальные значения для отслеживания изменений
      initialFormData.value = { ...formData.value };
      initialExercises.value = [...exercises.value];
    }
  }
}, { immediate: false });

onMounted(() => {
  if (isEditMode.value) {
    fetchPlanData();
  } else {
    // Для новых планов сбрасываем состояние
    resetFormState();
    // Сохраняем начальные значения для отслеживания изменений
    initialFormData.value = { ...formData.value };
    initialExercises.value = [...exercises.value];
  }
});

onUnmounted(() => {
  // Очищаем таймер поиска при размонтировании компонента
  if (exerciseSearchTimeout.value) {
    clearTimeout(exerciseSearchTimeout.value);
    exerciseSearchTimeout.value = null;
  }
});

// Обработка попытки покинуть страницу с несохраненными изменениями
onBeforeRouteLeave((to: any, from: any, next: any) => {
  // Если уже покидаем страницу, разрешаем навигацию
  if (isLeaving.value) {
    next();
    return;
  }
  
  if (checkForUnsavedChanges()) {
    pendingNavigation.value = () => next();
    unsavedChangesModal.open();
  } else {
    next();
  }
});
</script>

<style scoped>
.plan-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-checkbox {
  margin-right: 8px;
  transform: scale(1.2);
}

.form-label {
  display: flex;
  align-items: center;
}

.form-textarea {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: var(--ion-text-color);
  padding: 12px;
  font-size: 16px;
  width: 100%;
  box-sizing: border-box;
  resize: vertical;
  min-height: 100px;
}

.form-textarea:focus {
  border-color: var(--ion-color-primary);
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
  outline: none;
}

.form-select {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: var(--ion-text-color);
  padding: 12px;
  font-size: 16px;
  width: 100%;
  box-sizing: border-box;
}

.form-select:focus {
  border-color: var(--ion-color-primary);
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
  outline: none;
}

ion-toolbar ion-button i {
  font-size: 20px;
  color: white !important;
}

/* Exercises Management Styles */
.exercises-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.add-exercise-button {
  background: var(--ion-color-primary);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: none;
  display: flex;
  align-items: center;
  gap: 6px;
}

.add-exercise-button:hover { background: var(--ion-color-primary); }

/* Delete Plan Button Styles */
.delete-plan-section {
  padding: 0 16px 8px 16px;
  margin-top: 8px;
}

.delete-plan-button {
  background: transparent;
  border: 1px solid rgba(239, 68, 68, 0.4);
  color: rgba(239, 68, 68, 0.7);
  border-radius: 8px;
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  min-height: 40px;
}

.delete-plan-button:hover { background: transparent; border-color: rgba(239, 68, 68, 0.4); color: rgba(239, 68, 68, 0.7); }

.delete-plan-button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.delete-plan-button i {
  font-size: 14px;
}

/* Кастомные отступы для CustomInput в форме плана */
.plan-form .custom-input-wrapper {
  margin: 0 !important;
}

.plan-form .custom-input-label {
  margin-bottom: 6px !important;
}
</style>
