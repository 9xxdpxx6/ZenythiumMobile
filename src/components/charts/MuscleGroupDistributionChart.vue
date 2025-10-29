<template>
  <div class="muscle-group-distribution-chart">
    <div class="chart-container modern-card">
      <h3>Баланс мышечных групп</h3>
      <div class="chart-wrapper">
        <Doughnut
          v-if="chartData"
          :data="chartData"
          :options="chartOptions"
        />
        <div v-else class="no-data">
          <p>Нет данных для отображения</p>
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
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

interface PersonalRecord {
  exercise_name: string;
  muscle_group: string;
  max_volume: number;
}

interface Props {
  personalRecords?: PersonalRecord[];
  balanceRecommendation?: string | null;
}

const props = defineProps<Props>();

const chartData = computed(() => {
  if (!props.personalRecords || props.personalRecords.length === 0) return null;
  
  const muscleGroups: Record<string, number> = {};
  
  props.personalRecords.forEach(record => {
    const group = record.muscle_group;
    if (!muscleGroups[group]) {
      muscleGroups[group] = 0;
    }
    muscleGroups[group] += record.max_volume || 0;
  });
  
  const colors = [
    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
    '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384'
  ];
  
  const labels = Object.keys(muscleGroups);
  const data = Object.values(muscleGroups);
  const total = data.reduce((sum, value) => sum + value, 0);
  
  const percentages = data.map(value => Math.round((value / total) * 100));
  const labelsWithPercentages = labels.map((label, index) => 
    `${label} (${percentages[index]}%)`
  );
  
  return {
    labels: labelsWithPercentages,
    datasets: [{
      data: percentages,
      backgroundColor: colors.slice(0, labels.length),
      borderWidth: 2,
      borderColor: '#ffffff',
    }]
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
