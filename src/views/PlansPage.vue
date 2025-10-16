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

      <div class="page-content">
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

        <div v-if="loading" class="loading-state">
          <ion-spinner name="crescent"></ion-spinner>
          <p>Загрузка планов...</p>
        </div>

        <div v-else-if="filteredPlans.length > 0">
          <div class="plans-grid">
            <div
              v-for="plan in filteredPlans"
              :key="plan.id"
              class="plan-card modern-card"
              @click="handlePlanClick(plan)"
            >
              <div class="plan-header">
                <h3>{{ plan.name }}</h3>
                <div v-if="!plan.is_active" class="inactive-label">
                  не активен
                </div>
              </div>
              
              <div class="plan-stats">
                <div class="stat">
                  <div class="stat-content">
                    <div v-if="plan.cycle" class="cycle-info">
                      <i class="fas fa-sync-alt cycle-icon"></i>
                      <span>{{ plan.cycle.name }}</span>
                    </div>
                    <div class="exercise-count">
                      <i class="fas fa-dumbbell"></i>
                      <span>{{ plan.exercise_count || 0 }} упражнений</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="exercises-list" v-if="plan.exercises && plan.exercises.length > 0">
                <div 
                  v-for="exercise in getSortedExercises(plan.exercises)" 
                  :key="exercise.id"
                  class="exercise-item"
                >
                  {{ exercise.order }}. {{ exercise.name }}
                </div>
              </div>
              
              <div class="plan-footer">
                <div class="created-date">
                  {{ formatDate(plan.created_at) }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="empty-state">
          <i class="fas fa-list empty-icon"></i>
          <h2>{{ searchQuery ? 'Планы не найдены' : 'Нет планов' }}</h2>
          <p>{{ searchQuery ? 'Попробуйте изменить поисковый запрос' : 'Планы тренировок будут доступны в ближайшее время' }}</p>
          <button
            @click="createNewPlan"
            class="modern-button"
          >
            <i class="fas fa-plus"></i>
            Создать план
          </button>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, onActivated, computed, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonSpinner,
  IonRefresher,
  IonRefresherContent,
  IonButtons,
  IonButton,
} from '@ionic/vue';
import SearchInput from '@/components/SearchInput.vue';
import PlansFilters from '@/components/PlansFilters.vue';
import apiClient from '@/services/api';
import { Plan, ApiError, Exercise } from '@/types/api';

const router = useRouter();
const plans = ref<Plan[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const searchQuery = ref('');
// Функции для работы с localStorage
const FILTERS_STORAGE_KEY = 'plans-filters';

const saveFiltersToStorage = (filters: any) => {
  try {
    localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(filters));
  } catch (error) {
    console.warn('Failed to save filters to localStorage:', error);
  }
};

const loadFiltersFromStorage = () => {
  try {
    const saved = localStorage.getItem(FILTERS_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.warn('Failed to load filters from localStorage:', error);
  }
  return null;
};

const clearFiltersFromStorage = () => {
  try {
    localStorage.removeItem(FILTERS_STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear filters from localStorage:', error);
  }
};

// Инициализация фильтров с загрузкой из localStorage
const defaultFilters = {
  is_active: true, // По умолчанию показываем только активные планы
  standalone: null,
  cycle_id: null,
  sort_by: 'created_at',
  sort_order: 'desc'
};

const savedFilters = loadFiltersFromStorage();
const currentFilters = ref(savedFilters || defaultFilters);

// Фильтрация планов по поисковому запросу
const filteredPlans = computed(() => {
  if (!searchQuery.value.trim()) {
    return plans.value;
  }
  
  const query = searchQuery.value.toLowerCase().trim();
  return plans.value.filter(plan => 
    plan.name.toLowerCase().includes(query)
  );
});

const fetchPlans = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    const params: Record<string, string> = {};
    
    // Добавляем параметры фильтрации
    if (currentFilters.value.is_active !== null) {
      params.is_active = String(currentFilters.value.is_active);
    }
    if (currentFilters.value.standalone !== null) {
      params.standalone = String(currentFilters.value.standalone);
    }
    if (currentFilters.value.cycle_id !== null) {
      params.cycle_id = String(currentFilters.value.cycle_id);
    }
    if (currentFilters.value.sort_by) {
      params.sort_by = currentFilters.value.sort_by;
    }
    if (currentFilters.value.sort_order) {
      params.sort_order = currentFilters.value.sort_order;
    }
    
    const response = await apiClient.get('/api/v1/plans', { params });
    plans.value = response.data.data || [];
  } catch (err) {
    console.error('Plans fetch error:', err);
    error.value = (err as ApiError).message;
  } finally {
    loading.value = false;
  }
};

const handleRefresh = async (event: CustomEvent) => {
  await fetchPlans();
  event.detail.complete();
};

const handlePlanClick = (plan: Plan) => {
  // Убираем фокус с текущего элемента перед навигацией
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }
  router.push(`/plan/${plan.id}`);
};

const getSortedExercises = (exercises: Exercise[]) => {
  return exercises.sort((a, b) => a.order - b.order);
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
};

// Функции поиска
const handleSearch = (value: string) => {
  searchQuery.value = value;
};

const handleFiltersChanged = (filters: any) => {
  currentFilters.value = { ...filters };
  saveFiltersToStorage(filters);
  fetchPlans();
};

const clearSearch = () => {
  searchQuery.value = '';
};

const resetFilters = () => {
  currentFilters.value = { ...defaultFilters };
  clearFiltersFromStorage();
  fetchPlans();
};

const createNewPlan = () => {
  // Убираем фокус с текущего элемента перед навигацией
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }
  router.push('/plan/new');
};

onActivated(() => {
  // Обновляем данные при возвращении на страницу (например, после создания/редактирования плана)
  fetchPlans();
});

// Обработчик события обновления планов
const handlePlansUpdated = () => {
  fetchPlans();
};

onMounted(() => {
  fetchPlans();
  // Добавляем обработчик события
  window.addEventListener('plans-updated', handlePlansUpdated);
});

onUnmounted(() => {
  // Удаляем обработчик события при размонтировании компонента
  window.removeEventListener('plans-updated', handlePlansUpdated);
});
</script>

<style scoped>
/* Minimal spacing for maximum screen usage */
.page-content {
  padding: 4px !important;
  margin: 0 !important;
  padding-top: 4px !important;
  padding-bottom: 80px !important; /* Add space for tab bar (60px) + extra margin */
}

.page-subtitle {
  margin-bottom: 0 !important;
}

/* Search input spacing */
.search-filters-row {
  display: flex;
  align-items: flex-start;
  width: 100%;
  padding-right: 16px !important;
}

.search-input {
  flex: 1;
  min-width: 0;
  margin-right: 8px !important;
}

.filters-component {
  flex-shrink: 0;
}

/* Кнопка добавления в заголовке */
.add-button {
  --background: transparent !important;
  --background-hover: transparent !important;
  --background-focused: transparent !important;
  --background-activated: transparent !important;
  --border-width: 0 !important;
  --border-style: none !important;
  --border-color: transparent !important;
  --color: var(--ion-color-primary) !important;
  --color-hover: var(--ion-color-primary-shade) !important;
  --color-focused: var(--ion-color-primary) !important;
  --color-activated: var(--ion-color-primary-shade) !important;
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
  color: var(--ion-color-primary) !important;
}

.modern-button {
  background: var(--ion-color-primary);
  color: white;
  border: none;
  border-radius: 12px;
  padding: 12px 24px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 16px;
}

.modern-button:hover {
  background: var(--ion-color-primary-shade);
}

.plans-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
}

.plan-card {
  padding: 20px !important;
  cursor: pointer;
  transition: transform 0.2s ease;
  display: flex;
  flex-direction: column;
}


.plan-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.stat-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.cycle-info {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: var(--ion-color-medium);
  margin-bottom: 4px;
}

.cycle-icon {
  font-size: 12px;
  color: var(--ion-color-primary);
  margin-right: 6px;
}

.exercise-count {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: var(--ion-color-medium);
}

.exercise-count i {
  font-size: 12px;
  margin-right: 6px;
  color: var(--ion-color-primary);
}

.plan-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--ion-text-color);
  flex: 1;
}

.inactive-label {
  background: var(--ion-color-medium);
  color: white;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
}


.plan-stats {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.stat {
  display: flex;
  align-items: flex-start;
}

.exercise-item {
  font-size: 13px;
  color: var(--ion-color-medium);
  margin-bottom: 4px;
  padding: 2px 0;
  line-height: 1.3;
}

.plan-footer {
  margin-top: auto;
  padding-top: 12px;
  display: flex;
  justify-content: flex-end;
}

.created-date {
  font-size: 11px;
  color: var(--ion-color-medium);
  opacity: 0.7;
}

.modern-button {
  background: var(--ion-color-primary);
  color: white;
  border: none;
  border-radius: 10px;
  padding: 8px 16px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  justify-content: center;
}


.modern-button i {
  font-size: 12px;
}

.loading-state,
.empty-state {
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

.empty-state i {
  font-size: 4rem;
  margin-bottom: 1rem;
  color: var(--ion-color-primary);
}

.empty-state h2 {
  margin: 0 0 8px 0;
  font-size: 1.5rem;
  color: var(--ion-text-color);
}

.empty-state p {
  margin: 0;
  font-size: 1rem;
}
</style>
