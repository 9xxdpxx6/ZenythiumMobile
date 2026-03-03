<template>
  <ion-page>
    <PageHeader title="Тренировки" />

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

        <div v-else-if="allWorkouts.length > 0">
          <div class="workouts-list card-list">
            <WorkoutCard
              v-for="workout in allWorkouts"
              :key="workout.id"
              :workout="workout"
              @click="handleWorkoutClick"
              @press-start="handleWorkoutPressStart"
              @press-end="handleWorkoutPressEnd"
            />
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

      <ion-infinite-scroll
        @ionInfinite="handleInfiniteScroll"
        :disabled="!hasMorePages"
      >
        <ion-infinite-scroll-content
          loading-text="Загрузка тренировок..."
          loading-spinner="crescent"
        />
      </ion-infinite-scroll>
    </ion-content>

    <CustomToast
      :is-open="!!error"
      :message="error || ''"
      color="danger"
      @didDismiss="clearError"
    />

    <!-- Модальное окно действий с тренировкой -->
    <WorkoutActionModal
      :is-open="actionModal.isOpen.value"
      :workout="actionModal.data.value || undefined"
      :is-deleting="isDeleting"
      @edit="handleActionEdit"
      @delete="handleActionDelete"
      @cancel="handleActionCancel"
    />

    <!-- Модальное окно подтверждения удаления -->
    <DeleteConfirmationModal
      :is-open="deleteModal.isOpen.value"
      title="Удалить тренировку"
      message="Вы уверены, что хотите удалить эту тренировку?"
      :item-name="deleteModal.data.value?.plan?.name"
      warning-text="Это действие нельзя отменить."
      :is-deleting="isDeleting"
      @confirm="handleDeleteConfirm"
      @cancel="handleDeleteCancel"
    />
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage,
  IonContent,
  IonRefresher,
  IonRefresherContent,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
} from '@ionic/vue';
import { useToast, useModal } from '@/composables';
import { workoutsService } from '@/services';
import type { Workout } from '@/types/models/workout.types';
import type { ApiPaginationMeta } from '@/types/common/pagination.types';
import CustomButton from '@/components/ui/CustomButton.vue';
import CustomToast from '@/components/ui/CustomToast.vue';
import WorkoutActionModal from '@/components/modals/WorkoutActionModal.vue';
import DeleteConfirmationModal from '@/components/modals/DeleteConfirmationModal.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import LoadingState from '@/components/ui/LoadingState.vue';
import EmptyState from '@/components/ui/EmptyState.vue';
import PageContainer from '@/components/ui/PageContainer.vue';
import WorkoutCard from '@/components/cards/WorkoutCard.vue';
import VueDatePicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';
import { errorHandler } from '@/utils/error-handler';

const router = useRouter();
const dateFrom = ref<Date | null>(null);
const dateTo = ref<Date | null>(null);

// Pagination state
const PER_PAGE = 20;
const currentPage = ref(1);
const allWorkouts = ref<Workout[]>([]);
const paginationMeta = ref<ApiPaginationMeta | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);

const hasMorePages = computed(() => {
  if (!paginationMeta.value) return false;
  return paginationMeta.value.current_page < paginationMeta.value.last_page;
});

/**
 * Build filters for the current date range
 */
const buildFilters = (page: number): Record<string, any> => {
  const filters: Record<string, any> = {
    page,
    per_page: PER_PAGE,
    sort_by: 'started_at',
    sort_order: 'desc',
  };
  if (dateFrom.value) {
    const dateFromWithTime = new Date(dateFrom.value);
    dateFromWithTime.setHours(0, 0, 0, 0);
    filters.started_at_from = dateFromWithTime.toISOString();
  }
  if (dateTo.value) {
    const dateToWithTime = new Date(dateTo.value);
    dateToWithTime.setHours(23, 59, 59, 999);
    filters.started_at_to = dateToWithTime.toISOString();
  }
  return filters;
};

/**
 * Fetch workouts page (replaces list on page=1, appends otherwise)
 */
const fetchWorkouts = async (page: number = 1): Promise<void> => {
  loading.value = page === 1;
  error.value = null;

  try {
    const filters = buildFilters(page);
    const result = await workoutsService.getPaginated(filters);

    if (page === 1) {
      allWorkouts.value = result.data;
    } else {
      allWorkouts.value = [...allWorkouts.value, ...result.data];
    }

    paginationMeta.value = result.meta;
    currentPage.value = result.meta.current_page;
  } catch (err) {
    error.value = errorHandler.format(err);
    errorHandler.log(err, 'WorkoutsPage.fetchWorkouts');
  } finally {
    loading.value = false;
  }
};

const { showError, showSuccess } = useToast();

// Variables for long press
const longPressTimer = ref<NodeJS.Timeout | null>(null);
const longPressDelay = 500;
const isLongPressing = ref(false);

// Modal variables
const actionModal = useModal<any>();
const deleteModal = useModal<any>();
const isDeleting = ref(false);

const handleRefresh = async (event: CustomEvent) => {
  currentPage.value = 1;
  await fetchWorkouts(1);
  event.detail.complete();
};

/**
 * Infinite scroll handler — load next page
 */
const handleInfiniteScroll = async (event: CustomEvent) => {
  if (!hasMorePages.value) {
    (event.target as any)?.complete();
    return;
  }
  await fetchWorkouts(currentPage.value + 1);
  (event.target as any)?.complete();
};

const handleWorkoutClick = (workout: any) => {
  if (!workout || isLongPressing.value) {
    if (isLongPressing.value) isLongPressing.value = false;
    return;
  }
  const finishedAt = (workout as any).finished_at || (workout as any).completedAt;
  const route = finishedAt === null || !finishedAt ? `/workout/${(workout as any).id}` : `/view-workout/${(workout as any).id}`;
  router.push(route);
};

const handleWorkoutPressStart = (workout: any) => {
  isLongPressing.value = false;
  longPressTimer.value = setTimeout(() => {
    isLongPressing.value = true;
    actionModal.open(workout);
  }, longPressDelay);
};

const handleWorkoutPressEnd = () => {
  if (longPressTimer.value) {
    clearTimeout(longPressTimer.value);
    longPressTimer.value = null;
  }
};

const handleActionEdit = () => {
  actionModal.close();
  if (actionModal.data.value) {
    router.push(`/edit-workout/${actionModal.data.value.id}`);
  }
};

const handleActionDelete = () => {
  actionModal.close();
  if (actionModal.data.value) {
    deleteModal.open(actionModal.data.value);
  }
};

const handleActionCancel = () => {
  actionModal.close();
};

const handleDeleteConfirm = async () => {
  if (!deleteModal.data.value) return;
  isDeleting.value = true;
  try {
    await workoutsService.delete(deleteModal.data.value.id.toString());
    // Перезагружаем первую страницу после удаления
    await fetchWorkouts(1);
    await showSuccess('Тренировка удалена');
    deleteModal.close();
  } catch (err) {
    await showError('Не удалось удалить тренировку');
  } finally {
    isDeleting.value = false;
  }
};

const handleDeleteCancel = () => {
  deleteModal.close();
};

const clearError = () => {
  error.value = null;
};

const handleDateFilterChange = () => {
  // Сбрасываем на первую страницу при изменении фильтров
  fetchWorkouts(1);
};

// Debounced handler — multiple events can fire near-simultaneously
let externalRefreshTimer: NodeJS.Timeout | null = null;
const handleExternalRefresh = () => {
  if (externalRefreshTimer) clearTimeout(externalRefreshTimer);
  externalRefreshTimer = setTimeout(() => {
    fetchWorkouts(1);
  }, 300);
};

onMounted(() => {
  fetchWorkouts(1);
  window.addEventListener('workout-started', handleExternalRefresh as EventListener);
  window.addEventListener('workout-finished', handleExternalRefresh as EventListener);
});

onUnmounted(() => {
  if (externalRefreshTimer) clearTimeout(externalRefreshTimer);
  window.removeEventListener('workout-started', handleExternalRefresh as EventListener);
  window.removeEventListener('workout-finished', handleExternalRefresh as EventListener);
});
</script>

<style scoped>

/* Фиксированная кнопка внизу экрана */
.fixed-bottom-action {
  position: fixed;
  bottom: 60px; /* Высота табс бара */
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
  padding-bottom: 100px; /* Отступ для фиксированной кнопки (60px табс бар + 40px кнопка с padding) */
}

/* Отступ для EmptyState, чтобы не перекрывался кнопкой */
:deep(.empty-state) {
  padding-bottom: 100px;
}
</style>
