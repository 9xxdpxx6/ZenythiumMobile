<template>
  <div
    class="cycle-card modern-card"
    @click="$emit('click', cycle)"
  >
    <div class="cycle-header">
      <h3>{{ cycle.name }}</h3>
      <div
        :class="['cycle-status', cycle.status === 'active' ? 'status-active' : 'status-completed']"
      >
        {{ cycle.status === 'active' ? 'Активен' : 'Завершен' }}
      </div>
    </div>
    
    <div class="cycle-info">
      <p><strong>Планов:</strong> {{ (cycle as any).plans_count || 0 }}</p>
      <p><strong>Тренировок:</strong> {{ (cycle as any).workouts_count || 0 }}</p>
      <p><strong>Начало:</strong> {{ formatDate((cycle as any).started_at) }}</p>
      <p v-if="(cycle as any).status === 'completed' && (cycle as any).finished_at">
        <strong>Завершение:</strong> {{ formatDate((cycle as any).finished_at) }}
      </p>
    </div>

    <div class="cycle-progress">
      <div class="progress-label">
        <span>Прогресс</span>
        <span>{{ Math.round((cycle as any).progress || 0) }}%</span>
      </div>
      <div class="progress-bar">
        <div 
          class="progress-fill" 
          :style="{ width: ((cycle as any).progress || 0) + '%' }"
        ></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Cycle } from '@/types/models/cycle.types';

interface Props {
  cycle: Cycle;
}

defineProps<Props>();
defineEmits<{
  click: [cycle: Cycle];
}>();

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};
</script>

<style scoped>
.cycle-card {
  padding: 20px !important;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.cycle-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  gap: 12px;
}

.cycle-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--ion-text-color);
  flex: 1;
  line-height: 1.3;
}

.cycle-status {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  flex-shrink: 0;
  margin-top: 2px;
}

.status-active {
  background: rgba(16, 185, 129, 0.2);
  color: var(--ion-color-success);
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.status-completed {
  background: rgba(107, 114, 128, 0.2);
  color: var(--ion-color-medium);
  border: 1px solid rgba(107, 114, 128, 0.3);
}

.cycle-info {
  margin-bottom: 16px;
}

.cycle-info p {
  margin: 4px 0;
  font-size: 14px;
  color: var(--ion-color-medium);
}

.cycle-info strong {
  color: var(--ion-text-color);
}

.cycle-progress {
  margin-top: 16px;
}

.progress-label {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 14px;
  color: var(--ion-color-medium);
}

.progress-bar {
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--ion-color-primary);
  border-radius: 4px;
  transition: width 0.3s ease;
}
</style>

