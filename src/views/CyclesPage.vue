<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>Циклы</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="createCycle" class="add-button">
            <i class="fas fa-plus"></i>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-refresher slot="fixed" @ionRefresh="handleRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <PageContainer>
        <h1 class="page-title">Циклы тренировок</h1>
        <p class="page-subtitle">Управляйте своими тренировочными циклами</p>

        <!-- Поле поиска -->
        <SearchInput
          v-model="searchQuery"
          placeholder="Поиск циклов..."
          @search="handleSearchInput"
          @clear="clearSearch"
        />

        <LoadingState v-if="loading" message="Загрузка циклов..." />

        <div v-else-if="cycles.length > 0">
          <div class="cycles-list card-list">
            <div
              v-for="cycle in cycles"
              :key="cycle.id"
              class="cycle-card modern-card"
              @click="handleCycleClick(cycle)"
            >
              <div class="cycle-header">
                <h3>{{ cycle.name }}</h3>
                <div
                  :class="['cycle-status', cycle.status === 'active' ? 'status-active' : 'status-completed']"
                >
                  {{ cycle.status === 'active' ? 'Активен' : 'Завершен' }}
                </div>
              </div>
              
              <div class="cycle-info">
                <p><strong>Планов:</strong> {{ cycle.plans_count || 0 }}</p>
                <p><strong>Тренировок:</strong> {{ cycle.workouts_count || 0 }}</p>
                <p><strong>Начало:</strong> {{ formatDate(cycle.started_at) }}</p>
                <p v-if="cycle.status === 'completed' && cycle.finished_at"><strong>Завершение:</strong> {{ formatDate(cycle.finished_at) }}</p>
              </div>

              <div class="cycle-progress">
                <div class="progress-label">
                  <span>Прогресс</span>
                  <span>{{ Math.round(cycle.progress || 0) }}%</span>
                </div>
                <div class="progress-bar">
                  <div 
                    class="progress-fill" 
                    :style="{ width: (cycle.progress || 0) + '%' }"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <EmptyState
          v-else
          icon="fas fa-sync-alt"
          title="Нет циклов"
          message="Создайте свой первый тренировочный цикл"
          action-text="Создать цикл"
          action-icon="fas fa-plus"
          :action-handler="createCycle"
        />
      </PageContainer>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, onActivated, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonSpinner,
  IonRefresher,
  IonRefresherContent,
  IonButtons,
  IonButton,
  IonInput,
  toastController,
} from '@ionic/vue';
import apiClient from '@/services/api';
import { ApiError } from '@/types/api';
import SearchInput from '@/components/SearchInput.vue';
import LoadingState from '@/components/LoadingState.vue';
import EmptyState from '@/components/EmptyState.vue';
import PageContainer from '@/components/PageContainer.vue';

interface Cycle {
  id: number;
  name: string;
  status: 'active' | 'completed';
  plans_count?: number;
  workouts_count?: number;
  started_at: string;
  finished_at?: string;
  progress?: number;
}

const router = useRouter();
const cycles = ref<Cycle[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const searchQuery = ref('');
const searchTimeout = ref<NodeJS.Timeout | null>(null);
const lastFetchTime = ref<number>(0);

const fetchCycles = async (searchTerm: string = '') => {
  loading.value = true;
  error.value = null;
  
  try {
    // Запрашиваем циклы 
    const params: any = {};
    
    // Добавляем параметр поиска если есть
    if (searchTerm.trim()) {
      params.name = searchTerm.trim();
      params.search = searchTerm.trim();
    }
    
    const response = await apiClient.get('/api/v1/cycles', { params });
    const cyclesData = response.data.data || [];
    
    // Transform API data to match our interface
    cycles.value = cyclesData.map((cycle: any) => {
      // Простая логика статуса: если есть end_date - завершен, иначе - активен
      let status: 'active' | 'completed' = 'active';
      if (cycle.end_date) {
        status = 'completed';
      }
      
      return {
        id: cycle.id,
        name: cycle.name,
        status,
        plans_count: cycle.plans_count || 0,
        workouts_count: cycle.completed_workouts_count || 0,
        started_at: cycle.start_date || cycle.created_at,
        finished_at: cycle.end_date,
        progress: cycle.progress_percentage || 0,
      };
    });
  } catch (err) {
    console.error('Cycles fetch error:', err);
    error.value = (err as ApiError).message || 'Не удалось загрузить циклы';
    
    // Show error toast
    const toast = await toastController.create({
      message: error.value,
      duration: 3000,
      color: 'danger',
    });
    await toast.present();
    
    // Fallback to empty array if API fails
    cycles.value = [];
  } finally {
    loading.value = false;
    lastFetchTime.value = Date.now();
  }
};

const handleRefresh = async (event: CustomEvent) => {
  await fetchCycles(searchQuery.value);
  event.detail.complete();
};

const handleSearchInput = (value: string) => {
  searchQuery.value = value;
  
  // Очищаем предыдущий таймаут
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value);
  }
  
  // Устанавливаем новый таймаут для дебаунса (300ms)
  searchTimeout.value = setTimeout(() => {
    fetchCycles(value);
  }, 300);
};

const clearSearch = () => {
  searchQuery.value = '';
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value);
  }
  fetchCycles('');
};

const handleCycleClick = (cycle: Cycle) => {
  // Переход к редактированию цикла
  router.push(`/cycle/${cycle.id}`);
};

const createCycle = () => {
  // Переход к созданию нового цикла
  router.push('/cycle/new');
};

// Функция для принудительного обновления данных
const forceRefresh = () => {
  lastFetchTime.value = 0; // Сбрасываем время последнего обновления
  fetchCycles(searchQuery.value);
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

// Обработчик события обновления циклов
const handleCyclesUpdated = () => {
  forceRefresh();
};

onMounted(() => {
  fetchCycles();
  window.addEventListener('cycles-updated', handleCyclesUpdated);
});

onActivated(() => {
  // Обновляем данные только если прошло больше 5 секунд с последнего обновления
  // или если это первое открытие страницы
  const timeSinceLastFetch = Date.now() - lastFetchTime.value;
  if (timeSinceLastFetch > 5000 || lastFetchTime.value === 0) {
    fetchCycles(searchQuery.value);
  }
});

onUnmounted(() => {
  window.removeEventListener('cycles-updated', handleCyclesUpdated);
});
</script>

<style scoped>
.cycles-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.cycle-card {
  padding: 20px !important;
  cursor: pointer;
  transition: transform 0.2s ease;
}


.cycle-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  gap: 12px;
}

.cycle-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--ion-text-color);
  flex: 1;
  line-height: 1.3;
}

.cycle-status {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  flex-shrink: 0;
  margin-top: 2px;
}

.status-active {
  background: rgba(16, 185, 129, 0.2);
  color: var(--ion-color-success);
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.status-completed {
  background: rgba(107, 114, 128, 0.2);
  color: var(--ion-color-medium);
  border: 1px solid rgba(107, 114, 128, 0.3);
}

.cycle-info {
  margin-bottom: 16px;
}

.cycle-info p {
  margin: 4px 0;
  font-size: 14px;
  color: var(--ion-color-medium);
}

.cycle-info strong {
  color: var(--ion-text-color);
}

.cycle-progress {
  margin-top: 16px;
}

.progress-label {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 14px;
  color: var(--ion-color-medium);
}

.progress-bar {
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--ion-color-primary);
  border-radius: 4px;
  transition: width 0.3s ease;
}


/* Кнопка добавления в заголовке */
.add-button {
  --background: transparent !important;
  --background-hover: transparent !important;
  --background-focused: transparent !important;
  --background-activated: transparent !important;
  --border-width: 0 !important;
  --border-style: none !important;
  --border-color: transparent !important;
  --color: white !important;
  --color-hover: rgba(255, 255, 255, 0.8) !important;
  --color-focused: white !important;
  --color-activated: rgba(255, 255, 255, 0.8) !important;
  --box-shadow: none !important;
  --padding-start: 8px !important;
  --padding-end: 8px !important;
  --padding-top: 8px !important;
  --padding-bottom: 8px !important;
  margin: 0 !important;
  width: 40px !important;
  height: 40px !important;
}

.add-button i {
  font-size: 20px !important;
  color: white !important;
}
</style>
