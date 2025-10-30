<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>Планы</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="createNewPlan" class="add-button">
            <i class="fas fa-plus"></i>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

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
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, onActivated, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonRefresher,
  IonRefresherContent,
  IonButtons,
  IonButton,
} from '@ionic/vue';
import { useDataFetching, useToast } from '@/composables';
import { plansService } from '@/services';
import SearchInput from '@/components/ui/SearchInput.vue';
import PlansFilters from '@/components/filters/PlansFilters.vue';
import LoadingState from '@/components/ui/LoadingState.vue';
import EmptyState from '@/components/ui/EmptyState.vue';
import SearchLoading from '@/components/ui/SearchLoading.vue';
import PageContainer from '@/components/ui/PageContainer.vue';
import PlanCard from '@/components/cards/PlanCard.vue';
import type { Plan } from '@/types/api';

const router = useRouter();
const searchQuery = ref('');
const searchTimeout = ref<NodeJS.Timeout | null>(null);
const duplicatingPlanId = ref<number | null>(null);
const FILTERS_STORAGE_KEY = 'plans-filters';

const saveFilters = (filters: any) => {
  try {
    localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(filters));
  } catch (e) {
    console.warn('Failed to save filters:', e);
  }
};

const loadFilters = () => {
  try {
    const saved = localStorage.getItem(FILTERS_STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch (e) {
    return null;
  }
};

const defaultFilters = {
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
  { immediate: true }
);

const searchLoading = ref(false);

const handleRefresh = async (event: CustomEvent) => {
  await fetchData();
  event.detail.complete();
};

const handlePlanClick = (plan: Plan) => {
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }
  router.push(`/plan/${plan.id}`);
};

const handleSearch = (value: string) => {
  searchQuery.value = value;
  if (searchTimeout.value) clearTimeout(searchTimeout.value);
  searchLoading.value = true;
  searchTimeout.value = setTimeout(async () => {
    await fetchData();
    searchLoading.value = false;
  }, 300);
};

const handleFiltersChanged = (filters: any) => {
  currentFilters.value = { ...filters };
  saveFilters(filters);
  fetchData();
};

const clearSearch = () => {
  searchQuery.value = '';
  if (searchTimeout.value) clearTimeout(searchTimeout.value);
  searchLoading.value = true;
  fetchData();
  setTimeout(() => { searchLoading.value = false; }, 300);
};

const resetFilters = () => {
  currentFilters.value = { ...defaultFilters };
  try {
    localStorage.removeItem(FILTERS_STORAGE_KEY);
  } catch (e) {}
  fetchData();
};

const createNewPlan = () => {
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }
  router.push('/plan/new');
};

const duplicatePlan = async (plan: Plan) => {
  if (duplicatingPlanId.value) return;
  duplicatingPlanId.value = plan.id;
  try {
    await plansService.duplicate(plan.id.toString());
    await showSuccess('План успешно скопирован');
    await fetchData();
  } catch (err) {
    await showError('Ошибка при копировании плана');
  } finally {
    duplicatingPlanId.value = null;
  }
};

onActivated(() => {
  fetchData();
});

const handlePlansUpdated = () => {
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
