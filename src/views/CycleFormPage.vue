<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button @click="handleBack">
            <i class="fas fa-arrow-left"></i>
          </ion-button>
        </ion-buttons>
        <ion-title>{{ isEditMode ? 'Редактировать цикл' : 'Создать цикл' }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <div class="page-content">
        <h1 class="page-title">{{ isEditMode ? 'Редактирование цикла' : 'Новый цикл' }}</h1>
        <p class="page-subtitle">{{ isEditMode ? 'Обновите информацию о цикле тренировок' : 'Создайте новый тренировочный цикл' }}</p>

        <div v-if="loading" class="loading-state">
          <ion-spinner name="crescent"></ion-spinner>
          <p>Загрузка...</p>
        </div>

        <form v-else @submit.prevent="handleSubmit" class="cycle-form">
          <div class="form-group">
            <CustomInput
              v-model="formData.name"
              label="Название цикла *"
              type="text"
              placeholder="Например: Набор массы"
              :error="!!errors.name"
              :error-message="getFirstError(errors.name)"
              required
            />
          </div>

          <div class="form-group">
            <CustomInput
              v-model="formData.weeks"
              label="Количество недель *"
              type="number"
              placeholder="Например: 6"
              :error="!!errors.weeks"
              :error-message="getFirstError(errors.weeks)"
              required
            />
          </div>

          <div class="form-group">
            <label class="form-label">Дата начала (необязательно)</label>
            <VueDatePicker
              v-model="formData.start_date"
              :class="{ 'datepicker-error': errors.start_date }"
              format="dd.MM.yyyy"
              placeholder="Выберите дату начала"
              :enable-time-picker="false"
              auto-apply
              :dark="true"
              locale="ru"
              :week-start="1"
              :month-name-format="'long'"
              :year-range="[2020, 2030]"
            />
            <span v-if="errors.start_date" class="error-message">{{ getFirstError(errors.start_date) }}</span>
          </div>

          <div class="form-group">
            <label class="form-label">Дата окончания (необязательно)</label>
            <VueDatePicker
              v-model="formData.end_date"
              :class="{ 'datepicker-error': errors.end_date }"
              format="dd.MM.yyyy"
              placeholder="Выберите дату окончания"
              :enable-time-picker="false"
              auto-apply
              :dark="true"
              :min-date="formData.start_date || undefined"
              locale="ru"
              :week-start="1"
              :month-name-format="'long'"
              :year-range="[2020, 2030]"
            />
            <span v-if="errors.end_date" class="error-message">{{ getFirstError(errors.end_date) }}</span>
            <span class="field-hint">Если указана дата начала, дата окончания должна быть позже</span>
          </div>

          <!-- Plans Management Section -->
          <div class="form-group">
            <div class="plans-section-header">
              <label class="form-label">Планы тренировок</label>
              <button
                type="button"
                class="add-plan-button"
                @click="openPlanModal"
              >
                <i class="fas fa-plus"></i>
                Добавить план
              </button>
            </div>
            
            <PlansList
              :plans="cyclePlans"
              :is-edit-mode="!!isEditMode"
              @plan-reorder="handlePlanReorder"
              @plan-delete="showDeleteConfirmation"
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
                {{ isEditMode ? 'Сохранить' : 'Создать цикл' }}
              </span>
            </button>
          </div>

          <!-- Delete Cycle Button - только в режиме редактирования -->
          <div v-if="isEditMode" class="delete-cycle-section">
            <button
              type="button"
              class="delete-cycle-button"
              @click="showDeleteCycleConfirmation"
              :disabled="submitting"
            >
              <i class="fas fa-trash"></i>
              Удалить цикл
            </button>
          </div>
        </form>
      </div>
    </ion-content>

    <!-- Plan Selection Modal -->
    <PlanSelectionModal
      :is-open="isPlanModalOpen"
      :available-plans="availablePlans"
      :loading-plans="loadingPlans"
      @close="isPlanModalOpen = false"
      @select-plan="addPlanToCycle"
      @create-new-plan="createNewPlan"
      @search="handlePlanSearch"
    />

    <!-- Delete Confirmation Dialog -->
    <DeleteConfirmationModal
      :is-open="isDeleteDialogOpen"
      title="Подтверждение удаления"
      message="Вы уверены, что хотите удалить план"
      :item-name="planToDeleteName"
      warning-text="Это действие нельзя отменить."
      @confirm="confirmDeletePlan"
      @cancel="cancelDeletePlan"
    />

    <!-- Delete Cycle Confirmation Dialog -->
    <DeleteConfirmationModal
      :is-open="isDeleteCycleDialogOpen"
      title="Подтверждение удаления"
      message="Вы уверены, что хотите удалить цикл"
      :item-name="formData.name"
      warning-text="Это действие нельзя отменить. Будут удалены все связанные планы и тренировки."
      :is-deleting="submitting"
      @confirm="confirmDeleteCycle"
      @cancel="cancelDeleteCycle"
    />
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch, nextTick } from 'vue';
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
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonList,
  IonItem,
  IonLabel,
  IonChip,
  IonModal,
  IonSearchbar,
  toastController,
  alertController,
} from '@ionic/vue';
import CustomInput from '@/components/CustomInput.vue';
import PlansList from '@/components/PlansList.vue';
import PlanSelectionModal from '@/components/PlanSelectionModal.vue';
import DeleteConfirmationModal from '@/components/DeleteConfirmationModal.vue';
import VueDatePicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';
import apiClient from '@/services/api';
import { ApiError, Plan, CyclePlan } from '@/types/api';
import { useCycleFormValidation, type CycleFormData, type ValidationErrors } from '@/composables/useCycleFormValidation';

const router = useRouter();
const route = useRoute();

const cycleId = computed(() => route.params.id as string);
const isEditMode = computed(() => cycleId.value && cycleId.value !== 'new');

// Computed property to detect unsaved changes
const hasUnsavedChanges = computed(() => {
  if (!originalFormData.value) return false;
  
  // Check form data changes
  const formChanged = 
    formData.value.name !== originalFormData.value.name ||
    formData.value.weeks !== originalFormData.value.weeks ||
    formData.value.start_date?.getTime() !== originalFormData.value.start_date?.getTime() ||
    formData.value.end_date?.getTime() !== originalFormData.value.end_date?.getTime();
  
  // Check plans changes
  const plansChanged = JSON.stringify(cyclePlans.value) !== JSON.stringify(originalCyclePlans.value);
  
  return formChanged || plansChanged;
});

// Используем composable для валидации
const { validateForm, getFirstError } = useCycleFormValidation();

// Функция для генерации названия цикла на основе даты начала и количества недель
const generateCycleName = (startDate: Date, weeks: number): string => {
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + (weeks * 7));
  
  const startMonth = startDate.toLocaleDateString('ru-RU', { month: 'long' });
  const endMonth = endDate.toLocaleDateString('ru-RU', { month: 'long' });
  
  const startYear = startDate.getFullYear();
  const endYear = endDate.getFullYear();
  
  if (startYear === endYear) {
    if (startMonth === endMonth) {
      return `${startMonth} ${startYear}`;
    }
    return `${startMonth}-${endMonth} ${startYear}`;
  } else {
    return `${startMonth}-${endMonth} ${startYear}-${endYear}`;
  }
};

const loading = ref(false);
const submitting = ref(false);
const errors = ref<ValidationErrors>({});

// Plan management
const cyclePlans = ref<CyclePlan[]>([]);
const availablePlans = ref<Plan[]>([]);
const isPlanModalOpen = ref(false);
const loadingPlans = ref(false);

// Delete confirmation dialog
const isDeleteDialogOpen = ref(false);
const planToDelete = ref<number | null>(null);
const planToDeleteName = ref('');

// Delete cycle confirmation dialog
const isDeleteCycleDialogOpen = ref(false);

// Original state tracking for unsaved changes detection
const originalFormData = ref<CycleFormData | null>(null);
const originalCyclePlans = ref<CyclePlan[]>([]);

const formData = ref<CycleFormData>({
  name: '',
  weeks: '6', // Устанавливаем 6 недель по умолчанию
  start_date: new Date(), // Устанавливаем текущую дату по умолчанию
  end_date: null,
});

const fetchCycleData = async () => {
  if (!isEditMode.value) return;

  loading.value = true;
  try {
    const response = await apiClient.get(`/api/v1/cycles/${cycleId.value}`);
    const cycle = response.data.data;

    formData.value = {
      name: cycle.name || '',
      weeks: cycle.weeks ? cycle.weeks.toString() : '',
      start_date: cycle.start_date ? new Date(cycle.start_date) : null,
      end_date: cycle.end_date ? new Date(cycle.end_date) : null,
    };

    // Save original form data for change detection
    originalFormData.value = {
      name: cycle.name || '',
      weeks: cycle.weeks ? cycle.weeks.toString() : '',
      start_date: cycle.start_date ? new Date(cycle.start_date) : null,
      end_date: cycle.end_date ? new Date(cycle.end_date) : null,
    };

    // Load cycle plans if they exist
    if (cycle.plans && Array.isArray(cycle.plans)) {
      cyclePlans.value = cycle.plans.map((plan: any, index: number) => ({
        id: plan.id || 0,
        cycle_id: cycle.id,
        plan_id: plan.plan_id || plan.id,
        order: plan.order || index + 1,
        plan: {
          id: plan.plan?.id || plan.id,
          name: plan.plan?.name || plan.name,
          order: plan.plan?.order || plan.order || index + 1,
          is_active: plan.plan?.is_active !== undefined ? plan.plan.is_active : true,
          exercise_count: plan.plan?.exercise_count || plan.exercise_count || 0,
          cycle: plan.plan?.cycle || plan.cycle,
          exercises: plan.plan?.exercises || plan.exercises,
          created_at: plan.plan?.created_at || plan.created_at,
          updated_at: plan.plan?.updated_at || plan.updated_at,
        }
      }));
      
      // Save original plans for change detection
      originalCyclePlans.value = JSON.parse(JSON.stringify(cyclePlans.value));
    } else {
      cyclePlans.value = [];
      originalCyclePlans.value = [];
    }

  } catch (err) {
    console.error('Failed to fetch cycle:', err);
    const toast = await toastController.create({
      message: 'Не удалось загрузить данные цикла',
      duration: 3000,
      color: 'danger',
    });
    await toast.present();
    router.back();
  } finally {
    loading.value = false;
  }
};

const validateFormData = (): boolean => {
  const { isValid, errors: validationErrors } = validateForm(formData.value);
  errors.value = validationErrors;
  return isValid;
};

const handleSubmit = async () => {
  if (!validateFormData()) {
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
      weeks: parseInt(formData.value.weeks),
      // Всегда отправляем даты, даже если они null (для очистки)
      start_date: formData.value.start_date ? formData.value.start_date.toISOString().split('T')[0] : null,
      end_date: formData.value.end_date ? formData.value.end_date.toISOString().split('T')[0] : null,
      // Отправляем массив ID планов в порядке их расположения
      plan_ids: cyclePlans.value.map(cp => cp.plan_id)
    };

    if (isEditMode.value) {
      await apiClient.put(`/api/v1/cycles/${cycleId.value}`, payload);
      const toast = await toastController.create({
        message: 'Цикл успешно обновлен',
        duration: 2000,
        color: 'success',
      });
      await toast.present();
    } else {
      await apiClient.post('/api/v1/cycles', payload);
      const toast = await toastController.create({
        message: 'Цикл успешно создан',
        duration: 2000,
        color: 'success',
      });
      await toast.present();
    }

    // Уведомляем CyclesPage о необходимости обновления данных
    window.dispatchEvent(new CustomEvent('cycles-updated'));
    
    // Update original state after successful save
    originalFormData.value = JSON.parse(JSON.stringify(formData.value));
    originalCyclePlans.value = JSON.parse(JSON.stringify(cyclePlans.value));
    
    // Если это режим редактирования, также обновляем данные текущего цикла
    if (isEditMode.value) {
      await fetchCycleData();
    }
    
    router.push('/tabs/cycles');
  } catch (err) {
    console.error('Failed to save cycle:', err);
    const apiError = err as ApiError;
    
    if (apiError.errors) {
      // Преобразуем ошибки из Record<string, string[]> в наш формат
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
      message: apiError.message || `Не удалось ${isEditMode.value ? 'обновить' : 'создать'} цикл`,
      duration: 3000,
      color: 'danger',
    });
    await toast.present();
  } finally {
    submitting.value = false;
  }
};

const handleBack = async () => {
  if (hasUnsavedChanges.value) {
    const shouldLeave = await showUnsavedChangesWarning();
    if (!shouldLeave) {
      return; // Stay on the page
    }
  }
  router.back();
};

// Plan management functions
const fetchAvailablePlans = async (searchTerm: string = '') => {
  loadingPlans.value = true;
  try {
    const params: any = {
      is_active: true,    // Только активные планы
      standalone: true,   // Только планы без цикла (свободные)
    };
    
    // Добавляем поиск если есть
    if (searchTerm.trim()) {
      params.search = searchTerm.trim();
    }
    
    const response = await apiClient.get('/api/v1/plans', { params });
    const allPlans = response.data.data || response.data || [];
    availablePlans.value = allPlans;
  } catch (err) {
    console.error('Failed to fetch plans:', err);
    const toast = await toastController.create({
      message: 'Не удалось загрузить планы',
      duration: 3000,
      color: 'danger',
    });
    await toast.present();
  } finally {
    loadingPlans.value = false;
  }
};

const filteredPlans = computed(() => {
  // Фильтрация теперь происходит на сервере, возвращаем все доступные планы
  return availablePlans.value;
});

// Plan search functions
const handlePlanSearch = (value: string) => {
  // Выполняем поиск на сервере
  fetchAvailablePlans(value);
};

const clearPlanSearch = () => {
  // Загружаем все доступные планы без поиска
  fetchAvailablePlans('');
};

const createNewPlan = async () => {
  // Закрываем модал выбора планов
  isPlanModalOpen.value = false;
  
  // Ждем завершения закрытия модального окна
  await nextTick();
  
  // Добавляем дополнительную задержку для полного закрытия модального окна
  // Это предотвращает проблемы с aria-hidden и фокусом
  setTimeout(() => {
    router.push('/plan/new');
  }, 300);
};

const addPlanToCycle = (plan: Plan) => {
  const newCyclePlan: CyclePlan = {
    id: 0, // Will be assigned by server
    cycle_id: parseInt(cycleId.value) || 0,
    plan_id: plan.id,
    order: cyclePlans.value.length + 1, // Порядок определяется позицией в массиве, но оставляем для совместимости
    plan: plan
  };
  
  cyclePlans.value.push(newCyclePlan);
  isPlanModalOpen.value = false;
  
  // Возвращаем фокус на предыдущий элемент после закрытия модала
  setTimeout(() => {
    const activeElement = document.activeElement as HTMLElement;
    if (activeElement && activeElement.blur) {
      activeElement.blur();
    }
  }, 100);
};

const handlePlanReorder = (reorderedPlans: CyclePlan[]) => {
  cyclePlans.value = reorderedPlans;
};

const removePlanFromCycle = (index: number) => {
  cyclePlans.value.splice(index, 1);
  // Порядок планов определяется их позицией в массиве, не нужно обновлять поле order
};

// Delete confirmation functions
const showDeleteConfirmation = (index: number) => {
  const plan = cyclePlans.value[index];
  planToDelete.value = index;
  planToDeleteName.value = plan.plan.name;
  isDeleteDialogOpen.value = true;
};

const confirmDeletePlan = () => {
  if (planToDelete.value !== null) {
    cyclePlans.value.splice(planToDelete.value, 1);
    // Порядок планов определяется их позицией в массиве, не нужно обновлять поле order
  }
  isDeleteDialogOpen.value = false;
  planToDelete.value = null;
  planToDeleteName.value = '';
  
  // Возвращаем фокус на предыдущий элемент после закрытия модала
  setTimeout(() => {
    const activeElement = document.activeElement as HTMLElement;
    if (activeElement && activeElement.blur) {
      activeElement.blur();
    }
  }, 100);
};

const cancelDeletePlan = () => {
  isDeleteDialogOpen.value = false;
  planToDelete.value = null;
  planToDeleteName.value = '';
  
  // Возвращаем фокус на предыдущий элемент после закрытия модала
  setTimeout(() => {
    const activeElement = document.activeElement as HTMLElement;
    if (activeElement && activeElement.blur) {
      activeElement.blur();
    }
  }, 100);
};

// Delete cycle functions
const showDeleteCycleConfirmation = () => {
  isDeleteCycleDialogOpen.value = true;
};

const confirmDeleteCycle = async () => {
  if (!isEditMode.value) return;
  
  submitting.value = true;
  
  try {
    await apiClient.delete(`/api/v1/cycles/${cycleId.value}`);
    
    const toast = await toastController.create({
      message: 'Цикл успешно удален',
      duration: 2000,
      color: 'success',
    });
    await toast.present();
    
    // Уведомляем CyclesPage о необходимости обновления данных
    window.dispatchEvent(new CustomEvent('cycles-updated'));
    
    // Переходим обратно к списку циклов
    router.push('/tabs/cycles');
  } catch (err) {
    console.error('Failed to delete cycle:', err);
    const apiError = err as ApiError;
    
    const toast = await toastController.create({
      message: apiError.message || 'Не удалось удалить цикл',
      duration: 3000,
      color: 'danger',
    });
    await toast.present();
  } finally {
    submitting.value = false;
    isDeleteCycleDialogOpen.value = false;
    
    // Возвращаем фокус на предыдущий элемент после закрытия модала
    setTimeout(() => {
      const activeElement = document.activeElement as HTMLElement;
      if (activeElement && activeElement.blur) {
        activeElement.blur();
      }
    }, 100);
  }
};

const cancelDeleteCycle = () => {
  isDeleteCycleDialogOpen.value = false;
  
  // Возвращаем фокус на предыдущий элемент после закрытия модала
  setTimeout(() => {
    const activeElement = document.activeElement as HTMLElement;
    if (activeElement && activeElement.blur) {
      activeElement.blur();
    }
  }, 100);
};


const openPlanModal = async () => {
  if (availablePlans.value.length === 0) {
    await fetchAvailablePlans('');
  }
  isPlanModalOpen.value = true;
};

// Initialize original state for new cycles
const initializeOriginalState = () => {
  const currentDate = new Date();
  const defaultName = generateCycleName(currentDate, 6);
  
  originalFormData.value = {
    name: defaultName,
    weeks: '6', // Устанавливаем 6 недель по умолчанию
    start_date: currentDate, // Устанавливаем текущую дату по умолчанию
    end_date: null,
  };
  originalCyclePlans.value = [];
};

// Function to show unsaved changes warning
const showUnsavedChangesWarning = async (): Promise<boolean> => {
  const alert = await alertController.create({
    header: 'Несохраненные изменения',
    message: 'У вас есть несохраненные изменения. Вы уверены, что хотите покинуть страницу?',
    buttons: [
      {
        text: 'Остаться',
        role: 'cancel',
        handler: () => false
      },
      {
        text: 'Покинуть',
        role: 'destructive',
        handler: () => true
      }
    ]
  });

  await alert.present();
  const { role } = await alert.onDidDismiss();
  return role === 'destructive';
};


onMounted(() => {
  if (isEditMode.value) {
    fetchCycleData();
  } else {
    initializeOriginalState();
    // Устанавливаем автоматически сгенерированное название для новых циклов
    const currentDate = new Date();
    formData.value.name = generateCycleName(currentDate, 6);
  }
});

// Автоматическое обновление названия при изменении даты начала или количества недель
watch([() => formData.value.start_date, () => formData.value.weeks], ([newStartDate, newWeeks]) => {
  if (newStartDate && newWeeks && !isEditMode.value) {
    const weeksNum = parseInt(newWeeks);
    if (!isNaN(weeksNum) && weeksNum > 0) {
      formData.value.name = generateCycleName(newStartDate, weeksNum);
    }
  }
}, { deep: true });
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

.cycle-form {
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

.form-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--ion-text-color);
}

.error-message {
  font-size: 12px;
  color: var(--ion-color-danger);
  margin-top: 4px;
}

.field-hint {
  font-size: 12px;
  color: var(--ion-color-medium);
  margin-top: 4px;
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

/* Delete Cycle Button Styles */
.delete-cycle-section {
  padding: 0 16px 8px 16px;
  margin-top: 8px;
}

.delete-cycle-button {
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

.delete-cycle-button:hover {
  background: rgba(239, 68, 68, 0.05);
  border-color: rgba(239, 68, 68, 0.6);
  color: rgba(239, 68, 68, 0.8);
}

.delete-cycle-button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.delete-cycle-button i {
  font-size: 14px;
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

.datepicker-error :deep(.dp__input) {
  border-color: var(--ion-color-danger) !important;
}

/* Иконки */
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

:deep(.dp__calendar_item:hover) {
  background: rgba(255, 255, 255, 0.1) !important;
}

:deep(.dp__date_hover) {
  background: rgba(255, 255, 255, 0.1) !important;
}

:deep(.dp__date_selected) {
  background: var(--ion-color-primary) !important;
  color: white !important;
}

/* Кастомные отступы для CustomInput в форме цикла */
.cycle-form .custom-input-wrapper {
  margin: 0 !important;
}

.cycle-form .custom-input-label {
  margin-bottom: 6px !important;
}

/* Plans Management Styles */
.plans-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.add-plan-button {
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

.add-plan-button:hover {
  background: var(--ion-color-primary-shade);
}
</style>

