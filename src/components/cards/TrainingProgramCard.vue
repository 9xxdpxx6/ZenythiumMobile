<template>
  <div
    class="training-program-card modern-card"
    :class="{ 'installed': program.is_installed, 'featured': isFeatured }"
    @click="$emit('click', program)"
  >

    <!-- Ленточка "NEW" в правом верхнем углу -->
    <div v-if="isNew && !program.is_installed" class="ribbon ribbon-new">
      <span>NEW</span>
    </div>

    <!-- Заголовок с названием -->
    <div class="program-header">
      <h2 class="program-title">{{ program.name }}</h2>
    </div>

    <!-- Автор как доверительный сигнал -->
    <div v-if="program.author" class="program-author">
      <div class="author-avatar">
        <i class="fas fa-user-tie"></i>
      </div>
      <span class="author-name">от {{ program.author.name }}</span>
    </div>

    <!-- Ключевые характеристики -->
    <div class="program-features">
      <div class="feature-item feature-duration">
        <div class="feature-icon">
          <i class="fas fa-calendar-check"></i>
        </div>
        <div class="feature-content">
          <div class="feature-value">{{ program.duration_weeks }}</div>
          <div class="feature-label">{{ formatWeeks(program.duration_weeks) }}</div>
        </div>
      </div>
      
      <div v-if="program.exercises_count" class="feature-item feature-exercises">
        <div class="feature-icon">
          <i class="fas fa-dumbbell"></i>
        </div>
        <div class="feature-content">
          <div class="feature-value">{{ program.exercises_count }}</div>
          <div class="feature-label">{{ formatExercises(program.exercises_count) }}</div>
        </div>
      </div>
      
      <div v-if="program.plans_count" class="feature-item feature-plans">
        <div class="feature-icon">
          <i class="fas fa-list-check"></i>
        </div>
        <div class="feature-content">
          <div class="feature-value">{{ program.plans_count }}</div>
          <div class="feature-label">{{ formatPlans(program.plans_count) }}</div>
        </div>
      </div>
      
      <div v-if="program.cycles_count && program.cycles_count > 1" class="feature-item feature-cycles">
        <div class="feature-icon">
          <i class="fas fa-sync-alt"></i>
        </div>
        <div class="feature-content">
          <div class="feature-value">{{ program.cycles_count }}</div>
          <div class="feature-label">{{ formatCycles(program.cycles_count) }}</div>
        </div>
      </div>
    </div>
    
    <!-- Кнопка действия - крупная и привлекательная -->
    <div class="program-footer">
      <button 
        v-if="!program.is_installed"
        @click.stop="$emit('install', program)"
        class="install-button primary-button"
        :disabled="isInstalling"
      >
        <span v-if="isInstalling" class="button-loading">
          <i class="fas fa-spinner fa-spin"></i>
          Установка...
        </span>
        <span v-else class="button-content">
          <i class="fas fa-download"></i>
          <span>Установить программу</span>
        </span>
      </button>
      <button 
        v-else
        @click.stop="$emit('uninstall', program)"
        class="uninstall-button secondary-button"
        :disabled="isUninstalling"
      >
        <span v-if="isUninstalling" class="button-loading">
          <i class="fas fa-spinner fa-spin"></i>
          Удаление...
        </span>
        <span v-else class="button-content">
          <i class="fas fa-check"></i>
          <span>Установлена</span>
        </span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { TrainingProgram } from '@/types/models/training-program.types';

interface Props {
  program: TrainingProgram;
  isInstalling?: boolean;
  isUninstalling?: boolean;
}

const props = defineProps<Props>();
defineEmits<{
  click: [program: TrainingProgram];
  install: [program: TrainingProgram];
  uninstall: [program: TrainingProgram];
}>();

// Определяем, является ли программа новой (создана не более 2 недель назад)
const isNew = computed(() => {
  const createdDate = new Date(props.program.created_at);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - createdDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= 14;
});

// Определяем, является ли программа "featured" (популярная/рекомендуемая)
// Можно добавить логику на основе duration_weeks или других критериев
const isFeatured = computed(() => {
  return props.program.is_active && props.program.duration_weeks >= 6;
});

const formatWeeks = (weeks: number): string => {
  const lastDigit = weeks % 10;
  const lastTwoDigits = weeks % 100;
  
  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
    return 'недель';
  }
  
  if (lastDigit === 1) {
    return 'неделя';
  }
  
  if (lastDigit >= 2 && lastDigit <= 4) {
    return 'недели';
  }
  
  return 'недель';
};

const formatExercises = (count: number): string => {
  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;
  
  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
    return 'упражнений';
  }
  
  if (lastDigit === 1) {
    return 'упражнение';
  }
  
  if (lastDigit >= 2 && lastDigit <= 4) {
    return 'упражнения';
  }
  
  return 'упражнений';
};

const formatPlans = (count: number): string => {
  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;
  
  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
    return 'планов';
  }
  
  if (lastDigit === 1) {
    return 'план';
  }
  
  if (lastDigit >= 2 && lastDigit <= 4) {
    return 'плана';
  }
  
  return 'планов';
};

const formatCycles = (count: number): string => {
  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;
  
  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
    return 'циклов';
  }
  
  if (lastDigit === 1) {
    return 'цикл';
  }
  
  if (lastDigit >= 2 && lastDigit <= 4) {
    return 'цикла';
  }
  
  return 'циклов';
};
</script>

<style scoped>
.training-program-card {
  padding: 24px !important;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: visible;
  border: 2px solid rgba(255, 255, 255, 0.1);
}

.training-program-card.featured {
  border-color: rgba(124, 58, 237, 0.3);
  background: rgba(124, 58, 237, 0.05);
}

.training-program-card.installed {
  border-color: rgba(34, 197, 94, 0.3);
  background: rgba(34, 197, 94, 0.05);
}

/* Ribbon */
.ribbon {
  position: absolute;
  top: 0;
  right: 0;
  z-index: 10;
  width: 50px;
  height: 50px;
  overflow: hidden;
  pointer-events: none;
}

.ribbon span {
  position: absolute;
  top: 9px;
  right: -17px;
  width: 70px;
  padding: 3px 0;
  background: #f59e0b;
  color: white;
  font-size: 10px;
  font-weight: 700;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 1px;
  transform: rotate(45deg);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  line-height: 1;
}

/* Header */
.program-header {
  margin-bottom: 16px;
  margin-top: 8px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.program-title {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: var(--ion-text-color);
  line-height: 1.2;
  flex: 1;
  min-width: 0;
  word-break: break-word;
}

/* Author */
.program-author {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.author-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--ion-color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 14px;
  flex-shrink: 0;
}

.author-name {
  font-size: 13px;
  color: var(--ion-color-medium);
  font-weight: 500;
}

/* Features */
.program-features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
  margin-bottom: 24px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.feature-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: var(--ion-color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 18px;
  flex-shrink: 0;
}

.feature-content {
  display: flex;
  flex-direction: column;
}

.feature-value {
  font-size: 18px;
  font-weight: 700;
  color: var(--ion-text-color);
  line-height: 1.2;
}

.feature-label {
  font-size: 11px;
  color: var(--ion-color-medium);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-top: 2px;
}

.feature-level .feature-icon {
  background: #f59e0b;
}

.feature-exercises .feature-icon {
  background: #3b82f6;
}

.feature-plans .feature-icon {
  background: #8b5cf6;
}

.feature-cycles .feature-icon {
  background: #10b981;
}

/* Footer with CTA button */
.program-footer {
  margin-top: auto;
  padding-top: 16px;
}

.primary-button,
.secondary-button {
  width: 100%;
  padding: 14px 20px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border: none;
  min-height: 48px;
  position: relative;
  overflow: hidden;
}

.primary-button {
  background: var(--ion-color-primary);
  color: white;
}

.secondary-button {
  background: #22c55e;
  color: white;
}

.primary-button:disabled,
.secondary-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.button-content {
  display: flex;
  align-items: center;
  gap: 10px;
}

.button-loading {
  display: flex;
  align-items: center;
  gap: 10px;
}

.primary-button i,
.secondary-button i {
  font-size: 16px;
}

/* Responsive adjustments */
@media (max-width: 480px) {
  .program-features {
    grid-template-columns: 1fr;
  }
  
  .program-title {
    font-size: 20px;
  }
}
</style>

