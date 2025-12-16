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
        <div v-if="activeGoal" class="stat-top">
          <div class="stat-value">{{ goalRemaining }}</div>
          <i class="fas fa-bullseye stat-icon"></i>
        </div>
        <div v-else class="stat-top stat-top-button">
          <ion-button 
            fill="clear" 
            size="small" 
            class="set-goal-button"
            @click="handleSetGoal"
          >
            <i class="fas fa-plus"></i>
          </ion-button>
          <i class="fas fa-bullseye stat-icon"></i>
        </div>
        <div class="stat-content">
          <h3>До цели</h3>
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
import { useRouter } from 'vue-router';
import { IonButton } from '@ionic/vue';
import { useDataFetching } from '@/composables/useDataFetching';
import { statisticsService } from '@/services/statistics.service';
import { goalsService } from '@/services/goals.service';
import { formatWeight, formatDuration } from '@/utils/formatters';
import LoadingState from '@/components/ui/LoadingState.vue';
import type { Statistics } from '@/types/api';
import type { Workout } from '@/types/models/workout.types';
import type { Goal, GoalType } from '@/types/models/goal.types';

interface Props {
  workouts?: Workout[];
}

const props = defineProps<Props>();
const router = useRouter();

const statistics = ref<Statistics | null>(null);
const timeAnalytics = ref<any>(null);
const muscleGroupStats = ref<any>(null);
const activeGoals = ref<Goal[]>([]);
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

// Fetch active goals
const { data: goalsData, loading: goalsLoading } = useDataFetching(
  async () => {
    const goals = await goalsService.getAll({ status: 'active' });
    return goals;
  },
  { immediate: true, skipIfDataExists: true, cacheKey: 'homepage_active_goals' }
);

// Update local refs when data loads
const updateData = () => {
  if (statsData.value) statistics.value = statsData.value as Statistics;
  if (timeData.value) timeAnalytics.value = timeData.value;
  if (muscleData.value) muscleGroupStats.value = muscleData.value;
  if (goalsData.value) activeGoals.value = goalsData.value as Goal[];
  loading.value = statsLoading.value || timeLoading.value || muscleLoading.value || goalsLoading.value;
};

// Watch for data changes
import { watch } from 'vue';
watch([statsData, timeData, muscleData, goalsData, statsLoading, timeLoading, muscleLoading, goalsLoading], updateData, { immediate: true });

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

// Get first active goal or null
const activeGoal = computed(() => {
  if (!activeGoals.value || activeGoals.value.length === 0) return null;
  // Sort by end_date (closest first), then by created_at
  const sorted = [...activeGoals.value].sort((a, b) => {
    if (a.end_date && b.end_date) {
      return new Date(a.end_date).getTime() - new Date(b.end_date).getTime();
    }
    if (a.end_date) return -1;
    if (b.end_date) return 1;
    return (a.created_at || '').localeCompare(b.created_at || '');
  });
  return sorted[0];
});

// Calculate remaining value to goal
const goalRemaining = computed(() => {
  const goal = activeGoal.value;
  if (!goal) return '';
  
  const current = goal.current_value ?? 0;
  const target = goal.target_value;
  const remaining = Math.max(0, target - current);
  
  return formatGoalRemaining(remaining, goal.type);
});

// Handle navigation to goals page
const handleSetGoal = () => {
  router.push('/goals');
};

// Format remaining value based on goal type
const formatGoalRemaining = (value: number, type: GoalType): string => {
  if (value === 0) return '0';
  
  switch (type) {
    case 'target_weight':
    case 'weight_loss':
    case 'weight_gain':
    case 'exercise_max_weight':
      return formatWeight(value, 'kg');
    
    case 'total_volume':
    case 'weekly_volume':
    case 'exercise_volume':
      return formatWeight(value, 'kg');
    
    case 'total_training_time':
    case 'weekly_training_time':
      // Convert to minutes if needed (assuming value is in minutes)
      return formatDuration(value);
    
    case 'total_workouts':
    case 'completed_workouts':
    case 'training_frequency':
      return `${Math.round(value)}`;
    
    case 'exercise_max_reps':
      const reps = Math.round(value);
      return `${reps} ${getRepsLabel(reps)}`;
    
    default:
      return `${Math.round(value)}`;
  }
};

// Get Russian pluralization for reps
const getRepsLabel = (reps: number): string => {
  const lastDigit = reps % 10;
  const lastTwoDigits = reps % 100;
  
  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
    return 'повторений';
  }
  
  if (lastDigit === 1) {
    return 'повторение';
  }
  
  if (lastDigit >= 2 && lastDigit <= 4) {
    return 'повторения';
  }
  
  return 'повторений';
};

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

.stat-top-button {
  align-items: center;
  justify-content: space-between;
}

.set-goal-button {
  --color: #f59e0b;
  --background: transparent;
  --border-radius: 50%;
  --padding: 0;
  margin: 0;
  width: 40px;
  height: 40px;
  min-width: 40px;
  min-height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.set-goal-button i {
  font-size: 20px;
  margin: 0;
}

.set-goal-button:hover {
  --color: #f59e0b;
  --background: rgba(245, 158, 11, 0.1);
}
</style>
