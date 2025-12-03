<template>
  <div class="quick-stats-widget content-section">
    <h2>Основные показатели</h2>
    
    <div class="quick-stats card-grid-2">
      <div class="stat-card modern-card">
        <div class="stat-top">
          <div class="stat-value">{{ weekWorkouts }}</div>
          <i class="fas fa-chart-line stat-icon"></i>
        </div>
        <div class="stat-content">
          <h3>Тренировок в неделю</h3>
        </div>
      </div>

      <div class="stat-card modern-card">
        <div class="stat-top">
          <div class="stat-value">{{ formatTimeCompact(avgTimePerMonth) }}</div>
          <i class="fas fa-clock stat-icon"></i>
        </div>
        <div class="stat-content">
          <h3>Среднее время тренировки</h3>
        </div>
      </div>

      <div class="stat-card modern-card">
        <div class="stat-top">
          <div class="stat-value">{{ trainingStreak }}</div>
          <i class="fas fa-fire stat-icon"></i>
        </div>
        <div class="stat-content">
          <h3>Серия тренировок</h3>
        </div>
      </div>

      <div class="stat-card modern-card">
        <div class="stat-top">
          <div class="stat-value">{{ mostTrainedMuscleGroup }}</div>
          <i class="fas fa-dumbbell stat-icon"></i>
        </div>
        <div class="stat-content">
          <h3>Самая качаемая группа</h3>
        </div>
      </div>
    </div>

    <LoadingState v-if="loading" message="Загрузка..." />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useDataFetching } from '@/composables/useDataFetching';
import { statisticsService } from '@/services/statistics.service';
import LoadingState from '@/components/ui/LoadingState.vue';
import type { Statistics } from '@/types/api';
import type { Workout } from '@/types/models/workout.types';

interface Props {
  workouts?: Workout[];
}

const props = defineProps<Props>();

const statistics = ref<Statistics | null>(null);
const timeAnalytics = ref<any>(null);
const muscleGroupStats = ref<any>(null);
const loading = ref(false);

// Fetch statistics
const { data: statsData, loading: statsLoading } = useDataFetching(
  () => statisticsService.getOverview(),
  { immediate: true, skipIfDataExists: true, cacheKey: 'homepage_statistics' }
);

// Fetch time analytics
const { data: timeData, loading: timeLoading } = useDataFetching(
  () => statisticsService.getTimeAnalytics(),
  { immediate: true, skipIfDataExists: true, cacheKey: 'homepage_time_analytics' }
);

// Fetch muscle group stats
const { data: muscleData, loading: muscleLoading } = useDataFetching(
  () => statisticsService.getMuscleGroupStatistics(),
  { immediate: true, skipIfDataExists: true, cacheKey: 'homepage_muscle_groups' }
);

// Update local refs when data loads
const updateData = () => {
  if (statsData.value) statistics.value = statsData.value as Statistics;
  if (timeData.value) timeAnalytics.value = timeData.value;
  if (muscleData.value) muscleGroupStats.value = muscleData.value;
  loading.value = statsLoading.value || timeLoading.value || muscleLoading.value;
};

// Watch for data changes
import { watch } from 'vue';
watch([statsData, timeData, muscleData, statsLoading, timeLoading, muscleLoading], updateData, { immediate: true });

const weekWorkouts = computed(() => {
  return (statsData.value as Statistics)?.training_frequency_4_weeks || 0;
});

const avgTimePerMonth = computed(() => {
  if (!timeAnalytics.value?.monthly_trends || timeAnalytics.value.monthly_trends.length === 0) {
    return 0;
  }
  
  const currentMonth = new Date().toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
  const currentMonthData = timeAnalytics.value.monthly_trends.find((month: any) => 
    month.month === currentMonth
  );
  
  if (currentMonthData && currentMonthData.avg_duration) {
    return currentMonthData.avg_duration * 60;
  }
  
  const totalDuration = timeAnalytics.value.monthly_trends.reduce((sum: number, month: any) => {
    return sum + (month.avg_duration || 0);
  }, 0);
  
  const avgDuration = timeAnalytics.value.monthly_trends.length > 0 
    ? totalDuration / timeAnalytics.value.monthly_trends.length 
    : 0;
    
  return avgDuration * 60;
});

const trainingStreak = computed(() => {
  return (statsData.value as Statistics)?.training_streak_days || 0;
});

const mostTrainedMuscleGroup = computed(() => {
  // Normalize groups from service mapping or raw API
  const groups = (muscleGroupStats.value?.muscle_groups
    || (muscleGroupStats.value as any)?.data?.muscle_group_stats
    || (muscleGroupStats.value as any)?.data?.muscle_groups
    || []) as any[];

  if (!Array.isArray(groups) || groups.length === 0) return '—';

  // Rule: max total_volume; tie-breakers: workout_count -> avg_volume_per_workout -> original order
  let maxIdx = 0;
  for (let i = 1; i < groups.length; i++) {
    const a = groups[maxIdx] || {};
    const b = groups[i] || {};
    const aVol = Number(a.total_volume ?? 0);
    const bVol = Number(b.total_volume ?? 0);
    if (bVol > aVol) { maxIdx = i; continue; }
    if (bVol < aVol) { continue; }
    const aCnt = Number(a.workout_count ?? 0);
    const bCnt = Number(b.workout_count ?? 0);
    if (bCnt > aCnt) { maxIdx = i; continue; }
    if (bCnt < aCnt) { continue; }
    const aAvg = Number(a.avg_volume_per_workout ?? 0);
    const bAvg = Number(b.avg_volume_per_workout ?? 0);
    if (bAvg > aAvg) { maxIdx = i; continue; }
    // else keep original order
  }

  const top = groups[maxIdx] || {};
  return top.muscle_group_name || top.name || '—';
});

const formatTimeCompact = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}ч${minutes > 0 ? ` ${minutes}м` : ''}`;
  }
  return `${minutes}м`;
};
</script>

<style scoped>
.quick-stats-widget {
  margin-bottom: 32px;
}

.quick-stats-widget h2 {
  font-size: 18px;
  font-weight: 600;
  color: var(--ion-text-color);
  margin: 0 0 24px 10px;
}

.quick-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 24px;
  align-items: stretch;
}

.stat-card {
  padding: 16px !important;
  background: var(--ion-color-step-50);
  border-radius: 12px;
  margin: 0 !important;
  display: flex;
  flex-direction: column;
  min-height: fit-content;
  height: 100%;
}

.stat-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 8px;
  gap: 8px;
  flex-shrink: 0;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--ion-text-color);
  margin: 0;
  line-height: 1.2;
  word-break: break-word;
  overflow-wrap: break-word;
}

.stat-card:nth-child(1) .stat-value {
  color: #10b981;
}

.stat-card:nth-child(2) .stat-value {
  color: #8b5cf6;
}

.stat-card:nth-child(3) .stat-value {
  color: #f59e0b;
}

.stat-card:nth-child(4) .stat-value {
  color: #3b82f6;
}

.stat-content {
  margin-top: auto;
  flex: 1;
  display: flex;
  align-items: flex-end;
}

.stat-content h3 {
  margin: 0;
  text-align: start;
  font-size: 14px;
  font-weight: 600;
  color: var(--ion-color-medium);
  line-height: 1.3;
  word-wrap: break-word;
  overflow-wrap: break-word;
  hyphens: auto;
}

.stat-icon {
  font-size: 1.5rem;
  color: var(--ion-color-primary);
  flex-shrink: 0;
}

.stat-card:nth-child(1) .stat-icon {
  color: #10b981;
}

.stat-card:nth-child(2) .stat-icon {
  color: #8b5cf6;
}

.stat-card:nth-child(3) .stat-icon {
  color: #f59e0b;
}

.stat-card:nth-child(4) .stat-icon {
  color: #3b82f6;
}
</style>
