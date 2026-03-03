<template>
  <div class="progress-chart-widget content-section">
    <div class="charts-section">
      <!-- Weight Chart -->
      <div class="chart-container modern-card">
        <div class="chart-header">
          <ion-button fill="clear" size="small" @click="$emit('view-metrics')" class="list-btn">
            <i class="fas fa-list"></i>
          </ion-button>
          <h3>Изменение веса тела</h3>
          <ion-button fill="clear" size="small" @click="refreshWeightChart">
            <i class="fas fa-sync-alt" :class="{ 
              'refresh-spinning': isRefreshingChart && !isCompletingChart,
              'refresh-completing': isCompletingChart
            }"></i>
          </ion-button>
        </div>
        <div class="chart-content">
          <div v-if="weightChartData" class="weight-chart">
            <div class="chart-container-wrapper">
              <Line :data="weightChartData" :options="weightChartOptions" />
            </div>
            <div class="chart-summary">
              <div class="current-weight">
                <span class="weight-value">{{ getCurrentWeight() }} кг</span>
                <span class="weight-date">{{ getCurrentWeightDate() }}</span>
              </div>
              <div class="chart-actions">
                <div class="weight-change" v-if="getWeightChange()">
                  <span :class="getWeightChangeClassForChart()">
                    {{ getWeightChange() }}
                  </span>
                </div>
                <ion-button fill="clear" size="small" @click="$emit('add-metric')" class="add-metric-btn">
                  <i class="fas fa-plus"></i>
                </ion-button>
              </div>
            </div>
          </div>
          <div v-else class="no-data">
            <i class="fas fa-weight chart-icon"></i>
            <p>Нет измерений</p>
            <ion-button fill="outline" size="small" @click="$emit('add-metric')">
              Добавить вес
            </ion-button>
          </div>
        </div>
      </div>

      <!-- Exercise Progress -->
      <div class="chart-container modern-card">
        <div class="chart-header">
          <h3>Часто выполняемые упражнения</h3>
        </div>
        <div class="chart-content">
          <div v-if="selectedExercises.length > 0" class="exercise-progress">
            <div v-for="exercise in selectedExercises" :key="exercise.id" class="exercise-item">
              <div class="exercise-content">
                <div class="exercise-header">
                  <div class="exercise-title-row">
                    <h4>{{ exercise.name }}</h4>
                    <div v-if="exercise.weightChange" class="weight-change-badge">
                      <span :class="getWeightChangeClass(exercise.weightChange)">
                        {{ getWeightChangeText(exercise.weightChange) }}
                      </span>
                    </div>
                  </div>
                  <div class="exercise-category">{{ exercise.category }}</div>
                </div>
                <div class="exercise-stats">
                  <div class="stat-item highlight">
                    <div class="stat-item-icon">🏆</div>
                    <div class="stat-content">
                      <div class="stat-item-value">{{ exercise.bestWeight }} кг</div>
                      <div class="stat-label">Лучший результат</div>
                    </div>
                  </div>
                  <div class="stat-item">
                    <div class="stat-item-icon">📅</div>
                    <div class="stat-content">
                      <div class="stat-item-value">{{ formatDate(exercise.lastPerformed || '') }}</div>
                      <div class="stat-label">Последняя тренировка</div>
                    </div>
                  </div>
                  <div class="stat-item">
                    <div class="stat-item-icon">⚡</div>
                    <div class="stat-content">
                      <div class="stat-item-value">{{ exercise.totalSets }}</div>
                      <div class="stat-label">Всего подходов</div>
                    </div>
                  </div>
                  <div class="stat-item">
                    <div class="stat-item-icon">📊</div>
                    <div class="stat-content">
                      <div class="stat-item-value">{{ exercise.avgWeight.toFixed(1) }} кг</div>
                      <div class="stat-label">Средний вес</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="no-data">
            <i class="fas fa-dumbbell chart-icon"></i>
            <p>Нет тренировок</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { IonButton } from '@ionic/vue';
import { Line } from 'vue-chartjs';
import '@/utils/chartSetup';
import { useDataFetching } from '@/composables/useDataFetching';
import { metricsService } from '@/services/metrics.service';
import { statisticsService } from '@/services/statistics.service';

defineEmits<{
  'view-metrics': [];
  'add-metric': [];
}>();

const weightData = ref<Array<{date: string, weight: number}>>([]);
const isRefreshingChart = ref(false);
const isCompletingChart = ref(false);
const selectedExercises = ref<any[]>([]);

const { data: metrics, loading, execute: fetchMetrics } = useDataFetching(
  async () => {
    const result = await metricsService.getAll();
    return result;
  },
  { immediate: true, skipIfDataExists: true, cacheKey: 'homepage_metrics' }
);

const { data: exerciseStats, loading: exerciseLoading } = useDataFetching(
  () => statisticsService.getExerciseStatistics(),
  { immediate: true, skipIfDataExists: true, cacheKey: 'homepage_exercise_stats' }
);

// Функция должна быть объявлена до использования в watch
const calculateWeightChange = (progressData: any) => {
  if (!progressData?.weight_progression || progressData.weight_progression.length < 2) {
    return null;
  }
  const progression = progressData.weight_progression;
  const firstWeight = progression[0].max_weight;
  const lastWeight = progression[progression.length - 1].max_weight;
  const change = lastWeight - firstWeight;
  return {
    value: change,
    isPositive: change > 0,
    isNegative: change < 0,
    isStable: change === 0
  };
};

watch(metrics, (newMetrics) => {
  if (newMetrics && Array.isArray(newMetrics)) {
    const mapped = newMetrics
      .map((m: any) => {
        // Support both shapes: { date, weight } and { date, value, category: 'weight' }
        const date = m.date || m.created_at || m.updated_at;
        const rawWeight = m.weight !== undefined ? m.weight : (m.category === 'weight' ? m.value : undefined);
        const weightNum = typeof rawWeight === 'string' ? parseFloat(rawWeight) : Number(rawWeight);
        return { date, weight: weightNum };
      })
      .filter(item => !!item.date && !isNaN(item.weight))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    weightData.value = mapped;
  } else {
    weightData.value = [];
  }
}, { immediate: true });

watch(exerciseStats, (stats) => {
  if (stats?.top_exercises) {
    selectedExercises.value = stats.top_exercises.slice(0, 5).map((exercise: any) => {
      const progressData = stats.exercise_progress?.find((p: any) => 
        p.exercise_name === exercise.exercise_name
      );
      return {
        id: Math.random(),
        name: exercise.exercise_name,
        category: exercise.muscle_group || 'Неизвестно',
        weightChange: calculateWeightChange(progressData),
        bestWeight: exercise.max_weight || 0,
        totalSets: exercise.total_sets || 0,
        avgWeight: exercise.avg_weight || 0,
        lastPerformed: exercise.last_performed
      };
    });
  }
}, { immediate: true });

const weightChartData = computed(() => {
  if (weightData.value.length === 0) return null;
  const monthlyData = getMonthlyWeightData();
  if (monthlyData.length === 0) return null;
  
  return {
    labels: monthlyData.map(item => {
      const date = new Date(item.date);
      return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
    }),
    datasets: [{
      label: 'Вес (кг)',
      data: monthlyData.map(item => item.weight),
      borderColor: 'rgb(124, 58, 237)',
      backgroundColor: 'rgba(124, 58, 237, 0.1)',
      borderWidth: 2,
      fill: true,
      tension: 0.4,
      pointBackgroundColor: 'rgb(124, 58, 237)',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointRadius: 4,
    }]
  };
});

const weightChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { color: 'rgba(255, 255, 255, 0.1)' } },
    y: { 
      grid: { color: 'rgba(255, 255, 255, 0.1)' },
      ticks: { 
        callback: (value: any) => value + ' кг',
        color: 'rgba(255, 255, 255, 0.7)'
      }
    }
  }
};

const getMonthlyWeightData = () => {
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  return weightData.value.filter(item => 
    new Date(item.date) >= oneMonthAgo
  ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

const getWeightChange = () => {
  const monthlyData = getMonthlyWeightData();
  if (monthlyData.length < 2) return '';
  const firstWeight = monthlyData[0].weight;
  const lastWeight = monthlyData[monthlyData.length - 1].weight;
  const change = lastWeight - firstWeight;
  return change > 0 ? `+${change.toFixed(1)} кг` : `${change.toFixed(1)} кг`;
};

const getWeightChangeClassForChart = () => {
  const monthlyData = getMonthlyWeightData();
  if (monthlyData.length < 2) return '';
  const change = monthlyData[monthlyData.length - 1].weight - monthlyData[0].weight;
  return change > 0 ? 'weight-increase' : change < 0 ? 'weight-decrease' : 'weight-stable';
};

const getCurrentWeight = () => {
  if (weightData.value.length === 0) return '0';
  return weightData.value[weightData.value.length - 1].weight.toFixed(1);
};

const getCurrentWeightDate = () => {
  if (weightData.value.length === 0) return '';
  return formatDate(weightData.value[weightData.value.length - 1].date);
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

const getWeightChangeText = (weightChange: any) => {
  if (!weightChange) return '';
  const sign = weightChange.isPositive ? '+' : '';
  return `${sign}${weightChange.value.toFixed(1)} кг`;
};

const getWeightChangeClass = (weightChange: any) => {
  if (!weightChange) return '';
  if (weightChange.isPositive) return 'weight-increase';
  if (weightChange.isNegative) return 'weight-decrease';
  return 'weight-stable';
};

const refreshWeightChart = async () => {
  isRefreshingChart.value = true;
  // Trigger refresh via emit or direct call
  setTimeout(() => {
    isRefreshingChart.value = false;
    isCompletingChart.value = true;
    setTimeout(() => {
      isCompletingChart.value = false;
    }, 300);
  }, 600);
};

defineExpose({
  refreshWeightChart
});

// Refresh metrics when metric is added elsewhere or homepage requests refresh
const handleMetricAdded = () => fetchMetrics();
const handleMetricUpdated = () => fetchMetrics();
const handleHomepageRefresh = () => fetchMetrics();

onMounted(() => {
  window.addEventListener('metric-added', handleMetricAdded as EventListener);
  window.addEventListener('metric-updated', handleMetricUpdated as EventListener);
  window.addEventListener('homepage-refresh', handleHomepageRefresh as EventListener);
});

onUnmounted(() => {
  window.removeEventListener('metric-added', handleMetricAdded as EventListener);
  window.removeEventListener('metric-updated', handleMetricUpdated as EventListener);
  window.removeEventListener('homepage-refresh', handleHomepageRefresh as EventListener);
});
</script>

<style scoped>
.progress-chart-widget {
  margin-bottom: 32px;
}

.charts-section {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.chart-container {
  padding: 12px !important;
  background: var(--ion-color-step-50);
  border-radius: 8px;
  margin: 0 !important;
}

.chart-header {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  gap: 8px;
}

.chart-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--ion-text-color);
  flex: 1;
}

.chart-container-wrapper {
  position: relative;
  height: 200px;
  width: 100%;
}

.chart-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-top: 1px solid var(--ion-color-step-200);
}

.current-weight {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.weight-value {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--ion-color-primary);
}

.weight-date {
  font-size: 0.8rem;
  color: var(--ion-color-medium);
}

.weight-increase {
  color: #10b981;
  border-color: #10b981;
}

.weight-decrease {
  color: #3b82f6; /* blue when weight decreased */
  border-color: #3b82f6;
}

.weight-stable {
  color: #6b7280;
  border-color: #6b7280;
}

.exercise-progress {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.chart-actions {
  display: flex;
  align-items: center;
  gap: 12px; /* label left, button right with spacing */
}

.exercise-item {
  background: var(--ion-color-step-50);
  border-radius: 12px;
  padding: 12px 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.exercise-header {
  margin-bottom: 12px;
}

.exercise-title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 4px;
}

.exercise-title-row h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--ion-text-color);
  flex: 1;
}

.exercise-category {
  font-size: 11px;
  color: var(--ion-color-primary);
  font-weight: 500;
  text-transform: uppercase;
}

.exercise-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
}

.stat-item-value {
  font-size: 12px;
  font-weight: 600;
  color: var(--ion-text-color);
}

.stat-label {
  font-size: 10px;
  color: var(--ion-color-medium);
}

.no-data {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 160px;
  text-align: center;
  color: var(--ion-color-medium);
  padding: 20px;
  gap: 16px;
}

.refresh-spinning {
  animation: spinContinuous 0.6s linear infinite;
}

.refresh-completing {
  animation: spinComplete 0.3s ease-out forwards;
}

@keyframes spinContinuous {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes spinComplete {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
