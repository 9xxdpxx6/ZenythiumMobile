<template>
  <div class="filters-container">
    <button 
      @click="toggleFilters" 
      class="filters-button"
    >
      <i class="fas fa-filter"></i>
    </button>

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

          <!-- Фильтр по статусу установки -->
          <div class="filter-section">
            <h3>Статус установки</h3>
            <div class="toggle-group">
              <button 
                v-for="option in installedOptions" 
                :key="String(option.value)"
                @click="localFilters.is_installed = option.value"
                :class="['toggle-button', { active: localFilters.is_installed === option.value }]"
              >
                {{ option.label }}
              </button>
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
import { ref, reactive, watch } from 'vue';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
} from '@ionic/vue';

interface Filters {
  is_active: string | null;
  is_installed: boolean | null;
}

const props = defineProps<{
  filters: Filters;
}>();

const emit = defineEmits<{
  'filters-changed': [filters: Filters];
  'reset-filters': [];
}>();

const isFiltersOpen = ref(false);

const localFilters = reactive<Filters>({
  is_active: props.filters.is_active,
  is_installed: props.filters.is_installed,
});

const activityOptions = [
  { value: null, label: 'Все' },
  { value: '1', label: 'Активные' },
  { value: '0', label: 'Неактивные' }
];

const installedOptions = [
  { value: null, label: 'Все' },
  { value: true, label: 'Установленные' },
  { value: false, label: 'Не установленные' }
];

const toggleFilters = () => {
  isFiltersOpen.value = !isFiltersOpen.value;
};

const closeFilters = () => {
  isFiltersOpen.value = false;
};

const resetFilters = () => {
  emit('reset-filters');
  closeFilters();
};

const applyFilters = () => {
  const filtersToApply: Filters = {
    is_active: localFilters.is_active,
    is_installed: localFilters.is_installed,
  };
  
  emit('filters-changed', filtersToApply);
  closeFilters();
};

// Синхронизация localFilters с props.filters
watch(() => props.filters, (newFilters) => {
  localFilters.is_active = newFilters.is_active;
  localFilters.is_installed = newFilters.is_installed;
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
}

.toggle-group {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
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

