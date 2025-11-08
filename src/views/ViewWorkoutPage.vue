<template>
  <BasePage>
    <PageHeader title="Тренировка" show-back-button default-back-href="/tabs/workouts">
      <template #end>
        <div class="workout-status-header">
          <CustomChip 
            :color="workout?.finished_at ? 'success' : 'warning'"
            size="small"
            class="status-chip"
          >
            {{ workout?.finished_at ? 'Завершена' : 'Активна' }}
          </CustomChip>
        </div>
      </template>
    </PageHeader>

    <ion-content :fullscreen="true">
      <PageContainer>
        <LoadingState v-if="loading" message="Загрузка тренировки..." />

        <div v-else-if="error" class="error-state">
          <i class="fas fa-exclamation-triangle error-icon"></i>
          <h2>Ошибка загрузки</h2>
          <p>{{ error }}</p>
          <CustomButton @click="fetchWorkout" class="retry-button">
            Попробовать снова
          </CustomButton>
        </div>

        <div v-else-if="workout" class="workout-details">
          <WorkoutSummary
            :workout-name="workout.plan.name"
            :start-date-time="formatDateTime(workout.started_at)"
            :end-date-time="workout.finished_at ? formatDateTime(workout.finished_at) : undefined"
            :duration-minutes="workout.duration_minutes"
            :exercise-count="workout.exercise_count"
            :total-volume="workout.total_volume"
          />

          <WorkoutExerciseHistory
            :exercises="workout.exercises"
            :current-workout-id="Number(workoutId)"
            :group-and-format-sets="groupAndFormatSets"
            :format-weight="formatWeight"
            :format-date="formatDate"
          />
        
        <!-- Кнопки действий в конце страницы -->
        <div class="bottom-actions">
          <CustomButton
            @click="handleEditWithRouter"
            variant="outline"
            color="warning"
            class="action-button edit-button"
            icon="fas fa-edit"
          >
            Редактировать
          </CustomButton>
          
          <CustomButton
            @click="handleDelete"
            variant="outline"
            color="danger"
            class="action-button delete-button"
            icon="fas fa-trash"
          >
            Удалить
          </CustomButton>
        </div>
      </div>
      </PageContainer>
    </ion-content>


    <CustomToast
      :is-open="!!toastMessage"
      :message="toastMessage || ''"
      :color="toastColor"
      @didDismiss="clearToast"
    />

    <!-- Модальное окно подтверждения удаления -->
    <DeleteConfirmationModal
      :is-open="showDeleteModal"
      title="Удалить тренировку"
      message="Вы уверены, что хотите удалить эту тренировку?"
      :item-name="workout?.plan?.name"
      warning-text="Это действие нельзя отменить."
      :is-deleting="isDeleting"
      @confirm="handleDeleteConfirmWithRouter"
      @cancel="handleDeleteCancel"
    />
  </BasePage>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  IonPage,
  IonContent,
  IonSpinner,
} from '@ionic/vue';
import CustomButton from '@/components/ui/CustomButton.vue';
import CustomChip from '@/components/ui/CustomChip.vue';
import CustomToast from '@/components/ui/CustomToast.vue';
import DeleteConfirmationModal from '@/components/modals/DeleteConfirmationModal.vue';
import PageContainer from '@/components/ui/PageContainer.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import LoadingState from '@/components/ui/LoadingState.vue';
import WorkoutSummary from '@/components/workout/WorkoutSummary.vue';
import WorkoutExerciseHistory from '@/components/workout/WorkoutExerciseHistory.vue';
import { useViewWorkout } from '@/composables/useViewWorkout';
import type { DetailedWorkout } from '@/types/api';

const route = useRoute();
const router = useRouter();
const workoutId = route.params.id as string;

// Swipe back is handled automatically by BasePage

const {
  workout,
  loading,
  error,
  toastMessage,
  toastColor,
  showDeleteModal,
  isDeleting,
  fetchWorkout,
  formatDateTime,
  formatDate,
  formatDuration,
  formatWeight,
  groupAndFormatSets,
  getSortedHistory,
  isCurrentWorkout,
  clearToast,
  handleEdit,
  handleDelete,
  handleDeleteConfirm,
  handleDeleteCancel,
} = useViewWorkout(workoutId);

const handleEditWithRouter = () => {
  if (workout.value) {
    router.push(handleEdit(workout.value.id));
  }
};

const handleDeleteConfirmWithRouter = async () => {
  const success = await handleDeleteConfirm();
  if (success) {
    setTimeout(() => {
      router.push('/tabs/workouts');
    }, 1500);
  }
};

const getSortedHistoryWithId = (history: any[]) => {
  return getSortedHistory(history, Number(workoutId));
};

const isCurrentWorkoutWithId = (historyItem: any) => {
  return isCurrentWorkout(historyItem, Number(workoutId));
};

onMounted(() => {
  fetchWorkout();
});
</script>

<style scoped>
.workout-details {
  padding: 0;
}

.workout-header {
  margin-bottom: 24px;
}

.workout-title {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--ion-text-color);
  line-height: 1.2;
}

.workout-status-header {
  display: flex;
  align-items: center;
  padding-right: 16px;
}

.section-title {
  margin: 0 0 16px 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--ion-text-color);
}

.workout-info-section {
  margin-bottom: 32px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.stats-grid {
  display: grid;
  gap: 16px;
}

.stats-grid-2 {
  grid-template-columns: repeat(2, 1fr);
}

.stats-grid-3 {
  grid-template-columns: repeat(3, 1fr);
}

.info-item {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 16px;
}

.info-label {
  font-size: 0.875rem;
  color: var(--ion-color-medium);
  margin-bottom: 4px;
}

.info-value {
  font-size: 1rem;
  font-weight: 600;
  color: var(--ion-text-color);
}

.stats-item {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 12px;
  text-align: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.stats-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--ion-text-color);
  margin-bottom: 4px;
}

.stats-label {
  font-size: 0.875rem;
  color: var(--ion-color-medium);
  text-align: center;
}

.exercises-section {
  margin-bottom: 32px;
}

.exercises-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.exercise-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 20px;
}

.exercise-header {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 12px;
}

.exercise-number {
  background: var(--ion-color-primary);
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.875rem;
  flex-shrink: 0;
}

.exercise-info {
  flex: 1;
}

.exercise-name {
  margin: 0 0 4px 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--ion-text-color);
}

.exercise-muscle-group {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.875rem;
  color: var(--ion-color-medium);
}

.exercise-muscle-group i {
  font-size: 0.75rem;
}

.exercise-description {
  margin-bottom: 16px;
  font-size: 0.875rem;
  color: var(--ion-color-medium);
  line-height: 1.4;
}

.exercise-history {
  margin-top: 16px;
}

.history-title {
  margin: 0 0 12px 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--ion-text-color);
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.history-item {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 16px;
}

.history-item.current-workout {
  background: rgba(99, 102, 241, 0.1);
  border: 1px solid rgba(99, 102, 241, 0.3);
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.history-date {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--ion-text-color);
}

.history-sets-count {
  font-size: 0.75rem;
  color: var(--ion-color-medium);
  background: rgba(255, 255, 255, 0.1);
  padding: 4px 8px;
  border-radius: 6px;
}

.sets-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.set-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.set-fraction {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.1);
  padding: 6px 12px;
  border-radius: 8px;
}

/* vertical-fraction, numerator, denominator, multiplier, simple-reps now in utilities.css */

.no-history {
  text-align: center;
  padding: 20px;
  color: var(--ion-color-medium);
}

.empty-exercises {
  text-align: center;
  padding: 40px 20px;
  color: var(--ion-color-medium);
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 16px;
  color: var(--ion-color-primary);
}

.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
  color: var(--ion-color-medium);
  min-height: 50vh;
}

.error-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  color: var(--ion-color-danger);
}

.error-state h2 {
  margin: 0 0 8px 0;
  font-size: 1.5rem;
  color: var(--ion-text-color);
}

.error-state p {
  margin: 0 0 24px 0;
  font-size: 1rem;
}

.retry-button {
  background: var(--ion-color-primary);
  color: white;
  border: none;
  border-radius: 12px;
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: none;
}

.retry-button:hover { opacity: 1; }

/* Кнопки действий в конце страницы */
.bottom-actions {
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 24px;
}

.action-button {
  width: 100%;
}

@media (max-width: 768px) {
  .workout-details {
    padding: 0;
  }
  
  .bottom-actions {
    padding: 0;
    gap: 8px;
    margin-top: 20px;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
  }
  
  .stats-grid-2 {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  
  .stats-grid-3 {
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }
  
  .stats-item {
    padding: 10px;
  }
  
  .stats-value {
    font-size: 1.25rem;
  }
  
  .stats-label {
    font-size: 0.8rem;
  }
  
  .exercise-header {
    gap: 12px;
  }
  
  .exercise-number {
    width: 28px;
    height: 28px;
    font-size: 0.75rem;
  }
  
  .exercise-name {
    font-size: 1rem;
  }
  
  .sets-list {
    gap: 6px;
  }
  
  .set-fraction {
    padding: 4px 8px;
  }
}
</style>
