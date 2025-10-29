<template>
  <div class="cycle-plan-selection">
    <div class="plans-section-header">
      <label class="form-label">Планы тренировок</label>
      <button
        type="button"
        class="add-plan-button"
        @click="$emit('add-plan')"
      >
        <i class="fas fa-plus"></i>
        Добавить план
      </button>
    </div>
    
    <PlansList
      :plans="plans"
      :is-edit-mode="isEditMode"
      @plan-reorder="$emit('reorder', $event)"
      @plan-delete="$emit('delete', $event)"
    />
    
    <span v-if="errors.plan_ids" class="error-message">{{ getFirstError(errors.plan_ids) }}</span>
  </div>
</template>

<script setup lang="ts">
import { Plan } from '@/types/api';
import PlansList from './PlansList.vue';

interface ValidationErrors {
  [key: string]: string | string[] | undefined;
  plan_ids?: string | string[];
}

interface Props {
  plans: any[];
  isEditMode: boolean;
  errors: ValidationErrors;
}

const props = defineProps<Props>();

defineEmits<{
  'add-plan': [];
  'reorder': [plans: any[]];
  'delete': [index: number];
}>();

const getFirstError = (error: string | string[] | undefined): string => {
  if (!error) return '';
  if (Array.isArray(error)) return error[0] || '';
  return error;
};
</script>

<style scoped>
.plans-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.form-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--ion-text-color);
}

.add-plan-button {
  background: var(--ion-color-primary);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 6px;
}

.add-plan-button:hover {
  background: var(--ion-color-primary-shade);
}

.error-message {
  display: block;
  margin-top: 6px;
  font-size: 12px;
  color: var(--ion-color-danger);
}
</style>

