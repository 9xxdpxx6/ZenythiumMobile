<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>Главная</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <div class="page-content">
        <div class="main-header">
          <h1 class="page-title">Zenythium</h1>
        </div>

        <!-- Main Action Grid 2x2 -->
        <div class="action-grid">
          <div class="grid-item" @click="$router.push('/select-plan')">
            <div class="grid-card modern-card">
              <i class="fas fa-play grid-icon"></i>
              <h3>Начать тренировку</h3>
            </div>
          </div>

          <div class="grid-item" @click="$router.push('/tabs/workouts')">
            <div class="grid-card modern-card">
              <i class="fas fa-list grid-icon"></i>
              <h3>Тренировки</h3>
            </div>
          </div>

          <div class="grid-item" @click="$router.push('/tabs/plans')">
            <div class="grid-card modern-card">
              <i class="fas fa-book grid-icon"></i>
              <h3>Планы</h3>
            </div>
          </div>

          <div class="grid-item" @click="$router.push('/tabs/cycles')">
            <div class="grid-card modern-card">
              <i class="fas fa-sync-alt grid-icon"></i>
              <h3>Циклы</h3>
            </div>
          </div>
        </div>

        <!-- Statistics Section -->
        <div class="statistics-section">
          <h2>Основные показатели</h2>
          
          <!-- Quick Stats Cards -->
          <div class="quick-stats">
            <div class="stat-card modern-card">
              <div class="stat-top">
                <div class="stat-value">{{ weekWorkouts }}</div>
                <i class="fas fa-chart-line stat-icon"></i>
              </div>
              <div class="stat-content">
                <h3>Тренировок за неделю</h3>
              </div>
            </div>

            <div class="stat-card modern-card">
              <div class="stat-top">
                <div class="stat-value">{{ formatTimeCompact(avgTimePerMonth) }}</div>
                <i class="fas fa-clock stat-icon"></i>
              </div>
              <div class="stat-content">
                <h3>Среднее время тренировки</h3>
              </div>
            </div>

            <div class="stat-card modern-card">
              <div class="stat-top">
                <div class="stat-value">{{ trainingStreak }}</div>
                <i class="fas fa-fire stat-icon"></i>
              </div>
              <div class="stat-content">
                <h3>Серия тренировок</h3>
              </div>
            </div>

            <div class="stat-card modern-card">
              <div class="stat-top">
                <div class="stat-value">{{ mostTrainedMuscleGroup }}</div>
                <i class="fas fa-dumbbell stat-icon"></i>
              </div>
              <div class="stat-content">
                <h3>Самая качаемая группа</h3>
              </div>
            </div>
          </div>

          <!-- Charts Section -->
          <div class="charts-section">
            <!-- Weight Chart -->
            <div class="chart-container modern-card">
              <div class="chart-header">
                <ion-button fill="clear" size="small" @click="$router.push('/metrics')" class="list-btn">
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
                <div v-if="weightData.length > 0" class="weight-chart">
                  <div class="chart-container-wrapper">
                    <canvas ref="weightChartCanvas" class="weight-chart-canvas"></canvas>
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
                      <ion-button 
                        fill="clear" 
                        size="small" 
                        @click="openAddMetricModal"
                        class="add-metric-btn"
                      >
                        <i class="fas fa-plus"></i>
                      </ion-button>
                    </div>
                  </div>
                </div>
                <div v-else class="no-data">
                  <i class="fas fa-weight chart-icon"></i>
                  <p>Нет измерений</p>
                  <ion-button fill="outline" size="small" @click="openAddMetricModal">
                    Добавить вес
                  </ion-button>
                </div>
              </div>
            </div>

            <!-- Exercise Progress Chart -->
            <div class="chart-container modern-card">
              <div class="chart-header">
                <h3>Часто выполняемые упражнения</h3>
              </div>
              <div class="chart-content">
                <div v-if="selectedExercises.length > 0" class="exercise-progress">
                  <div 
                    v-for="exercise in selectedExercises" 
                    :key="exercise.id"
                    class="exercise-item"
                  >
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
                  <p v-if="!hasWorkoutData" class="no-workout-data">
                    <small>Для отображения прогресса необходимо выполнить тренировки с упражнениями</small>
                    <br>
                    <small>Нажмите "Начать тренировку" для создания первой тренировки</small>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Additional Statistics Section -->
        <div class="additional-statistics-section">
          <h2>Дополнительные показатели</h2>
          
          <!-- Additional Stats Grid -->
          <div class="additional-stats-grid">
            <!-- Общий объем тренировок -->
            <div class="additional-stat-card modern-card">
              <div class="additional-stat-header">
                <i class="fas fa-chart-bar additional-stat-icon"></i>
                <h3>Общий объем тренировок</h3>
              </div>
              <div class="additional-stat-value">{{ formatVolume(totalVolume) }}</div>
            </div>

            <!-- Активные циклы -->
            <div class="additional-stat-card modern-card">
              <div class="additional-stat-header">
                <i class="fas fa-sync-alt additional-stat-icon"></i>
                <h3>Активные циклы</h3>
              </div>
              <div class="additional-stat-value">{{ activeCycles }}</div>
            </div>

            <!-- Мотивационные показатели -->
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

            <!-- Анализ баланса мышц -->
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

        <!-- Loading State -->
        <div v-if="loading" class="loading-state">
          <ion-spinner name="crescent"></ion-spinner>
          <p>Загрузка данных...</p>
        </div>
      </div>

    </ion-content>

    <!-- Add Metric Modal -->
    <ion-modal :is-open="isAddMetricModalOpen" @did-dismiss="closeAddMetricModal">
      <ion-header>
        <ion-toolbar>
          <ion-title>Добавить вес</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="closeAddMetricModal">
              <i class="fas fa-times"></i>
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      
      <ion-content class="modal-content">
        <div class="metric-form">
          <div class="form-group">
            <CustomDatePicker
              v-model="newMetricDate"
              label="Дата измерения"
              :max="new Date().toISOString()"
            />
          </div>
          
          <div class="form-group">
            <CustomInput
              v-model="newMetricWeight"
              label="Вес (кг)"
              type="number"
              placeholder="Введите вес"
              :min="0"
              :max="1000"
              step="0.01"
            />
          </div>
          
          <div class="form-group">
            <CustomInput
              v-model="newMetricNote"
              label="Заметка (необязательно)"
              type="text"
              placeholder="Добавьте заметку к измерению"
            />
          </div>
          
          <div class="form-actions">
            <ion-button 
              expand="block" 
              @click="addMetric"
              :disabled="!newMetricWeight || isAddingMetric"
              class="save-btn"
            >
              <ion-spinner v-if="isAddingMetric" name="crescent"></ion-spinner>
              <span v-else>Сохранить</span>
            </ion-button>
          </div>
        </div>
      </ion-content>
    </ion-modal>
    
    <!-- Toast notifications -->
    <CustomToast
      :is-open="isToastOpen"
      :message="toastMessage"
      :color="toastColor"
      position="bottom"
      :duration="4000"
      @didDismiss="onToastDismiss"
    />
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, nextTick, onActivated } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonSpinner,
  IonModal,
  IonButtons,
} from '@ionic/vue';
// Font Awesome icons - no imports needed, using CSS classes
import apiClient from '@/services/api';
import { Workout, Statistics, StatisticsResponse, MetricsResponse, Metric, ApiError } from '@/types/api';
import { Chart, registerables } from 'chart.js';
import CustomDatePicker from '@/components/CustomDatePicker.vue';
import CustomInput from '@/components/CustomInput.vue';
import CustomToast from '@/components/CustomToast.vue';

// Register Chart.js components
Chart.register(...registerables);

const router = useRouter();
const workouts = ref<Workout[]>([]);
const statistics = ref<Statistics | null>(null);
const timeAnalytics = ref<any>(null);
const muscleGroupStats = ref<any>(null);
const personalRecords = ref<any>(null);
const loading = ref(false);
const error = ref<string | null>(null);

// Weight tracking data
const weightData = ref<Array<{date: string, weight: number}>>([]);

// Chart.js variables
const weightChartCanvas = ref<HTMLCanvasElement | null>(null);
let weightChart: Chart | null = null;

// Refresh animation state
const isRefreshingChart = ref(false);
const isCompletingChart = ref(false);

// Add metric modal state
const isAddMetricModalOpen = ref(false);
const newMetricDate = ref('');
const newMetricWeight = ref<string>('');
const newMetricNote = ref('');
const isAddingMetric = ref(false);

// Toast state
const isToastOpen = ref(false);
const toastMessage = ref('');
const toastColor = ref<'primary' | 'secondary' | 'success' | 'warning' | 'danger'>('primary');

// Exercise progress tracking
const selectedExercises = ref<Array<{
  id: number;
  name: string;
  category: string;
  lastResult: string;
  weightChange: {
    value: number;
    percentage: number;
    isPositive: boolean;
    isNegative: boolean;
    isStable: boolean;
  } | null;
  bestWeight: number;
  totalSets: number;
  totalVolume: number;
  avgWeight: number;
  lastPerformed?: string;
}>>([]);


const weekWorkouts = computed(() => {
  const now = new Date();
  const startOfWeek = getStartOfWeek(now);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);
  
  return workouts.value.filter(workout => {
    const workoutDate = new Date(workout.started_at);
    return workoutDate >= startOfWeek && workoutDate <= endOfWeek;
  }).length;
});

// Функция для получения начала недели (понедельник)
const getStartOfWeek = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Понедельник = 1
  const startOfWeek = new Date(d.setDate(diff));
  startOfWeek.setHours(0, 0, 0, 0);
  return startOfWeek;
};

const avgTimePerMonth = computed(() => {
  if (!timeAnalytics.value?.monthly_trends || timeAnalytics.value.monthly_trends.length === 0) {
    return 0;
  }
  
  // Получаем текущий месяц
  const currentMonth = new Date().toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
  
  // Ищем данные за текущий месяц
  const currentMonthData = timeAnalytics.value.monthly_trends.find((month: any) => 
    month.month === currentMonth
  );
  
  if (currentMonthData && currentMonthData.avg_duration) {
    return currentMonthData.avg_duration * 60; // Конвертируем минуты в секунды
  }
  
  // Если нет данных за текущий месяц, берем среднее из всех месяцев
  const totalDuration = timeAnalytics.value.monthly_trends.reduce((sum: number, month: any) => {
    return sum + (month.avg_duration || 0);
  }, 0);
  
  const avgDuration = timeAnalytics.value.monthly_trends.length > 0 
    ? totalDuration / timeAnalytics.value.monthly_trends.length 
    : 0;
    
  return avgDuration * 60; // Конвертируем минуты в секунды
});

// Серия тренировок
const trainingStreak = computed(() => {
  return statistics.value?.training_streak_days || 0;
});

// Самая качаемая мышечная группа
const mostTrainedMuscleGroup = computed(() => {
  if (!muscleGroupStats.value?.muscle_groups || muscleGroupStats.value.muscle_groups.length === 0) {
    // Если нет данных о мышечных группах, попробуем получить из статистики упражнений
    if (selectedExercises.value.length > 0) {
      const exerciseCategories = selectedExercises.value.map(ex => ex.category);
      const categoryCounts = exerciseCategories.reduce((acc, category) => {
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const mostFrequent = Object.entries(categoryCounts)
        .sort(([,a], [,b]) => b - a)[0];
      
      return mostFrequent ? mostFrequent[0] : '—';
    }
    return '—';
  }
  
  const sortedGroups = muscleGroupStats.value.muscle_groups.sort((a: any, b: any) => 
    (b.total_volume || 0) - (a.total_volume || 0)
  );
  
  return sortedGroups[0]?.muscle_group_name || '—';
});

// Общий объем тренировок
const totalVolume = computed(() => {
  return statistics.value?.total_volume || 0;
});

// Активные циклы
const activeCycles = computed(() => {
  return statistics.value?.active_cycles_count || 0;
});

// Лучший личный рекорд
const bestPersonalRecord = computed(() => {
  if (!personalRecords.value?.personal_records || personalRecords.value.personal_records.length === 0) {
    return null;
  }
  
  const sortedRecords = personalRecords.value.personal_records.sort((a: any, b: any) => 
    (b.max_weight || 0) - (a.max_weight || 0)
  );
  
  return sortedRecords[0] || null;
});

// Анализ баланса мышц
const balanceAnalysis = computed(() => {
  if (!muscleGroupStats.value?.balance_analysis) {
    return null;
  }
  
  return muscleGroupStats.value.balance_analysis;
});

const recentWorkouts = computed(() => {
  return workouts.value
    .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())
    .slice(0, 5);
});

const hasWorkoutData = computed(() => {
  return workouts.value.length > 0;
});


// Функция для получения реального прогресса упражнений из API статистики
const fetchExerciseProgress = async () => {
  try {
    const response = await apiClient.get('/api/v1/user/exercise-statistics');
    const statsData = response.data.data;
    
    if (!statsData || !statsData.top_exercises) {
      return [];
    }
    
    // Преобразуем данные из API в формат для отображения
    const exerciseProgress = statsData.top_exercises.map((exercise: any) => {
      // Находим соответствующий прогресс из exercise_progress
      const progressData = statsData.exercise_progress?.find((progress: any) => 
        progress.exercise_name === exercise.exercise_name
      );
      
      // Рассчитываем изменение веса
      const weightChange = calculateWeightChange(progressData);
      
      // Форматируем последний результат
      const lastResult = exercise.last_performed 
        ? `${exercise.avg_weight?.toFixed(1) || 0} кг (${exercise.last_performed})`
        : 'Нет данных';
      
      return {
        id: Math.random(), // Временный ID, так как в API нет ID упражнения
        name: exercise.exercise_name,
        category: exercise.muscle_group || 'Неизвестно',
        lastResult,
        weightChange,
        bestWeight: exercise.max_weight || 0,
        totalSets: exercise.total_sets || 0,
        totalVolume: exercise.total_volume || 0,
        avgWeight: exercise.avg_weight || 0,
        lastPerformed: exercise.last_performed
      };
    });
    
    return exerciseProgress;
  } catch (error) {
    console.error('❌ Error fetching exercise progress:', error);
    return [];
  }
};

// Функция для расчета изменения веса из exercise_progress
const calculateWeightChange = (progressData: any) => {
  if (!progressData || !progressData.weight_progression || progressData.weight_progression.length < 2) {
    return null; // Нет данных для сравнения
  }
  
  const progression = progressData.weight_progression;
  const firstWeight = progression[0].max_weight;
  const lastWeight = progression[progression.length - 1].max_weight;
  const change = lastWeight - firstWeight;
  
  return {
    value: change,
    percentage: firstWeight > 0 ? ((change / firstWeight) * 100) : 0,
    isPositive: change > 0,
    isNegative: change < 0,
    isStable: change === 0
  };
};

// Weight chart methods
const refreshWeightChart = async () => {
  isRefreshingChart.value = true;
  isCompletingChart.value = false;
  
  try {
    await fetchData();
  } finally {
    // Переключаемся на завершающую анимацию
    isRefreshingChart.value = false;
    isCompletingChart.value = true;
    
    // После завершения анимации сбрасываем состояние
    setTimeout(() => {
      isCompletingChart.value = false;
    }, 300);
  }
};

const createWeightChart = () => {
  if (!weightChartCanvas.value || weightData.value.length === 0) return;
  
  // Destroy existing chart
  if (weightChart) {
    weightChart.destroy();
  }
  
  // Filter data for last month
  const monthlyData = getMonthlyWeightData();
  
  if (monthlyData.length === 0) return;
  
  const ctx = weightChartCanvas.value.getContext('2d');
  if (!ctx) return;
  
  weightChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: monthlyData.map(item => {
        const date = new Date(item.date);
        return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
      }),
      datasets: [{
        label: 'Вес (кг)',
        data: monthlyData.map(item => item.weight),
        borderColor: 'rgb(124, 58, 237)', // Purple color
        backgroundColor: 'rgba(124, 58, 237, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgb(124, 58, 237)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#fff',
          bodyColor: '#fff',
          borderColor: 'rgb(124, 58, 237)',
          borderWidth: 1,
          position: 'nearest',
          xAlign: 'center',
          yAlign: 'top',
          caretSize: 6,
          caretPadding: 8,
          displayColors: false,
          callbacks: {
            title: function(context) {
              const index = context[0].dataIndex;
              const date = new Date(monthlyData[index].date);
              return date.toLocaleDateString('ru-RU', { 
                day: '2-digit', 
                month: 'long',
                year: 'numeric'
              });
            },
            label: function(context) {
              return `Вес: ${context.parsed.y.toFixed(1)} кг`;
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
            font: {
              size: 11
            }
          }
        },
        y: {
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          },
          ticks: {
            color: 'rgba(255, 255, 255, 0.7)',
            font: {
              size: 11
            },
            callback: function(value) {
              return value + ' кг';
            }
          }
        }
      },
      interaction: {
        intersect: false,
        mode: 'index'
      }
    }
  });
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
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
  
  // Берем первый и последний вес за месяц
  const firstWeight = monthlyData[0].weight;
  const lastWeight = monthlyData[monthlyData.length - 1].weight;
  const change = lastWeight - firstWeight;
  const sign = change > 0 ? '+' : '';
  return `${sign}${change.toFixed(1)} кг`;
};

const getWeightChangeClassForChart = () => {
  const monthlyData = getMonthlyWeightData();
  if (monthlyData.length < 2) return '';
  
  // Берем первый и последний вес за месяц
  const firstWeight = monthlyData[0].weight;
  const lastWeight = monthlyData[monthlyData.length - 1].weight;
  const change = lastWeight - firstWeight;
  
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

const formatDateShort = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit'
  });
};

// Modal functions
const openAddMetricModal = () => {
  // Set default date to today
  const today = new Date().toISOString().split('T')[0];
  newMetricDate.value = today;
  newMetricWeight.value = '';
  newMetricNote.value = '';
  isAddMetricModalOpen.value = true;
};

const closeAddMetricModal = () => {
  isAddMetricModalOpen.value = false;
  newMetricDate.value = '';
  newMetricWeight.value = '';
  newMetricNote.value = '';
};

const addMetric = async () => {
  if (!newMetricWeight.value || !newMetricDate.value) return;
  
  // Validate date is not in the future
  const selectedDate = new Date(newMetricDate.value);
  const today = new Date();
  today.setHours(23, 59, 59, 999); // End of today
  
  if (selectedDate > today) {
    showErrorToast('Дата не может быть в будущем');
    return;
  }
  
  // Validate weight
  const weight = parseFloat(newMetricWeight.value);
  if (isNaN(weight) || weight <= 0 || weight > 1000) {
    showErrorToast('Вес должен быть от 0 до 1000 кг');
    return;
  }
  
  isAddingMetric.value = true;
  
  try {
    const metricData = {
      date: newMetricDate.value,
      weight: weight.toFixed(2),
      note: newMetricNote.value || null
    };
    
    await apiClient.post('/api/v1/metrics', metricData);
    
    // Refresh data to update chart
    await fetchData();
    
    // Show success toast
    showSuccessToast('Метрика успешно добавлена!');
    
    // Close modal
    closeAddMetricModal();
  } catch (error: any) {
    console.error('Error adding metric:', error);
    
    // Handle different types of errors
    if (error.response?.status === 422) {
      const errorData = error.response.data;
      
      // Специальная обработка для ошибки дублирования даты
      if (errorData.errors && errorData.errors.date) {
        const dateError = Array.isArray(errorData.errors.date) 
          ? errorData.errors.date[0] 
          : String(errorData.errors.date);
        showErrorToast(`Запись на эту дату уже существует. ${dateError}`);
      } else if (errorData.message) {
        showErrorToast(errorData.message);
      } else if (errorData.errors) {
        // Handle validation errors
        const firstError = Object.values(errorData.errors)[0];
        if (Array.isArray(firstError)) {
          showErrorToast(firstError[0]);
        } else {
          showErrorToast(String(firstError));
        }
      } else {
        showErrorToast('Ошибка валидации данных');
      }
    } else if (error.response?.status === 401) {
      showErrorToast('Необходимо войти в систему');
    } else if (error.response?.status >= 500) {
      showErrorToast('Ошибка сервера. Попробуйте позже');
    } else {
      showErrorToast('Произошла ошибка при сохранении метрики');
    }
  } finally {
    isAddingMetric.value = false;
  }
};

const addWeightEntry = () => {
  openAddMetricModal();
};

// Toast functions
const showToast = (message: string, color: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' = 'primary') => {
  toastMessage.value = message;
  toastColor.value = color;
  isToastOpen.value = true;
};

const showSuccessToast = (message: string) => {
  showToast(message, 'success');
};

const showErrorToast = (message: string) => {
  showToast(message, 'danger');
};

const onToastDismiss = () => {
  isToastOpen.value = false;
};

const fetchData = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    // Загружаем тренировки
    const workoutsResponse = await apiClient.get('/api/v1/workouts');
    workouts.value = workoutsResponse.data.data || workoutsResponse.data || [];
    
    // Загружаем статистику
    try {
      const statsResponse = await apiClient.get<StatisticsResponse>('/api/v1/user/statistics');
      statistics.value = statsResponse.data.data;
    } catch (statsError) {
      console.error('Statistics fetch error:', statsError);
    }
    
    // Загружаем временную аналитику для среднего времени тренировки
    try {
      const timeAnalyticsResponse = await apiClient.get('/api/v1/user/time-analytics');
      timeAnalytics.value = timeAnalyticsResponse.data.data;
    } catch (timeAnalyticsError) {
      console.error('Time analytics fetch error:', timeAnalyticsError);
    }
    
    // Загружаем статистику мышечных групп
    try {
      const muscleGroupResponse = await apiClient.get('/api/v1/user/muscle-group-statistics');
      muscleGroupStats.value = muscleGroupResponse.data.data;
    } catch (muscleGroupError) {
      console.error('Muscle group statistics fetch error:', muscleGroupError);
    }
    
    // Загружаем личные рекорды
    try {
      const recordsResponse = await apiClient.get('/api/v1/user/records');
      personalRecords.value = recordsResponse.data.data;
    } catch (recordsError) {
      console.error('Personal records fetch error:', recordsError);
    }
    
    // Загружаем метрики (вес)
    try {
      const metricsResponse = await apiClient.get<MetricsResponse>('/api/v1/metrics');
      const metrics = metricsResponse.data.data || [];
      
      // Конвертируем все метрики в формат для диаграммы
      if (metrics.length > 0) {
        weightData.value = metrics.map(metric => ({
          date: metric.date,
          weight: parseFloat(metric.weight) // Конвертируем строку в число
        })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()); // Сортируем по дате
        
        // Create chart after data is loaded
        nextTick(() => {
          createWeightChart();
        });
      }
    } catch (metricsError) {
      console.error('Metrics fetch error:', metricsError);
    }
    
    // Загружаем реальный прогресс упражнений из API статистики
    const exerciseProgressData = await fetchExerciseProgress();
    selectedExercises.value = exerciseProgressData;
  } catch (err) {
    console.error('Data fetch error:', err);
    error.value = (err as ApiError).message;
  } finally {
    loading.value = false;
  }
};

const handleWorkoutClick = (workout: Workout) => {
  if (workout.status === 'active') {
    router.push(`/workout/${workout.id}`);
  } else {
    router.push('/tabs/workouts');
  }
};


const formatTime = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}ч ${minutes}м`;
  }
  return `${minutes}м`;
};

const formatTimeCompact = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    // Если есть часы, показываем только часы и минуты без лишних пробелов
    return `${hours}ч${minutes > 0 ? ` ${minutes}м` : ''}`;
  }
  return `${minutes}м`;
};

// Форматирование объема тренировок
const formatVolume = (volume: number) => {
  if (volume >= 1000000) {
    return `${(volume / 1000000).toFixed(1)}М кг`;
  } else if (volume >= 1000) {
    return `${(volume / 1000).toFixed(1)}К кг`;
  }
  return `${volume} кг`;
};

// Функции для форматирования изменения веса
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

onMounted(() => {
  fetchData();
});

// Обновляем данные при возврате на страницу
onActivated(() => {
  fetchData();
});
</script>

<style scoped>
/* Balanced layout with increased spacing */
.page-content {
  padding: 16px !important;
  margin: 0 !important;
  padding-top: 12px !important;
  padding-bottom: 120px !important; /* Add more space for tab bar and scrolling */
}

/* Main Header */
.main-header {
  text-align: center;
  margin-bottom: 20px;
}

.main-header .page-title {
  color: var(--ion-text-color) !important;
  font-size: 24px !important;
  margin: 0 !important;
  font-weight: 600;
}

/* Action Grid 2x2 - Increased spacing */
.action-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 32px;
}

.grid-item {
  cursor: pointer;
}

.grid-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px 8px !important;
  text-align: center;
  min-height: 80px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  border-radius: 12px;
  margin: 0 !important;
  position: relative;
  overflow: hidden;
}

/* Градиенты для разных плиток */
.grid-item:nth-child(1) .grid-card {
  background: linear-gradient(135deg, 
    rgba(30, 50, 80, 0.9) 0%, 
    rgba(50, 70, 100, 0.8) 50%, 
    rgba(20, 40, 70, 0.9) 100%);
  border: 2px solid rgba(59, 130, 246, 0.6);
}

.grid-item:nth-child(2) .grid-card {
  background: linear-gradient(135deg, 
    rgba(80, 30, 100, 0.9) 0%, 
    rgba(100, 50, 120, 0.8) 50%, 
    rgba(60, 20, 80, 0.9) 100%);
  border: 2px solid rgba(168, 85, 247, 0.6);
}

.grid-item:nth-child(3) .grid-card {
  background: linear-gradient(135deg, 
    rgba(30, 60, 40, 0.9) 0%, 
    rgba(50, 80, 60, 0.8) 50%, 
    rgba(20, 50, 30, 0.9) 100%);
  border: 2px solid rgba(34, 197, 94, 0.6);
}

.grid-item:nth-child(4) .grid-card {
  background: linear-gradient(135deg, 
    rgba(80, 70, 30, 0.9) 0%, 
    rgba(100, 90, 50, 0.8) 50%, 
    rgba(60, 50, 20, 0.9) 100%);
  border: 2px solid rgba(245, 158, 11, 0.6);
}

/* Статичные пузыри */
.grid-card::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  pointer-events: none;
}

.grid-item:nth-child(1) .grid-card::before {
  background: radial-gradient(circle at 30% 20%, rgba(99, 102, 241, 0.15) 0%, transparent 50%),
              radial-gradient(circle at 70% 80%, rgba(124, 58, 237, 0.12) 0%, transparent 50%),
              radial-gradient(circle at 20% 70%, rgba(59, 130, 246, 0.08) 0%, transparent 40%);
}

.grid-item:nth-child(2) .grid-card::before {
  background: radial-gradient(circle at 40% 30%, rgba(168, 85, 247, 0.15) 0%, transparent 50%),
              radial-gradient(circle at 60% 70%, rgba(139, 92, 246, 0.12) 0%, transparent 50%),
              radial-gradient(circle at 30% 80%, rgba(147, 51, 234, 0.08) 0%, transparent 40%);
}

.grid-item:nth-child(3) .grid-card::before {
  background: radial-gradient(circle at 25% 25%, rgba(34, 197, 94, 0.15) 0%, transparent 50%),
              radial-gradient(circle at 75% 75%, rgba(16, 185, 129, 0.12) 0%, transparent 50%),
              radial-gradient(circle at 50% 20%, rgba(5, 150, 105, 0.08) 0%, transparent 40%);
}

.grid-item:nth-child(4) .grid-card::before {
  background: radial-gradient(circle at 35% 15%, rgba(245, 158, 11, 0.15) 0%, transparent 50%),
              radial-gradient(circle at 65% 85%, rgba(234, 179, 8, 0.12) 0%, transparent 50%),
              radial-gradient(circle at 15% 65%, rgba(217, 119, 6, 0.08) 0%, transparent 40%);
}

/* Статичные световые эффекты */
.grid-card::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(45deg, 
    transparent 0%, 
    rgba(255, 255, 255, 0.05) 25%, 
    transparent 50%, 
    rgba(255, 255, 255, 0.03) 75%, 
    transparent 100%);
  pointer-events: none;
}

.grid-icon {
  font-size: 2rem;
  color: var(--ion-color-primary);
  margin-bottom: 8px;
  position: relative;
  z-index: 2;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

.grid-card h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--ion-text-color);
  position: relative;
  z-index: 2;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

/* Statistics Section - Increased spacing */
.statistics-section {
  margin-bottom: 32px;
}

.statistics-section h2 {
  font-size: 18px;
  font-weight: 600;
  color: var(--ion-text-color);
  margin: 0 0 24px 10px;
}

.quick-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 24px;
}

/* Additional Statistics Section */
.additional-statistics-section {
  margin-bottom: 32px;
}

.additional-statistics-section h2 {
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

.stat-card {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 18px !important;
  text-align: center;
  background: var(--ion-color-step-50);
  border-radius: 12px;
  margin: 0 !important;
  min-height: 100px;
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

/* Цветные значения для карточек статистики */
.stat-card:nth-child(1) .stat-value {
  color: #10b981; /* Зеленый */
}

.stat-card:nth-child(2) .stat-value {
  color: #8b5cf6; /* Фиолетовый */
}

.stat-card:nth-child(3) .stat-value {
  color: #f59e0b; /* Оранжевый */
}

.stat-card:nth-child(4) .stat-value {
  color: #3b82f6; /* Синий */
}

.stat-content h3 {
  margin: 0;
  text-align: start;
  font-size: 14px;
  font-weight: 600;
  color: var(--ion-color-medium);
  line-height: 1.2;
}

.stat-icon {
  font-size: 1.5rem;
  color: var(--ion-color-primary);
}

/* Цветные иконки для карточек статистики */
.stat-card:nth-child(1) .stat-icon {
  color: #10b981; /* Зеленый */
}

.stat-card:nth-child(2) .stat-icon {
  color: #8b5cf6; /* Фиолетовый */
}

.stat-card:nth-child(3) .stat-icon {
  color: #f59e0b; /* Оранжевый */
}

.stat-card:nth-child(4) .stat-icon {
  color: #3b82f6; /* Синий */
}

/* Charts Section - Increased spacing */
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

.list-btn {
  --color: var(--ion-color-medium);
  --background: transparent;
  --border-radius: 50%;
  width: 32px;
  height: 32px;
  min-width: 32px;
  min-height: 32px;
  margin: 0;
  padding: 0;
}

.list-btn:hover {
  --color: var(--ion-color-primary);
}

.list-btn i {
  font-size: 14px;
}

.chart-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--ion-text-color);
  padding-left: 0;
  flex: 1;
}


.chart-container-wrapper {
  position: relative;
  height: 200px;
  width: 100%;
}

.weight-chart-canvas {
  width: 100% !important;
  height: 100% !important;
}

.chart-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-top: 1px solid var(--ion-color-step-200);
}

.chart-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.add-metric-btn {
  --color: var(--ion-color-primary);
  --background: transparent;
  --border-radius: 50%;
  width: 32px;
  height: 32px;
  min-width: 32px;
  min-height: 32px;
  margin: 0;
  padding: 0;
}

.add-metric-btn i {
  font-size: 14px;
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

.weight-change {
  font-size: 0.9rem;
  font-weight: 600;
}

.weight-change span {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 12px;
  border: 1px solid;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
}

.weight-increase {
  color: #10b981;
  border-color: #10b981;
}

.weight-decrease {
  color: #f59e0b;
  border-color: #f59e0b;
}

.weight-stable {
  color: #6b7280;
  border-color: #6b7280;
}

/* Refresh animation */
.refresh-spinning {
  animation: spinContinuous 0.6s linear infinite;
  opacity: 0.7;
}

.refresh-completing {
  animation: spinComplete 0.3s ease-out forwards;
  opacity: 1;
}

@keyframes spinContinuous {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes spinComplete {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.chart-content {
  min-height: 70px;
}

.chart-icon {
  margin-bottom: 0;
  font-size: 2.5rem;
  color: var(--ion-color-primary);
  opacity: 0.8;
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

.no-data p {
  margin: 0;
  font-size: 14px;
  line-height: 1.4;
}

.no-data ion-button {
  --padding-start: 16px;
  --padding-end: 16px;
  --padding-top: 10px;
  --padding-bottom: 10px;
  font-size: 13px;
  font-weight: 500;
  text-align: center;
  min-width: 120px;
  --border-radius: 8px;
}

.no-data ion-button .button-native {
  text-align: center !important;
  justify-content: center !important;
}

.no-workout-data {
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  color: var(--ion-color-medium);
  opacity: 0.8;
  text-align: center;
  max-width: 280px;
}

.no-workout-data small {
  display: block;
  margin-bottom: 6px;
  text-align: center;
}

/* Exercise Progress - Increased spacing */
.exercise-progress {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Exercise Progress - Mobile Design */
.exercise-item {
  position: relative;
  background: var(--ion-color-step-50);
  border-radius: 12px;
  padding: 12px 16px;
  margin-bottom: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.exercise-content {
  margin-top: 0;
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
  line-height: 1.3;
  flex: 1;
  min-width: 0;
  margin-right: 8px;
  word-wrap: break-word;
  hyphens: auto;
}

.exercise-category {
  font-size: 11px;
  color: var(--ion-color-primary);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Weight change badge in flex container */
.weight-change-badge {
  flex-shrink: 0;
  margin-right: 0;
}

.weight-change-badge span {
  display: inline-block;
  padding: 3px 6px;
  border-radius: 8px;
  font-size: 10px;
  font-weight: 600;
  text-align: center;
  min-width: 40px;
  border: 1px solid;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
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
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.stat-item.highlight {
  background: rgba(255, 255, 255, 0.05);
}

.stat-item-icon {
  font-size: 16px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  flex-shrink: 0;
}

.stat-content {
  flex: 1;
  min-width: 0;
}

.stat-item-value {
  font-size: 12px;
  font-weight: 600;
  color: var(--ion-text-color);
  margin-bottom: 1px;
  line-height: 1.2;
}

.stat-label {
  font-size: 10px;
  color: var(--ion-color-medium);
  font-weight: 500;
  line-height: 1.2;
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
  color: var(--ion-color-medium);
  gap: 16px;
  min-height: 120px;
}

.loading-state ion-spinner {
  margin-bottom: 0;
  --color: var(--ion-color-primary);
}

.loading-state p {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  color: var(--ion-color-medium);
}

/* Modal Styles */
.modal-content {
  --background: var(--ion-color-step-50);
}

.metric-form {
  padding: 20px;
  max-width: 400px;
  margin: 0 auto;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--ion-text-color);
}

.form-actions {
  margin-top: 30px;
}

.save-btn {
  --background: var(--ion-color-primary);
  --color: white;
  --border-radius: 8px;
  height: 48px;
  font-weight: 600;
}

.save-btn:disabled {
  --background: var(--ion-color-step-200);
  --color: var(--ion-color-medium);
}
</style>
