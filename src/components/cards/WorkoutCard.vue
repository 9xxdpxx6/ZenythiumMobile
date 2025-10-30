<template>
  <CustomCard
    clickable
    @click="handleClick"
    @touchstart="longPress.handleTouchStart"
    @touchend="longPress.handleTouchEnd"
    @touchmove="longPress.handleTouchMove"
    @touchcancel="longPress.handleTouchEnd"
    @mousedown="longPress.handleMouseDown"
    @mouseup="longPress.handleMouseUp"
    @mouseleave="longPress.handleMouseLeave"
    @mousemove="longPress.handleMouseMove"
    class="workout-card"
  >
    <div class="workout-header">
      <h3>{{ formatDate((workout as any).startedAt || (workout as any).started_at || (workout as any).startDate || '') }}</h3>
      <CustomChip
        :color="(workout as any).completedAt || (workout as any).finished_at ? 'success' : 'warning'"
        size="small"
      >
        {{ (workout as any).completedAt || (workout as any).finished_at ? 'Завершена' : 'Активна' }}
      </CustomChip>
    </div>
    
    <div class="workout-info">
      <p><strong>План:</strong> {{ (workout as any).plan?.name || (workout as any).name || 'План не найден' }}</p>
      <p v-if="getDuration" class="workout-duration">
        <i class="fas fa-clock"></i> {{ getDuration }}
      </p>
    </div>
  </CustomCard>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import CustomCard from '@/components/ui/CustomCard.vue';
import CustomChip from '@/components/ui/CustomChip.vue';
import { useLongPress } from '@/composables';

interface Props {
  workout: any;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  click: [workout: any];
  'press-start': [workout: any];
  'press-end': [];
}>();

// Use long press composable with swipe detection
const longPress = useLongPress({
  threshold: 10,
  onPressStart: () => emit('press-start', props.workout),
  onPressEnd: () => emit('press-end'),
});

// Handle click with swipe detection
const handleClick = () => {
  longPress.handleClick(() => {
    emit('click', props.workout);
  });
};

const formatDate = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const isCompleted = computed(() => {
  const workoutData = props.workout as any;
  return workoutData?.completedAt || workoutData?.finished_at;
});

const getDuration = computed(() => {
  const workoutData = props.workout as any;
  
  if (!isCompleted.value) {
    return null;
  }
  
  // Try to get duration_minutes if available
  if (workoutData?.duration_minutes !== undefined && workoutData?.duration_minutes !== null) {
    return formatDuration(workoutData.duration_minutes);
  }
  
  // Calculate from dates
  const startedAt = workoutData?.startedAt || workoutData?.started_at || workoutData?.startDate;
  const finishedAt = workoutData?.completedAt || workoutData?.finished_at;
  
  if (!startedAt || !finishedAt) {
    return null;
  }
  
  try {
    const start = new Date(startedAt);
    const end = new Date(finishedAt);
    const diffMs = end.getTime() - start.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    
    if (diffMinutes < 0) {
      return null;
    }
    
    return formatDuration(diffMinutes);
  } catch {
    return null;
  }
});

const formatDuration = (minutes: number): string => {
  if (isNaN(minutes) || minutes < 0) {
    return '';
  }
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours > 0) {
    return `${hours}ч ${mins}м`;
  }
  return `${mins}м`;
};

</script>

<style scoped>
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
  flex-direction: column;
  gap: 8px;
}

.workout-info p {
  margin: 0;
  font-size: 14px;
  color: var(--ion-color-medium);
}

.workout-info strong {
  color: var(--ion-text-color);
}

.workout-duration {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--ion-color-medium);
}

.workout-duration i {
  font-size: 12px;
  opacity: 0.7;
}
</style>

