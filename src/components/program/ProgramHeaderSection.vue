<template>
  <div class="program-header-section">
    <div class="program-title-wrapper">
      <h1 class="program-name">{{ program.name }}</h1>
      <div v-if="!program.is_active" class="inactive-badge">
        <span>Неактивна</span>
      </div>
    </div>
    <div v-if="program.description" class="program-description">
      {{ program.description }}
    </div>
    
    <div class="program-info-grid">
      <div class="info-item" v-if="program.author">
        <div class="info-label">Автор</div>
        <div class="info-value">{{ program.author.name }}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Продолжительность</div>
        <div class="info-value">{{ program.duration_weeks }} {{ formatWeeks(program.duration_weeks) }}</div>
      </div>
      <div class="info-item" v-if="program.cycles_count">
        <div class="info-label">Циклов</div>
        <div class="info-value">{{ program.cycles_count }}</div>
      </div>
      <div class="info-item" v-if="program.plans_count">
        <div class="info-label">Планов</div>
        <div class="info-value">{{ program.plans_count }}</div>
      </div>
      <div class="info-item" v-if="program.exercises_count">
        <div class="info-label">Упражнений</div>
        <div class="info-value">{{ program.exercises_count }}</div>
      </div>
    </div>

    <div class="program-actions">
      <button
        @click="$emit('export')"
        class="export-button"
        :disabled="isInstalling"
      >
        <i class="fas fa-file-export"></i>
        <span>Экспорт</span>
      </button>
      
      <button
        v-if="!program.is_installed && program.is_active"
        @click="$emit('install')"
        class="install-button"
        :disabled="isInstalling"
      >
        <i v-if="isInstalling" class="fas fa-spinner fa-spin"></i>
        <i v-else class="fas fa-download"></i>
        <span>{{ isInstalling ? 'Установка...' : 'Установить программу' }}</span>
      </button>
      <div v-else-if="program.is_installed && program.is_active" class="installed-badge">
        <i class="fas fa-check-circle"></i>
        <span>Программа установлена</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatWeeks } from '@/utils/formatters';
import type { TrainingProgramDetail } from '@/types/models/training-program.types';

interface Props {
  program: TrainingProgramDetail;
  isInstalling?: boolean;
}

interface Emits {
  (e: 'install'): void;
  (e: 'export'): void;
}

withDefaults(defineProps<Props>(), {
  isInstalling: false,
});

defineEmits<Emits>();
</script>

<style scoped>
.program-header-section {
  margin-bottom: 32px;
}

.program-title-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.program-name {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  color: var(--ion-text-color);
  line-height: 1.2;
}

.inactive-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  background: rgba(156, 163, 175, 0.15);
  border: 1px solid rgba(156, 163, 175, 0.3);
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  width: fit-content;
}

.program-description {
  margin: 0 0 24px 0;
  font-size: 16px;
  color: var(--ion-color-medium);
  line-height: 1.5;
}

.program-info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.info-item {
  padding: 12px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.info-label {
  font-size: 12px;
  color: var(--ion-color-medium);
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-value {
  font-size: 18px;
  font-weight: 600;
  color: var(--ion-text-color);
}

.program-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 16px;
}

.export-button {
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
  border: 1px solid rgba(255, 255, 255, 0.2);
  min-height: 48px;
  background: rgba(255, 255, 255, 0.05);
  color: var(--ion-text-color);
  transition: all 0.2s;
}

.export-button:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.3);
}

.export-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.install-button {
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
  background: var(--ion-color-primary);
  color: white;
}

.install-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.installed-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 20px;
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.3);
  border-radius: 12px;
  color: #22c55e;
  font-weight: 600;
  margin-top: 16px;
}
</style>



