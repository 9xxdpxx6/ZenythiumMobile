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
                <i class="fas fa-dumbbell stat-icon"></i>
              </div>
              <div class="stat-content">
                <h3>Тренировок за неделю</h3>
              </div>
            </div>

            <div class="stat-card modern-card">
              <div class="stat-top">
                <div class="stat-value">{{ formatTime(totalTime) }}</div>
                <i class="fas fa-clock stat-icon"></i>
              </div>
              <div class="stat-content">
                <h3>Время тренировок</h3>
              </div>
            </div>
          </div>

          <!-- Charts Section -->
          <div class="charts-section">
            <!-- Weight Chart -->
            <div class="chart-container modern-card">
              <div class="chart-header">
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
                    <div class="weight-change" v-if="getWeightChange()">
                      <span :class="getWeightChangeClass()">
                        {{ getWeightChange() }}
                      </span>
                    </div>
                  </div>
                </div>
                <div v-else class="no-data">
                  <i class="fas fa-weight chart-icon"></i>
                  <p>Нет данных о весе</p>
                  <ion-button fill="outline" size="small" @click="addWeightEntry">
                    Добавить вес
                  </ion-button>
                </div>
              </div>
            </div>

            <!-- Exercise Progress Chart -->
            <div class="chart-container modern-card">
              <div class="chart-header">
                <h3>Прогресс по упражнениям</h3>
                <ion-button fill="clear" size="small" @click="showExerciseSelector">
                  <i class="fas fa-cog" :class="{ 'refresh-spinning': isRefreshingExercises }"></i>
                </ion-button>
              </div>
              <div class="chart-content">
                <div v-if="selectedExercises.length > 0" class="exercise-progress">
                  <div 
                    v-for="exercise in selectedExercises" 
                    :key="exercise.id"
                    class="exercise-item"
                  >
                    <div class="exercise-info">
                      <h4>{{ exercise.name }}</h4>
                      <p>Последний результат: {{ exercise.lastResult }}</p>
                    </div>
                    <div class="progress-bar">
                      <div 
                        class="progress-fill" 
                        :style="{ width: exercise.progress + '%' }"
                      ></div>
                    </div>
                  </div>
                </div>
                <div v-else class="no-data">
                  <i class="fas fa-dumbbell chart-icon"></i>
                  <p>Выберите упражнения для отслеживания</p>
                  <ion-button fill="outline" size="small" @click="showExerciseSelector">
                    Выбрать упражнения
                  </ion-button>
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

      <!-- Exercise Selector Modal -->
      <ion-modal :is-open="showExerciseModal" @did-dismiss="showExerciseModal = false">
        <ion-header>
          <ion-toolbar>
            <ion-title>Выберите упражнения</ion-title>
            <ion-buttons slot="end">
              <ion-button fill="clear" @click="showExerciseModal = false">
                <i class="fas fa-times"></i>
              </ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content>
          <div class="exercise-selector">
            <div class="modal-header">
              <h2>Отслеживание прогресса</h2>
              <p>Выберите упражнения для отображения на главной странице</p>
            </div>
            
            <!-- Search Bar -->
            <div class="search-container">
              <div class="search-input-wrapper">
                <i class="fas fa-search search-icon"></i>
                <ion-input
                  v-model="searchQuery"
                  placeholder="Поиск упражнений..."
                  class="search-input"
                ></ion-input>
                <ion-button 
                  v-if="searchQuery" 
                  fill="clear" 
                  size="small"
                  @click="searchQuery = ''"
                  class="clear-search"
                >
                  <i class="fas fa-times"></i>
                </ion-button>
              </div>
            </div>
            
            <div class="exercises-list">
              <div 
                v-for="exercise in filteredExercises" 
                :key="exercise.id"
                class="exercise-card"
                :class="{ 'exercise-selected': isExerciseSelected(exercise.id) }"
                @click="toggleExercise(exercise)"
              >
                <div class="exercise-checkbox">
                  <ion-checkbox 
                    :checked="isExerciseSelected(exercise.id)"
                    @click.stop
                  ></ion-checkbox>
                </div>
                <div class="exercise-info">
                  <h3>{{ exercise.name }}</h3>
                  <p class="exercise-category">{{ exercise.muscle_group || exercise.category }}</p>
                  <p v-if="exercise.description" class="exercise-description">{{ exercise.description }}</p>
                </div>
                <div class="exercise-icon">
                  <i class="fas fa-dumbbell"></i>
                </div>
              </div>
              
              <!-- No results message -->
              <div v-if="filteredExercises.length === 0" class="no-results">
                <i class="fas fa-search"></i>
                <p>Упражнения не найдены</p>
                <small>Попробуйте изменить поисковый запрос</small>
              </div>
            </div>
          </div>
        </ion-content>
      </ion-modal>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonSpinner,
  IonModal,
  IonButtons,
  IonCheckbox,
  IonInput,
} from '@ionic/vue';
// Font Awesome icons - no imports needed, using CSS classes
import apiClient from '@/services/api';
import { Workout, Statistics, StatisticsResponse, MetricsResponse, Metric, ApiError } from '@/types/api';
import { Chart, registerables } from 'chart.js';

// Register Chart.js components
Chart.register(...registerables);

const router = useRouter();
const workouts = ref<Workout[]>([]);
const statistics = ref<Statistics | null>(null);
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
const isRefreshingExercises = ref(false);

// Exercise progress tracking
const showExerciseModal = ref(false);
const selectedExercises = ref<Array<{
  id: number;
  name: string;
  category: string;
  lastResult: string;
  progress: number;
}>>([]);

// Search functionality
const searchQuery = ref('');
const filteredExercises = computed(() => {
  if (!searchQuery.value.trim()) {
    return availableExercises.value;
  }
  
  const query = searchQuery.value.toLowerCase();
  return availableExercises.value.filter(exercise => 
    exercise.name.toLowerCase().includes(query) ||
    (exercise.muscle_group || exercise.category).toLowerCase().includes(query) ||
    (exercise.description && exercise.description.toLowerCase().includes(query))
  );
});

// Available exercises for selection
const availableExercises = ref<Array<{
  id: number;
  name: string;
  category: string;
  muscle_group?: string;
  description?: string;
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

const totalTime = computed(() => {
  return statistics.value?.total_training_time || 0;
});

const recentWorkouts = computed(() => {
  return workouts.value
    .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())
    .slice(0, 5);
});

// Exercise selection methods
const isExerciseSelected = (exerciseId: number) => {
  return selectedExercises.value.some(ex => ex.id === exerciseId);
};

const toggleExercise = (exercise: {id: number, name: string, category: string, muscle_group?: string}) => {
  const existingIndex = selectedExercises.value.findIndex(ex => ex.id === exercise.id);
  
  if (existingIndex >= 0) {
    selectedExercises.value.splice(existingIndex, 1);
  } else {
    // Add new exercise with mock progress data
    selectedExercises.value.push({
      id: exercise.id,
      name: exercise.name,
      category: exercise.muscle_group || exercise.category,
      lastResult: Math.floor(Math.random() * 50) + 10 + ' кг',
      progress: Math.floor(Math.random() * 100)
    });
  }
  
  // Auto-save to localStorage immediately
  localStorage.setItem('selectedExercises', JSON.stringify(selectedExercises.value));
};

const fetchUserExercises = async () => {
  try {
    const response = await apiClient.get('/api/v1/exercises');
    availableExercises.value = response.data.data || response.data || [];
  } catch (err) {
    console.error('Exercises fetch error:', err);
    // Fallback to mock data if API fails
    availableExercises.value = [
      { id: 1, name: 'Жим лежа', category: 'Грудь', muscle_group: 'Грудь' },
      { id: 2, name: 'Приседания', category: 'Ноги', muscle_group: 'Ноги' },
      { id: 3, name: 'Становая тяга', category: 'Спина', muscle_group: 'Спина' },
      { id: 4, name: 'Подтягивания', category: 'Спина', muscle_group: 'Спина' },
      { id: 5, name: 'Отжимания', category: 'Грудь', muscle_group: 'Грудь' },
      { id: 6, name: 'Планка', category: 'Кор', muscle_group: 'Кор' },
      { id: 7, name: 'Бег', category: 'Кардио', muscle_group: 'Кардио' },
      { id: 8, name: 'Велосипед', category: 'Кардио', muscle_group: 'Кардио' },
    ];
  }
};

const showExerciseSelector = async () => {
  isRefreshingExercises.value = true;
  try {
    await fetchUserExercises();
    showExerciseModal.value = true;
  } finally {
    isRefreshingExercises.value = false;
  }
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

const getWeightChangeClass = () => {
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

const addWeightEntry = () => {
  // This would typically open a modal to add weight entry
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
    
    // Load selected exercises from localStorage
    const savedExercises = localStorage.getItem('selectedExercises');
    if (savedExercises) {
      selectedExercises.value = JSON.parse(savedExercises);
    } else {
      // Select 3 random exercises on first load
      const shuffled = [...availableExercises.value].sort(() => 0.5 - Math.random());
      const randomExercises = shuffled.slice(0, 3).map(exercise => ({
        id: exercise.id,
        name: exercise.name,
        category: exercise.category,
        lastResult: Math.floor(Math.random() * 50) + 10 + ' кг',
        progress: Math.floor(Math.random() * 100)
      }));
      selectedExercises.value = randomExercises;
      localStorage.setItem('selectedExercises', JSON.stringify(randomExercises));
    }
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

onMounted(() => {
  fetchData();
});
</script>

<style scoped>
/* Balanced layout with increased spacing */
.page-content {
  padding: 16px !important;
  margin: 0 !important;
  padding-top: 12px !important;
  padding-bottom: 80px !important; /* Add space for tab bar (60px) + extra margin */
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
  border: 1px solid rgba(255, 255, 255, 0.05);
}

/* Градиенты для разных плиток */
.grid-item:nth-child(1) .grid-card {
  background: linear-gradient(135deg, 
    rgba(30, 30, 35, 0.9) 0%, 
    rgba(45, 45, 55, 0.8) 50%, 
    rgba(25, 25, 30, 0.9) 100%);
}

.grid-item:nth-child(2) .grid-card {
  background: linear-gradient(135deg, 
    rgba(35, 30, 40, 0.9) 0%, 
    rgba(50, 45, 60, 0.8) 50%, 
    rgba(30, 25, 35, 0.9) 100%);
}

.grid-item:nth-child(3) .grid-card {
  background: linear-gradient(135deg, 
    rgba(30, 35, 40, 0.9) 0%, 
    rgba(45, 50, 55, 0.8) 50%, 
    rgba(25, 30, 35, 0.9) 100%);
}

.grid-item:nth-child(4) .grid-card {
  background: linear-gradient(135deg, 
    rgba(40, 30, 35, 0.9) 0%, 
    rgba(55, 45, 50, 0.8) 50%, 
    rgba(35, 25, 30, 0.9) 100%);
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
  background: radial-gradient(circle at 35% 15%, rgba(245, 101, 101, 0.15) 0%, transparent 50%),
              radial-gradient(circle at 65% 85%, rgba(239, 68, 68, 0.12) 0%, transparent 50%),
              radial-gradient(circle at 15% 65%, rgba(220, 38, 38, 0.08) 0%, transparent 40%);
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

.stat-card {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 20px 24px !important;
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
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--ion-text-color);
  margin: 0;
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
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.chart-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--ion-text-color);
}

/* Weight chart styles */
.weight-chart-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
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

.weight-increase {
  color: var(--ion-color-warning);
}

.weight-decrease {
  color: var(--ion-color-success);
}

.weight-stable {
  color: var(--ion-color-medium);
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

.chart-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 70px;
  text-align: center;
  color: var(--ion-color-medium);
}

.chart-icon {
  margin-bottom: 6px;
  font-size: 2rem;
  color: var(--ion-color-primary);
}

.chart-placeholder p {
  margin: 0 0 4px 0;
  font-size: 14px;
  font-weight: 500;
}

.chart-placeholder small {
  font-size: 12px;
  color: var(--ion-color-medium);
}

.no-data {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 70px;
  text-align: center;
  color: var(--ion-color-medium);
}

.no-data p {
  margin: 0 0 8px 0;
  font-size: 14px;
}

.no-data ion-button {
  --padding-start: 12px;
  --padding-end: 12px;
  --padding-top: 6px;
  --padding-bottom: 6px;
  font-size: 12px;
}

/* Exercise Progress - Increased spacing */
.exercise-progress {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.exercise-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.exercise-info h4 {
  margin: 0 0 4px 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--ion-text-color);
}

.exercise-info p {
  margin: 0;
  font-size: 12px;
  color: var(--ion-color-medium);
}

.progress-bar {
  width: 100%;
  height: 6px;
  background-color: var(--ion-color-light);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: var(--ion-color-primary);
  border-radius: 3px;
  transition: width 0.3s ease;
}

/* Exercise Selector Modal */
.exercise-selector {
  padding: 16px;
  min-height: 100%;
  display: flex;
  flex-direction: column;
}

.modal-header {
  text-align: center;
  margin-bottom: 24px;
  padding: 16px 0;
}

.modal-header h2 {
  margin: 0 0 8px 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--ion-text-color);
}

.modal-header p {
  margin: 0;
  font-size: 14px;
  color: var(--ion-color-medium);
  line-height: 1.4;
}

/* Search Container */
.search-container {
  margin-bottom: 20px;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  background: var(--ion-color-step-50);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 0 16px;
  transition: border-color 0.2s ease;
}

.search-input-wrapper:focus-within {
  border-color: var(--ion-color-primary);
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
}

.search-icon {
  color: var(--ion-color-medium);
  font-size: 16px;
  margin-right: 12px;
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  --padding-start: 0;
  --padding-end: 0;
  --padding-top: 12px;
  --padding-bottom: 12px;
  --background: transparent;
  --color: var(--ion-text-color);
  --placeholder-color: var(--ion-color-medium);
  font-size: 16px;
}

.clear-search {
  --color: var(--ion-color-medium);
  margin-left: 8px;
  flex-shrink: 0;
}

.exercises-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.exercise-card {
  display: flex;
  align-items: center;
  padding: 16px;
  background: var(--ion-color-step-50);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid transparent;
}

.exercise-card.exercise-selected {
  border-color: var(--ion-color-primary);
  background: rgba(99, 102, 241, 0.1);
}

.exercise-checkbox {
  margin-right: 16px;
  flex-shrink: 0;
}

.exercise-info {
  flex: 1;
  margin-right: 12px;
}

.exercise-info h3 {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--ion-text-color);
}

.exercise-category {
  margin: 0 0 4px 0;
  font-size: 13px;
  color: var(--ion-color-primary);
  font-weight: 500;
}

.exercise-description {
  margin: 0;
  font-size: 12px;
  color: var(--ion-color-medium);
  line-height: 1.3;
}

.exercise-icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(99, 102, 241, 0.1);
  border-radius: 8px;
}

.exercise-icon i {
  font-size: 18px;
  color: var(--ion-color-primary);
}

.exercise-selected .exercise-icon {
  background: var(--ion-color-primary);
}

.exercise-selected .exercise-icon i {
  color: white;
}

/* No results message */
.no-results {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
  color: var(--ion-color-medium);
}

.no-results i {
  font-size: 3rem;
  margin-bottom: 16px;
  color: var(--ion-color-primary);
  opacity: 0.5;
}

.no-results p {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 500;
  color: var(--ion-text-color);
}

.no-results small {
  margin: 0;
  font-size: 14px;
  color: var(--ion-color-medium);
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  text-align: center;
  color: var(--ion-color-medium);
}

.loading-state ion-spinner {
  margin-bottom: 0.5rem;
}

.loading-state p {
  margin: 0;
  font-size: 0.8rem;
}
</style>
