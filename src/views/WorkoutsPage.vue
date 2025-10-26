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

      <PageContainer>
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

        <LoadingState v-if="loading" message="Загрузка тренировок..." />

        <div v-else-if="filteredWorkouts.length > 0">
          <div class="workouts-list card-list" :key="workoutsKey">
            <CustomCard
              v-for="workout in filteredWorkouts"
              :key="workout.id"
              clickable
              @click="handleWorkoutClick(workout)"
              @touchstart="handleWorkoutPressStart(workout)"
              @touchend="handleWorkoutPressEnd"
              @mousedown="handleWorkoutPressStart(workout)"
              @mouseup="handleWorkoutPressEnd"
              @mouseleave="handleWorkoutPressEnd"
              class="workout-card"
            >
              <div class="workout-header">
                <h3>{{ formatDate(workout.started_at) }}</h3>
                <CustomChip
                  :color="workout.finished_at ? 'success' : 'warning'"
                  size="small"
                >
                  {{ workout.finished_at ? 'Завершена' : 'Активна' }}
                </CustomChip>
              </div>
              
              <div class="workout-info">
                <p><strong>План:</strong> {{ workout.plan?.name || 'План не найден' }}</p>
              </div>
            </CustomCard>
          </div>
        </div>

        <EmptyState
          v-else
          icon="fas fa-dumbbell"
          :title="(dateFrom || dateTo) ? 'Тренировки не найдены' : 'Нет тренировок'"
          :message="(dateFrom || dateTo) ? 'Попробуйте изменить диапазон дат' : 'Начните свою первую тренировку!'"
          action-text="Начать тренировку"
          action-icon="fas fa-plus"
          :action-handler="() => $router.push('/select-plan')"
        />
      </PageContainer>
    </ion-content>

    <CustomToast
      :is-open="!!error"
      :message="error || ''"
      color="danger"
      @didDismiss="clearError"
    />

    <!-- Модальное окно действий с тренировкой -->
    <WorkoutActionModal
      :is-open="showActionModal"
      :workout="selectedWorkout || undefined"
      :is-deleting="isDeleting"
      @edit="handleActionEdit"
      @delete="handleActionDelete"
      @cancel="handleActionCancel"
    />

    <!-- Модальное окно подтверждения удаления -->
    <DeleteConfirmationModal
      :is-open="showDeleteModal"
      title="Удалить тренировку"
      message="Вы уверены, что хотите удалить эту тренировку?"
      :item-name="selectedWorkout?.plan?.name"
      warning-text="Это действие нельзя отменить."
      :is-deleting="isDeleting"
      @confirm="handleDeleteConfirm"
      @cancel="handleDeleteCancel"
    />
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, nextTick, onActivated, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
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
import WorkoutActionModal from '@/components/WorkoutActionModal.vue';
import DeleteConfirmationModal from '@/components/DeleteConfirmationModal.vue';
import LoadingState from '@/components/LoadingState.vue';
import EmptyState from '@/components/EmptyState.vue';
import PageContainer from '@/components/PageContainer.vue';
import VueDatePicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';
import apiClient from '@/services/api';
import { Workout, ApiError } from '@/types/api';

const router = useRouter();
const route = useRoute();
const workouts = ref<Workout[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const dateFrom = ref<Date | null>(null);
const dateTo = ref<Date | null>(null);
const workoutsKey = ref(0);
const isInitialized = ref(false);

// Переменные для долгого нажатия
const longPressTimer = ref<NodeJS.Timeout | null>(null);
const longPressDelay = 500; // 500ms для долгого нажатия
const isLongPressing = ref(false);

// Переменные для модальных окон
const showActionModal = ref(false);
const showDeleteModal = ref(false);
const selectedWorkout = ref<Workout | null>(null);
const isDeleting = ref(false);
const isUserCancelling = ref(false);
const isTransitioningToDelete = ref(false);
const isDeletionCompleted = ref(false);

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
    
    workouts.value = response.data.data || [];
    
    workouts.value = [...workouts.value];
    
    workoutsKey.value++;
    
    await nextTick();
    
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
  if (isLongPressing.value) {
    isLongPressing.value = false;
    return;
  }
  
  // Проверяем статус тренировки
  if (workout.finished_at === null) {
    // Активная тренировка - переходим на ActiveWorkoutPage
    router.push(`/workout/${workout.id}`);
  } else {
    // Завершенная тренировка - переходим на ViewWorkoutPage
    router.push(`/view-workout/${workout.id}`);
  }
};

// Функции для долгого нажатия
const handleWorkoutPressStart = (workout: Workout) => {
  isLongPressing.value = false;
  longPressTimer.value = setTimeout(() => {
    isLongPressing.value = true;
    selectedWorkout.value = workout;
    showActionModal.value = true;
  }, longPressDelay);
};

const handleWorkoutPressEnd = () => {
  if (longPressTimer.value) {
    clearTimeout(longPressTimer.value);
    longPressTimer.value = null;
  }
};

// Функции для модальных окон
const handleActionEdit = () => {
  showActionModal.value = false;
  if (selectedWorkout.value) {
    router.push(`/edit-workout/${selectedWorkout.value.id}`);
  }
};

const handleActionDelete = () => {
  isUserCancelling.value = false;
  isTransitioningToDelete.value = true;
  isDeletionCompleted.value = false;
  
  showActionModal.value = false;
  showDeleteModal.value = true;
  
};

const handleActionCancel = () => {
  if (isTransitioningToDelete.value) {
    isTransitioningToDelete.value = false;
    return;
  }
  
  showActionModal.value = false;
  selectedWorkout.value = null;
};

const handleDeleteConfirm = async () => {
  if (!selectedWorkout.value) {
    console.error('No workout selected for deletion');
    return;
  }
  
  if (isUserCancelling.value) {
    return;
  }
  
  
  isDeleting.value = true;
  try {
    const response = await apiClient.delete(`/api/v1/workouts/${selectedWorkout.value.id}`);
    
    // Обновляем список
    await fetchWorkouts();
    
    // Закрываем модальные окна
    showDeleteModal.value = false;
    selectedWorkout.value = null;
    isUserCancelling.value = false;
    isTransitioningToDelete.value = false;
    isDeletionCompleted.value = true;
    
  } catch (err) {
    console.error('❌ Delete workout error:', err);
    console.error('❌ Error details:', {
      message: (err as ApiError).message,
      errors: (err as ApiError).errors,
      status: (err as any).response?.status,
      statusText: (err as any).response?.statusText,
      data: (err as any).response?.data
    });
    error.value = (err as ApiError).message;
  } finally {
    isDeleting.value = false;
    isUserCancelling.value = false;
    isTransitioningToDelete.value = false;
    isDeletionCompleted.value = false;
  }
};

const handleDeleteCancel = () => {
  
  if (isDeletionCompleted.value) {
    isDeletionCompleted.value = false;
    return;
  }
  
  isUserCancelling.value = true;
  showDeleteModal.value = false;
  selectedWorkout.value = null;
  isTransitioningToDelete.value = false;
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
  fetchWorkouts();
};

// Обновляем список тренировок при возврате на страницу
onActivated(async () => {
  if (!isInitialized.value) {
    return;
  }
  
  // Ждем следующий тик, чтобы убедиться, что компонент готов
  await nextTick();
  
  fetchWorkouts();
});

// Экспортируем для тестирования в консоли браузера
(window as any).testFetchWorkouts = fetchWorkouts;
(window as any).workouts = workouts;

onMounted(async () => {
  await fetchWorkouts();
  isInitialized.value = true;
});

// Дополнительно отслеживаем изменения роутера для надежности
watch(() => route.path, (newPath) => {
  if (newPath === '/tabs/workouts' && isInitialized.value) {
    fetchWorkouts();
  }
});
</script>

<style scoped>

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

/* State styles now handled by utility classes */
</style>
