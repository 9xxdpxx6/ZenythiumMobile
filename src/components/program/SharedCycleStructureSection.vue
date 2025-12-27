<template>
  <div v-if="structure && structure.cycles.length > 0" class="structure-section">
    <h2 class="section-title">Структура программы</h2>
    
    <div v-for="(cycle, cycleIndex) in structure.cycles" :key="cycleIndex" class="cycle-block">
      <h3 class="cycle-name">{{ cycle.name }}</h3>
      
      <div 
        v-for="(plan, planIndex) in cycle.plans" 
        :key="planIndex" 
        class="plan-block"
        :style="{ borderLeftColor: getPlanColor(plan.name) }"
      >
        <h4 class="plan-name" :style="{ color: getPlanColor(plan.name) }">{{ plan.name }}</h4>
        
        <div v-if="plan.exercises && plan.exercises.length > 0" class="exercises-list">
          <div
            v-for="(exercise, exerciseIndex) in plan.exercises"
            :key="exerciseIndex"
            class="exercise-item"
          >
            <div class="exercise-name">{{ exercise.name }}</div>
            <div v-if="exercise.muscle_group" class="exercise-muscle-group">
              <i class="fas fa-dumbbell"></i>
              {{ exercise.muscle_group.name }}
            </div>
            <div v-if="exercise.description" class="exercise-description">
              {{ exercise.description }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div v-else-if="structure" class="empty-structure">
    <p>Структура программы пока не доступна</p>
  </div>
</template>

<script setup lang="ts">
import { getColorFromString } from '@/utils/formatters';
import type { SharedCycleStructure } from '@/types/models/cycle.types';

interface Props {
  structure?: SharedCycleStructure | null;
}

defineProps<Props>();

function getPlanColor(name: string): string {
  return getColorFromString(name);
}
</script>

<style scoped>
.structure-section {
  margin-top: 32px;
}

.section-title {
  margin: 0 0 24px 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--ion-text-color);
}

.cycle-block {
  margin-bottom: 32px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.cycle-name {
  margin: 0 0 16px 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--ion-color-primary);
}

.plan-block {
  margin-bottom: 20px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 10px;
  border-left: 3px solid var(--ion-color-primary);
}

.plan-block:last-child {
  margin-bottom: 0;
}

.plan-name {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--ion-text-color);
}

.exercises-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.exercise-item {
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
}

.exercise-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--ion-text-color);
  margin-bottom: 4px;
}

.exercise-muscle-group {
  font-size: 12px;
  color: var(--ion-color-primary);
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.exercise-muscle-group i {
  font-size: 11px;
}

.exercise-description {
  font-size: 12px;
  color: var(--ion-color-medium);
  line-height: 1.4;
}

.empty-structure {
  text-align: center;
  padding: 40px 20px;
  color: var(--ion-color-medium);
}
</style>

