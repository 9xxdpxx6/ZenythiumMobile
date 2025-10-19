<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/"></ion-back-button>
        </ion-buttons>
        <ion-title>Статистика</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="refreshAllData" :disabled="loading">
            <ion-icon :icon="refreshOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-refresher slot="fixed" @ionRefresh="handleRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <div class="page-content">
        <!-- <h1 class="page-title">Статистика</h1> -->

        <!-- Loading State -->
        <div v-if="loading && !statistics" class="loading-state">
          <ion-spinner name="crescent"></ion-spinner>
          <p>Загрузка статистики...</p>
        </div>

        <!-- Main Content -->
        <div v-else-if="statistics">
          <!-- KPI Cards Section -->
          <section class="stats-section">
            <h2 class="section-title">Ключевые показатели</h2>
            <div class="kpi-grid">
              <div class="kpi-card modern-card">
                <div class="kpi-icon">🏋️</div>
                <div class="kpi-content">
                  <h3>Всего тренировок</h3>
                  <div class="kpi-value">{{ statistics.total_workouts || 0 }}</div>
                </div>
              </div>

              <div class="kpi-card modern-card">
                <div class="kpi-icon">⏱️</div>
                <div class="kpi-content">
                  <h3>Время тренировок</h3>
                  <div class="kpi-value">{{ formatTime(statistics.total_training_time) }}</div>
                </div>
              </div>

              <div class="kpi-card modern-card">
                <div class="kpi-icon">📈</div>
                <div class="kpi-content">
                  <h3>Частота (4 недели)</h3>
                  <div class="kpi-value">{{ statistics.training_frequency_4_weeks || 0 }} в неделю</div>
                </div>
              </div>

              <div class="kpi-card modern-card">
                <div class="kpi-icon">🔥</div>
                <div class="kpi-content">
                  <h3>Серия тренировок</h3>
                  <div class="kpi-value">{{ statistics.training_streak_days || 0 }} дней</div>
                </div>
              </div>

              <div class="kpi-card modern-card">
                <div class="kpi-icon">⚖️</div>
                <div class="kpi-content">
                  <h3>Изменение веса (30 дней)</h3>
                  <div class="kpi-value" :class="getWeightChangeClass(statistics.weight_change_30_days)">
                    {{ formatWeightChange(statistics.weight_change_30_days) }}
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

          <!-- Charts Section -->
          <section class="stats-section" v-if="timeAnalytics">
            <h2 class="section-title">Аналитика</h2>
            
            <!-- Weekly Pattern Chart -->
            <div class="chart-container modern-card">
              <h3>Тренировки по дням недели</h3>
              <div class="chart-wrapper">
                <Bar
                  v-if="weeklyChartData"
                  :data="weeklyChartData"
                  :options="weeklyChartOptions"
                />
              </div>
            </div>

            <!-- Monthly Trends Chart -->
            <div class="chart-container modern-card">
              <h3>Тренды по месяцам</h3>
              <div class="chart-wrapper">
                <Line
                  v-if="monthlyChartData"
                  :data="monthlyChartData"
                  :options="monthlyChartOptions"
                />
              </div>
            </div>

            <!-- Muscle Group Balance Chart -->
            <div class="chart-container modern-card">
              <h3>Баланс мышечных групп</h3>
              <div class="chart-wrapper">
                <Doughnut
                  v-if="muscleBalanceChartData"
                  :data="muscleBalanceChartData"
                  :options="muscleBalanceChartOptions"
                />
              </div>
              
              <!-- Balance Recommendation -->
              <div v-if="balanceRecommendation" class="balance-recommendation">
                <h4>💡 Рекомендация по балансу:</h4>
                <p>{{ balanceRecommendation }}</p>
              </div>
            </div>
          </section>

          <!-- Tables Section -->
          <section class="stats-section">
            <h2 class="section-title">Детальная статистика</h2>

            <!-- Muscle Group Stats Table -->
            <div class="table-container modern-card" v-if="timeAnalytics?.muscle_group_stats">
              <h3>Статистика по мышечным группам</h3>
              <div class="table-wrapper">
                <table class="stats-table">
                  <thead>
                    <tr>
                      <th>Группа мышц</th>
                      <th>Объем</th>
                      <th>Тренировок</th>
                      <th>Последняя тренировка</th>
                      <th>Дней назад</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="muscle in timeAnalytics.muscle_group_stats" :key="muscle.muscle_group_name">
                      <td>{{ muscle.muscle_group_name }}</td>
                      <td>{{ formatVolume(muscle.total_volume) }}</td>
                      <td>{{ muscle.workout_count }}</td>
                      <td>{{ formatDate(muscle.last_trained) }}</td>
                      <td>
                        <span :class="getDaysSinceClass(muscle.days_since_last_training)">
                          {{ muscle.days_since_last_training }}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Personal Records Cards -->
            <div class="records-container modern-card" v-if="records?.data?.personal_records">
              <h3>Личные рекорды</h3>
              <div class="records-grid">
                <div 
                  v-for="record in records.data.personal_records.slice(0, 10)" 
                  :key="record.exercise_name"
                  class="record-card"
                >
                  <div class="record-header">
                    <h4>{{ record.exercise_name }}</h4>
                    <span class="muscle-group">{{ record.muscle_group }}</span>
                  </div>
                  <div class="record-stats">
                    <div class="stat-item">
                      <span class="stat-label">Макс. вес</span>
                      <span class="stat-value">{{ record.max_weight }} кг</span>
                    </div>
                    <div class="stat-item">
                      <span class="stat-label">Повторения</span>
                      <span class="stat-value">{{ record.max_reps }}</span>
                    </div>
                    <div class="stat-item">
                      <span class="stat-label">Дата</span>
                      <span class="stat-value">{{ formatDate(record.achieved_date) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Recent Metrics Cards -->
            <div class="metrics-container modern-card" v-if="metrics?.data">
              <h3>Последние измерения</h3>
              <div class="metrics-grid">
                <div 
                  v-for="metric in metrics.data.slice(0, 5)" 
                  :key="metric.id"
                  class="metric-card"
                >
                  <div class="metric-header">
                    <h4>{{ formatDate(metric.date) }}</h4>
                  </div>
                  <div class="metric-stats">
                    <div class="stat-item">
                      <span class="stat-label">Вес</span>
                      <span class="stat-value">{{ formatWeight(metric.weight) }}</span>
                    </div>
                    <div class="stat-item" v-if="metric.body_fat_percentage">
                      <span class="stat-label">Жир %</span>
                      <span class="stat-value">{{ metric.body_fat_percentage }}%</span>
                    </div>
                    <div class="stat-item" v-if="metric.muscle_mass">
                      <span class="stat-label">Мышцы</span>
                      <span class="stat-value">{{ metric.muscle_mass }} кг</span>
                    </div>
                    <div class="stat-item" v-if="metric.note">
                      <span class="stat-label">Заметка</span>
                      <span class="stat-value">{{ metric.note }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Balance Analysis -->
            <div class="balance-analysis modern-card" v-if="timeAnalytics?.balance_analysis">
              <h3>Анализ баланса</h3>
              <div class="balance-content">
                <div class="balance-item">
                  <strong>Самые тренируемые:</strong> {{ timeAnalytics.balance_analysis.most_trained }}
                </div>
                <div class="balance-item">
                  <strong>Наименее тренируемые:</strong> {{ timeAnalytics.balance_analysis.least_trained }}
                </div>
                <div class="balance-item">
                  <strong>Оценка баланса:</strong> 
                  <span :class="getBalanceScoreClass(timeAnalytics.balance_analysis.balance_score)">
                    {{ timeAnalytics.balance_analysis.balance_score.toFixed(1) }}/10
                  </span>
                </div>
                <div class="recommendations" v-if="timeAnalytics.balance_analysis.recommendations.length">
                  <strong>Рекомендации:</strong>
                  <ul>
                    <li v-for="rec in timeAnalytics.balance_analysis.recommendations" :key="rec">
                      {{ rec }}
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>
        </div>

        <!-- Empty State -->
        <div v-else class="empty-state">
          <i class="fas fa-chart-bar" style="font-size: 3rem;"></i>
          <h2>Статистика недоступна</h2>
          <p>Начните тренировки для просмотра статистики</p>
        </div>
      </div>
    </ion-content>

    <ion-toast
      :is-open="!!error"
      :message="error"
      duration="3000"
      @didDismiss="clearError"
    ></ion-toast>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonSpinner,
  IonToast,
  IonRefresher,
  IonRefresherContent,
  IonButton,
  IonButtons,
  IonIcon,
  IonBackButton,
} from '@ionic/vue';
import { refreshOutline } from 'ionicons/icons';
import { Bar, Line, Doughnut } from 'vue-chartjs';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

import apiClient from '@/services/api';
import { statisticsApi } from '@/services/api';
import { 
  Statistics, 
  StatisticsResponse,
  ApiError, 
  TimeAnalytics, 
  RecordsResponse, 
  MetricsResponse 
} from '@/types/api';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const statistics = ref<Statistics | null>(null);
const timeAnalytics = ref<TimeAnalytics | null>(null);
const records = ref<RecordsResponse | null>(null);
const metrics = ref<MetricsResponse | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);

// Computed properties
const topRecords = computed(() => {
  if (!records.value?.data?.personal_records) return [];
  
  return records.value.data.personal_records
    .sort((a, b) => b.max_weight - a.max_weight)
    .slice(0, 3);
});

// Helper function for medal emojis
const getMedalEmoji = (index: number) => {
  const medals = ['🥇', '🥈', '🥉'];
  return medals[index] || '🏅';
};

// Balance recommendation computed property
const balanceRecommendation = computed(() => {
  // Пока что возвращаем null, так как API не возвращает рекомендации
  // В будущем можно добавить логику для генерации рекомендаций на основе данных
  return null;
});

// Chart data computed properties
const weeklyChartData = computed(() => {
  if (!timeAnalytics.value?.weekly_pattern) return null;
  
  return {
    labels: timeAnalytics.value.weekly_pattern.map(item => {
      const dayMap: Record<string, string> = {
        'monday': 'Пн', 'tuesday': 'Вт', 'wednesday': 'Ср', 'thursday': 'Чт',
        'friday': 'Пт', 'saturday': 'Сб', 'sunday': 'Вс'
      };
      return dayMap[item.day_of_week.toLowerCase()] || item.day_of_week;
    }),
    datasets: [{
      label: 'Количество тренировок',
      data: timeAnalytics.value.weekly_pattern.map(item => item.workout_count),
      backgroundColor: 'rgba(54, 162, 235, 0.6)',
      borderColor: 'rgba(54, 162, 235, 1)',
      borderWidth: 1,
    }]
  };
});

const monthlyChartData = computed(() => {
  if (!timeAnalytics.value?.monthly_trends) return null;
  
  return {
    labels: timeAnalytics.value.monthly_trends.map(item => item.month),
    datasets: [{
      label: 'Количество тренировок',
      data: timeAnalytics.value.monthly_trends.map(item => item.workout_count),
      borderColor: 'rgba(75, 192, 192, 1)',
      backgroundColor: 'rgba(75, 192, 192, 0.2)',
      tension: 0.1,
    }, {
      label: 'Общий объем',
      data: timeAnalytics.value.monthly_trends.map(item => item.total_volume),
      borderColor: 'rgba(255, 99, 132, 1)',
      backgroundColor: 'rgba(255, 99, 132, 0.2)',
      tension: 0.1,
      yAxisID: 'y1',
    }]
  };
});

const muscleBalanceChartData = computed(() => {
  if (!records.value?.data?.personal_records) return null;
  
  // Группируем рекорды по группам мышц и суммируем объем
  const muscleGroups: Record<string, number> = {};
  
  records.value.data.personal_records.forEach(record => {
    const group = record.muscle_group;
    if (!muscleGroups[group]) {
      muscleGroups[group] = 0;
    }
    muscleGroups[group] += record.max_volume;
  });
  
  const colors = [
    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
    '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384'
  ];
  
  const labels = Object.keys(muscleGroups);
  const data = Object.values(muscleGroups);
  const total = data.reduce((sum, value) => sum + value, 0);
  
  // Конвертируем в проценты
  const percentages = data.map(value => Math.round((value / total) * 100));
  
  // Создаем labels с процентами
  const labelsWithPercentages = labels.map((label, index) => 
    `${label} (${percentages[index]}%)`
  );
  
  return {
    labels: labelsWithPercentages,
    datasets: [{
      data: percentages, // Используем проценты вместо абсолютных значений
      backgroundColor: colors.slice(0, labels.length),
      borderWidth: 2,
      borderColor: '#ffffff',
    }]
  };
});

// Chart options
const weeklyChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        stepSize: 1,
      },
    },
  },
};

const monthlyChartOptions = {
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

const muscleBalanceChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom' as const,
    },
  },
};

// API calls
const fetchStatistics = async () => {
  try {
    console.log('🔍 Fetching statistics...');
    const response = await apiClient.get<StatisticsResponse>('/api/v1/user/statistics');
    console.log('📊 Statistics API Response:', response);
    console.log('📊 Statistics Data:', response.data);
    
    // Обрабатываем данные - конвертируем строки в числа и обрабатываем null
    const processedData = {
      ...response.data.data,
      total_volume: typeof response.data.data.total_volume === 'string' 
        ? parseFloat(response.data.data.total_volume) || 0 
        : response.data.data.total_volume,
      weight_change_30_days: response.data.data.weight_change_30_days || 0,
    };
    
    console.log('📊 Processed Statistics Data:', processedData);
    statistics.value = processedData;
  } catch (err) {
    console.error('❌ Error fetching statistics:', err);
    error.value = (err as ApiError).message;
  }
};

const fetchTimeAnalytics = async () => {
  try {
    const response = await statisticsApi.getTimeAnalytics();
    timeAnalytics.value = response.data;
  } catch (err) {
    console.error('❌ Error fetching time analytics:', err);
  }
};

const fetchRecords = async () => {
  try {
    const response = await statisticsApi.getRecords();
    records.value = response;
  } catch (err) {
    console.error('❌ Error fetching records:', err);
  }
};

const fetchMetrics = async () => {
  try {
    const response = await statisticsApi.getMetrics(1, 10);
    metrics.value = response;
  } catch (err) {
    console.error('❌ Error fetching metrics:', err);
  }
};

const fetchAllData = async () => {
  loading.value = true;
  error.value = null;
  
  await Promise.all([
    fetchStatistics(),
    fetchTimeAnalytics(),
    fetchRecords(),
    fetchMetrics(),
  ]);
  
  loading.value = false;
};

const refreshAllData = async () => {
  await fetchAllData();
};

const handleRefresh = async (event: CustomEvent) => {
  await fetchAllData();
  event.detail.complete();
};

// Utility functions
const formatTime = (seconds: number) => {
  if (!seconds || isNaN(seconds)) return '0м';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
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

const formatVolume = (volume: number) => {
  if (!volume || isNaN(volume)) return '0 кг';
  
  if (volume >= 1000) {
    return `${(volume / 1000).toFixed(1)}т`;
  }
  return `${volume.toFixed(0)} кг`;
};

const formatWeight = (weight: number | string) => {
  const numWeight = typeof weight === 'string' ? parseFloat(weight) : weight;
  if (isNaN(numWeight)) return '0 кг';
  return `${numWeight.toFixed(1)} кг`;
};

const formatDate = (dateString: string) => {
  if (!dateString) return '-';
  try {
    return new Date(dateString).toLocaleDateString('ru-RU');
  } catch {
    return '-';
  }
};

const getWeightChangeClass = (change: number | null) => {
  if (!change || isNaN(change)) return '';
  if (change > 0) {
    return 'weight-increase';
  } else if (change < 0) {
    return 'weight-decrease';
  }
  return '';
};

const getDaysSinceClass = (days: number) => {
  if (days <= 3) return 'days-recent';
  if (days <= 7) return 'days-week';
  return 'days-old';
};

const getBalanceScoreClass = (score: number) => {
  if (score >= 8) return 'balance-excellent';
  if (score >= 6) return 'balance-good';
  if (score >= 4) return 'balance-fair';
  return 'balance-poor';
};

const clearError = () => {
  error.value = null;
};

onMounted(() => {
  fetchAllData();
});
</script>

<style scoped>
/* Page layout */
.page-content {
  padding: 16px !important;
  margin: 0 !important;
  padding-top: 12px !important;
  padding-bottom: 80px !important;
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 24px 0;
  padding: 0 !important;
  color: var(--ion-color-primary);
}

/* Sections */
.stats-section {
  margin-bottom: 32px;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 20px 0;
  color: #ffffff;
}

/* KPI Cards */
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

/* Charts */
.chart-container {
  margin: 16px 0 0 0 !important;
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

/* Tables */
.table-container {
  margin-bottom: 32px;
  padding: 24px !important;
}

.table-container h3 {
  margin: 0 0 20px 0;
  font-size: 1.2rem;
  font-weight: 600;
  color: #ffffff;
  padding: 0 4px;
}

.table-wrapper {
  overflow-x: auto;
}

.stats-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.stats-table th,
.stats-table td {
  padding: 16px 12px;
  text-align: left;
  border-bottom: 1px solid var(--ion-color-light-shade);
  line-height: 1.4;
}

.stats-table th {
  background-color: var(--ion-color-light);
  font-weight: 600;
  color: #333333;
  font-size: 13px;
}

.stats-table tr:hover {
  background-color: rgba(255, 255, 255, 0.05);
}

/* Cards instead of tables */
.records-container,
.metrics-container {
  margin: 16px 0 0 0 !important;
  padding: 16px !important;
}

.records-container h3,
.metrics-container h3 {
  margin: 0 0 16px 0 !important;
}

.records-grid,
.metrics-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.record-card,
.metric-card {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
}

.record-card:hover,
.metric-card:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(139, 92, 246, 0.3);
  transform: translateY(-2px);
}

.record-header,
.metric-header {
  margin-bottom: 12px;
}

.record-header h4,
.metric-header h4 {
  margin: 0 0 4px 0;
  color: #ffffff;
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.3;
}

.muscle-group {
  display: inline-block;
  background: rgba(139, 92, 246, 0.2);
  color: #8B5CF6;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 500;
}

.record-stats,
.metric-stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.stat-item:last-child {
  border-bottom: none;
}

.stat-label {
  color: #a0a0a0;
  font-size: 0.9rem;
  font-weight: 500;
}

.stat-value {
  color: #ffffff;
  font-size: 0.9rem;
  font-weight: 600;
}

/* Balance Analysis */
.balance-analysis {
  padding: 24px !important;
}

.balance-analysis h3 {
  margin: 0 0 20px 0;
  font-size: 1.2rem;
  font-weight: 600;
  color: #ffffff;
  padding: 0 4px;
}

.balance-item {
  margin-bottom: 16px;
  font-size: 14px;
  line-height: 1.5;
  color: #e0e0e0;
}

.recommendations {
  margin-top: 16px;
}

.recommendations ul {
  margin: 8px 0 0 0;
  padding-left: 20px;
}

.recommendations li {
  margin-bottom: 8px;
  font-size: 14px;
  line-height: 1.4;
  color: #e0e0e0;
}

/* Status classes */
.kpi-value {
  font-size: 2rem;
  font-weight: 700;
  color: #ffffff;
  margin-top: 0.5rem;
}

.top-records {
  margin-top: 0.5rem;
}

.record-item {
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.record-rank {
  font-size: 1.2rem;
  margin-right: 0.5rem;
  min-width: 1.5rem;
  text-align: center;
}

.record-name {
  flex: 1;
  color: #ffffff;
  margin-right: 0.5rem;
}

.record-weight {
  font-weight: 600;
  color: #10B981;
}

.weight-increase {
  color: #8B5CF6; /* Фиолетовый для увеличения веса */
}

.weight-decrease {
  color: #10B981; /* Зеленый для уменьшения веса */
}

.days-recent {
  color: var(--ion-color-success);
  font-weight: 600;
}

.days-week {
  color: var(--ion-color-warning);
  font-weight: 600;
}

.days-old {
  color: var(--ion-color-danger);
  font-weight: 600;
}

.balance-excellent {
  color: var(--ion-color-success);
  font-weight: 600;
}

.balance-good {
  color: var(--ion-color-primary);
  font-weight: 600;
}

.balance-fair {
  color: var(--ion-color-warning);
  font-weight: 600;
}

.balance-poor {
  color: var(--ion-color-danger);
  font-weight: 600;
}

/* Loading and empty states */
.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
  color: var(--ion-color-medium);
}

.loading-state ion-spinner {
  margin-bottom: 1rem;
}

.empty-state i {
  font-size: 4rem;
  margin-bottom: 1rem;
}

/* Responsive design */
@media (max-width: 768px) {
  .kpi-grid {
    grid-template-columns: 1fr;
  }
  
  .chart-wrapper {
    height: 250px;
  }
  
  .stats-table {
    font-size: 12px;
  }
  
  .stats-table th,
  .stats-table td {
    padding: 8px 4px;
  }
}
</style>