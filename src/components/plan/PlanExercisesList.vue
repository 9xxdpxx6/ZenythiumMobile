<template>
  <div class="plan-exercises-list">
    <div class="exercises-section-header">
      <label class="form-label">Упражнения</label>
      <button
        type="button"
        class="add-exercise-button"
        @click="$emit('add-exercise')"
      >
        <i class="fas fa-plus"></i>
        Добавить упражнение
      </button>
    </div>
    
    <ExercisesList
      :exercises="exercises"
      :is-edit-mode="isEditMode"
      @exercise-reorder="$emit('reorder', $event)"
      @exercise-delete="$emit('delete', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import { Exercise } from '@/types/api';
import ExercisesList from '@/components/shared/ExercisesList.vue';

interface Props {
  exercises: Exercise[];
  isEditMode: boolean;
}

defineProps<Props>();

defineEmits<{
  'add-exercise': [];
  'reorder': [exercises: Exercise[]];
  'delete': [index: number];
}>();
</script>

<style scoped>
.exercises-section-header {
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

.add-exercise-button {
  background: var(--ion-color-primary);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: none;
  display: flex;
  align-items: center;
  gap: 6px;
}

.add-exercise-button:hover { background: var(--ion-color-primary); }
</style>


