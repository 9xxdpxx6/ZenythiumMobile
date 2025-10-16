<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>Тренировки</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-refresher slot="fixed" @ionRefresh="handleRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <div class="page-content">
        <h1 class="page-title">История тренировок</h1>
        <p class="page-subtitle">Управляйте своими тренировками</p>
        
        <!-- Фильтр по датам -->
        <div class="date-filters">
          <div class="date-filter-group">
            <VueDatePicker
              v-model="dateFrom"
              format="dd.MM.yyyy"
              placeholder="Дата с"
              :enable-time-picker="false"
              auto-apply
              :dark="true"
              locale="ru"
              :week-start="1"
              :month-name-format="'long'"
              :year-range="[2020, 2030]"
              @update:model-value="handleDateFilterChange"
            />
          </div>
          
          <div class="date-filter-group">
            <VueDatePicker
              v-model="dateTo"
              format="dd.MM.yyyy"
              placeholder="Дата по"
              :enable-time-picker="false"
              auto-apply
              :dark="true"
              :min-date="dateFrom || undefined"
              locale="ru"
              :week-start="1"
              :month-name-format="'long'"
              :year-range="[2020, 2030]"
              @update:model-value="handleDateFilterChange"
            />
          </div>
        </div>
        
        <!-- Фиксированная кнопка внизу экрана -->
        <div class="fixed-bottom-action">
          <CustomButton
            expand
            @click="$router.push('/select-plan')"
            size="large"
            icon="fas fa-plus"
          >
            Начать тренировку
          </CustomButton>
        </div>

        <div v-if="loading" class="loading-state">
          <ion-spinner name="crescent"></ion-spinner>
          <p>Загрузка тренировок...</p>
        </div>

        <div v-else-if="filteredWorkouts.length > 0">
          <div class="workouts-list">
            <CustomCard
              v-for="workout in filteredWorkouts"
              :key="workout.id"
              clickable
              @click="handleWorkoutClick(workout)"
              class="workout-card"
            >
              <div class="workout-header">
                <h3>{{ formatDate(workout.started_at) }}</h3>
                <CustomChip
                  :color="workout.status === 'active' ? 'warning' : 'success'"
                  size="small"
                >
                  {{ workout.status === 'active' ? 'Активна' : 'Завершена' }}
                </CustomChip>
              </div>
              
              <div class="workout-info">
                <p><strong>План:</strong> {{ workout.plan?.name || 'План не найден' }}</p>
                <div class="workout-status-icon">
                  <i :class="workout.status === 'active' ? 'fas fa-play' : 'fas fa-check-circle'"></i>
                </div>
              </div>
            </CustomCard>
          </div>
        </div>

        <div v-else class="empty-state">
          <i class="fas fa-dumbbell empty-icon"></i>
          <h2>{{ (dateFrom || dateTo) ? 'Тренировки не найдены' : 'Нет тренировок' }}</h2>
          <p>{{ (dateFrom || dateTo) ? 'Попробуйте изменить диапазон дат' : 'Начните свою первую тренировку!' }}</p>
          <CustomButton
            @click="$router.push('/select-plan')"
            class="modern-button"
            icon="fas fa-plus"
          >
            Начать тренировку
          </CustomButton>
        </div>
      </div>
    </ion-content>

    <CustomToast
      :is-open="!!error"
      :message="error || ''"
      color="danger"
      @didDismiss="clearError"
    />
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
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
import CustomButton from '@/components/CustomButton.vue';
import CustomCard from '@/components/CustomCard.vue';
import CustomChip from '@/components/CustomChip.vue';
import CustomToast from '@/components/CustomToast.vue';
import VueDatePicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';
import apiClient from '@/services/api';
import { Workout, ApiError } from '@/types/api';

const router = useRouter();
const workouts = ref<Workout[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const dateFrom = ref<Date | null>(null);
const dateTo = ref<Date | null>(null);

// Все тренировки (фильтрация теперь происходит на сервере)
const filteredWorkouts = computed(() => workouts.value);

const fetchWorkouts = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    const params: Record<string, string> = {};
    
    // Добавляем параметры фильтрации по датам
    if (dateFrom.value) {
      // Для даты "с" устанавливаем время 00:00:00
      const dateFromWithTime = new Date(dateFrom.value);
      dateFromWithTime.setHours(0, 0, 0, 0);
      params.started_at_from = dateFromWithTime.toISOString();
    }
    if (dateTo.value) {
      // Для даты "по" устанавливаем время 23:59:59
      const dateToWithTime = new Date(dateTo.value);
      dateToWithTime.setHours(23, 59, 59, 999);
      params.started_at_to = dateToWithTime.toISOString();
    }
    
    const response = await apiClient.get('/api/v1/workouts', { params });
    // API может возвращать данные в разных форматах
    workouts.value = response.data.data || [];
  } catch (err) {
    console.error('Workouts fetch error:', err);
    error.value = (err as ApiError).message;
  } finally {
    loading.value = false;
  }
};

const handleRefresh = async (event: CustomEvent) => {
  await fetchWorkouts();
  event.detail.complete();
};

const handleWorkoutClick = (workout: Workout) => {
  if (workout.status === 'active') {
    router.push(`/workout/${workout.id}`);
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const clearError = () => {
  error.value = null;
};

// Функции фильтрации по датам
const handleDateFilterChange = () => {
  // Вызываем fetchWorkouts при изменении дат для получения отфильтрованных данных с сервера
  fetchWorkouts();
};

onMounted(() => {
  fetchWorkouts();
});
</script>

<style scoped>
/* Balanced layout with increased spacing - same as original WorkoutsPage */
.page-content {
  padding: 20px !important;
  margin: 0 !important;
  padding-top: 6px !important;
  padding-bottom: 150px !important; /* Add space for fixed button + tab bar */
}

.page-title {
  padding-left: 0 !important;
  margin: 0 0 4px 0;
  font-size: 1.5rem;
  color: var(--ion-text-color);
  font-weight: 600;
}

.page-subtitle {
  padding-left: 0 !important;
  margin: 0 0 8px 0;
  font-size: 1rem;
  color: var(--ion-color-medium);
}

/* Фиксированная кнопка внизу экрана */
.fixed-bottom-action {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 10;
  padding: 16px 20px; 
  background: transparent;
}

/* Стили для фильтра по датам */
.date-filters {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.date-filter-group {
  flex: 1;
}

/* Vue Datepicker стили */
:deep(.dp__input_wrap) {
  position: relative !important;
  display: flex !important;
  align-items: center !important;
}

:deep(.dp__input) {
  background: rgba(255, 255, 255, 0.05) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  border-radius: 12px !important;
  color: var(--ion-text-color) !important;
  padding: 12px 40px 12px 40px !important;
  height: 48px !important;
  font-size: 16px !important;
  width: 100% !important;
  box-sizing: border-box !important;
}

:deep(.dp__input::placeholder) {
  color: var(--ion-color-medium) !important;
}

:deep(.dp__input:focus) {
  border-color: var(--ion-color-primary) !important;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2) !important;
}

/* Иконки */
:deep(.dp__input_icon) {
  position: absolute !important;
  left: 6px !important;
  top: 50% !important;
  transform: translateY(-50%) !important;
  z-index: 2 !important;
  pointer-events: none !important;
}

:deep(.dp__input_clear) {
  position: absolute !important;
  right: 12px !important;
  top: 50% !important;
  transform: translateY(-50%) !important;
  z-index: 2 !important;
}

:deep(.dp__menu) {
  background: var(--ion-background-color) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  border-radius: 12px !important;
}

:deep(.dp__calendar_header) {
  background: var(--ion-background-color) !important;
}

:deep(.dp__calendar_header_item) {
  color: var(--ion-text-color) !important;
}

:deep(.dp__calendar_item) {
  color: var(--ion-text-color) !important;
}

:deep(.dp__calendar_item:hover) {
  background: rgba(255, 255, 255, 0.1) !important;
}

:deep(.dp__date_hover) {
  background: rgba(255, 255, 255, 0.1) !important;
}

:deep(.dp__date_selected) {
  background: var(--ion-color-primary) !important;
  color: white !important;
}

.workouts-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.workout-card {
  padding: 20px !important;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.workout-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
  gap: 12px;
}

.workout-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--ion-text-color);
  flex: 1;
  line-height: 1.3;
}

.workout-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.workout-info p {
  margin: 0;
  font-size: 14px;
  color: var(--ion-color-medium);
}

.workout-info strong {
  color: var(--ion-text-color);
}

.workout-status-icon {
  color: var(--ion-color-primary);
  font-size: 18px;
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
}

.modern-button i {
  font-size: 14px;
}
</style>
