<template>
  <div class="filters-section">
    <div class="filter-row">
      <CustomInput
        v-model="filters.search"
        placeholder="Поиск по заметкам..."
        type="text"
        class="search-input"
        @update:model-value="handleChange"
      >
        <template #icon>
          <i class="fas fa-search"></i>
        </template>
      </CustomInput>
    </div>
    
    <div class="filter-row">
      <div class="date-filter-group">
        <VueDatePicker
          v-model="filters.dateFrom"
          format="dd.MM.yyyy"
          placeholder="Дата с"
          :enable-time-picker="false"
          auto-apply
          :dark="true"
          locale="ru"
          :week-start="1"
          :month-name-format="'long'"
          :year-range="[2020, 2030]"
          @update:model-value="handleDateChange"
        />
      </div>
      
      <div class="date-filter-group">
        <VueDatePicker
          v-model="filters.dateTo"
          format="dd.MM.yyyy"
          placeholder="Дата по"
          :enable-time-picker="false"
          auto-apply
          :dark="true"
          :min-date="filters.dateFrom || undefined"
          locale="ru"
          :week-start="1"
          :month-name-format="'long'"
          :year-range="[2020, 2030]"
          @update:model-value="handleDateChange"
        />
      </div>
    </div>
    
    <div class="filter-row">
      <CustomInput
        v-model="filters.weightFrom"
        type="number"
        placeholder="Вес от"
        step="0.1"
        @update:model-value="handleChange"
      />
      <CustomInput
        v-model="filters.weightTo"
        type="number"
        placeholder="Вес до"
        step="0.1"
        @update:model-value="handleChange"
      />
    </div>
    
    <div class="filter-actions">
      <ion-button fill="outline" @click="$emit('reset')">
        <i class="fas fa-undo"></i>
        Сбросить
      </ion-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IonButton } from '@ionic/vue';
import CustomInput from '@/components/CustomInput.vue';
import VueDatePicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';
import type { MetricFilters } from '@/composables/useMetrics';

interface Props {
  filters: MetricFilters;
}

interface Emits {
  (e: 'update:filters', value: MetricFilters): void;
  (e: 'date-change'): void;
  (e: 'reset'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const handleChange = () => {
  emit('update:filters', props.filters);
};

const handleDateChange = () => {
  emit('date-change');
  emit('update:filters', props.filters);
};
</script>

<style scoped>
.filters-section {
  margin-bottom: 24px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
}

.filter-row {
  display: grid;
  gap: 12px;
  margin-bottom: 12px;
}

.filter-row:first-child {
  grid-template-columns: 1fr;
}

/* Даты и вес всегда в 2 колонки */
.filter-row:nth-child(2),
.filter-row:nth-child(3) {
  grid-template-columns: repeat(2, 1fr);
}

.filter-row:last-of-type {
  margin-bottom: 0;
}

.date-filter-group {
  width: 100%;
}

.filter-actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

.filter-actions ion-button {
  flex: 1;
}

@media (max-width: 767px) {
  /* На мобильных тоже 2 колонки для дат и веса */
  .filter-row:nth-child(2),
  .filter-row:nth-child(3) {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>

