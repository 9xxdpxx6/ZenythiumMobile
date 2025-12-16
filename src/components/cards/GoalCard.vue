<template>
  <div 
    class="goal-card modern-card"
    @click="$emit('click', goal)"
  >
    <div class="goal-header">
      <div class="goal-title-section">
        <h3>{{ goal.title }}</h3>
        <div class="goal-type-badge">
          {{ getGoalTypeLabel(goal.type) }}
        </div>
      </div>
      <div class="goal-actions">
        <ion-button 
          v-if="goal.status === 'cancelled'"
          fill="clear" 
          size="small" 
          @click.stop="$emit('restore', goal)"
          class="restore-btn"
          title="Восстановить цель"
        >
          <i class="fas fa-undo"></i>
        </ion-button>
        <ion-button 
          fill="clear" 
          size="small" 
          @click.stop="$emit('edit', goal)"
          class="edit-btn"
          :disabled="goal.status === 'cancelled'"
        >
          <i class="fas fa-edit"></i>
        </ion-button>
        <ion-button 
          fill="clear" 
          size="small" 
          @click.stop="$emit('delete', goal)"
          class="delete-btn"
        >
          <i class="fas fa-trash"></i>
        </ion-button>
      </div>
    </div>
    
    <div v-if="goal.description" class="goal-description">
      {{ goal.description }}
    </div>

    <div v-if="goal.exercise" class="goal-exercise">
      <i class="fas fa-dumbbell"></i>
      <span>{{ goal.exercise.name }}</span>
    </div>

    <div v-if="goal.status !== 'cancelled'" class="goal-progress">
      <div class="progress-info">
        <span class="progress-text">
          {{ formatProgress() }}
        </span>
        <span class="progress-percentage" v-if="goal.progress_percentage !== null">
          {{ Math.round(goal.progress_percentage) }}%
        </span>
      </div>
      <div class="progress-bar-container">
        <div 
          class="progress-bar" 
          :style="{ width: `${Math.min(goal.progress_percentage || 0, 100)}%` }"
          :class="getProgressBarClass()"
        ></div>
      </div>
    </div>

    <div class="goal-footer">
      <div class="goal-dates">
        <div class="date-item">
          <i class="fas fa-calendar-alt"></i>
          <span>{{ formatDate(goal.start_date) }}</span>
        </div>
        <div v-if="goal.end_date" class="date-item">
          <i class="fas fa-calendar-check"></i>
          <span>{{ formatDate(goal.end_date) }}</span>
        </div>
      </div>
      <div class="goal-status" :class="getStatusClass()">
        {{ getStatusLabel() }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IonButton } from '@ionic/vue';
import type { Goal } from '@/types/models/goal.types';
import { getGoalTypeLabel } from '@/constants/goal-types';

interface Props {
  goal: Goal;
}

const props = defineProps<Props>();

defineEmits<{
  click: [goal: Goal];
  edit: [goal: Goal];
  delete: [goal: Goal];
  restore: [goal: Goal];
}>();

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

const formatProgress = () => {
  const current = props.goal.current_value ?? 0;
  const target = props.goal.target_value;
  return `${current} / ${target}`;
};

const getProgressBarClass = () => {
  const status = props.goal.status;
  if (status === 'completed') return 'progress-completed';
  if (status === 'failed') return 'progress-failed';
  return 'progress-active';
};

const getStatusClass = () => {
  return `status-${props.goal.status}`;
};

const getStatusLabel = () => {
  const labels: Record<string, string> = {
    active: 'Активна',
    completed: 'Завершена',
    failed: 'Провалена',
    cancelled: 'Отменена',
  };
  return labels[props.goal.status] || props.goal.status;
};
</script>

<style scoped>
.goal-card {
  padding: 16px !important;
  background: var(--ion-color-step-50);
  border-radius: 12px;
  margin: 0 !important;
  cursor: pointer;
  transition: none;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.goal-card.modern-card:hover {
  transform: none !important;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
}

.goal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.goal-title-section {
  flex: 1;
}

.goal-title-section h3 {
  margin: 0 0 6px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--ion-text-color);
}

.goal-type-badge {
  display: inline-block;
  background: rgba(107, 114, 128, 0.2);
  color: var(--ion-color-medium);
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 500;
}

.goal-actions {
  display: flex;
  gap: 4px;
}

.edit-btn, .delete-btn, .restore-btn {
  --color: var(--ion-color-medium);
  --background: transparent;
  --border-radius: 50%;
  width: 32px;
  height: 32px;
  min-width: 32px;
  min-height: 32px;
  margin: 0;
  padding: 0;
}

.edit-btn:hover,
.delete-btn:hover {
  --color: var(--ion-color-medium);
}

.restore-btn {
  --color: var(--ion-color-primary);
}

.restore-btn:hover {
  --color: var(--ion-color-primary);
}

.edit-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.goal-description {
  font-size: 13px;
  color: var(--ion-color-medium);
  margin-bottom: 12px;
  line-height: 1.4;
}

.goal-exercise {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--ion-color-primary);
  margin-bottom: 12px;
}

.goal-exercise i {
  font-size: 12px;
}

.goal-progress {
  margin-bottom: 12px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.progress-text {
  font-size: 13px;
  color: var(--ion-text-color);
  font-weight: 500;
}

.progress-percentage {
  font-size: 13px;
  color: var(--ion-color-medium);
  font-weight: 600;
}

.progress-bar-container {
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-active {
  background: var(--ion-color-primary);
}

.progress-completed {
  background: var(--ion-color-success);
}

.progress-failed {
  background: var(--ion-color-danger);
}

.goal-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.goal-dates {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.date-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--ion-color-medium);
}

.date-item i {
  font-size: 10px;
}

.goal-status {
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
}

.status-active {
  background: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
}

.status-completed {
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
}

.status-failed {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.status-cancelled {
  background: rgba(107, 114, 128, 0.2);
  color: #6b7280;
}
</style>

