<template>
  <ion-page>
    <PageHeader 
      title="Планы" 
      :end-button="{ icon: 'fas fa-plus', onClick: createNewPlan, class: 'add-button' }"
    />

    <ion-content :fullscreen="true">
      <ion-refresher slot="fixed" @ionRefresh="handleRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <PageContainer>
        <h1 class="page-title">Планы тренировок</h1>
        <p class="page-subtitle">Выберите план для своей тренировки</p>
        
        <div class="search-filters-row">
          <SearchInput
            v-model="searchQuery"
            placeholder="Поиск планов..."
            @search="handleSearch"
            @clear="clearSearch"
            class="search-input"
          />
          
          <PlansFilters
            :filters="currentFilters"
            @filters-changed="handleFiltersChanged"
            @reset-filters="resetFilters"
            class="filters-component"
          />
        </div>

        <LoadingState v-if="loading" message="Загрузка планов..." />

        <div v-else-if="plans && plans.length > 0">
          <!-- Локальный спиннер для поиска -->
          <SearchLoading v-if="searchLoading" message="Поиск планов..." />
          
          <div class="plans-grid card-grid">
            <PlanCard
              v-for="plan in plans"
              :key="plan.id"
              :plan="plan"
              :is-duplicating="duplicatingPlanId === Number(plan.id)"
              @click="handlePlanClick"
              @duplicate="duplicatePlan"
              v-show="!searchLoading"
            />
          </div>
        </div>

        <EmptyState
          v-else-if="!searchLoading"
          icon="fas fa-list"
          title="Планы не найдены"
          :message="searchQuery ? 'Попробуйте изменить поисковый запрос' : 'Планы тренировок будут доступны в ближайшее время'"
          action-text="Создать план"
          action-icon="fas fa-plus"
          :action-handler="createNewPlan"
        />
      </PageContainer>
    </ion-content>

    <!-- Duplicate Confirmation Modal -->
    <DuplicateConfirmationModal
      :is-open="duplicateModal.isOpen"
      title="Дублировать план"
      message="Вы уверены, что хотите дублировать план"
      :item-name="duplicateModal.selectedPlan?.name"
      :is-duplicating="duplicatingPlanId !== null"
      @confirm="confirmDuplicate"
      @cancel="cancelDuplicate"
    />
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { clearDataCache } from '@/composables/useDataFetching';
import { useRouter } from 'vue-router';
import {
  IonPage,
  IonContent,
  IonRefresher,
  IonRefresherContent,
} from '@ionic/vue';
import { useDataFetching, useToast } from '@/composables';
import { plansService } from '@/services';
import { logger } from '@/utils/logger';
import { errorHandler } from '@/utils/error-handler';
import SearchInput from '@/components/ui/SearchInput.vue';
import PlansFilters from '@/components/filters/PlansFilters.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import LoadingState from '@/components/ui/LoadingState.vue';
import EmptyState from '@/components/ui/EmptyState.vue';
import SearchLoading from '@/components/ui/SearchLoading.vue';
import PageContainer from '@/components/ui/PageContainer.vue';
import PlanCard from '@/components/cards/PlanCard.vue';
import DuplicateConfirmationModal from '@/components/modals/DuplicateConfirmationModal.vue';
import type { Plan } from '@/types/api';

interface PlanFilters {
  is_active: boolean | null;
  standalone: boolean | null;
  cycle_id: number | null;
  sort_by: string;
  sort_order: string;
}

const router = useRouter();
const searchQuery = ref('');
const searchTimeout = ref<NodeJS.Timeout | null>(null);
const duplicatingPlanId = ref<number | null>(null);
const FILTERS_STORAGE_KEY = 'plans-filters';

const duplicateModal = ref<{
  isOpen: boolean;
  selectedPlan: Plan | null;
}>({
  isOpen: false,
  selectedPlan: null,
});

const saveFilters = (filters: PlanFilters): void => {
  try {
    localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(filters));
  } catch (e) {
    logger.warn('Failed to save filters', e);
  }
};

const loadFilters = (): PlanFilters | null => {
  try {
    const saved = localStorage.getItem(FILTERS_STORAGE_KEY);
    if (!saved) return null;
    const parsed = JSON.parse(saved) as PlanFilters;
    return parsed;
  } catch (e) {
    logger.warn('Failed to load filters', e);
    return null;
  }
};

const defaultFilters: PlanFilters = {
  is_active: true,
  standalone: null,
  cycle_id: null,
  sort_by: 'created_at',
  sort_order: 'desc'
};

const currentFilters = ref(loadFilters() || defaultFilters);

const { showSuccess, showError } = useToast();

const { data: plans, loading, execute: fetchData } = useDataFetching(
  async () => {
    const params: Record<string, string> = {};
    const f = currentFilters.value;
    
    if (searchQuery.value.trim()) params.search = searchQuery.value.trim();
    if (f.is_active !== null) params.is_active = String(f.is_active);
    if (f.standalone !== null) params.standalone = String(f.standalone);
    if (f.cycle_id !== null) params.cycle_id = String(f.cycle_id);
    if (f.sort_by) params.sort_by = f.sort_by;
    if (f.sort_order) params.sort_order = f.sort_order;
    
    return await plansService.getAll(params) || [];
  },
  { 
    immediate: true,
    skipIfDataExists: true, // Включаем кеш
    cacheKey: 'plans_list'
  }
);

const searchLoading = ref(false);

const handleRefresh = async (event: CustomEvent): Promise<void> => {
  // Очищаем кеш при ручном обновлении
  clearDataCache('plans_list');
  await fetchData();
  event.detail.complete();
};

const handlePlanClick = (plan: Plan): void => {
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }
  router.push(`/plan/${plan.id}`);
};

const handleSearch = (value: string): void => {
  searchQuery.value = value;
  if (searchTimeout.value) clearTimeout(searchTimeout.value);
  searchLoading.value = true;
  // Очищаем кеш при поиске, чтобы загрузить новые данные
  clearDataCache('plans_list');
  searchTimeout.value = setTimeout(async () => {
    await fetchData();
    searchLoading.value = false;
  }, 300);
};

const handleFiltersChanged = (filters: PlanFilters): void => {
  currentFilters.value = { ...filters };
  saveFilters(filters);
  // Очищаем кеш при изменении фильтров
  clearDataCache('plans_list');
  fetchData();
};

const clearSearch = (): void => {
  searchQuery.value = '';
  if (searchTimeout.value) clearTimeout(searchTimeout.value);
  searchLoading.value = true;
  // Очищаем кеш при очистке поиска
  clearDataCache('plans_list');
  fetchData();
  setTimeout(() => { searchLoading.value = false; }, 300);
};

const resetFilters = (): void => {
  currentFilters.value = { ...defaultFilters };
  try {
    localStorage.removeItem(FILTERS_STORAGE_KEY);
  } catch (e) {
    logger.warn('Failed to remove filters', e);
  }
  // Очищаем кеш при сбросе фильтров
  clearDataCache('plans_list');
  fetchData();
};

const createNewPlan = (): void => {
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }
  router.push('/plan/new');
};

const duplicatePlan = (plan: Plan): void => {
  if (duplicatingPlanId.value) return;
  duplicateModal.value = {
    isOpen: true,
    selectedPlan: plan,
  };
};

const confirmDuplicate = async () => {
  const plan = duplicateModal.value.selectedPlan;
  if (!plan) return;
  
  duplicatingPlanId.value = plan.id;
  try {
    await plansService.duplicate(plan.id.toString());
    await showSuccess('План успешно скопирован');
    // Очищаем кеш при успешном дублировании
    clearDataCache('plans_list');
    await fetchData();
  } catch (err: unknown) {
    errorHandler.log(err, 'PlansPage.confirmDuplicate');
    const errorMessage = errorHandler.format(err);
    await showError(errorMessage);
  } finally {
    duplicatingPlanId.value = null;
    duplicateModal.value = {
      isOpen: false,
      selectedPlan: null,
    };
  }
};

const cancelDuplicate = (): void => {
  duplicateModal.value = {
    isOpen: false,
    selectedPlan: null,
  };
};

const handlePlansUpdated = (): void => {
  // Очищаем кеш при обновлении планов извне
  clearDataCache('plans_list');
  fetchData();
};

onMounted(() => {
  fetchData();
  window.addEventListener('plans-updated', handlePlansUpdated);
});

onUnmounted(() => {
  window.removeEventListener('plans-updated', handlePlansUpdated);
  
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value);
  }
});
</script>

<style scoped>
.search-filters-row {
  display: flex;
  align-items: flex-start;
  width: 100%;
}

.search-input {
  flex: 1;
  min-width: 0;
  margin-right: 8px !important;
}

.filters-component {
  flex-shrink: 0;
}

.add-button {
  --background: transparent !important;
  --background-hover: transparent !important;
  --background-focused: transparent !important;
  --background-activated: transparent !important;
  --border-width: 0 !important;
  --border-style: none !important;
  --border-color: transparent !important;
  --color: white !important;
  --color-hover: rgba(255, 255, 255, 0.8) !important;
  --color-focused: white !important;
  --color-activated: rgba(255, 255, 255, 0.8) !important;
  --box-shadow: none !important;
  --padding-start: 8px !important;
  --padding-end: 8px !important;
  --padding-top: 8px !important;
  --padding-bottom: 8px !important;
  margin: 0 !important;
  width: 40px !important;
  height: 40px !important;
}

.add-button i {
  font-size: 20px !important;
  color: white !important;
}

.plans-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
}
</style>
