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
      <div class="page-content">
        <h1 class="page-title">{{ isEditMode ? 'Редактирование плана' : 'Новый план' }}</h1>
        <p class="page-subtitle">{{ isEditMode ? 'Обновите информацию о плане тренировок' : 'Создайте новый план тренировок' }}</p>

        <div v-if="loading" class="loading-state">
          <ion-spinner name="crescent"></ion-spinner>
          <p>Загрузка...</p>
        </div>

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
            <CustomInput
              v-model="formData.order"
              label="Порядок *"
              type="number"
              placeholder="Например: 1"
              :error="!!errors.order"
              :error-message="getFirstError(errors.order)"
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
            
            <div v-if="exercises.length === 0" class="empty-exercises-state">
              <i class="fas fa-dumbbell"></i>
              <p>Упражнения не добавлены</p>
              <span class="hint">Добавьте упражнения для создания плана</span>
            </div>

            <div v-else class="exercises-list">
              <div
                v-for="(exercise, index) in exercises"
                :key="exercise.id || index"
                class="exercise-item"
              >
                <div class="exercise-info">
                  <h4>{{ exercise.name }}</h4>
                  <div class="exercise-meta">
                    <span class="exercise-stats">
                      <i class="fas fa-dumbbell"></i>
                      {{ exercise.sets || 0 }} подходов
                    </span>
                    <span class="exercise-stats">
                      <i class="fas fa-repeat"></i>
                      {{ exercise.reps || 0 }} повторений
                    </span>
                  </div>
                </div>
                
                <button
                  type="button"
                  class="remove-exercise-button"
                  @click="removeExercise(index)"
                >
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
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
      </div>
    </ion-content>

    <!-- Delete Confirmation Dialog -->
    <DeleteConfirmationModal
      :is-open="isDeleteDialogOpen"
      title="Подтверждение удаления"
      message="Вы уверены, что хотите удалить план"
      :item-name="formData.name"
      warning-text="Это действие нельзя отменить. Будут удалены все связанные упражнения."
      :is-deleting="submitting"
      @confirm="confirmDeletePlan"
      @cancel="cancelDeletePlan"
    />
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonSpinner,
  toastController,
} from '@ionic/vue';
import CustomInput from '@/components/CustomInput.vue';
import DeleteConfirmationModal from '@/components/DeleteConfirmationModal.vue';
import apiClient from '@/services/api';
import { ApiError } from '@/types/api';

interface PlanFormData {
  name: string;
  order: number;
  is_active: boolean;
}

interface Exercise {
  id?: number;
  name: string;
  sets?: number;
  reps?: number;
  weight?: number;
  duration?: number;
}

interface ValidationErrors {
  name?: string | string[];
  order?: string | string[];
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

// Delete confirmation dialog
const isDeleteDialogOpen = ref(false);

const formData = ref<PlanFormData>({
  name: '',
  order: 1,
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

  if (formData.value.order < 1) {
    errors.value.order = 'Порядок должен быть положительным числом';
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
      order: formData.value.order,
      is_active: formData.value.is_active,
    };

    if (isEditMode.value) {
      await apiClient.put(`/api/v1/plans/${planId.value}`, payload);
      const toast = await toastController.create({
        message: 'План успешно обновлен',
        duration: 2000,
        color: 'success',
      });
      await toast.present();
    } else {
      await apiClient.post('/api/v1/plans', payload);
      const toast = await toastController.create({
        message: 'План успешно создан',
        duration: 2000,
        color: 'success',
      });
      await toast.present();
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

const handleBack = () => {
  router.back();
};

// Exercise management functions
const openExerciseModal = () => {
  // TODO: Implement exercise selection modal
  console.log('Open exercise modal');
};

const removeExercise = (index: number) => {
  exercises.value.splice(index, 1);
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
    const plan = response.data;
    
    formData.value = {
      name: plan.name,
      order: plan.order,
      is_active: plan.is_active,
    };
    
    if (plan.exercises) {
      exercises.value = plan.exercises.map((ex: any) => ({
        id: ex.id,
        name: ex.name,
        order: ex.order,
      }));
    }
  } catch (err) {
    console.error('Failed to fetch plan:', err);
    const apiError = err as ApiError;
    
    const toast = await toastController.create({
      message: apiError.message || 'Не удалось загрузить данные плана',
      duration: 3000,
      color: 'danger',
    });
    await toast.present();
    
    router.back();
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  if (isEditMode.value) {
    fetchPlanData();
  }
});
</script>

<style scoped>
.page-content {
  padding: 16px !important;
  padding-bottom: 120px !important;
  max-width: 600px;
  margin: 0 auto;
}

.page-title {
  font-size: 22px !important;
  font-weight: 700 !important;
  color: var(--ion-text-color) !important;
  margin: 0 0 6px 0 !important;
  padding-left: 0 !important;
}

.page-subtitle {
  font-size: 13px !important;
  color: var(--ion-color-medium) !important;
  margin: 0 0 12px 0 !important;
  padding-left: 0 !important;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  text-align: center;
  color: var(--ion-color-medium);
}

.loading-state ion-spinner {
  margin-bottom: 1rem;
}

.plan-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 0;
}

.form-checkbox {
  margin-right: 8px;
  transform: scale(1.2);
}

.field-hint {
  font-size: 12px;
  color: var(--ion-color-medium);
  margin-top: 4px;
  display: block;
}

.form-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--ion-text-color);
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
  width: 100%;
  min-height: 48px;
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

.modern-button i {
  font-size: 16px;
}

.modern-button ion-spinner {
  width: 20px;
  height: 20px;
}

ion-toolbar ion-button i {
  font-size: 20px;
  color: var(--ion-color-primary);
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

.empty-exercises-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
  color: var(--ion-color-medium);
  border: 2px dashed rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.02);
}

.empty-exercises-state i {
  font-size: 2rem;
  margin-bottom: 1rem;
  color: var(--ion-color-primary);
}

.empty-exercises-state p {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--ion-text-color);
}

.empty-exercises-state .hint {
  font-size: 14px;
  color: var(--ion-color-medium);
}

.exercises-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.exercise-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  transition: all 0.3s ease;
}

.exercise-item:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.15);
}

.exercise-info {
  flex: 1;
  min-width: 0;
}

.exercise-info h4 {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--ion-text-color);
}

.exercise-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.exercise-stats {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: var(--ion-color-medium);
}

.exercise-stats i {
  margin-right: 4px;
  color: var(--ion-color-primary);
}

.remove-exercise-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: rgba(239, 68, 68, 0.1);
  color: var(--ion-color-danger);
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.remove-exercise-button:hover {
  background: rgba(239, 68, 68, 0.2);
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
