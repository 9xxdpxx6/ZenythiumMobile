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
          <ion-title>Фильтры упражнений</ion-title>
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

          <!-- Фильтр по группе мышц -->
          <div class="filter-section">
            <h3>Группа мышц</h3>
            <CustomSelect
              v-model="localFilters.muscle_group_id"
              :options="muscleGroupOptions"
              placeholder="Все группы мышц"
              search-placeholder="Поиск групп мышц..."
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
import { ref, reactive, computed, watch } from 'vue';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
} from '@ionic/vue';
import CustomSelect from '@/components/ui/CustomSelect.vue';
import CustomInput from '@/components/ui/CustomInput.vue';
import { MuscleGroupResource } from '@/types/api';

interface ExerciseFilters {
  is_active: boolean | null;
  muscle_group_id: number | null;
  date_from: string;
  date_to: string;
  sort_by: string;
  sort_order: string;
}

const props = defineProps<{
  filters: ExerciseFilters;
  muscleGroups: MuscleGroupResource[];
}>();

const emit = defineEmits<{
  'filters-changed': [filters: ExerciseFilters];
  'reset-filters': [];
}>();

const isFiltersOpen = ref(false);

const localFilters = reactive<ExerciseFilters>({
  is_active: props.filters.is_active,
  muscle_group_id: props.filters.muscle_group_id,
  date_from: props.filters.date_from,
  date_to: props.filters.date_to,
  sort_by: props.filters.sort_by,
  sort_order: props.filters.sort_order,
});

const activityOptions = [
  { value: null, label: 'Все' },
  { value: true, label: 'Активные' },
  { value: false, label: 'Неактивные' }
];

const sortByOptions = computed(() => [
  { value: 'created_at', label: 'Дате создания' },
  { value: 'name', label: 'Названию' },
  { value: 'muscle_group_id', label: 'Группе мышц' },
  { value: 'is_active', label: 'Активности' }
]);

const sortOrderOptions = [
  { value: 'desc', label: 'По убыванию' },
  { value: 'asc', label: 'По возрастанию' }
];

const muscleGroupOptions = computed(() => {
  const options: Array<{ value: number | null; label: string }> = [{ value: null, label: 'Все группы мышц' }];
  props.muscleGroups.forEach((group: MuscleGroupResource) => {
    options.push({ value: group.id, label: group.name });
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
  const filtersToApply: ExerciseFilters = {
    is_active: localFilters.is_active,
    muscle_group_id: localFilters.muscle_group_id,
    date_from: localFilters.date_from,
    date_to: localFilters.date_to,
    sort_by: localFilters.sort_by,
    sort_order: localFilters.sort_order,
  };
  
  emit('filters-changed', filtersToApply);
  closeFilters();
};

// Синхронизация localFilters с props.filters
watch(() => props.filters, (newFilters) => {
  localFilters.is_active = newFilters.is_active;
  localFilters.muscle_group_id = newFilters.muscle_group_id;
  localFilters.date_from = newFilters.date_from;
  localFilters.date_to = newFilters.date_to;
  localFilters.sort_by = newFilters.sort_by;
  localFilters.sort_order = newFilters.sort_order;
}, { deep: true });
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
  transition: none;
  font-size: 16px;
}

.filters-button:hover {
  border-color: rgba(255, 255, 255, 0.1);
  box-shadow: none;
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
  transition: none;
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  word-break: keep-all;
  hyphens: none;
}

.toggle-button:hover {
  background: var(--ion-color-step-100);
  border-color: var(--ion-color-step-200);
}

.toggle-button.active {
  background: var(--ion-color-primary);
  border-color: var(--ion-color-primary);
  color: white;
}

/* Диапазон дат */
.date-range {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
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
  transition: none;
}

.reset-button:hover {
  background: transparent;
  border-color: var(--ion-color-medium);
  color: var(--ion-color-medium);
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
  transition: none;
}

.apply-button:hover {
  background: var(--ion-color-primary);
}
</style>
