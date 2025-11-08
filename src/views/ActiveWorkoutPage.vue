<template>
  <BasePage>
    <PageHeader title="Активная тренировка">
      <template #start>
          <ion-button @click="router.back()">
            <i class="fas fa-arrow-left"></i>
          </ion-button>
      </template>
    </PageHeader>

    <ion-content :fullscreen="true">
      <PageContainer>
        <LoadingState v-if="loading" message="Загрузка тренировки..." />

        <div v-else-if="workout && exercises.length > 0" class="workout-container">
        <!-- Workout Title -->
        <div class="workout-title-section">
          <h1 class="workout-title">{{ workout?.plan?.name || 'Тренировка' }}</h1>
          <p class="workout-start-time">{{ formatStartTime(workout?.started_at) }}</p>
        </div>

        <div 
          v-for="exercise in exercises" 
          :key="exercise.id"
          class="exercise-card"
        >
          <!-- Exercise Header -->
          <div class="exercise-header">
            <h3 class="exercise-title">{{ exercise.order }}. {{ exercise.exercise.name }}</h3>
          </div>

          <!-- Previous Sets -->
          <div v-if="getPreviousSets(exercise.id).length > 0" class="previous-sets">
            <p class="previous-label">Предыдущие тренировки:</p>
            <div class="sets-list">
              <div 
                v-for="historyItem in getPreviousSets(exercise.id)" 
                :key="historyItem.workout_id"
                class="history-item"
              >
                <div class="history-date">{{ formatDate(historyItem.workout_date) }}</div>
                <div class="history-sets">
                  <span 
                    v-for="groupedSet in groupAndFormatSets(historyItem.sets)" 
                    :key="`${groupedSet.weight}-${groupedSet.reps}-${groupedSet.count}`"
                    class="set-item"
                  >
                    <div v-if="groupedSet.isSimple" class="simple-reps">
                      {{ groupedSet.reps }}<span v-if="groupedSet.count > 1"> × {{ groupedSet.count }}</span>
                    </div>
                    <div v-else class="vertical-fraction">
                      <div class="numerator">{{ formatWeight(groupedSet.weight) }}</div>
                      <div class="denominator">{{ groupedSet.reps }}</div>
                    </div>
                    <span v-if="!groupedSet.isSimple && groupedSet.count > 1" class="multiplier">× {{ groupedSet.count }}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Current Sets -->
          <div v-if="getCurrentSets(exercise.id).length > 0" class="current-sets">
            <p class="current-label">Сегодня:</p>
            <div class="current-sets-list">
                <span
                  v-for="groupedSet in groupAndFormatSets(getCurrentSets(exercise.id))"
                  :key="`${groupedSet.weight}-${groupedSet.reps}-${groupedSet.count}`"
                  class="current-set-item"
                >
                  <div v-if="groupedSet.isSimple" class="simple-reps">
                    {{ groupedSet.reps }}<span v-if="groupedSet.count > 1"> × {{ groupedSet.count }}</span>
                  </div>
                  <div v-else class="vertical-fraction">
                    <div class="numerator">{{ formatWeight(groupedSet.weight) }}</div>
                    <div class="denominator">{{ groupedSet.reps }}</div>
                  </div>
                  <span v-if="!groupedSet.isSimple && groupedSet.count > 1" class="multiplier">× {{ groupedSet.count }}</span>
                  <button 
                    @click="deleteLastSetFromGroup(exercise.id, groupedSet)"
                    class="delete-button"
                    type="button"
                  >
                    <i class="fas fa-times delete-icon"></i>
                  </button>
                </span>
            </div>
          </div>

          <!-- Today's Input -->
          <div class="today-input">
            <p class="today-label">Добавить подход:</p>
            <div class="input-row">
              <div class="input-field">
                <CustomInput
                  :modelValue="newSets[exercise.id].weight?.toString() || ''"
                  label="Вес"
                  type="number"
                  :placeholder="getPlaceholderValue(exercise.id, 'weight')"
                  @update:modelValue="(value) => validateInput(value, exercise.id, 'weight')"
                />
              </div>
              <div class="input-field">
                <CustomInput
                  :modelValue="newSets[exercise.id].reps?.toString() || ''"
                  label="Повторения"
                  type="number"
                  :placeholder="getPlaceholderValue(exercise.id, 'reps')"
                  @update:modelValue="(value) => validateInput(value, exercise.id, 'reps')"
                />
              </div>
            </div>
            <ion-button 
              @click="addSet(exercise.id)" 
              :disabled="addingSet"
              expand="block"
              class="add-set-button"
            >
              <ion-spinner v-if="addingSet" name="crescent"></ion-spinner>
              <span v-else>Добавить подход</span>
            </ion-button>
          </div>
        </div>

        <div style="margin-top: 16px;">
            <ion-button
              expand="block"
              color="success"
              @click="handleFinishWorkout"
              :disabled="finishing || !canFinishWorkout"
              style="--border-radius: 12px; --padding-top: 12px; --padding-bottom: 12px; font-weight: 600; box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.1);"
            >
              <ion-spinner v-if="finishing" name="crescent"></ion-spinner>
              <span v-else>Завершить тренировку</span>
            </ion-button>
        </div>
      </div>

        <div v-else class="empty-state">
          <i class="fas fa-dumbbell" style="font-size: 3rem;"></i>
          <h2>Тренировка не найдена</h2>
          <p>Возможно, тренировка была удалена</p>
        </div>
      </PageContainer>
    </ion-content>

    <ion-toast
      :is-open="!!error"
      :message="error"
      duration="3000"
      @didDismiss="clearError"
    ></ion-toast>
  </BasePage>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  IonContent,
  IonButton,
  IonSpinner,
  IonToast,
} from '@ionic/vue';
import CustomInput from '@/components/ui/CustomInput.vue';
import PageContainer from '@/components/ui/PageContainer.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import LoadingState from '@/components/ui/LoadingState.vue';
import { useActiveWorkout } from '@/composables/useActiveWorkout';

const route = useRoute();
const router = useRouter();
const workoutId = Number(route.params.id);

const {
  workout,
  exercises,
  loading,
  addingSet,
  finishing,
  error,
  newSets,
  canFinishWorkout,
  fetchWorkout,
  getCurrentSets,
  getPlaceholderValue,
  getPreviousSets,
  groupAndFormatSets,
  formatWeight,
  addSet,
  deleteSet,
  deleteLastSetFromGroup,
  finishWorkout,
  validateInput,
  formatDate,
  formatStartTime,
  clearError,
} = useActiveWorkout(workoutId);

const handleFinishWorkout = async () => {
  const success = await finishWorkout();
  if (success) {
    // Notify other pages to refresh workouts list
    window.dispatchEvent(new CustomEvent('workout-finished', {
      detail: { workoutId }
    }));
    router.push('/tabs/workouts');
  }
};

onMounted(() => {
  if (!Number.isFinite(workoutId) || isNaN(workoutId)) {
    router.push('/tabs/workouts');
    return;
    }
  fetchWorkout();
});
</script>

<style scoped>
/* Container */
.workout-container {
  padding: 0;
  max-width: 100%;
  background: var(--ion-background-color);
}

/* Workout Title */
.workout-title-section {
  margin-bottom: 24px;
  text-align: left;
  padding-left: 0;
}

.workout-title {
  font-size: 22px !important;
  font-weight: 700 !important;
  color: var(--ion-text-color) !important;
  margin: 0 0 6px 0 !important;
  padding-left: 0 !important;
}

.workout-start-time {
  font-size: 14px !important;
  color: var(--ion-color-medium) !important;
  margin: 0 !important;
  padding-left: 0 !important;
}

/* Exercise Card */
.exercise-card {
  background: var(--ion-card-background);
  border-radius: var(--ion-card-border-radius);
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.exercise-card:last-child {
  margin-bottom: 0;
}

/* Exercise Header */
.exercise-header {
  margin-bottom: 16px;
}

.exercise-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--ion-text-color);
  margin: 0;
}

/* Previous Sets */
.previous-sets {
  margin-bottom: 20px;
}

.previous-label {
  font-size: 0.9rem;
  color: var(--ion-color-medium);
  margin: 0 0 8px 0;
  font-weight: 500;
}

.sets-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.set-item {
  font-size: 0.95rem;
  color: var(--ion-text-color);
  padding: 4px 0;
}

.history-item {
  margin-bottom: 8px;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.history-item:last-child {
  border-bottom: none;
}

.history-date {
  font-size: 0.85rem;
  color: var(--ion-color-medium);
  margin-bottom: 4px;
  font-weight: 500;
}

.history-sets {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.history-sets .set-item {
  background: rgba(255, 255, 255, 0.1);
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 0.9rem;
  color: var(--ion-text-color);
  display: flex;
  align-items: center;
  gap: 4px;
}

/* vertical-fraction, numerator, denominator, multiplier, simple-reps now in utilities.css */

/* Override line-height for current sets */
.current-set-item .vertical-fraction {
  line-height: 2;
}

/* Current Sets */
.current-sets {
  margin-bottom: 20px;
}

.current-label {
  font-size: 0.9rem;
  color: white;
  margin: 0 0 8px 0;
  font-weight: 600;
}

.current-sets-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.current-set-item {
  background: transparent;
  border: 2px solid var(--ion-color-primary);
  color: white;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 4px;
}

/* Override colors for current sets */
.current-set-item .numerator,
.current-set-item .denominator,
.current-set-item .multiplier,
.current-set-item .simple-reps {
  color: white;
}

.current-set-item .vertical-fraction::after {
  background-color: white;
}

.delete-button {
  background: transparent;
  border: none;
  padding: 4px;
  margin-left: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.delete-icon {
  font-size: 16px;
  color: #ff4444;
  font-weight: bold;
}

/* Today's Input */
.today-input {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.today-label {
  font-size: 0.9rem;
  color: var(--ion-color-medium);
  margin: 0;
  font-weight: 500;
}

.input-row {
  display: flex;
  gap: 12px;
}

.input-field {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* Убираем стили для ion-input, так как теперь используем CustomInput */
.input-field CustomInput {
  margin: 0;
}

.add-set-button {
  --background: var(--ion-color-primary);
  --color: white;
  --border-radius: 12px;
  --padding-top: 12px;
  --padding-bottom: 12px;
  font-weight: 600;
  margin-top: 8px;
  box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.1);
}

/* Back Button */
ion-toolbar ion-button i {
  font-size: 20px;
  color: white;
}
</style>
