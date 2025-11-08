<template>
  <BasePage :swipe-back-options="{ onBeforeBack: handleSwipeBack }">
    <PageHeader :title="isEditMode ? 'Редактировать цикл' : 'Создать цикл'">
      <template #start>
          <ion-button @click="handleBack">
            <i class="fas fa-arrow-left"></i>
          </ion-button>
      </template>
    </PageHeader>

    <ion-content :fullscreen="true">
      <PageContainer>
        <h1 class="page-title">{{ isEditMode ? 'Редактирование цикла' : 'Новый цикл' }}</h1>
        <p class="page-subtitle">{{ isEditMode ? 'Обновите информацию о цикле тренировок' : 'Создайте новый тренировочный цикл' }}</p>

        <LoadingState v-if="loading" message="Загрузка..." />

        <form v-else @submit.prevent="handleSubmit" class="cycle-form">
          <CycleBasicInfo
            v-model:name="formData.name"
            v-model:weeks="formData.weeks"
            v-model:startDate="formData.start_date"
            v-model:endDate="formData.end_date"
            :errors="errors"
            @update:name="formData.name = $event"
            @update:weeks="formData.weeks = $event"
            @update:startDate="formData.start_date = $event"
            @update:endDate="formData.end_date = $event"
          />

          <CyclePlanSelection
            :plans="cyclePlans"
            :is-edit-mode="!!isEditMode"
            :errors="errors"
            @add-plan="openPlanModal"
            @reorder="handlePlanReorder"
            @delete="showDeleteConfirmation"
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
      </PageContainer>
    </ion-content>

    <PlanSelectionModal
      :is-open="planModal.isOpen.value"
      :available-plans="availablePlans"
      :loading-plans="loadingPlans"
      @close="handlePlanModalClose"
      @select-plan="addPlanToCycle"
      @create-new-plan="createNewPlan"
      @search="handlePlanSearch"
    />

    <DeleteConfirmationModal
      :is-open="deletePlanModal.isOpen.value"
      title="Подтверждение удаления"
      message="Вы уверены, что хотите удалить план"
      :item-name="deletePlanModal.data.value?.name"
      warning-text="Это действие нельзя отменить."
      @confirm="confirmDeletePlan"
      @cancel="cancelDeletePlan"
    />

    <DeleteConfirmationModal
      :is-open="deleteCycleModal.isOpen.value"
      title="Подтверждение удаления"
      message="Вы уверены, что хотите удалить цикл"
      :item-name="formData.name"
      warning-text="Это действие нельзя отменить. Будут удалены все связанные планы и тренировки."
      :is-deleting="submitting"
      @confirm="confirmDeleteCycle"
      @cancel="cancelDeleteCycle"
    />

    <UnsavedChangesModal
      :is-open="unsavedChangesModal.isOpen.value"
      @confirm="confirmLeave"
      @cancel="cancelLeave"
    />
  </BasePage>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue';
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
import PlanSelectionModal from '@/components/modals/PlanSelectionModal.vue';
import DeleteConfirmationModal from '@/components/modals/DeleteConfirmationModal.vue';
import UnsavedChangesModal from '@/components/modals/UnsavedChangesModal.vue';
import CycleBasicInfo from '@/components/cycle/CycleBasicInfo.vue';
import CyclePlanSelection from '@/components/cycle/CyclePlanSelection.vue';
import { cyclesService } from '@/services/cycles.service';
import { plansService } from '@/services/plans.service';
import { useToast, useModal } from '@/composables';
import { useCycleFormValidation, type CycleFormData, type ValidationErrors } from '@/composables/useCycleFormValidation';
import type { Plan, CyclePlan, Cycle as APICycle } from '@/types/api';

const router = useRouter();
const route = useRoute();
const { showSuccess, showError, showWarning } = useToast();

const cycleId = computed(() => route.params.id as string);
const isEditMode = computed(() => cycleId.value && cycleId.value !== 'new');

const hasUnsavedChanges = computed(() => {
  if (!originalFormData.value) return false;
  
  const formChanged = 
    formData.value.name !== originalFormData.value.name ||
    formData.value.weeks !== originalFormData.value.weeks ||
    formData.value.start_date?.getTime() !== originalFormData.value.start_date?.getTime() ||
    formData.value.end_date?.getTime() !== originalFormData.value.end_date?.getTime();
  
  const plansChanged = JSON.stringify(cyclePlans.value) !== JSON.stringify(originalCyclePlans.value);
  
  return formChanged || plansChanged;
});

const { validateForm, getFirstError } = useCycleFormValidation();

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

const cyclePlans = ref<CyclePlan[]>([]);
const availablePlans = ref<Plan[]>([]);
const planModal = useModal();
const loadingPlans = ref(false);

const deletePlanModal = useModal<{ index: number; name: string }>();
const deleteCycleModal = useModal();
const unsavedChangesModal = useModal();
const pendingNavigation = ref<any>(null);
const isLeaving = ref(false);

// Swipe back handler for unsaved changes check
const handleSwipeBack = async (): Promise<boolean> => {
  if (hasUnsavedChanges.value) {
    pendingNavigation.value = () => router.back();
    unsavedChangesModal.open();
    return false; // Cancel navigation, show modal
  }
  return true; // Allow navigation
};

const originalFormData = ref<CycleFormData | null>(null);
const originalCyclePlans = ref<CyclePlan[]>([]);

const formData = ref<CycleFormData>({
  name: '',
  weeks: '6',
  start_date: new Date(),
  end_date: null,
});

const fetchCycleData = async () => {
  if (!isEditMode.value) return;

  loading.value = true;
  try {
    const cycle = await cyclesService.getById(cycleId.value) as any;

    formData.value = {
      name: cycle.name || '',
      weeks: cycle.weeks ? cycle.weeks.toString() : '',
      start_date: cycle.start_date ? new Date(cycle.start_date) : null,
      end_date: cycle.end_date ? new Date(cycle.end_date) : null,
    };

    originalFormData.value = {
      name: cycle.name || '',
      weeks: cycle.weeks ? cycle.weeks.toString() : '',
      start_date: cycle.start_date ? new Date(cycle.start_date) : null,
      end_date: cycle.end_date ? new Date(cycle.end_date) : null,
    };

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
      
      originalCyclePlans.value = JSON.parse(JSON.stringify(cyclePlans.value));
    } else {
      cyclePlans.value = [];
      originalCyclePlans.value = [];
    }

  } catch (err) {
    console.error('Failed to fetch cycle:', err);
    showError('Не удалось загрузить данные цикла');
    router.back();
  } finally {
    loading.value = false;
  }
};

const handleSubmit = async () => {
  const formDataWithPlans = {
    ...formData.value,
    plan_ids: cyclePlans.value.map(cp => cp.plan_id)
  };

  const { isValid, errors: validationErrors } = validateForm(formDataWithPlans);
  errors.value = validationErrors;

  if (!isValid) {
    showWarning('Пожалуйста, исправьте ошибки в форме');
    return;
  }

  submitting.value = true;
  errors.value = {};

  try {
    const planIds = cyclePlans.value.map(cp => cp.plan_id).filter(id => typeof id === 'number' && !isNaN(id));
    
    const payload: any = {
      name: formData.value.name.trim(),
      weeks: parseInt(formData.value.weeks),
      start_date: formData.value.start_date ? formData.value.start_date.toISOString().split('T')[0] : null,
      end_date: formData.value.end_date ? formData.value.end_date.toISOString().split('T')[0] : null,
      plan_ids: planIds
    };

    if (isEditMode.value) {
      await cyclesService.update(cycleId.value, payload);
      showSuccess('Цикл успешно обновлен');
    } else {
      await cyclesService.create(payload);
      showSuccess('Цикл успешно создан');
    }

    window.dispatchEvent(new CustomEvent('cycles-updated'));
    
    originalFormData.value = {
      name: formData.value.name,
      weeks: formData.value.weeks,
      start_date: formData.value.start_date ? new Date(formData.value.start_date) : null,
      end_date: formData.value.end_date ? new Date(formData.value.end_date) : null,
    };
    originalCyclePlans.value = [...cyclePlans.value];
    
    if (isEditMode.value) {
      await fetchCycleData();
    }
    
    router.push('/tabs/cycles');
  } catch (err: any) {
    console.error('Failed to save cycle:', err);
    
    if (err.errors) {
      const processedErrors: ValidationErrors = {};
      Object.keys(err.errors).forEach(key => {
        const errorArray = err.errors[key];
        if (errorArray && errorArray.length > 0) {
          processedErrors[key as keyof ValidationErrors] = errorArray;
        }
      });
      errors.value = processedErrors;
    }

    showError(err.message || `Не удалось ${isEditMode.value ? 'обновить' : 'создать'} цикл`);
  } finally {
    submitting.value = false;
  }
};

const fetchAvailablePlans = async (searchTerm: string = '') => {
  loadingPlans.value = true;
  try {
    const allPlans = await plansService.getAll({ search: searchTerm.trim() }) as any[] || [];
    
    // Планы, которые уже добавлены в текущий цикл (разрешаем их выбрать повторно)
    const addedPlanIds = cyclePlans.value.map(cp => cp.plan_id);
    
    // Текущий ID цикла (если редактируем)
    const currentCycleId = isEditMode.value ? parseInt(cycleId.value) : null;
    
    const availablePlansFiltered = allPlans.filter((plan: any) => {
      const isActive = plan.is_active === true || (plan.is_active as any) === 1;
      const notAdded = !addedPlanIds.includes(plan.id);
      
      // Проверяем, не используется ли план в другом цикле
      // План доступен если:
      // 1. У плана нет cycle (не используется ни в каком цикле)
      // 2. ИЛИ мы редактируем цикл и план принадлежит текущему циклу
      const isAvailable = !plan.cycle || 
        (isEditMode.value && plan.cycle?.id === currentCycleId);
      
      return isActive && notAdded && isAvailable;
    });
    
    availablePlans.value = availablePlansFiltered;
  } catch (err) {
    console.error('Failed to fetch plans:', err);
    showError('Не удалось загрузить планы');
  } finally {
    loadingPlans.value = false;
  }
};

const handlePlanSearch = (value: string) => {
  fetchAvailablePlans(value);
};

const createNewPlan = async () => {
  planModal.close();
  await nextTick();
  
  setTimeout(() => {
    router.push('/plan/new');
  }, 300);
};

const addPlanToCycle = (plan: Plan) => {
  const newCyclePlan: CyclePlan = {
    id: 0,
    cycle_id: parseInt(cycleId.value) || 0,
    plan_id: plan.id,
    order: cyclePlans.value.length + 1,
    plan: plan
  };
  
  cyclePlans.value.push(newCyclePlan);
  planModal.close();
  handlePlanSearch('');
  fetchAvailablePlans('');
  
  setTimeout(() => {
    const activeElement = document.activeElement as HTMLElement;
    if (activeElement && activeElement.blur) {
      activeElement.blur();
    }
    const modalElement = document.querySelector('.ion-page-hidden');
    if (modalElement) {
      modalElement.removeAttribute('aria-hidden');
    }
  }, 100);
};

const handlePlanReorder = (reorderedPlans: CyclePlan[]) => {
  cyclePlans.value = reorderedPlans;
};

const showDeleteConfirmation = (index: number) => {
  const plan = cyclePlans.value[index];
  deletePlanModal.open({ index, name: plan.plan.name });
};

const confirmDeletePlan = () => {
  if (deletePlanModal.data.value?.index !== undefined) {
    cyclePlans.value.splice(deletePlanModal.data.value.index, 1);
  }
  deletePlanModal.close();
  
  fetchAvailablePlans('');
  
  setTimeout(() => {
    const activeElement = document.activeElement as HTMLElement;
    if (activeElement && activeElement.blur) {
      activeElement.blur();
    }
    const modalElement = document.querySelector('.ion-page-hidden');
    if (modalElement) {
      modalElement.removeAttribute('aria-hidden');
    }
  }, 100);
};

const cancelDeletePlan = () => {
  deletePlanModal.close();
  
  setTimeout(() => {
    const activeElement = document.activeElement as HTMLElement;
    if (activeElement && activeElement.blur) {
      activeElement.blur();
    }
    const modalElement = document.querySelector('.ion-page-hidden');
    if (modalElement) {
      modalElement.removeAttribute('aria-hidden');
    }
  }, 100);
};

const showDeleteCycleConfirmation = () => {
  deleteCycleModal.open();
};

const confirmDeleteCycle = async () => {
  if (!isEditMode.value) return;
  
  submitting.value = true;
  
  try {
    await cyclesService.delete(cycleId.value);
    showSuccess('Цикл успешно удален');
    window.dispatchEvent(new CustomEvent('cycles-updated'));
    router.push('/tabs/cycles');
  } catch (err: any) {
    console.error('Failed to delete cycle:', err);
    showError(err.message || 'Не удалось удалить цикл');
  } finally {
    submitting.value = false;
    deleteCycleModal.close();
    
    setTimeout(() => {
      const activeElement = document.activeElement as HTMLElement;
      if (activeElement && activeElement.blur) {
        activeElement.blur();
      }
    }, 100);
  }
};

const cancelDeleteCycle = () => {
  deleteCycleModal.close();
  
  setTimeout(() => {
    const activeElement = document.activeElement as HTMLElement;
    if (activeElement && activeElement.blur) {
      activeElement.blur();
    }
    const modalElement = document.querySelector('.ion-page-hidden');
    if (modalElement) {
      modalElement.removeAttribute('aria-hidden');
    }
  }, 100);
};

const openPlanModal = async () => {
  if (availablePlans.value.length === 0) {
    await fetchAvailablePlans('');
  }
  planModal.open();
};

const handlePlanModalClose = () => {
  planModal.close();
  handlePlanSearch('');
};

const initializeOriginalState = () => {
  const currentDate = new Date();
  const defaultName = generateCycleName(currentDate, 6);
  
  originalFormData.value = {
    name: defaultName,
    weeks: '6',
    start_date: currentDate,
    end_date: null,
  };
  originalCyclePlans.value = [];
};

// Функция для полного сброса состояния формы при создании нового цикла
const resetFormState = () => {
  const currentDate = new Date();
  const defaultName = generateCycleName(currentDate, 6);
  
  formData.value = {
    name: defaultName,
    weeks: '6',
    start_date: currentDate,
    end_date: null,
  };
  cyclePlans.value = [];
  errors.value = {};
  originalFormData.value = {
    name: defaultName,
    weeks: '6',
    start_date: currentDate,
    end_date: null,
  };
  originalCyclePlans.value = [];
  availablePlans.value = [];
  
  // Закрываем все модальные окна
  planModal.close();
  deletePlanModal.close();
  deleteCycleModal.close();
  unsavedChangesModal.close();
  pendingNavigation.value = null;
};

const handleBack = () => {
  if (hasUnsavedChanges.value) {
    pendingNavigation.value = () => router.back();
    unsavedChangesModal.open();
  } else {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    router.back();
  }
};

const confirmLeave = () => {
  unsavedChangesModal.close();
  isLeaving.value = true;
  if (pendingNavigation.value) {
    pendingNavigation.value();
    pendingNavigation.value = null;
  }
};

const cancelLeave = () => {
  unsavedChangesModal.close();
  pendingNavigation.value = null;
};

onBeforeRouteLeave((to: any, from: any, next: any) => {
  if (isLeaving.value) {
    isLeaving.value = false;
    next();
    return;
  }
  
  if (hasUnsavedChanges.value) {
    pendingNavigation.value = () => next();
    unsavedChangesModal.open();
  } else {
    next();
  }
});

// Сбрасываем состояние при переходе в режим создания нового цикла
watch(isEditMode, (newMode, oldMode) => {
  // Если переходим из режима редактирования в режим создания
  if (oldMode !== undefined && !newMode && oldMode) {
    resetFormState();
  }
}, { immediate: false });

// Также отслеживаем прямой переход на страницу создания
watch(() => route.params.id, (newId) => {
  // Если переходим на создание нового цикла
  if (!newId || newId === 'new') {
    if (!isEditMode.value) {
      resetFormState();
    }
  }
}, { immediate: false });

onMounted(() => {
  if (isEditMode.value) {
    fetchCycleData();
  } else {
    // Для новых циклов сбрасываем состояние
    resetFormState();
  }
});

onUnmounted(() => {
  availablePlans.value = [];
});

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
.cycle-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

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
  transition: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  min-height: 40px;
}

.delete-cycle-button:hover { background: transparent; border-color: rgba(239, 68, 68, 0.4); color: rgba(239, 68, 68, 0.7); }

.delete-cycle-button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.delete-cycle-button i {
  font-size: 14px;
}

ion-toolbar ion-button i {
  font-size: 20px;
  color: white !important;
}

.cycle-form .custom-input-wrapper {
  margin: 0 !important;
}

.cycle-form .custom-input-label {
  margin-bottom: 6px !important;
}
</style>
