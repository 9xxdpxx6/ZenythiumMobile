<template>
  <div class="cycle-basic-info">
    <div class="form-group">
      <CustomInput
        v-model="localName"
        label="Название цикла *"
        type="text"
        placeholder="Например: Набор массы"
        :error="!!errors.name"
        :error-message="getFirstError(errors.name)"
      />
    </div>

    <div class="form-group">
      <CustomInput
        v-model="localWeeks"
        label="Количество недель *"
        type="number"
        placeholder="Например: 6"
        :error="!!errors.weeks"
        :error-message="getFirstError(errors.weeks)"
      />
    </div>

    <div class="form-group">
      <label class="form-label">Дата начала (необязательно)</label>
      <VueDatePicker
        v-model="localStartDate"
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
        v-model="localEndDate"
        :class="{ 'datepicker-error': errors.end_date }"
        format="dd.MM.yyyy"
        placeholder="Выберите дату окончания"
        :enable-time-picker="false"
        auto-apply
        :dark="true"
        :min-date="localStartDate || undefined"
        locale="ru"
        :week-start="1"
        :month-name-format="'long'"
        :year-range="[2020, 2030]"
      />
      <span v-if="errors.end_date" class="error-message">{{ getFirstError(errors.end_date) }}</span>
      <span class="field-hint">Если указана дата начала, дата окончания должна быть позже</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import CustomInput from '@/components/ui/CustomInput.vue';
import VueDatePicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';

interface Props {
  name: string;
  weeks: string;
  startDate: Date | null;
  endDate: Date | null;
  errors: Record<string, string | string[]>;
}

interface Emits {
  (e: 'update:name', value: string): void;
  (e: 'update:weeks', value: string): void;
  (e: 'update:startDate', value: Date | null): void;
  (e: 'update:endDate', value: Date | null): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const localName = computed({
  get: () => props.name,
  set: (value: string) => emit('update:name', value)
});

const localWeeks = computed({
  get: () => props.weeks,
  set: (value: string) => emit('update:weeks', value)
});

const localStartDate = computed({
  get: () => props.startDate,
  set: (value: Date | null) => emit('update:startDate', value)
});

const localEndDate = computed({
  get: () => props.endDate,
  set: (value: Date | null) => emit('update:endDate', value)
});

const getFirstError = (error: string | string[] | undefined): string => {
  if (!error) return '';
  if (Array.isArray(error)) return error[0] || '';
  return error;
};
</script>

<style scoped>
.datepicker-error :deep(.dp__input) {
  border-color: var(--ion-color-danger) !important;
}

.form-group {
  margin-bottom: 16px;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--ion-text-color);
}

.error-message {
  display: block;
  margin-top: 6px;
  font-size: 12px;
  color: var(--ion-color-danger);
}

.field-hint {
  display: block;
  margin-top: 6px;
  font-size: 12px;
  color: var(--ion-color-medium);
}
</style>

