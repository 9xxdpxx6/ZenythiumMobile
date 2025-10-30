<template>
  <div class="progress-by-exercise-chart">
    <div class="chart-container modern-card">
      <h3>Прогресс по упражнениям</h3>
      <div v-if="exercises && exercises.length > 0" class="exercise-selector">
        <label>Выберите упражнение:</label>
        <CustomSelect
          v-model="selectedExerciseIndex"
          :options="exerciseOptions"
          placeholder="Выберите упражнение"
          search-placeholder="Поиск упражнения..."
        />
      </div>
      <div class="chart-wrapper">
        <Line
          v-if="chartData"
          :data="chartData"
          :options="chartOptions"
        />
        <div v-else class="no-data">
          <p>Выберите упражнение для отображения прогресса</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import CustomSelect from '@/components/ui/CustomSelect.vue';
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
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ExerciseProgress {
  name: string;
  data: Array<{
    date: string;
    weight: number;
    reps?: number;
    sets?: number;
  }>;
}

interface Props {
  exercises?: ExerciseProgress[];
}

const props = defineProps<Props>();

const selectedExerciseIndex = ref(0);

const exerciseOptions = computed(() => {
  if (!props.exercises) return [] as Array<{ value: number; label: string }>;
  return props.exercises.map((ex, idx) => ({ value: idx, label: ex.name }));
});

const selectedExercise = computed(() => {
  if (!props.exercises || props.exercises.length === 0) return null;
  return props.exercises[selectedExerciseIndex.value] || null;
});

const chartData = computed(() => {
  if (!selectedExercise.value || !selectedExercise.value.data || selectedExercise.value.data.length === 0) {
    return null;
  }
  
  const sortedData = [...selectedExercise.value.data].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  const lineColor = getColor(selectedExercise.value.name);
  return {
    labels: sortedData.map(item => {
      const date = new Date(item.date);
      return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
    }),
    datasets: [{
      label: `Вес (${selectedExercise.value.name})`,
      data: sortedData.map(item => item.weight),
      borderColor: lineColor,
      backgroundColor: 'transparent',
      borderWidth: 2,
      fill: false,
      tension: 0.4,
      pointBackgroundColor: lineColor,
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6,
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
    tooltip: {
      callbacks: {
        label: function(context: any) {
          const exercise = selectedExercise.value;
          if (!exercise) return '';
          const dataPoint = exercise.data[context.dataIndex];
          let label = `Вес: ${context.parsed.y.toFixed(1)} кг`;
          if (dataPoint.reps) {
            label += `, Повторений: ${dataPoint.reps}`;
          }
          if (dataPoint.sets) {
            label += `, Подходов: ${dataPoint.sets}`;
          }
          return label;
        }
      }
    }
  },
  scales: {
    x: {
      grid: {
        color: 'rgba(255, 255, 255, 0.1)'
      },
      ticks: {
        color: 'rgba(255, 255, 255, 0.7)',
      }
    },
    y: {
      grid: {
        color: 'rgba(255, 255, 255, 0.1)'
      },
      ticks: {
        color: 'rgba(255, 255, 255, 0.7)',
        callback: function(value: any) {
          return value + ' кг';
        }
      }
    }
  },
};

function hashStringToHue(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  // Map to [0, 360)
  return Math.abs(hash) % 360;
}

function getColor(name: string): string {
  const hue = hashStringToHue(name);
  return `hsl(${hue}, 70%, 55%)`;
}
</script>

<style scoped>
.progress-by-exercise-chart {
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

.exercise-selector {
  margin-bottom: 16px;
}

.exercise-selector label {
  display: block;
  margin-bottom: 8px;
  color: #ffffff;
  font-size: 0.9rem;
  font-weight: 500;
}

.exercise-select {
  width: 100%;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: #ffffff;
  font-size: 0.9rem;
}

.exercise-select:focus {
  outline: none;
  border-color: rgba(139, 92, 246, 0.5);
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
