<template>
  <div class="statistics-filters">
    <div class="filter-row">
      <div class="date-filter-group">
        <VueDatePicker
          v-model="dateFrom"
          format="dd.MM.yyyy"
          placeholder="Дата с"
          :enable-time-picker="false"
          auto-apply
          :dark="true"
          locale="ru"
          :week-start="1"
          :month-name-format="'long'"
          :year-range="[2020, 2030]"
          @update:model-value="handleDateFromChange"
        />
      </div>
      
      <div class="date-filter-group">
        <VueDatePicker
          v-model="dateTo"
          format="dd.MM.yyyy"
          placeholder="Дата по"
          :enable-time-picker="false"
          auto-apply
          :dark="true"
          :min-date="dateFrom || undefined"
          locale="ru"
          :week-start="1"
          :month-name-format="'long'"
          :year-range="[2020, 2030]"
          @update:model-value="handleDateToChange"
        />
      </div>
      
      <ion-button 
        fill="outline" 
        @click="handleReset"
        :disabled="!hasFilters"
      >
        <i class="fas fa-undo"></i>
        Сбросить
      </ion-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { IonButton } from '@ionic/vue';
import VueDatePicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';

interface Props {
  dateFrom?: Date | null;
  dateTo?: Date | null;
}

interface Emits {
  (e: 'update:dateFrom', value: Date | null): void;
  (e: 'update:dateTo', value: Date | null): void;
  (e: 'change'): void;
  (e: 'reset'): void;
}

const props = withDefaults(defineProps<Props>(), {
  dateFrom: null,
  dateTo: null,
});

const emit = defineEmits<Emits>();

const dateFrom = ref<Date | null>(props.dateFrom);
const dateTo = ref<Date | null>(props.dateTo);

watch(() => props.dateFrom, (newValue) => {
  dateFrom.value = newValue;
});

watch(() => props.dateTo, (newValue) => {
  dateTo.value = newValue;
});

const hasFilters = computed(() => {
  return !!dateFrom.value || !!dateTo.value;
});

const handleDateFromChange = (value: Date | null) => {
  dateFrom.value = value;
  emit('update:dateFrom', value);
  emit('change');
  
  if (value && dateTo.value && dateTo.value < value) {
    dateTo.value = null;
    emit('update:dateTo', null);
  }
};

const handleDateToChange = (value: Date | null) => {
  dateTo.value = value;
  emit('update:dateTo', value);
  emit('change');
};

const handleReset = () => {
  dateFrom.value = null;
  dateTo.value = null;
  emit('update:dateFrom', null);
  emit('update:dateTo', null);
  emit('reset');
};
</script>

<style scoped>
.statistics-filters {
  margin-bottom: 24px;
  padding: 16px;
  background: var(--ion-color-step-50);
  border-radius: 12px;
}

.filter-row {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.date-filter-group {
  flex: 1;
  min-width: 150px;
}
</style>
