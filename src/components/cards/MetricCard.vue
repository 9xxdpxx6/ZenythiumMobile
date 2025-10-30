<template>
  <div 
    class="metric-card modern-card"
    @click="$emit('click', metric)"
  >
    <div class="metric-header">
      <div class="metric-date">
        {{ formatDate(metric.date) }}
      </div>
      <div class="metric-actions">
        <ion-button 
          fill="clear" 
          size="small" 
          @click.stop="$emit('edit', metric)"
          class="edit-btn"
        >
          <i class="fas fa-edit"></i>
        </ion-button>
        <ion-button 
          fill="clear" 
          size="small" 
          @click.stop="$emit('delete', metric)"
          class="delete-btn"
        >
          <i class="fas fa-trash"></i>
        </ion-button>
      </div>
    </div>
    
    <div class="metric-content">
      <div class="metric-weight">
        <span class="weight-value">{{ parseFloat(metric.weight).toFixed(1) }}</span>
        <span class="weight-unit">кг</span>
      </div>
      
      <div v-if="metric.note" class="metric-note">
        {{ metric.note }}
      </div>
      
      <div class="metric-meta">
        <div class="metric-time">
          <i class="fas fa-clock"></i>
          {{ formatTime(metric.created_at) }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IonButton } from '@ionic/vue';

interface Metric {
  id: number;
  date: string;
  weight: string;
  note?: string;
  created_at: string;
  updated_at: string;
}

interface Props {
  metric: Metric;
}

defineProps<Props>();

const emit = defineEmits<{
  click: [metric: Metric];
  edit: [metric: Metric];
  delete: [metric: Metric];
}>();

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit'
  });
};
</script>

<style scoped>
.metric-card {
  padding: 16px !important;
  background: var(--ion-color-step-50);
  border-radius: 12px;
  margin: 0 !important;
  cursor: pointer;
  transition: none;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* Disable hover elevation for metric cards */
.metric-card.modern-card:hover {
  transform: none !important;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
}

.metric-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.metric-date {
  font-size: 14px;
  font-weight: 600;
  color: var(--ion-text-color);
}

.metric-actions {
  display: flex;
  gap: 4px;
}

.edit-btn, .delete-btn {
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

/* Keep icon color stable on hover */
.edit-btn:hover,
.delete-btn:hover {
  --color: var(--ion-color-medium);
}

.metric-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.metric-weight {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.weight-value {
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--ion-color-primary);
}

.weight-unit {
  font-size: 1rem;
  color: var(--ion-color-medium);
  font-weight: 500;
}

.metric-note {
  font-size: 14px;
  color: var(--ion-text-color);
  line-height: 1.4;
  background: rgba(255, 255, 255, 0.05);
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.metric-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.metric-time {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--ion-color-medium);
}

.metric-time i {
  font-size: 10px;
}
</style>

