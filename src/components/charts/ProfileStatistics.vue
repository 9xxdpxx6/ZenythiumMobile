<template>
  <div v-if="statistics && Object.keys(statistics).length > 0" class="statistics-section">
    <h2 class="section-title">Статистика</h2>
    
    <div class="quick-stats">
      <div class="stat-card modern-card">
        <div class="stat-top">
          <div class="stat-value">{{ (statistics as any)?.total_workouts || 0 }}</div>
          <i class="fas fa-dumbbell stat-icon"></i>
        </div>
        <div class="stat-content">
          <h3>Всего тренировок</h3>
        </div>
      </div>

      <div class="stat-card modern-card">
        <div class="stat-top">
          <div class="stat-value">{{ (statistics as any)?.completed_workouts || 0 }}</div>
          <i class="fas fa-check-circle stat-icon"></i>
        </div>
        <div class="stat-content">
          <h3>Завершено</h3>
        </div>
      </div>

      <div class="stat-card modern-card">
        <div class="stat-top">
          <div class="stat-value">{{ formatTime((statistics as any)?.total_training_time || 0) }}</div>
          <i class="fas fa-clock stat-icon"></i>
        </div>
        <div class="stat-content">
          <h3>Время тренировок</h3>
        </div>
      </div>

      <div class="stat-card modern-card">
        <div class="stat-top">
          <div class="stat-value">{{ formatWeight((statistics as any)?.total_volume || 0) }}</div>
          <i class="fas fa-weight stat-icon"></i>
        </div>
        <div class="stat-content">
          <h3>Общий объем</h3>
        </div>
      </div>

      <div class="stat-card modern-card">
        <div class="stat-top">
          <div class="stat-value">{{ (statistics as any)?.current_weight || 'N/A' }} кг</div>
          <i class="fas fa-chart-line stat-icon"></i>
        </div>
        <div class="stat-content">
          <h3>Текущий вес</h3>
        </div>
      </div>

      <div class="stat-card modern-card">
        <div class="stat-top">
          <div class="stat-value">{{ (statistics as any)?.training_frequency_4_weeks || 0 }}</div>
          <i class="fas fa-calendar-week stat-icon"></i>
        </div>
        <div class="stat-content">
          <h3>Тренировок/неделю</h3>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  statistics: any;
}

defineProps<Props>();

const formatTime = (minutes: number) => {
  if (!minutes || minutes <= 0) return '0м';

  const hours = Math.floor(minutes / 60);

  // 1000+ hours → show in days
  if (hours >= 1000) {
    const days = Math.floor(hours / 24);
    // 1000+ days → show in years
    if (days >= 1000) {
      const years = Math.floor(days / 365);
      return `${years} г`;
    }
    return `${days} д`;
  }

  // 10+ hours → show only hours (no minutes) to keep width compact
  if (hours >= 10) {
    return `${hours} ч`;
  }

  // < 10 hours → show hours and minutes
  if (hours > 0) {
    const mins = minutes % 60;
    return `${hours} ч ${mins} м`;
  }

  // < 1 hour → only minutes
  const mins = minutes % 60;
  return `${mins} м`;
};

const formatWeight = (volume: number | string) => {
  const numVolume = typeof volume === 'string' ? parseFloat(volume) : volume;
  if (isNaN(numVolume)) return '0 кг';
  const absVolume = Math.abs(numVolume);
  if (absVolume >= 1000000000) {
    const value = absVolume / 1000000000;
    const floored = Math.floor(value * 100) / 100;
    return `${floored.toFixed(floored >= 10 ? 0 : 2)}B кг`;
  } else if (absVolume >= 1000000) {
    const value = absVolume / 1000000;
    const floored = Math.floor(value * 100) / 100;
    return `${floored.toFixed(floored >= 10 ? 0 : 2)}M кг`;
  } else if (absVolume >= 1000) {
    const value = absVolume / 1000;
    const floored = Math.floor(value * 100) / 100;
    return `${floored.toFixed(floored >= 10 ? 0 : 2)}K кг`;
  }
  return `${Math.round(numVolume)} кг`;
};
</script>

<style scoped>
.statistics-section {
  margin: 0 0 24px 0;
}

.section-title {
  margin: 24px 0 16px 0;
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--ion-text-color);
}

.quick-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin: 0;
}

.stat-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--ion-text-color);
  margin: 0;
  line-height: 1.2;
  white-space: nowrap;
}

.stat-content h3 {
  margin: 0;
  text-align: start;
  font-size: 14px;
  font-weight: 600;
  color: var(--ion-color-medium);
  line-height: 1.2;
  height: 32px;
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
}

.stat-icon {
  font-size: 1.5rem;
  color: var(--ion-color-primary);
}

.stat-card:nth-child(1) .stat-value,
.stat-card:nth-child(1) .stat-icon {
  color: #10b981;
}

.stat-card:nth-child(2) .stat-value,
.stat-card:nth-child(2) .stat-icon {
  color: #8b5cf6;
}

.stat-card:nth-child(3) .stat-value,
.stat-card:nth-child(3) .stat-icon {
  color: #f59e0b;
}

.stat-card:nth-child(4) .stat-value,
.stat-card:nth-child(4) .stat-icon {
  color: #3b82f6;
}

.stat-card:nth-child(5) .stat-value,
.stat-card:nth-child(5) .stat-icon {
  color: #ef4444;
}

.stat-card:nth-child(6) .stat-value,
.stat-card:nth-child(6) .stat-icon {
  color: #06b6d4;
}
</style>

