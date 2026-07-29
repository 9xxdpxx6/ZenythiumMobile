<template>
  <div class="muscle-group-distribution-chart">
    <div class="chart-container modern-card">
      <h3>Распределение нагрузки по группам (30 дней)</h3>
      <div class="chart-wrapper">
        <Doughnut
          v-if="chartData"
          :data="chartData"
          :options="chartOptions"
        />
        <div v-else class="no-data">
          <p>Нет завершённых тренировок за последние 30 дней</p>
        </div>
      </div>

      <div v-if="balanceRecommendation" class="balance-recommendation">
        <h4>💡 Рекомендация по балансу:</h4>
        <p>{{ balanceRecommendation }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Doughnut } from 'vue-chartjs';
import '@/utils/chartSetup';
import type { MuscleGroupStats } from '@/types/api';

interface Props {
  muscleGroups?: MuscleGroupStats[];
  balanceRecommendation?: string | null;
}

const props = defineProps<Props>();

const chartData = computed(() => {
  // Реальный баланс — по фактическому объёму работы за окно (30 дней) из
  // muscle_group_stats. Группы с нулевым объёмом (is_untrained) в диаграмму
  // не попадают — их показывать в круговой невозможно, но список untrained
  // отдельно выводится в текстовой рекомендации.
  const trained = (props.muscleGroups ?? []).filter(g => g.total_volume > 0);
  if (trained.length === 0) return null;

  const colors = [
    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
    '#FF9F40', '#8B5CF6', '#C9CBCF',
  ];

  const total = trained.reduce((sum, g) => sum + g.total_volume, 0);
  const percentages = trained.map(g => Math.round((g.total_volume / total) * 100));
  const labels = trained.map((g, i) => `${g.muscle_group_name} (${percentages[i]}%)`);

  return {
    labels,
    datasets: [{
      data: percentages,
      backgroundColor: colors.slice(0, trained.length),
      borderWidth: 2,
      borderColor: '#ffffff',
    }],
  };
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom' as const,
    },
  },
};
</script>

<style scoped>
.muscle-group-distribution-chart {
  margin-bottom: 24px;
}

.chart-container {
  padding: 16px !important;
}

.chart-container h3 {
  margin: 0 0 20px 0;
  font-size: 1.2rem;
  font-weight: 600;
  color: #ffffff;
  padding: 0 4px;
}

.chart-wrapper {
  height: 300px;
  position: relative;
}

.balance-recommendation {
  margin-top: 1rem;
  padding: 1rem;
  background: rgba(139, 92, 246, 0.1);
  border-radius: 8px;
  border-left: 4px solid #8B5CF6;
}

.balance-recommendation h4 {
  margin: 0 0 0.5rem 0;
  color: #8B5CF6;
  font-size: 1rem;
  font-weight: 600;
}

.balance-recommendation p {
  margin: 0;
  color: #e0e0e0;
  font-size: 0.9rem;
  line-height: 1.4;
}

.no-data {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: var(--ion-color-medium);
}
</style>
