<template>
  <div
    class="plan-card modern-card"
    @click="$emit('click', plan)"
  >
    <div class="plan-header">
      <h3>{{ plan.name }}</h3>
      <div v-if="!plan.is_active" class="inactive-label">
        не активен
      </div>
    </div>
    
    <div class="plan-stats">
      <div class="stat">
        <div class="stat-content">
          <div v-if="plan.cycle" class="cycle-info">
            <i class="fas fa-sync-alt cycle-icon"></i>
            <span>{{ plan.cycle.name }}</span>
          </div>
          <div class="exercise-count">
            <i class="fas fa-dumbbell"></i>
            <span>{{ plan.exercise_count || 0 }} упражнений</span>
          </div>
        </div>
      </div>
    </div>

    <div class="exercises-list" v-if="plan.exercises && plan.exercises.length > 0">
      <div 
        v-for="exercise in getSortedExercises(plan.exercises)" 
        :key="exercise.id"
        class="exercise-item"
      >
        {{ exercise.order }}. {{ exercise.name }}
      </div>
    </div>
    
    <div class="plan-footer">
      <div class="created-date">
        {{ formatDate(plan.created_at) }}
      </div>
      <div class="plan-actions">
        <button 
          @click.stop="$emit('duplicate', plan)"
          class="duplicate-button"
          :disabled="isDuplicating"
          title="Дублировать план"
        >
          <i v-if="isDuplicating" class="fas fa-spinner fa-spin"></i>
          <i v-else class="fas fa-copy"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Plan, Exercise } from '@/types/api';

interface Props {
  plan: Plan;
  isDuplicating?: boolean;
}

defineProps<Props>();
defineEmits<{
  click: [plan: Plan];
  duplicate: [plan: Plan];
}>();

const getSortedExercises = (exercises: Exercise[]) => {
  return exercises.sort((a, b) => a.order - b.order);
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
};
</script>

<style scoped>
.plan-card {
  padding: 20px !important;
  cursor: pointer;
  transition: transform 0.2s ease;
  display: flex;
  flex-direction: column;
}

.plan-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.plan-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--ion-text-color);
  flex: 1;
}

.inactive-label {
  background: var(--ion-color-medium);
  color: white;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
}

.plan-stats {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.stat {
  display: flex;
  align-items: flex-start;
}

.stat-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.cycle-info {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: var(--ion-color-medium);
  margin-bottom: 4px;
}

.cycle-icon {
  font-size: 12px;
  color: var(--ion-color-primary);
  margin-right: 6px;
}

.exercise-count {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: var(--ion-color-medium);
}

.exercise-count i {
  font-size: 12px;
  margin-right: 6px;
  color: var(--ion-color-primary);
}

.exercise-item {
  font-size: 13px;
  color: var(--ion-color-medium);
  margin-bottom: 4px;
  padding: 2px 0;
  line-height: 1.3;
}

.plan-footer {
  margin-top: auto;
  padding-top: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.created-date {
  font-size: 11px;
  color: var(--ion-color-medium);
  opacity: 0.7;
}

.plan-actions {
  display: flex;
  gap: 8px;
}

.duplicate-button {
  background: transparent;
  border: 1px solid var(--ion-color-primary);
  color: var(--ion-color-primary);
  border-radius: 8px;
  padding: 6px 8px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 28px;
}

.duplicate-button:hover:not(:disabled) {
  background: var(--ion-color-primary);
  color: white;
}

.duplicate-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.duplicate-button i {
  font-size: 12px;
}
</style>

