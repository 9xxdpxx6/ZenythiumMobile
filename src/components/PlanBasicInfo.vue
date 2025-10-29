<template>
  <div class="plan-basic-info">
    <div class="form-group">
      <CustomInput
        v-model="localName"
        label="Название плана *"
        type="text"
        placeholder="Например: Грудь и трицепс"
        :error="!!errors.name"
        :error-message="getFirstError(errors.name)"
      />
    </div>

    <div class="form-group">
      <label class="form-label">
        <input
          type="checkbox"
          v-model="localIsActive"
          class="form-checkbox"
        />
        Активный план
      </label>
      <span class="field-hint">Активные планы доступны для выбора при создании тренировок</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import CustomInput from './CustomInput.vue';

interface Props {
  name: string;
  isActive: boolean;
  errors: Record<string, string | string[]>;
}

interface Emits {
  (e: 'update:name', value: string): void;
  (e: 'update:isActive', value: boolean): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const localName = computed({
  get: () => props.name,
  set: (value: string) => emit('update:name', value)
});

const localIsActive = computed({
  get: () => props.isActive,
  set: (value: boolean) => emit('update:isActive', value)
});

const getFirstError = (error: string | string[] | undefined): string => {
  if (!error) return '';
  if (Array.isArray(error)) return error[0] || '';
  return error;
};
</script>

<style scoped>
.form-group {
  margin-bottom: 16px;
}

.form-label {
  display: flex;
  align-items: center;
  font-size: 14px;
  font-weight: 600;
  color: var(--ion-text-color);
}

.form-checkbox {
  margin-right: 8px;
  transform: scale(1.2);
}

.field-hint {
  display: block;
  margin-top: 6px;
  font-size: 12px;
  color: var(--ion-color-medium);
}
</style>


