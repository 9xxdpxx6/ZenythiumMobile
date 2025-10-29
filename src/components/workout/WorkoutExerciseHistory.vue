<template>
  <div class="exercises-section">
    <h2 class="section-title">Упражнения</h2>
    
    <div v-if="!exercises || exercises.length === 0" class="empty-exercises">
      <i class="fas fa-dumbbell empty-icon"></i>
      <p>Упражнения не найдены</p>
    </div>
    
    <div v-else class="exercises-list">
      <div 
        v-for="(exercise, index) in exercises" 
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
        
        <div class="exercise-history">
          <h4 class="history-title">История выполнения</h4>
          
          <div v-if="!exercise.history || exercise.history.length === 0" class="no-history">
            <p>Нет данных о выполнении</p>
          </div>
          
          <div v-else class="history-list">
            <div 
              v-for="(historyItem, historyIndex) in sortedHistory(exercise.history)" 
              :key="historyItem.workout_id"
              class="history-item"
              :class="{ 'current-workout': isCurrent(historyItem) }"
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
</template>

<script setup lang="ts">
interface GroupedSet {
  weight: number;
  reps: number;
  count: number;
  isSimple: boolean;
}

interface Props {
  exercises: any[];
  currentWorkoutId: number;
  groupAndFormatSets: (sets: any[]) => GroupedSet[];
  formatWeight: (weight: number | null | undefined) => string;
  formatDate: (date: string) => string;
}

const props = defineProps<Props>();

const sortedHistory = (history: any[]) => {
  if (!history) return [];
  
  return [...history].sort((a, b) => {
    if (a.workout_id === props.currentWorkoutId && b.workout_id !== props.currentWorkoutId) return -1;
    if (a.workout_id !== props.currentWorkoutId && b.workout_id === props.currentWorkoutId) return 1;
    if (a.workout_id === props.currentWorkoutId && b.workout_id === props.currentWorkoutId) return 0;
    
    return new Date(b.workout_date).getTime() - new Date(a.workout_date).getTime();
  });
};

const isCurrent = (historyItem: any) => {
  return historyItem.workout_id === props.currentWorkoutId;
};
</script>

<style scoped>
.exercises-section {
  margin-bottom: 32px;
}

.section-title {
  margin: 0 0 16px 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--ion-text-color);
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

@media (max-width: 768px) {
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


