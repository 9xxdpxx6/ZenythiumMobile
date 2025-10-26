<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button @click="handleBack">
            <i class="fas fa-arrow-left"></i>
          </ion-button>
        </ion-buttons>
        <ion-title>{{ isEditMode ? 'Редактировать план' : 'Создать план' }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <PageContainer>
        <h1 class="page-title">{{ isEditMode ? 'Редактирование плана' : 'Новый план' }}</h1>
        <p class="page-subtitle">{{ isEditMode ? 'Обновите информацию о плане тренировок' : 'Создайте новый план тренировок' }}</p>

        <LoadingState v-if="loading" message="Загрузка..." />

        <form v-else @submit.prevent="handleSubmit" class="plan-form">
          <div class="form-group">
            <CustomInput
              v-model="formData.name"
              label="Название плана *"
              type="text"
              placeholder="Например: Грудь и трицепс"
              :error="!!errors.name"
              :error-message="getFirstError(errors.name)"
              required
            />
          </div>

          <div class="form-group">
            <label class="form-label">
              <input
                type="checkbox"
                v-model="formData.is_active"
                class="form-checkbox"
              />
              Активный план
            </label>
            <span class="field-hint">Активные планы доступны для выбора при создании тренировок</span>
          </div>

          <!-- Exercises Management Section -->
          <div class="form-group">
            <div class="exercises-section-header">
              <label class="form-label">Упражнения</label>
              <button
                type="button"
                class="add-exercise-button"
                @click="openExerciseModal"
              >
                <i class="fas fa-plus"></i>
                Добавить упражнение
              </button>
            </div>
            
            <ExercisesList
              :exercises="exercises"
              :is-edit-mode="!!isEditMode"
              @exercise-reorder="handleExerciseReorder"
              @exercise-delete="showDeleteExerciseConfirmation"
            />
          </div>

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
                {{ isEditMode ? 'Сохранить' : 'Создать план' }}
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
      :is-open="isExerciseModalOpen"
      :available-exercises="availableExercises"
      :loading-exercises="loadingExercises"
      @close="isExerciseModalOpen = false"
      @select-exercise="addExerciseToPlan"
      @create-new-exercise="createNewExercise"
      @search="handleExerciseSearch"
    />

    <!-- Delete Exercise Confirmation Dialog -->
    <DeleteConfirmationModal
      :is-open="isDeleteExerciseDialogOpen"
      title="Подтверждение удаления"
      message="Вы уверены, что хотите удалить упражнение"
      :item-name="exerciseToDeleteName"
      warning-text="Это действие нельзя отменить."
      @confirm="confirmDeleteExercise"
      @cancel="cancelDeleteExercise"
    />

    <!-- Delete Plan Confirmation Dialog -->
    <DeleteConfirmationModal
      :is-open="isDeleteDialogOpen"
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
      :is-open="isUnsavedChangesDialogOpen"
      @confirm="confirmLeave"
      @cancel="cancelLeave"
    />
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter, useRoute, onBeforeRouteLeave } from 'vue-router';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonSpinner,
  IonModal,
  toastController,
} from '@ionic/vue';
import PageContainer from '@/components/PageContainer.vue';
import LoadingState from '@/components/LoadingState.vue';
import CustomInput from '@/components/CustomInput.vue';
import ExercisesList from '@/components/ExercisesList.vue';
import ExerciseSelectionModal from '@/components/ExerciseSelectionModal.vue';
import DeleteConfirmationModal from '@/components/DeleteConfirmationModal.vue';
import UnsavedChangesModal from '@/components/UnsavedChangesModal.vue';
import apiClient from '@/services/api';
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

const planId = computed(() => route.params.id as string);
const isEditMode = computed(() => planId.value && planId.value !== 'new');

const loading = ref(false);
const submitting = ref(false);
const errors = ref<ValidationErrors>({});

// Exercise management
const exercises = ref<Exercise[]>([]);
const availableExercises = ref<AvailableExercise[]>([]);
const isExerciseModalOpen = ref(false);
const loadingExercises = ref(false);
// Флаг hasExercisesChanged больше не нужен - порядок передается через массив exercise_ids

// Delete confirmation dialogs
const isDeleteDialogOpen = ref(false);
const isDeleteExerciseDialogOpen = ref(false);
const exerciseToDelete = ref<number | null>(null);
const exerciseToDeleteName = ref('');

// Unsaved changes confirmation
const isUnsavedChangesDialogOpen = ref(false);
const pendingNavigation = ref<any>(null);
const hasUnsavedChanges = ref(false);
const initialFormData = ref<PlanFormData>({ name: '', is_active: true });
const initialExercises = ref<Exercise[]>([]);
const isLeaving = ref(false); // Флаг для предотвращения повторных проверок

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
    const toast = await toastController.create({
      message: 'Пожалуйста, исправьте ошибки в форме',
      duration: 2000,
      color: 'warning',
    });
    await toast.present();
    return;
  }

  submitting.value = true;
  errors.value = {};

  try {
    const payload: any = {
      name: formData.value.name.trim(),
      order: null, // Порядок устанавливается автоматически на сервере
      is_active: formData.value.is_active,
      exercise_ids: exercises.value.map(exercise => exercise.id), // Массив ID упражнений в порядке их расположения
    };

    if (isEditMode.value) {
      const response = await apiClient.put(`/api/v1/plans/${planId.value}`, payload);
      const toast = await toastController.create({
        message: 'План успешно обновлен',
        duration: 2000,
        color: 'success',
      });
      await toast.present();
    } else {
      const response = await apiClient.post('/api/v1/plans', payload);
      const toast = await toastController.create({
        message: 'План успешно создан',
        duration: 2000,
        color: 'success',
      });
      await toast.present();
    }

    // Обновляем начальные значения после успешного сохранения
    initialFormData.value = { ...formData.value };
    initialExercises.value = [...exercises.value];

    // Уведомляем PlansPage о необходимости обновления данных
    window.dispatchEvent(new CustomEvent('plans-updated'));

    // Убираем фокус перед навигацией
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

    const toast = await toastController.create({
      message: apiError.message || `Не удалось ${isEditMode.value ? 'обновить' : 'создать'} план`,
      duration: 3000,
      color: 'danger',
    });
    await toast.present();
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

const handleBack = () => {
  if (checkForUnsavedChanges()) {
    pendingNavigation.value = () => router.back();
    isUnsavedChangesDialogOpen.value = true;
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
  isUnsavedChangesDialogOpen.value = false;
  if (pendingNavigation.value) {
    pendingNavigation.value();
    pendingNavigation.value = null;
  }
};

const cancelLeave = () => {
  isUnsavedChangesDialogOpen.value = false;
  pendingNavigation.value = null;
};

// Exercise management functions
const fetchAvailableExercises = async (searchTerm: string = '') => {
  loadingExercises.value = true;
  try {
    const params: any = {};
    
    // Добавляем поиск если есть
    if (searchTerm.trim()) {
      params.search = searchTerm.trim();
    }
    
    const response = await apiClient.get('/api/v1/exercises', { params });
    const allExercises = response.data.data || [];
    
    // Фильтруем упражнения на клиенте:
    // Исключаем те, что уже добавлены в текущий план
    const addedExerciseIds = exercises.value.map(ex => ex.id);
    const availableExercisesFiltered = allExercises.filter((exercise: AvailableExercise) => {
      const notAdded = !addedExerciseIds.includes(exercise.id);
      return notAdded;
    });
    
    availableExercises.value = availableExercisesFiltered;
  } catch (err) {
    console.error('Failed to fetch exercises:', err);
    const toast = await toastController.create({
      message: 'Не удалось загрузить упражнения',
      duration: 3000,
      color: 'danger',
    });
    await toast.present();
  } finally {
    loadingExercises.value = false;
  }
};

const openExerciseModal = async () => {
  if (availableExercises.value.length === 0) {
    await fetchAvailableExercises('');
  }
  isExerciseModalOpen.value = true;
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
  
  isExerciseModalOpen.value = false;
  
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
  exerciseToDelete.value = index;
  exerciseToDeleteName.value = exercise.name;
  isDeleteExerciseDialogOpen.value = true;
};

const confirmDeleteExercise = async () => {
  if (exerciseToDelete.value === null) return;
  
  // Просто удаляем из локального массива
  // На сервер отправится только при нажатии "Сохранить"
  exercises.value.splice(exerciseToDelete.value, 1);
  
  isDeleteExerciseDialogOpen.value = false;
  exerciseToDelete.value = null;
  exerciseToDeleteName.value = '';
  
  // Обновляем список доступных упражнений
  fetchAvailableExercises();
};

const cancelDeleteExercise = () => {
  isDeleteExerciseDialogOpen.value = false;
  exerciseToDelete.value = null;
  exerciseToDeleteName.value = '';
};

const handleExerciseSearch = (value: string) => {
  // Выполняем поиск на сервере
  fetchAvailableExercises(value);
};

const createNewExercise = async () => {
  // Закрываем модал выбора упражнений
  isExerciseModalOpen.value = false;
  
  // Переходим на страницу создания нового упражнения
  // TODO: Implement exercise creation page or modal
};

// Delete plan functions
const showDeletePlanConfirmation = () => {
  isDeleteDialogOpen.value = true;
};

const confirmDeletePlan = async () => {
  if (!isEditMode.value) return;
  
  submitting.value = true;
  
  try {
    await apiClient.delete(`/api/v1/plans/${planId.value}`);
    
    const toast = await toastController.create({
      message: 'План успешно удален',
      duration: 2000,
      color: 'success',
    });
    await toast.present();
    
    // Уведомляем PlansPage о необходимости обновления данных
    window.dispatchEvent(new CustomEvent('plans-updated'));
    
    // Убираем фокус перед навигацией
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    router.back();
  } catch (err) {
    console.error('Failed to delete plan:', err);
    const apiError = err as ApiError;
    
    const toast = await toastController.create({
      message: apiError.message || 'Не удалось удалить план',
      duration: 3000,
      color: 'danger',
    });
    await toast.present();
  } finally {
    submitting.value = false;
    isDeleteDialogOpen.value = false;
  }
};

const cancelDeletePlan = () => {
  isDeleteDialogOpen.value = false;
};

const fetchPlanData = async () => {
  if (!isEditMode.value) return;

  loading.value = true;
  try {
    const response = await apiClient.get(`/api/v1/plans/${planId.value}`);
    const plan = response.data.data; // Правильно извлекаем данные из API ответа
    
    formData.value = {
      name: plan.name || '',
      is_active: plan.is_active !== undefined ? plan.is_active : true,
    };
    
    // Сохраняем начальные значения для отслеживания изменений
    initialFormData.value = { ...formData.value };
    
    // Правильно обрабатываем вложенную структуру упражнений согласно API docs
    if (plan.exercises && Array.isArray(plan.exercises)) {
      exercises.value = plan.exercises.map((planExercise: any) => ({
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
    
    const toast = await toastController.create({
      message: apiError.message || 'Не удалось загрузить данные плана',
      duration: 3000,
      color: 'danger',
    });
    await toast.present();
    
    // Убираем фокус перед навигацией
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    router.back();
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  if (isEditMode.value) {
    fetchPlanData();
  } else {
    // Для новых планов сохраняем начальные значения
    initialFormData.value = { ...formData.value };
    initialExercises.value = [...exercises.value];
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
    isUnsavedChangesDialogOpen.value = true;
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
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 6px;
}

.add-exercise-button:hover {
  background: var(--ion-color-primary-shade);
}

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
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  min-height: 40px;
}

.delete-plan-button:hover {
  background: rgba(239, 68, 68, 0.05);
  border-color: rgba(239, 68, 68, 0.6);
  color: rgba(239, 68, 68, 0.8);
}

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
