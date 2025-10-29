<template>
  <CustomCard
    clickable
    @click="$emit('click', workout)"
    @touchstart="$emit('press-start', workout)"
    @touchend="$emit('press-end')"
    @mousedown="$emit('press-start', workout)"
    @mouseup="$emit('press-end')"
    @mouseleave="$emit('press-end')"
    class="workout-card"
  >
    <div class="workout-header">
      <h3>{{ formatDate((workout as any).started_at || (workout as any).startDate || '') }}</h3>
      <CustomChip
        :color="(workout as any).finished_at || (workout as any).completedAt ? 'success' : 'warning'"
        size="small"
      >
        {{ (workout as any).finished_at || (workout as any).completedAt ? 'Завершена' : 'Активна' }}
      </CustomChip>
    </div>
    
    <div class="workout-info">
      <p><strong>План:</strong> {{ (workout as any).plan?.name || (workout as any).name || 'План не найден' }}</p>
    </div>
  </CustomCard>
</template>

<script setup lang="ts">
import CustomCard from '@/components/ui/CustomCard.vue';
import CustomChip from '@/components/ui/CustomChip.vue';

interface Props {
  workout: any;
}

defineProps<Props>();
defineEmits<{
  click: [workout: any];
  'press-start': [workout: any];
  'press-end': [];
}>();

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
</style>

