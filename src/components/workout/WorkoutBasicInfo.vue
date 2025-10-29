<template>
  <div class="workout-basic-info">
    <div class="workout-info">
      <h2>{{ workoutName }}</h2>
      <p class="workout-date">{{ workoutDate }}</p>
    </div>

    <div class="edit-fields">
      <div class="field-group">
        <label class="field-label">Дата и время начала</label>
        <VueDatePicker
          v-model="localStartedAt"
          format="dd.MM.yyyy HH:mm"
          :enable-time-picker="true"
          auto-apply
          :dark="true"
          locale="ru"
          :week-start="1"
          :month-name-format="'long'"
          :year-range="[2020, 2030]"
        />
      </div>

      <div class="field-group">
        <label class="field-label">Дата и время окончания</label>
        <VueDatePicker
          v-model="localFinishedAt"
          format="dd.MM.yyyy HH:mm"
          :enable-time-picker="true"
          auto-apply
          :dark="true"
          :min-date="localStartedAt || undefined"
          locale="ru"
          :week-start="1"
          :month-name-format="'long'"
          :year-range="[2020, 2030]"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import VueDatePicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';

interface Props {
  workoutName: string;
  workoutDate: string;
  startedAt: Date | null;
  finishedAt: Date | null;
}

interface Emits {
  (e: 'update:startedAt', value: Date | null): void;
  (e: 'update:finishedAt', value: Date | null): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const localStartedAt = computed({
  get: () => props.startedAt,
  set: (value: Date | null) => emit('update:startedAt', value)
});

const localFinishedAt = computed({
  get: () => props.finishedAt,
  set: (value: Date | null) => emit('update:finishedAt', value)
});
</script>

<style scoped>
.workout-info {
  margin-bottom: 24px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.workout-info h2 {
  margin: 0 0 8px 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--ion-text-color);
}

.workout-date {
  margin: 0;
  font-size: 1rem;
  color: var(--ion-color-medium);
}

.edit-fields {
  margin-bottom: 32px;
}

.field-group {
  margin-bottom: 20px;
}

.field-label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--ion-text-color);
}

:deep(.dp__input_wrap) {
  position: relative !important;
  display: flex !important;
  align-items: center !important;
}

:deep(.dp__input) {
  background: rgba(255, 255, 255, 0.05) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  border-radius: 12px !important;
  color: var(--ion-text-color) !important;
  padding: 12px 40px 12px 40px !important;
  height: 48px !important;
  font-size: 16px !important;
  width: 100% !important;
  box-sizing: border-box !important;
}

:deep(.dp__input::placeholder) {
  color: var(--ion-color-medium) !important;
}

:deep(.dp__input:focus) {
  border-color: var(--ion-color-primary) !important;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2) !important;
}

:deep(.dp__input_icon) {
  position: absolute !important;
  left: 6px !important;
  top: 50% !important;
  transform: translateY(-50%) !important;
  z-index: 2 !important;
  pointer-events: none !important;
}

:deep(.dp__input_clear) {
  position: absolute !important;
  right: 12px !important;
  top: 50% !important;
  transform: translateY(-50%) !important;
  z-index: 2 !important;
}

:deep(.dp__menu) {
  background: var(--ion-background-color) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  border-radius: 12px !important;
}

:deep(.dp__calendar_header) {
  background: var(--ion-background-color) !important;
}

:deep(.dp__calendar_header_item) {
  color: var(--ion-text-color) !important;
}

:deep(.dp__calendar_item) {
  color: var(--ion-text-color) !important;
}

:deep(.dp__date_selected) {
  background: var(--ion-color-primary) !important;
  color: white !important;
}
</style>


