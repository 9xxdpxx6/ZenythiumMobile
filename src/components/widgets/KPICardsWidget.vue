<template>
  <section class="stats-section">
    <h2 class="section-title">Ключевые показатели</h2>
    <div class="kpi-grid">
      <div class="kpi-card modern-card">
        <div class="kpi-icon">🏋️</div>
        <div class="kpi-content">
          <h3>Всего тренировок</h3>
          <div class="kpi-value">{{ statistics?.total_workouts || 0 }}</div>
        </div>
      </div>

      <div class="kpi-card modern-card">
        <div class="kpi-icon">⏱️</div>
        <div class="kpi-content">
          <h3>Общее время тренировок</h3>
          <div class="kpi-value">{{ formatTime(statistics?.total_training_time || 0) }}</div>
        </div>
      </div>

      <div class="kpi-card modern-card">
        <div class="kpi-icon">📈</div>
        <div class="kpi-content">
          <h3>Частота (последние 4 недели)</h3>
          <div class="kpi-value">{{ statistics?.training_frequency_4_weeks || 0 }} в неделю</div>
        </div>
      </div>

      <div class="kpi-card modern-card">
        <div class="kpi-icon">⚖️</div>
        <div class="kpi-content">
          <h3>Изменение веса (30 дней)</h3>
          <div class="kpi-value" :class="getWeightChangeClass(statistics?.weight_change_30_days ?? null)">
            {{ formatWeightChange(statistics?.weight_change_30_days ?? null) }}
          </div>
        </div>
      </div>

      <div class="kpi-card modern-card">
        <div class="kpi-icon">🏆</div>
        <div class="kpi-content">
          <h3>Топ рекорды</h3>
          <div class="top-records">
            <div v-for="(record, index) in topRecords" :key="record.exercise_name" class="record-item">
              <span class="record-rank">{{ getMedalEmoji(index) }}</span>
              <span class="record-name">{{ record.exercise_name }}</span>
              <span class="record-weight">{{ record.max_weight }} кг</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Statistics } from '@/types/api';

interface Props {
  statistics: Statistics | null;
  personalRecords?: Array<{
    exercise_name: string;
    max_weight: number;
    max_reps: number;
    achieved_date: string;
  }>;
}

const props = defineProps<Props>();

const topRecords = computed(() => {
  if (!props.personalRecords || props.personalRecords.length === 0) return [];
  return [...props.personalRecords]
    .sort((a, b) => b.max_weight - a.max_weight)
    .slice(0, 3);
});

// API возвращает total_training_time в МИНУТАХ (см. api-docs), форматируем ч/м
const formatTime = (minutesTotal: number) => {
  if (!minutesTotal || isNaN(minutesTotal)) return '0м';
  const hours = Math.floor(minutesTotal / 60);
  const minutes = Math.round(minutesTotal % 60);
  if (hours > 0) {
    return `${hours}ч ${minutes}м`;
  }
  return `${minutes}м`;
};

const formatWeightChange = (change: number | null) => {
  if (!change || isNaN(change)) return '0 кг';
  if (change > 0) {
    return `+${change.toFixed(1)} кг`;
  } else if (change < 0) {
    return `${change.toFixed(1)} кг`;
  }
  return '0 кг';
};

const getWeightChangeClass = (change: number | null) => {
  if (!change || isNaN(change)) return '';
  if (change > 0) return 'weight-increase';
  if (change < 0) return 'weight-decrease';
  return '';
};

const getMedalEmoji = (index: number) => {
  const medals = ['🥇', '🥈', '🥉'];
  return medals[index] || '🏅';
};
</script>

<style scoped>
.stats-section {
  margin-bottom: 32px;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 20px 0;
  color: #ffffff;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.kpi-card {
  display: flex;
  align-items: center;
  padding: 16px !important;
  background: var(--ion-color-light);
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  margin: 0 !important;
}

.kpi-icon {
  font-size: 2.5rem;
  margin-right: 16px;
}

.kpi-content h3 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 500;
  color: #b0b0b0;
  line-height: 1.4;
}

.kpi-value {
  font-size: 1.8rem;
  font-weight: 700;
  color: #ffffff;
}

.top-records {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.record-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.record-rank {
  font-size: 1.2rem;
}

.record-name {
  flex: 1;
  color: #ffffff;
  font-size: 0.9rem;
}

.record-weight {
  color: #ffffff;
  font-weight: 600;
  font-size: 0.9rem;
}

.weight-increase {
  color: #22c55e;
}

.weight-decrease {
  color: #3b82f6; /* blue when weight decreased */
}
</style>
