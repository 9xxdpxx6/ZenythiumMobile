<template>
  <div class="exercise-card modern-card">
    <div class="exercise-header">
      <div class="exercise-icon">
        <i class="fas fa-dumbbell"></i>
      </div>
      <div class="exercise-info">
        <h3 class="exercise-name">{{ exercise.name }}</h3>
        <div class="exercise-muscle-group">
          {{ (exercise as any).muscle_group?.name || '' }}
          <span v-if="!(exercise as any).is_active" class="inactive-badge">неактивен</span>
        </div>
      </div>
      <div class="exercise-actions">
        <ion-button 
          fill="clear" 
          size="small" 
          @click="$emit('edit', exercise)"
          class="action-button"
        >
          <i class="fas fa-edit"></i>
        </ion-button>
        <ion-button 
          fill="clear" 
          size="small" 
          @click="$emit('delete', exercise)"
          class="action-button delete-button"
        >
          <i class="fas fa-trash"></i>
        </ion-button>
      </div>
    </div>
    
    <div v-if="exercise.description" class="exercise-description">
      {{ exercise.description }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { IonButton } from '@ionic/vue';
import type { ExerciseResource } from '@/types/api';

interface Props {
  exercise: ExerciseResource;
}

defineProps<Props>();
defineEmits<{
  edit: [exercise: ExerciseResource];
  delete: [exercise: ExerciseResource];
}>();
</script>

<style scoped>
.exercise-card {
  margin: 0 !important;
}

.exercise-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.exercise-icon {
  width: 40px;
  height: 40px;
  background: var(--ion-color-primary);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
}

.exercise-icon i {
  font-size: 16px;
  color: white;
}

.exercise-info {
  flex: 1;
}

.exercise-name {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--ion-text-color);
}

.exercise-muscle-group {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: var(--ion-color-medium);
}

.inactive-badge {
  background: var(--ion-color-medium);
  color: var(--ion-color-light);
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  margin-left: 8px;
  font-weight: 500;
}

.exercise-actions {
  display: flex;
  gap: 4px;
}

.action-button {
  --padding-start: 8px;
  --padding-end: 8px;
  --padding-top: 8px;
  --padding-bottom: 8px;
  margin: 0;
}

.action-button i {
  font-size: 16px;
}

.delete-button {
  color: var(--ion-color-danger);
}

.exercise-description {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 14px;
  color: var(--ion-color-medium);
  line-height: 1.4;
}
</style>

