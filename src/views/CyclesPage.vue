<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>Циклы</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-refresher slot="fixed" @ionRefresh="handleRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <div class="page-content">
        <h1 class="page-title">Циклы тренировок</h1>
        <p class="page-subtitle">Управляйте своими тренировочными циклами</p>

        <div v-if="loading" class="loading-state">
          <ion-spinner name="crescent"></ion-spinner>
          <p>Загрузка циклов...</p>
        </div>

        <div v-else-if="cycles.length > 0">
          <div class="cycles-list">
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
                <p v-if="cycle.finished_at"><strong>Завершение:</strong> {{ formatDate(cycle.finished_at) }}</p>
              </div>

              <div class="cycle-progress" v-if="cycle.progress">
                <div class="progress-label">
                  <span>Прогресс</span>
                  <span>{{ Math.round(cycle.progress) }}%</span>
                </div>
                <div class="progress-bar">
                  <div 
                    class="progress-fill" 
                    :style="{ width: cycle.progress + '%' }"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="empty-state">
          <i class="fas fa-sync-alt empty-icon"></i>
          <h2>Нет циклов</h2>
          <p>Создайте свой первый тренировочный цикл</p>
          <button
            @click="createCycle"
            class="modern-button"
          >
            <i class="fas fa-plus"></i>
            Создать цикл
          </button>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
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
} from '@ionic/vue';
import apiClient from '@/services/api';
import { ApiError } from '@/types/api';

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

const fetchCycles = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    // Пока что используем моковые данные, так как API может не иметь эндпоинта для циклов
    // В реальном приложении здесь был бы запрос к API
    const mockCycles: Cycle[] = [
      {
        id: 1,
        name: 'Базовый цикл силы',
        status: 'active',
        plans_count: 3,
        workouts_count: 12,
        started_at: '2024-01-01T00:00:00Z',
        progress: 65
      },
      {
        id: 2,
        name: 'Цикл на выносливость',
        status: 'completed',
        plans_count: 2,
        workouts_count: 8,
        started_at: '2023-11-01T00:00:00Z',
        finished_at: '2023-12-31T00:00:00Z',
        progress: 100
      }
    ];
    
    cycles.value = mockCycles;
  } catch (err) {
    console.error('Cycles fetch error:', err);
    error.value = (err as ApiError).message;
  } finally {
    loading.value = false;
  }
};

const handleRefresh = async (event: CustomEvent) => {
  await fetchCycles();
  event.detail.complete();
};

const handleCycleClick = (cycle: Cycle) => {
  // В реальном приложении здесь была бы навигация к деталям цикла
  console.log('Cycle clicked:', cycle);
};

const createCycle = () => {
  // В реальном приложении здесь была бы навигация к созданию цикла
  console.log('Create cycle');
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

onMounted(() => {
  fetchCycles();
});
</script>

<style scoped>
/* Minimal spacing for maximum screen usage */
.page-content {
  padding: 4px !important;
  margin: 0 !important;
  padding-top: 4px !important;
  padding-bottom: 80px !important; /* Add space for tab bar (60px) + extra margin */
}

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

.cycle-card:hover {
  transform: translateY(-2px);
}

.cycle-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.cycle-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--ion-text-color);
}

.cycle-status {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
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
  color: var(--ion-color-primary);
}

.empty-state h2 {
  margin: 0 0 8px 0;
  font-size: 1.5rem;
  color: var(--ion-text-color);
}

.empty-state p {
  margin: 0 0 24px 0;
  font-size: 1rem;
}

.modern-button {
  background: var(--ion-color-primary);
  color: white;
  border: none;
  border-radius: 12px;
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  justify-content: center;
}

.modern-button:hover {
  background: var(--ion-color-primary-shade);
  transform: translateY(-1px);
}

.modern-button i {
  font-size: 14px;
}

.empty-state h2 {
  margin: 0 0 8px 0;
  font-size: 1.5rem;
  color: var(--ion-text-color);
}

.empty-state p {
  margin: 0 0 24px 0;
  font-size: 1rem;
}
</style>
