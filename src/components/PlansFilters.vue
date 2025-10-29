<template>
  <div class="filters-container">
    <button 
      @click="toggleFilters" 
      class="filters-button"
    >
      <i class="fas fa-filter"></i>
    </button>

    <!-- Используем ion-modal как в других модальных окнах приложения -->
    <ion-modal :is-open="isFiltersOpen" @did-dismiss="closeFilters">
      <ion-header>
        <ion-toolbar>
          <ion-title>Фильтры</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="closeFilters">
              <i class="fas fa-times"></i>
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>

      <ion-content>
        <div class="filters-content">
          <!-- Фильтр по активности -->
          <div class="filter-section">
            <h3>Активность</h3>
            <div class="toggle-group">
              <button 
                v-for="option in activityOptions" 
                :key="String(option.value)"
                @click="localFilters.is_active = option.value"
                :class="['toggle-button', { active: localFilters.is_active === option.value }]"
              >
                {{ option.label }}
              </button>
            </div>
          </div>

          <!-- Фильтр по типу планов -->
          <div class="filter-section">
            <h3>Тип планов</h3>
            <div class="toggle-group">
              <button 
                v-for="option in standaloneOptions" 
                :key="String(option.value)"
                @click="localFilters.standalone = option.value"
                :class="['toggle-button', { active: localFilters.standalone === option.value }]"
              >
                {{ option.label }}
              </button>
            </div>
          </div>

           <!-- Фильтр по циклу -->
           <div class="filter-section" v-if="cycles.length > 0">
             <h3>Конкретный цикл</h3>
             <CustomSelect
               v-model="localFilters.cycle_id"
               :options="cycleOptions"
               placeholder="Все циклы"
               search-placeholder="Поиск циклов..."
               @change="onFilterChange"
             />
           </div>

           <!-- Сортировка -->
           <div class="filter-section">
             <h3>Сортировка</h3>
             <CustomSelect
               v-model="localFilters.sort_by"
               :options="sortByOptions"
               placeholder="Выберите поле сортировки"
               search-placeholder="Поиск полей..."
               @change="onFilterChange"
             />
             
             <div class="sort-order-section">
               <div class="toggle-group">
                 <button 
                   v-for="option in sortOrderOptions" 
                   :key="option.value"
                   @click="localFilters.sort_order = option.value"
                   :class="['toggle-button', { active: localFilters.sort_order === option.value }]"
                 >
                   {{ option.label }}
                 </button>
               </div>
             </div>
           </div>

          <!-- Кнопки действий -->
          <div class="filter-actions">
            <button 
              @click="resetFilters" 
              class="reset-button"
            >
              Сбросить
            </button>
            <button 
              @click="applyFilters" 
              class="apply-button"
            >
              Применить
            </button>
          </div>
        </div>
      </ion-content>
    </ion-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from 'vue';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
} from '@ionic/vue';
import CustomSelect from '@/components/CustomSelect.vue';
import apiClient from '@/services/api';
import { Cycle } from '@/types/api';

interface Filters {
  is_active: boolean | null;
  standalone: boolean | null;
  cycle_id: number | null;
  sort_by: string;
  sort_order: string;
}

const props = defineProps<{
  filters: Filters;
}>();

const emit = defineEmits<{
  'filters-changed': [filters: Filters];
  'reset-filters': [];
}>();

const isFiltersOpen = ref(false);
const cycles = ref<Cycle[]>([]);

const localFilters = reactive<Filters>({
  is_active: props.filters.is_active,
  standalone: props.filters.standalone,
  cycle_id: props.filters.cycle_id,
  sort_by: props.filters.sort_by,
  sort_order: props.filters.sort_order,
});

const activityOptions = [
  { value: null, label: 'Все' },
  { value: true, label: 'Активные' },
  { value: false, label: 'Неактивные' }
];

const standaloneOptions = [
  { value: null, label: 'Все' },
  { value: true, label: 'Без цикла' },
  { value: false, label: 'С циклом' }
];

const sortByOptions = computed(() => [
  { value: 'created_at', label: 'Дате создания' },
  { value: 'name', label: 'Названию' },
  { value: 'order', label: 'Порядку' },
  { value: 'exercise_count', label: 'Количеству упражнений' },
  { value: 'is_active', label: 'Активности' }
]);

const sortOrderOptions = [
  { value: 'desc', label: 'По убыванию' },
  { value: 'asc', label: 'По возрастанию' }
];

const cycleOptions = computed(() => {
  const options: Array<{ value: number | null; label: string }> = [{ value: null, label: 'Все циклы' }];
  cycles.value.forEach((cycle: Cycle) => {
    options.push({ value: cycle.id, label: cycle.name });
  });
  return options;
});

const toggleFilters = () => {
  isFiltersOpen.value = !isFiltersOpen.value;
};

const closeFilters = () => {
  isFiltersOpen.value = false;
};

const onFilterChange = () => {
  // Обновляем локальные фильтры при изменении
};

const resetFilters = () => {
  emit('reset-filters');
  closeFilters();
};

const applyFilters = () => {
  const filtersToApply: Filters = {
    is_active: localFilters.is_active,
    standalone: localFilters.standalone,
    cycle_id: localFilters.cycle_id,
    sort_by: localFilters.sort_by,
    sort_order: localFilters.sort_order,
  };
  
  emit('filters-changed', filtersToApply);
  closeFilters();
};

const fetchCycles = async () => {
  try {
    const response = await apiClient.get('/cycles');
    cycles.value = response.data.data || response.data || [];
  } catch (error) {
    console.error('Error fetching cycles:', error);
  }
};

// Синхронизация localFilters с props.filters
watch(() => props.filters, (newFilters) => {
  localFilters.is_active = newFilters.is_active;
  localFilters.standalone = newFilters.standalone;
  localFilters.cycle_id = newFilters.cycle_id;
  localFilters.sort_by = newFilters.sort_by;
  localFilters.sort_order = newFilters.sort_order;
}, { deep: true });

onMounted(() => {
  fetchCycles();
});
</script>

<style scoped>
.filters-container {
  display: flex;
  align-items: center;
}

.filters-button {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: var(--ion-color-medium);
  width: 48px;
  height: 48px;
  display: flex;
  margin-top: 16px;
  margin-left: 0 !important;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  font-size: 16px;
}

.filters-button:hover {
  border-color: var(--ion-color-primary);
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
}

.filters-button i {
  font-size: 16px;
}

.filters-content {
  padding: 20px;
}

.filter-section {
  margin-bottom: 24px;
}

.filter-section h3 {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--ion-text-color);
  word-break: keep-all;
  hyphens: none;
}

/* Группы переключателей */
.toggle-group {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

/* Отступ для секции порядка сортировки */
.sort-order-section {
  margin-top: 16px;
}

.toggle-button {
  background: var(--ion-color-step-100);
  border: 1px solid var(--ion-color-step-200);
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  color: var(--ion-color-medium);
  cursor: pointer;
  transition: all 0.2s ease;
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  word-break: keep-all;
  hyphens: none;
}

.toggle-button:hover {
  background: var(--ion-color-step-150);
  border-color: var(--ion-color-primary);
}

.toggle-button.active {
  background: var(--ion-color-primary);
  border-color: var(--ion-color-primary);
  color: white;
}

/* Кастомный селект - убираем старые стили */
.select-wrapper,
.custom-select,
.select-icon {
  display: none;
}

/* Кнопки действий */
.filter-actions {
  display: flex;
  gap: 12px;
  margin-top: 32px;
  padding-top: 20px;
  border-top: 1px solid var(--ion-color-step-200);
}

.reset-button {
  flex: 1;
  background: transparent;
  border: 1px solid var(--ion-color-medium);
  border-radius: 12px;
  padding: 12px;
  font-size: 14px;
  font-weight: 600;
  color: var(--ion-color-medium);
  cursor: pointer;
  transition: all 0.2s ease;
}

.reset-button:hover {
  background: var(--ion-color-step-100);
  border-color: var(--ion-color-primary);
  color: var(--ion-color-primary);
}

.apply-button {
  flex: 1;
  background: var(--ion-color-primary);
  border: none;
  border-radius: 12px;
  padding: 12px;
  font-size: 14px;
  font-weight: 600;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
}

.apply-button:hover {
  background: var(--ion-color-primary-shade);
}
</style>