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
                <ion-icon :icon="addOutline"></ion-icon>
                Добавить план
              </button>
            </div>
            
            <div v-if="cyclePlans.length === 0" class="empty-plans-state">
              <i class="fas fa-list"></i>
              <p>Планы не добавлены</p>
              <span class="hint">Добавьте планы тренировок для создания цикла</span>
            </div>

            <div v-else class="plans-list">
              <div class="global-plan-hint">
                <i class="fas fa-info-circle"></i>
                <span>Долгое нажатие на план для удаления</span>
              </div>
              
              <draggable
                v-model="cyclePlans"
                @end="onPlanDragEnd"
                @start="onPlanDragStart"
                @move="onPlanMove"
                item-key="id"
                handle=".drag-handle"
                class="draggable-list"
                :animation="0"
                :ghost-class="''"
                :chosen-class="'sortable-chosen'"
                :drag-class="'sortable-drag'"
                :force-fallback="false"
                :fallback-tolerance="0"
                :delay="0"
                :delay-on-touch-start="false"
                :touch-start-threshold="10"
                :swap-threshold="0.65"
                :invert-swap="false"
                :direction="'vertical'"
                :disabled="false"
                :scroll="false"
                :group="false"
                :pull="false"
                :put="false"
              >
                <template #item="{ element: cyclePlan, index }">
                  <div 
                    class="plan-item"
                    @longpress="showDeleteConfirmation(index)"
                    @touchstart="handleTouchStart"
                    @touchend="handleTouchEnd"
                    @touchmove="handleTouchMove"
                  >
                    <div class="drag-handle">
                      <ion-icon :icon="reorderFourOutline"></ion-icon>
                    </div>
                    
                    <div class="plan-info">
                      <h4>{{ cyclePlan.plan.name }}</h4>
                      <div class="plan-meta">
                        <span class="plan-stats">
                          <i class="fas fa-dumbbell"></i>
                          {{ cyclePlan.plan.exercise_count }} упражнений
                        </span>
                      </div>
                    </div>
                  </div>
                </template>
              </draggable>
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
                {{ isEditMode ? 'Сохранить' : 'Создать цикл' }}
              </span>
            </button>
          </div>
        </form>
      </div>
    </ion-content>

    <!-- Plan Selection Modal -->
    <ion-modal :is-open="isPlanModalOpen" @did-dismiss="isPlanModalOpen = false">
      <ion-header>
        <ion-toolbar>
          <ion-title>Выберите план</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="isPlanModalOpen = false">
              <ion-icon :icon="closeOutline"></ion-icon>
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      
      <ion-content>
        <div class="modal-content">
          <ion-searchbar
            v-model="planSearchQuery"
            placeholder="Поиск планов..."
            :debounce="300"
          ></ion-searchbar>
          
          <div v-if="loadingPlans" class="loading-state">
            <ion-spinner name="crescent"></ion-spinner>
            <p>Загрузка планов...</p>
          </div>
          
          <div v-else-if="filteredPlans.length === 0" class="empty-state">
            <i class="fas fa-search"></i>
            <h3>Планы не найдены</h3>
            <p>{{ planSearchQuery ? 'Попробуйте изменить поисковый запрос' : 'Все доступные планы уже добавлены' }}</p>
          </div>
          
          <div v-else class="plans-grid">
            <ion-card
              v-for="plan in filteredPlans"
              :key="plan.id"
              class="plan-card"
              @click="addPlanToCycle(plan)"
            >
              <ion-card-header>
                <ion-card-title>{{ plan.name }}</ion-card-title>
              </ion-card-header>
              
              <ion-card-content>
                <div class="plan-meta">
                  <div class="plan-stats">
                    <span>
                      <i class="fas fa-dumbbell"></i>
                      {{ plan.exercise_count }} упражнений
                    </span>
                  </div>
                </div>
              </ion-card-content>
            </ion-card>
          </div>
        </div>
      </ion-content>
    </ion-modal>

    <!-- Delete Confirmation Dialog -->
    <ion-modal :is-open="isDeleteDialogOpen" @did-dismiss="cancelDeletePlan">
      <ion-header>
        <ion-toolbar>
          <ion-title>Подтверждение удаления</ion-title>
        </ion-toolbar>
      </ion-header>
      
      <ion-content>
        <div class="delete-dialog-content">
          <div class="delete-icon">
            <i class="fas fa-exclamation-triangle"></i>
          </div>
          
          <h2>Удалить план?</h2>
          <p>Вы уверены, что хотите удалить план <strong>"{{ planToDeleteName }}"</strong> из цикла?</p>
          <p class="warning-text">Это действие нельзя отменить.</p>
          
          <div class="dialog-actions">
            <button
              type="button"
              class="dialog-button cancel-button"
              @click="cancelDeletePlan"
            >
              <i class="fas fa-times"></i>
              Отмена
            </button>
            
            <button
              type="button"
              class="dialog-button delete-button"
              @click="confirmDeletePlan"
            >
              <i class="fas fa-trash"></i>
              Удалить
            </button>
          </div>
        </div>
      </ion-content>
    </ion-modal>
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
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  IonChip,
  IonModal,
  IonSearchbar,
  toastController,
  alertController,
} from '@ionic/vue';
import { addOutline, removeOutline, reorderFourOutline, closeOutline } from 'ionicons/icons';
import CustomInput from '@/components/CustomInput.vue';
import VueDatePicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';
import draggable from 'vuedraggable';
import apiClient from '@/services/api';
import { ApiError, Plan, CyclePlan } from '@/types/api';

interface CycleFormData {
  name: string;
  weeks: string;
  start_date: Date | null;
  end_date: Date | null;
}

interface ValidationErrors {
  name?: string | string[];
  weeks?: string | string[];
  start_date?: string | string[];
  end_date?: string | string[];
}

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

// Функция для получения первой ошибки из массива
const getFirstError = (error: string | string[] | undefined): string => {
  if (!error) return '';
  if (Array.isArray(error)) {
    return error[0] || '';
  }
  return error;
};

const loading = ref(false);
const submitting = ref(false);
const errors = ref<ValidationErrors>({});

// Plan management
const cyclePlans = ref<CyclePlan[]>([]);
const availablePlans = ref<Plan[]>([]);
const planSearchQuery = ref('');
const isPlanModalOpen = ref(false);
const loadingPlans = ref(false);

// Delete confirmation dialog
const isDeleteDialogOpen = ref(false);
const planToDelete = ref<number | null>(null);
const planToDeleteName = ref('');

// Original state tracking for unsaved changes detection
const originalFormData = ref<CycleFormData | null>(null);
const originalCyclePlans = ref<CyclePlan[]>([]);

const formData = ref<CycleFormData>({
  name: '',
  weeks: '',
  start_date: null,
  end_date: null,
});

const fetchCycleData = async () => {
  if (!isEditMode.value) return;

  loading.value = true;
  try {
    const response = await apiClient.get(`/api/v1/cycles/${cycleId.value}`);
    const cycle = response.data.data;

    console.log('Загруженные данные цикла:', cycle);

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

    console.log('Обработанные данные формы:', formData.value);
    console.log('Загруженные планы цикла:', cyclePlans.value);
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

const validateForm = (): boolean => {
  errors.value = {};
  let isValid = true;

  if (!formData.value.name || formData.value.name.trim().length === 0) {
    errors.value.name = 'Название цикла обязательно';
    isValid = false;
  } else if (formData.value.name.trim().length < 3) {
    errors.value.name = 'Название должно содержать минимум 3 символа';
    isValid = false;
  }

  if (!formData.value.weeks || formData.value.weeks.trim().length === 0) {
    errors.value.weeks = 'Укажите количество недель (минимум 1)';
    isValid = false;
  } else {
    const weeksNum = parseInt(formData.value.weeks);
    if (isNaN(weeksNum) || weeksNum < 1) {
      errors.value.weeks = 'Укажите количество недель (минимум 1)';
      isValid = false;
    } else if (weeksNum > 52) {
      errors.value.weeks = 'Максимальное количество недель: 52';
      isValid = false;
    }
  }

  if (formData.value.start_date && formData.value.end_date) {
    if (formData.value.end_date <= formData.value.start_date) {
      errors.value.end_date = 'Дата окончания должна быть позже даты начала';
      isValid = false;
    }
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
      weeks: parseInt(formData.value.weeks),
      // Всегда отправляем даты, даже если они null (для очистки)
      start_date: formData.value.start_date ? formData.value.start_date.toISOString().split('T')[0] : null,
      end_date: formData.value.end_date ? formData.value.end_date.toISOString().split('T')[0] : null,
      // Отправляем данные о планах
      plans: cyclePlans.value.map(cp => ({
        plan_id: cp.plan_id,
        order: cp.order
      }))
    };

    console.log('Отправляемые данные:', payload);

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
const fetchAvailablePlans = async () => {
  loadingPlans.value = true;
  try {
    const response = await apiClient.get('/api/v1/plans');
    const allPlans = response.data.data || response.data || [];
    // Фильтруем только активные планы
    availablePlans.value = allPlans.filter((plan: Plan) => plan.is_active === true);
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
  if (!planSearchQuery.value.trim()) {
    return availablePlans.value.filter(plan => 
      !cyclePlans.value.some(cp => cp.plan_id === plan.id)
    );
  }
  
  return availablePlans.value.filter(plan => 
    !cyclePlans.value.some(cp => cp.plan_id === plan.id) &&
    plan.name.toLowerCase().includes(planSearchQuery.value.toLowerCase())
  );
});

const addPlanToCycle = (plan: Plan) => {
  const newCyclePlan: CyclePlan = {
    id: 0, // Will be assigned by server
    cycle_id: parseInt(cycleId.value) || 0,
    plan_id: plan.id,
    order: cyclePlans.value.length + 1,
    plan: plan
  };
  
  cyclePlans.value.push(newCyclePlan);
  isPlanModalOpen.value = false;
  planSearchQuery.value = '';
};

const removePlanFromCycle = (index: number) => {
  cyclePlans.value.splice(index, 1);
  // Update order for remaining plans
  cyclePlans.value.forEach((cp, idx) => {
    cp.order = idx + 1;
  });
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
    // Update order for remaining plans
    cyclePlans.value.forEach((cp, idx) => {
      cp.order = idx + 1;
    });
  }
  isDeleteDialogOpen.value = false;
  planToDelete.value = null;
  planToDeleteName.value = '';
};

const cancelDeletePlan = () => {
  isDeleteDialogOpen.value = false;
  planToDelete.value = null;
  planToDeleteName.value = '';
};

// Long press handlers
let touchStartTime = 0;
let touchStartX = 0;
let touchStartY = 0;
let longPressTimer: NodeJS.Timeout | null = null;

const handleTouchStart = (event: TouchEvent) => {
  touchStartTime = Date.now();
  touchStartX = event.touches[0].clientX;
  touchStartY = event.touches[0].clientY;
  
  longPressTimer = setTimeout(() => {
    // Long press detected
    const target = event.target as HTMLElement;
    const planItem = target.closest('.plan-item');
    if (planItem) {
      const index = Array.from(planItem.parentElement?.children || []).indexOf(planItem);
      showDeleteConfirmation(index);
    }
  }, 800); // 800ms for long press
};

const handleTouchEnd = () => {
  if (longPressTimer) {
    clearTimeout(longPressTimer);
    longPressTimer = null;
  }
};

const handleTouchMove = () => {
  if (longPressTimer) {
    clearTimeout(longPressTimer);
    longPressTimer = null;
  }
};

const onPlanMove = (evt: any) => {
  // Prevent default move behavior to ensure smooth animation
  return true;
};

const onPlanDragStart = () => {
  // Add sorting class to enable smooth transitions
  const draggableList = document.querySelector('.draggable-list');
  if (draggableList) {
    draggableList.classList.add('sorting');
  }
};

const onPlanDragEnd = () => {
  // Update order after drag and drop
  cyclePlans.value.forEach((cp, idx) => {
    cp.order = idx + 1;
  });
  
  // Remove sorting class after animation completes with longer delay
  setTimeout(() => {
    const draggableList = document.querySelector('.draggable-list');
    if (draggableList) {
      draggableList.classList.remove('sorting');
    }
  }, 500); // Increased delay for smoother animation
};

const openPlanModal = async () => {
  if (availablePlans.value.length === 0) {
    await fetchAvailablePlans();
  }
  isPlanModalOpen.value = true;
};

// Initialize original state for new cycles
const initializeOriginalState = () => {
  originalFormData.value = {
    name: '',
    weeks: '',
    start_date: null,
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

.cycle-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
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

.empty-plans-state {
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

.empty-plans-state i {
  font-size: 2rem;
  margin-bottom: 1rem;
  color: var(--ion-color-primary);
}

.empty-plans-state p {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--ion-text-color);
}

.empty-plans-state .hint {
  font-size: 14px;
  color: var(--ion-color-medium);
}

.plans-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.draggable-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  transform: translateZ(0); /* Force hardware acceleration */
  will-change: transform;
}

.plan-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: grab;
  position: relative;
  will-change: transform, opacity, box-shadow;
  backface-visibility: hidden;
  perspective: 1000px;
  contain: layout style paint;
}

.plan-item:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.15);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Drag and drop animations - simplified */
.plan-item.sortable-chosen {
  cursor: grabbing;
  transform: scale(1.02);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
  z-index: 1000;
  transition: all 0.2s ease;
}

.plan-item.sortable-drag {
  opacity: 0.8;
  transform: scale(1.05);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.4);
  z-index: 1001;
  transition: all 0.2s ease;
}

/* Hide ALL intermediate drag elements */
.sortable-ghost,
.sortable-placeholder,
.sortable-fallback,
.sortable-clone,
.draggable-list .sortable-ghost,
.draggable-list .sortable-placeholder,
.draggable-list .sortable-fallback,
.draggable-list .sortable-clone {
  display: none !important;
  opacity: 0 !important;
  visibility: hidden !important;
  height: 0 !important;
  width: 0 !important;
  margin: 0 !important;
  padding: 0 !important;
  border: none !important;
  background: transparent !important;
}

/* Smooth movement for all items during drag */
.plan-item:not(.sortable-chosen):not(.sortable-drag) {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Additional rules to hide any drag-related elements */
*[class*="sortable-ghost"],
*[class*="sortable-placeholder"],
*[class*="sortable-fallback"],
*[class*="sortable-clone"],
*[class*="ghost"],
*[class*="placeholder"],
*[class*="fallback"],
*[class*="clone"] {
  display: none !important;
  opacity: 0 !important;
  visibility: hidden !important;
}

/* Ensure no elements overlap during drag */
.draggable-list.sorting .plan-item {
  position: relative;
  z-index: auto;
}

.draggable-list.sorting .plan-item.sortable-chosen,
.draggable-list.sorting .plan-item.sortable-drag {
  z-index: 1000;
}

/* Enhanced smooth movement */
/* Removed duplicate .draggable-list styles - merged above */

/* Prevent layout shifts during drag */
/* Removed duplicate .plan-item styles - merged above */

.drag-handle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  color: var(--ion-color-medium);
  cursor: grab;
  border-radius: 6px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.drag-handle:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--ion-color-primary);
  transform: scale(1.1);
}

.drag-handle:active {
  cursor: grabbing;
  transform: scale(0.95);
}

/* Enhanced drag handle animations during drag */
.plan-item.sortable-chosen .drag-handle {
  color: var(--ion-color-primary);
  background: rgba(99, 102, 241, 0.2);
  transform: scale(1.1);
}

.plan-item.sortable-drag .drag-handle {
  color: var(--ion-color-primary);
  background: rgba(99, 102, 241, 0.3);
  transform: scale(1.15);
}

.plan-info {
  flex: 1;
  min-width: 0;
}

.plan-info h4 {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--ion-text-color);
}

.plan-info p {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: var(--ion-color-medium);
  line-height: 1.4;
}

.plan-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.plan-stats {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: var(--ion-color-medium);
}

.plan-stats i {
  margin-right: 4px;
  color: var(--ion-color-primary);
}

.remove-plan-button {
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

.remove-plan-button:hover {
  background: rgba(239, 68, 68, 0.2);
}

.global-plan-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--ion-color-medium);
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  margin-bottom: 12px;
}

.global-plan-hint i {
  font-size: 14px;
  color: var(--ion-color-primary);
}


/* Modal Styles */
.modal-content {
  padding: 16px;
}

.plans-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
  margin-top: 16px;
}

.modal-content .plan-card {
  cursor: pointer;
  transition: transform 0.2s ease;
}

.modal-content .plan-card:hover {
  transform: translateY(-2px);
}

.modal-content .plan-card ion-card-header {
  padding-bottom: 8px;
}

.modal-content .plan-card ion-card-title {
  font-size: 16px;
  font-weight: 600;
}

.modal-content .plan-card ion-card-content {
  padding-top: 0;
}

.modal-content .plan-card ion-card-content p {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: var(--ion-color-medium);
  line-height: 1.4;
}

.modal-content .plan-meta {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.modal-content .plan-stats {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.modal-content .plan-stats span {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: var(--ion-color-medium);
}

.modal-content .plan-stats i {
  margin-right: 4px;
  color: var(--ion-color-primary);
}

/* Delete Confirmation Dialog Styles */
.delete-dialog-content {
  padding: 24px;
  text-align: center;
  max-width: 400px;
  margin: 0 auto;
}

.delete-icon {
  margin-bottom: 20px;
}

.delete-icon i {
  font-size: 4rem;
  color: var(--ion-color-warning);
}

.delete-dialog-content h2 {
  margin: 0 0 16px 0;
  font-size: 24px;
  font-weight: 600;
  color: var(--ion-text-color);
}

.delete-dialog-content p {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: var(--ion-color-medium);
  line-height: 1.5;
}

.warning-text {
  color: var(--ion-color-warning) !important;
  font-weight: 500;
}

.dialog-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

.dialog-button {
  flex: 1;
  padding: 12px 20px;
  border: none;
  border-radius: 12px;
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

.cancel-button {
  background: rgba(255, 255, 255, 0.1);
  color: var(--ion-text-color);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.cancel-button:hover {
  background: rgba(255, 255, 255, 0.15);
}

.delete-button {
  background: var(--ion-color-danger);
  color: white;
}

.delete-button:hover {
  background: var(--ion-color-danger-shade);
}

.dialog-button i {
  font-size: 16px;
}

/* Additional smooth animations for plan items */
/* Removed duplicate .plan-item styles - merged above */

.plan-item:not(.sortable-chosen):not(.sortable-drag) {
  animation: slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Smooth reordering animation */
.plan-item.reordering {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Enhanced visual feedback during drag */
.plan-item.sortable-chosen .plan-info {
  opacity: 0.8;
}

.plan-item.sortable-drag .plan-info {
  opacity: 0.6;
}

/* Force smooth animations on mobile */
@media (max-width: 768px) {
  .plan-item {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
  }
  
  .draggable-list.sorting .plan-item {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
  }
}
</style>

