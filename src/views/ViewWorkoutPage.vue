<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/tabs/workouts"></ion-back-button>
        </ion-buttons>
        <ion-title>Тренировка</ion-title>
        <div slot="end" class="workout-status-header">
          <CustomChip 
            :color="workout?.finished_at ? 'success' : 'warning'"
            size="small"
            class="status-chip"
          >
            {{ workout?.finished_at ? 'Завершена' : 'Активна' }}
          </CustomChip>
        </div>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <div v-if="loading" class="loading-state">
        <ion-spinner name="crescent"></ion-spinner>
        <p>Загрузка тренировки...</p>
      </div>

      <div v-else-if="error" class="error-state">
        <i class="fas fa-exclamation-triangle error-icon"></i>
        <h2>Ошибка загрузки</h2>
        <p>{{ error }}</p>
        <CustomButton @click="fetchWorkout" class="retry-button">
          Попробовать снова
        </CustomButton>
      </div>

      <div v-else-if="workout" class="workout-details">
        <!-- Заголовок тренировки -->
        <div class="workout-header">
          <h1 class="workout-title">{{ workout.plan.name }}</h1>
        </div>

        <!-- Основная информация -->
        <div class="workout-info-section">
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Дата начала</div>
              <div class="info-value">{{ formatDateTime(workout.started_at) }}</div>
            </div>
            
            <div v-if="workout.finished_at" class="info-item">
              <div class="info-label">Дата окончания</div>
              <div class="info-value">{{ formatDateTime(workout.finished_at) }}</div>
            </div>
          </div>
          
          <!-- Статистика в блоках -->
          <div :class="workout.finished_at ? 'stats-grid stats-grid-3' : 'stats-grid stats-grid-2'">
            <div v-if="workout.finished_at && workout.duration_minutes && workout.duration_minutes > 0" class="stats-item">
              <div class="stats-value">{{ formatDuration(workout.duration_minutes) }}</div>
              <div class="stats-label">Длительность</div>
            </div>
            
            <div class="stats-item">
              <div class="stats-value">{{ workout.exercise_count || 0 }}</div>
              <div class="stats-label">Упражнений</div>
            </div>
            
            <div v-if="workout.total_volume && workout.total_volume > 0" class="stats-item">
              <div class="stats-value">{{ formatWeight(workout.total_volume) }} кг</div>
              <div class="stats-label">Объем</div>
            </div>
          </div>
        </div>

        <!-- Упражнения -->
        <div class="exercises-section">
          <h2 class="section-title">Упражнения</h2>
          
          <div v-if="!workout.exercises || workout.exercises.length === 0" class="empty-exercises">
            <i class="fas fa-dumbbell empty-icon"></i>
            <p>Упражнения не найдены</p>
          </div>
          
          <div v-else class="exercises-list">
            <div 
              v-for="(exercise, index) in workout.exercises" 
              :key="exercise.id"
              class="exercise-card"
            >
              <div class="exercise-header">
                <div class="exercise-number">{{ exercise.order }}</div>
                <div class="exercise-info">
                  <h3 class="exercise-name">{{ exercise.exercise.name }}</h3>
                  <div class="exercise-muscle-group">
                    <i class="fas fa-dumbbell"></i>
                    {{ exercise.exercise.muscle_group.name }}
                  </div>
                </div>
              </div>
              
              <div v-if="exercise.exercise.description" class="exercise-description">
                {{ exercise.exercise.description }}
              </div>
              
              <!-- История выполнения -->
              <div class="exercise-history">
                <h4 class="history-title">История выполнения</h4>
                
                <div v-if="!exercise.history || exercise.history.length === 0" class="no-history">
                  <p>Нет данных о выполнении</p>
                </div>
                
                 <div v-else class="history-list">
                   <div 
                     v-for="(historyItem, historyIndex) in getSortedHistory(exercise.history)" 
                     :key="historyItem.workout_id"
                     class="history-item"
                     :class="{ 'current-workout': isCurrentWorkout(historyItem) }"
                   >
                    <div class="history-header">
                      <div class="history-date">
                        {{ historyItem.workout_date ? formatDate(historyItem.workout_date) : 'Текущая тренировка' }}
                      </div>
                      <div class="history-sets-count">
                        {{ historyItem.sets.length }} подходов
                      </div>
                    </div>
                    
                    <div class="sets-list">
                      <div 
                        v-for="(groupedSet, setIndex) in groupAndFormatSets(historyItem.sets)"
                        :key="`${groupedSet.weight}-${groupedSet.reps}-${groupedSet.count}`"
                        class="set-item"
                      >
                        <div class="set-fraction">
                          <div v-if="groupedSet.isSimple" class="simple-reps">
                            {{ groupedSet.reps }}<span v-if="groupedSet.count > 1"> × {{ groupedSet.count }}</span>
                          </div>
                          <div v-else class="vertical-fraction">
                            <div class="numerator">{{ formatWeight(groupedSet.weight) }}</div>
                            <div class="denominator">{{ groupedSet.reps }}</div>
                          </div>
                          <span v-if="!groupedSet.isSimple && groupedSet.count > 1" class="multiplier">× {{ groupedSet.count }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Кнопки действий в конце страницы -->
        <div class="bottom-actions">
          <CustomButton
            @click="handleEdit"
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
      @confirm="handleDeleteConfirm"
      @cancel="handleDeleteCancel"
    />
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonSpinner,
  IonBackButton,
  IonButtons,
} from '@ionic/vue';
import CustomButton from '@/components/CustomButton.vue';
import CustomChip from '@/components/CustomChip.vue';
import CustomToast from '@/components/CustomToast.vue';
import DeleteConfirmationModal from '@/components/DeleteConfirmationModal.vue';
import apiClient from '@/services/api';
import { DetailedWorkout, ApiError } from '@/types/api';

const route = useRoute();
const router = useRouter();
const workout = ref<DetailedWorkout | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);
const toastMessage = ref<string | null>(null);
const toastColor = ref<'success' | 'danger' | 'warning'>('danger');

// Переменные для модального окна удаления
const showDeleteModal = ref(false);
const isDeleting = ref(false);

const fetchWorkout = async () => {
  const workoutId = route.params.id as string;
  
  console.log('Fetching workout with ID:', workoutId);
  
  if (!workoutId) {
    error.value = 'ID тренировки не найден';
    return;
  }

  loading.value = true;
  error.value = null;
  
  try {
    console.log('Making API request to:', `/api/v1/workouts/${workoutId}`);
    const response = await apiClient.get(`/api/v1/workouts/${workoutId}`);
    console.log('API Response:', response.data);
    
    // Проверяем структуру ответа
    if (response.data && response.data.data) {
      workout.value = response.data.data;
      console.log('Workout data set:', workout.value);
    } else {
      console.error('Unexpected API response structure:', response.data);
      error.value = 'Неожиданная структура ответа API';
    }
  } catch (err) {
    console.error('Workout fetch error:', err);
    console.error('Error details:', {
      message: (err as ApiError).message,
      status: (err as any).response?.status,
      statusText: (err as any).response?.statusText,
      data: (err as any).response?.data
    });
    error.value = (err as ApiError).message || 'Ошибка загрузки тренировки';
  } finally {
    loading.value = false;
    console.log('Loading completed, loading.value:', loading.value);
  }
};

const formatDateTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

const formatDuration = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours > 0) {
    return `${hours}ч ${mins}м`;
  }
  return `${mins}м`;
};

const formatWeight = (weight: number | null | undefined) => {
  if (weight === null || weight === undefined || isNaN(weight)) {
    return '0';
  }
  return Math.round(Number(weight)).toString();
};

interface GroupedSet {
  weight: number;
  reps: number;
  count: number;
  isSimple: boolean;
}

const groupAndFormatSets = (sets: any[]): GroupedSet[] => {
  if (!sets || sets.length === 0) return [];
  
  // Группируем подходы по весу и повторениям
  const grouped = sets.reduce((acc, set) => {
    const key = `${set.weight}x${set.reps}`;
    if (!acc[key]) {
      acc[key] = {
        weight: set.weight,
        reps: set.reps,
        count: 0
      };
    }
    acc[key].count++;
    return acc;
  }, {} as Record<string, { weight: number; reps: number; count: number }>);
  
  // Преобразуем в массив и добавляем поле isSimple
  return Object.values(grouped).map((group) => {
    const typedGroup = group as { weight: number; reps: number; count: number };
    const isSimple = Number(typedGroup.weight) === 0;
    
    console.log('🔍 ViewWorkoutPage: Processing set:', {
      weight: typedGroup.weight,
      weightType: typeof typedGroup.weight,
      reps: typedGroup.reps,
      count: typedGroup.count,
      isSimple: isSimple
    });
    
    return {
      weight: typedGroup.weight,
      reps: typedGroup.reps,
      count: typedGroup.count,
      isSimple: isSimple
    };
  });
};

const getSortedHistory = (history: any[]) => {
  if (!history) return [];
  
  const currentWorkoutId = Number(route.params.id);
  
  // Сортируем от новых к старым (по дате убывания)
  return [...history].sort((a, b) => {
    // Текущая тренировка (по workout_id) всегда сверху
    if (a.workout_id === currentWorkoutId && b.workout_id !== currentWorkoutId) return -1;
    if (a.workout_id !== currentWorkoutId && b.workout_id === currentWorkoutId) return 1;
    if (a.workout_id === currentWorkoutId && b.workout_id === currentWorkoutId) return 0;
    
    // Сортируем по дате убывания
    return new Date(b.workout_date).getTime() - new Date(a.workout_date).getTime();
  });
};

const isCurrentWorkout = (historyItem: any) => {
  // Сравниваем workout_id с ID открытой тренировки
  return historyItem.workout_id === Number(route.params.id);
};

const clearToast = () => {
  toastMessage.value = null;
};

// Функции обработки кнопок
const handleEdit = () => {
  if (workout.value) {
    router.push(`/edit-workout/${workout.value.id}`);
  }
};

const handleDelete = () => {
  showDeleteModal.value = true;
};

const handleDeleteConfirm = async () => {
  if (!workout.value) return;
  
  isDeleting.value = true;
  try {
    await apiClient.delete(`/api/v1/workouts/${workout.value.id}`);
    
    toastMessage.value = 'Тренировка успешно удалена';
    toastColor.value = 'success';
    
    // Переходим обратно к списку тренировок
    setTimeout(() => {
      router.push('/tabs/workouts');
    }, 1500);
  } catch (err) {
    console.error('Delete workout error:', err);
    toastMessage.value = (err as ApiError).message || 'Ошибка удаления тренировки';
    toastColor.value = 'danger';
  } finally {
    isDeleting.value = false;
    showDeleteModal.value = false;
  }
};

const handleDeleteCancel = () => {
  showDeleteModal.value = false;
};

onMounted(() => {
  fetchWorkout();
});
</script>

<style scoped>
.workout-details {
  padding: 20px;
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
  padding-right: 8px;
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

.vertical-fraction {
  display: flex;
  flex-direction: column;
  align-items: center;
  line-height: 1.2;
  position: relative;
}

.numerator {
  font-size: 1rem;
  font-weight: 600;
  color: var(--ion-text-color);
}

.denominator {
  font-size: 1rem;
  font-weight: 500;
  opacity: 0.8;
  color: var(--ion-text-color);
}

.vertical-fraction::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background-color: currentColor;
  opacity: 0.6;
}

.multiplier {
  font-size: 0.9rem;
  font-weight: 500;
  opacity: 0.8;
  color: var(--ion-text-color);
}

.simple-reps {
  font-size: 1rem;
  font-weight: 600;
  color: var(--ion-text-color);
}

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

.loading-state,
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

.loading-state ion-spinner {
  margin-bottom: 1rem;
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
  transition: all 0.2s ease;
}

.retry-button:hover {
  opacity: 0.9;
}

/* Кнопки действий в конце страницы */
.bottom-actions {
  padding: 16px 20px;
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
    padding: 16px;
  }
  
  .bottom-actions {
    padding: 12px 0;
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
  
  .vertical-fraction {
    line-height: 1.1;
  }
  
  .numerator,
  .denominator {
    font-size: 0.9rem;
  }
  
  .multiplier {
    font-size: 0.8rem;
  }
}
</style>
