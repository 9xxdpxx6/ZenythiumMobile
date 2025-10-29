<template>
  <div class="workout-details">
    <div class="workout-header">
      <h1 class="workout-title">{{ workoutName }}</h1>
    </div>

    <div class="workout-info-section">
      <div class="info-grid">
        <div class="info-item">
          <div class="info-label">Дата начала</div>
          <div class="info-value">{{ startDateTime }}</div>
        </div>
        
        <div v-if="endDateTime" class="info-item">
          <div class="info-label">Дата окончания</div>
          <div class="info-value">{{ endDateTime }}</div>
        </div>
      </div>
      
      <div :class="durationMinutes && durationMinutes > 0 ? 'stats-grid stats-grid-3' : 'stats-grid stats-grid-2'">
        <div v-if="durationMinutes && durationMinutes > 0" class="stats-item">
          <div class="stats-value">{{ formatDuration(durationMinutes) }}</div>
          <div class="stats-label">Длительность</div>
        </div>
        
        <div class="stats-item">
          <div class="stats-value">{{ exerciseCount || 0 }}</div>
          <div class="stats-label">Упражнений</div>
        </div>
        
        <div v-if="totalVolume && totalVolume > 0" class="stats-item">
          <div class="stats-value">{{ formatWeight(totalVolume) }} кг</div>
          <div class="stats-label">Объем</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  workoutName: string;
  startDateTime: string;
  endDateTime?: string;
  durationMinutes?: number | null;
  exerciseCount?: number;
  totalVolume?: number | null;
}

defineProps<Props>();

const formatDuration = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return `${hours}ч ${mins}м`;
  }
  return `${mins}м`;
};

const formatWeight = (weight: number | null | undefined) => {
  if (weight === null || weight === undefined || isNaN(weight)) {
    return '0';
  }
  return Math.round(Number(weight)).toString();
};
</script>

<style scoped>
.workout-details {
  padding: 0;
}

.workout-header {
  margin-bottom: 24px;
}

.workout-title {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--ion-text-color);
  line-height: 1.2;
}

.workout-info-section {
  margin-bottom: 32px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.info-item {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 16px;
}

.info-label {
  font-size: 0.875rem;
  color: var(--ion-color-medium);
  margin-bottom: 4px;
}

.info-value {
  font-size: 1rem;
  font-weight: 600;
  color: var(--ion-text-color);
}

.stats-grid {
  display: grid;
  gap: 16px;
}

.stats-grid-2 {
  grid-template-columns: repeat(2, 1fr);
}

.stats-grid-3 {
  grid-template-columns: repeat(3, 1fr);
}

.stats-item {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 12px;
  text-align: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.stats-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--ion-text-color);
  margin-bottom: 4px;
}

.stats-label {
  font-size: 0.875rem;
  color: var(--ion-color-medium);
  text-align: center;
}

@media (max-width: 768px) {
  .info-grid {
    grid-template-columns: 1fr;
  }
  
  .stats-grid-2 {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  
  .stats-grid-3 {
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }
  
  .stats-item {
    padding: 10px;
  }
  
  .stats-value {
    font-size: 1.25rem;
  }
  
  .stats-label {
    font-size: 0.8rem;
  }
}
</style>


