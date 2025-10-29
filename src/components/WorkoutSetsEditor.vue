<template>
  <div class="workout-sets-editor">
    <div class="section-header">
      <h3>Подходы</h3>
    </div>

    <div v-if="!hasExercises" class="empty-sets">
      <p>Нет упражнений в плане</p>
    </div>

    <div v-else class="sets-list">
      <div
        v-for="(exerciseSets, exerciseName) in groupedSets"
        :key="exerciseName"
        class="exercise-group"
      >
        <div class="exercise-header">
          <h4>{{ exerciseName }}</h4>
          <ion-button
            @click="$emit('add-set', exerciseName)"
            fill="clear"
            color="primary"
            size="small"
          >
            <ion-icon :icon="addOutline"></ion-icon>
          </ion-button>
        </div>
        
        <div class="sets-in-exercise">
          <div
            v-for="(set, index) in exerciseSets"
            :key="set.id || `new-${index}`"
            class="set-item"
          >
            <div class="set-info">
              <div class="set-values">
                <CustomInput
                  :model-value="set.weight?.toString() || ''"
                  @update:model-value="handleWeightChange(set, $event)"
                  type="number"
                  placeholder="Вес"
                  class="weight-input"
                />
                <span v-if="set.weight !== 0" class="separator">x</span>
                <CustomInput
                  :model-value="set.reps?.toString() || ''"
                  @update:model-value="handleRepsChange(set, $event)"
                  type="number"
                  placeholder="Повт."
                  class="reps-input"
                />
              </div>
            </div>
            <div class="set-actions">
              <ion-button
                @click="$emit('delete-set', exerciseName, index)"
                fill="clear"
                color="danger"
                size="small"
              >
                <ion-icon :icon="trashOutline"></ion-icon>
              </ion-button>
            </div>
          </div>
          
          <div v-if="exerciseSets.length === 0" class="no-sets-message">
            <p>Нет подходов к этому упражнению</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { IonButton, IonIcon } from '@ionic/vue';
import { addOutline, trashOutline } from 'ionicons/icons';
import CustomInput from './CustomInput.vue';
import type { WorkoutSet } from '@/types/api';

interface Props {
  sets: WorkoutSet[];
  groupedSets: Record<string, WorkoutSet[]>;
  hasExercises: boolean;
}

defineProps<Props>();
defineEmits<{
  'add-set': [exerciseName: string];
  'delete-set': [exerciseName: string, index: number];
}>();

const handleWeightChange = (set: WorkoutSet, value: string) => {
  const numValue = value ? parseFloat(value) : null;
  if (!isNaN(numValue as number) && numValue >= 0) {
    set.weight = numValue;
  } else {
    set.weight = null;
  }
};

const handleRepsChange = (set: WorkoutSet, value: string) => {
  const numValue = value ? parseInt(value) : null;
  if (!isNaN(numValue as number) && numValue > 0) {
    set.reps = numValue;
  } else {
    set.reps = null;
  }
};
</script>

<style scoped>
.sets-section {
  margin-bottom: 90px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--ion-text-color);
}

.empty-sets {
  text-align: center;
  padding: 2rem;
  color: var(--ion-color-medium);
}

.sets-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.exercise-group {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
}

.exercise-header {
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.08);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.exercise-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--ion-text-color);
}

.sets-in-exercise {
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.set-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.set-info {
  flex: 1;
}

.set-values {
  display: flex;
  align-items: center;
  gap: 8px;
}

.weight-input,
.reps-input {
  width: 80px;
}

.separator {
  color: var(--ion-color-medium);
  font-weight: 600;
}

.set-actions {
  margin-left: 12px;
}

.no-sets-message {
  text-align: center;
  padding: 20px;
  color: var(--ion-color-medium);
  font-style: italic;
}

.no-sets-message p {
  margin: 0;
  font-size: 14px;
}
</style>


