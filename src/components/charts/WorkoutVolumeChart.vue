<template>
  <div class="workout-volume-chart">
    <div class="chart-container modern-card">
      <h3>Тренды по месяцам</h3>
      <div class="chart-wrapper">
        <Line
          v-if="chartData"
          :data="chartData"
          :options="chartOptions"
        />
        <div v-else class="no-data">
          <p>Нет данных для отображения</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Line } from 'vue-chartjs';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

interface Props {
  monthlyTrends?: Array<{
    month: string;
    workout_count: number;
    total_volume: number;
  }>;
}

const props = defineProps<Props>();

const chartData = computed(() => {
  if (!props.monthlyTrends || props.monthlyTrends.length === 0) return null;
  
  return {
    labels: props.monthlyTrends.map(item => item.month),
    datasets: [{
      label: 'Количество тренировок',
      data: props.monthlyTrends.map(item => item.workout_count),
      borderColor: 'rgba(75, 192, 192, 1)',
      backgroundColor: 'rgba(75, 192, 192, 0.2)',
      tension: 0.1,
    }, {
      label: 'Общий объем',
      data: props.monthlyTrends.map(item => item.total_volume),
      borderColor: 'rgba(255, 99, 132, 1)',
      backgroundColor: 'rgba(255, 99, 132, 0.2)',
      tension: 0.1,
      yAxisID: 'y1',
    }]
  };
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
    },
  },
  scales: {
    y: {
      type: 'linear' as const,
      display: true,
      position: 'left' as const,
    },
    y1: {
      type: 'linear' as const,
      display: true,
      position: 'right' as const,
      grid: {
        drawOnChartArea: false,
      },
    },
  },
};
</script>

<style scoped>
.workout-volume-chart {
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

.no-data {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: var(--ion-color-medium);
}
</style>
