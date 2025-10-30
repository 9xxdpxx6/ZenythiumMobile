<template>
  <div class="active-workout-widget content-section" v-if="activeWorkout">
    <h2>Активная тренировка</h2>
    
    <div class="workout-card modern-card" @click="handleResume">
      <div class="workout-header">
        <div>
          <h3>{{ activeWorkout.name || 'Тренировка' }}</h3>
          <p class="workout-date">{{ formatDate(activeWorkout.startedAt || '') }}</p>
        </div>
        <div class="status-badge active">Активна</div>
      </div>
      
      <div class="workout-stats" v-if="activeWorkout.exercises">
        <div class="stat-item">
          <i class="fas fa-dumbbell"></i>
          <span>{{ activeWorkout.exercises.length }} упражнений</span>
        </div>
        <div class="stat-item">
          <i class="fas fa-check-circle"></i>
          <span>{{ completedExercisesCount }} / {{ activeWorkout.exercises.length }}</span>
        </div>
      </div>
      
      <ion-button expand="block" @click.stop="handleResume" class="resume-btn">
        <i class="fas fa-play"></i> Продолжить тренировку
      </ion-button>
    </div>
    
    <LoadingState v-if="loading" message="Загрузка..." />
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { IonButton } from '@ionic/vue';
import { useDataFetching } from '@/composables/useDataFetching';
import { workoutsService } from '@/services/workouts.service';
import LoadingState from '@/components/ui/LoadingState.vue';
import type { Workout } from '@/types/models/workout.types';

const router = useRouter();

const { data: workout, loading, refresh } = useDataFetching(
  () => workoutsService.getActive(),
  { immediate: true }
);

const activeWorkout = computed(() => workout.value);

const completedExercisesCount = computed(() => {
  if (!activeWorkout.value?.exercises) return 0;
  
  return activeWorkout.value.exercises.filter((exercise: any) => {
    return exercise.sets && exercise.sets.some((set: any) => set.completed);
  }).length;
});

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

const handleResume = () => {
  if (activeWorkout.value?.id) {
    router.push(`/workout/${activeWorkout.value.id}`);
  }
};

defineExpose({
  refresh,
});
</script>

<style scoped>
.active-workout-widget {
  margin-bottom: 32px;
}

.active-workout-widget h2 {
  font-size: 18px;
  font-weight: 600;
  color: var(--ion-text-color);
  margin: 0 0 16px 10px;
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
  margin-bottom: 16px;
  gap: 12px;
}

.workout-header h3 {
  margin: 0 0 4px 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--ion-text-color);
}

.workout-date {
  margin: 0;
  font-size: 14px;
  color: var(--ion-color-medium);
}

.status-badge {
  padding: 6px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.status-badge.active {
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
}

.workout-stats {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--ion-color-step-200);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--ion-color-medium);
}

.stat-item i {
  color: var(--ion-color-primary);
}

.resume-btn {
  --background: var(--ion-color-primary);
  --color: white;
  margin-top: 8px;
}

.resume-btn i {
  margin-right: 8px;
}
</style>
