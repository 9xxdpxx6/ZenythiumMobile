<template>
  <div class="recent-workouts-widget content-section" v-if="recentWorkouts.length > 0">
    <div class="widget-header">
      <h2>Последние тренировки</h2>
      <ion-button fill="clear" size="small" @click="$emit('view-all')">
        Все
        <i class="fas fa-chevron-right"></i>
      </ion-button>
    </div>
    
    <div class="workouts-list">
      <div
        v-for="workout in recentWorkouts"
        :key="workout.id"
        class="workout-item modern-card"
        @click="$emit('view-workout', workout)"
      >
        <div class="workout-info">
          <h3>{{ workout.plan?.name || 'Тренировка' }}</h3>
          <p class="workout-date">{{ formatDate(workout.started_at) }}</p>
          <div class="workout-meta" v-if="workout.finished_at">
            <i class="fas fa-check-circle"></i>
            <span>Завершена</span>
          </div>
        </div>
        <div class="workout-arrow">
          <i class="fas fa-chevron-right"></i>
        </div>
      </div>
    </div>
    
    <LoadingState v-if="loading" message="Загрузка..." />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { IonButton } from '@ionic/vue';
import { useDataFetching } from '@/composables/useDataFetching';
import { workoutsService } from '@/services/workouts.service';
import LoadingState from '@/components/LoadingState.vue';
import type { Workout } from '@/types/models/workout.types';

interface Props {
  limit?: number;
}

const props = withDefaults(defineProps<Props>(), {
  limit: 5,
});

defineEmits<{
  'view-workout': [workout: Workout];
  'view-all': [];
}>();

const { data: workoutsData, loading } = useDataFetching(
  async () => {
    const result = await workoutsService.getPaginated({ limit: props.limit, page: 1 });
    return result.data || [];
  },
  { immediate: true }
);

const recentWorkouts = computed(() => {
  if (!workoutsData.value) return [];
  
  return (workoutsData.value as Workout[])
    .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())
    .slice(0, props.limit);
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
</script>

<style scoped>
.recent-workouts-widget {
  margin-bottom: 32px;
}

.widget-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.widget-header h2 {
  font-size: 18px;
  font-weight: 600;
  color: var(--ion-text-color);
  margin: 0 0 0 10px;
}

.workouts-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.workout-item {
  padding: 16px !important;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: transform 0.2s ease;
}

.workout-item:active {
  transform: scale(0.98);
}

.workout-info {
  flex: 1;
}

.workout-info h3 {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--ion-text-color);
}

.workout-date {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: var(--ion-color-medium);
}

.workout-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--ion-color-success);
}

.workout-meta i {
  font-size: 12px;
}

.workout-arrow {
  color: var(--ion-color-medium);
  margin-left: 12px;
}
</style>
