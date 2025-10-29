<template>
  <div class="additional-stats-widget content-section">
    <h2>Дополнительные показатели</h2>
    
    <div class="additional-stats-grid card-grid-2">
      <div class="additional-stat-card modern-card">
        <div class="additional-stat-header">
          <i class="fas fa-chart-bar additional-stat-icon"></i>
          <h3>Общий объем тренировок</h3>
        </div>
        <div class="additional-stat-value">{{ formatVolume(totalVolume) }}</div>
      </div>

      <div class="additional-stat-card modern-card">
        <div class="additional-stat-header">
          <i class="fas fa-sync-alt additional-stat-icon"></i>
          <h3>Активные циклы</h3>
        </div>
        <div class="additional-stat-value">{{ activeCycles }}</div>
      </div>

      <div class="additional-stat-card modern-card" v-if="bestPersonalRecord">
        <div class="additional-stat-header">
          <i class="fas fa-trophy additional-stat-icon"></i>
          <h3>Лучший рекорд</h3>
        </div>
        <div class="additional-stat-content">
          <div class="record-exercise">{{ bestPersonalRecord.exercise_name }}</div>
          <div class="record-weight">{{ bestPersonalRecord.max_weight }} кг</div>
          <div class="record-date">{{ formatDate(bestPersonalRecord.achieved_date) }}</div>
        </div>
      </div>

      <div class="additional-stat-card modern-card" v-if="balanceAnalysis">
        <div class="additional-stat-header">
          <i class="fas fa-balance-scale additional-stat-icon"></i>
          <h3>Анализ баланса</h3>
        </div>
        <div class="additional-stat-content">
          <div class="balance-item">
            <span class="balance-label">Больше всего:</span>
            <span class="balance-value">{{ balanceAnalysis.most_trained }}</span>
          </div>
          <div class="balance-item">
            <span class="balance-label">Меньше всего:</span>
            <span class="balance-value">{{ balanceAnalysis.least_trained }}</span>
          </div>
          <div class="balance-score">
            <span class="balance-label">Баланс:</span>
            <span class="balance-value">{{ balanceAnalysis.balance_score?.toFixed(1) || 'N/A' }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  totalVolume?: number | string;
  activeCycles?: number;
  bestPersonalRecord?: {
    exercise_name: string;
    max_weight: number;
    achieved_date: string;
  } | null;
  balanceAnalysis?: {
    most_trained: string;
    least_trained: string;
    balance_score: number;
  } | null;
}

const props = defineProps<Props>();

const formatVolume = (volume: number | string | undefined) => {
  if (!volume) return '0 кг';
  const numVolume = typeof volume === 'string' ? parseFloat(volume) : volume;
  if (isNaN(numVolume)) return '0 кг';
  
  if (numVolume >= 1000000) {
    return `${(numVolume / 1000000).toFixed(1)}М кг`;
  } else if (numVolume >= 1000) {
    return `${(numVolume / 1000).toFixed(1)}К кг`;
  }
  return `${numVolume} кг`;
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};
</script>

<style scoped>
.additional-stats-widget {
  margin-bottom: 32px;
}

.additional-stats-widget h2 {
  font-size: 18px;
  font-weight: 600;
  color: var(--ion-text-color);
  margin: 0 0 24px 10px;
}

.additional-stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.additional-stat-card {
  padding: 16px !important;
  background: var(--ion-color-step-50);
  border-radius: 12px;
  margin: 0 !important;
  min-height: 100px;
}

.additional-stat-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.additional-stat-icon {
  font-size: 1.2rem;
  color: var(--ion-color-primary);
}

.additional-stat-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--ion-text-color);
}

.additional-stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--ion-text-color);
  margin: 0;
}

.additional-stat-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.record-exercise {
  font-size: 14px;
  font-weight: 600;
  color: var(--ion-text-color);
}

.record-weight {
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--ion-color-primary);
}

.record-date {
  font-size: 12px;
  color: var(--ion-color-medium);
}

.balance-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.balance-score {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--ion-color-step-200);
}

.balance-label {
  font-size: 12px;
  color: var(--ion-color-medium);
  font-weight: 500;
}

.balance-value {
  font-size: 12px;
  color: var(--ion-text-color);
  font-weight: 600;
}
</style>
