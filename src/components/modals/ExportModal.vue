<template>
  <ion-modal :is-open="isOpen" @did-dismiss="handleModalClose">
    <ion-header>
      <ion-toolbar>
        <ion-title>Экспорт</ion-title>
      </ion-toolbar>
    </ion-header>
    
    <ion-content>
      <div class="export-dialog-content">
        <div class="export-icon">
          <i class="fas fa-file-export"></i>
        </div>
        
        <h2>Выберите параметры экспорта</h2>
        
        <div class="export-options">
          <div class="option-group">
            <label class="option-label">Формат</label>
            <div class="radio-group">
              <label class="radio-option">
                <input
                  type="radio"
                  value="json"
                  v-model="selectedFormat"
                  :disabled="isExporting"
                />
                <span class="radio-label">
                  <i class="fas fa-code"></i>
                  JSON
                </span>
              </label>
              <label class="radio-option">
                <input
                  type="radio"
                  value="pdf"
                  v-model="selectedFormat"
                  :disabled="isExporting"
                />
                <span class="radio-label">
                  <i class="fas fa-file-pdf"></i>
                  PDF
                </span>
              </label>
            </div>
          </div>
          
          <div class="option-group">
            <label class="option-label">Тип экспорта</label>
            <div class="radio-group">
              <label class="radio-option">
                <input
                  type="radio"
                  value="detailed"
                  v-model="selectedType"
                  :disabled="isExporting"
                />
                <span class="radio-label">
                  <i class="fas fa-chart-line"></i>
                  Подробный (с статистикой)
                </span>
              </label>
              <label class="radio-option">
                <input
                  type="radio"
                  value="structure"
                  v-model="selectedType"
                  :disabled="isExporting"
                />
                <span class="radio-label">
                  <i class="fas fa-sitemap"></i>
                  Структурный
                </span>
              </label>
            </div>
          </div>
        </div>
        
        <div class="dialog-actions">
          <button
            type="button"
            class="dialog-button cancel-button"
            @click="$emit('cancel')"
            :disabled="isExporting"
          >
            <i class="fas fa-times"></i>
            Отмена
          </button>
          
          <button
            type="button"
            class="dialog-button export-button"
            @click="handleExport"
            :disabled="isExporting"
          >
            <ion-spinner v-if="isExporting" name="crescent"></ion-spinner>
            <span v-else>
              <i class="fas fa-download"></i>
              Экспорт
            </span>
          </button>
        </div>
      </div>
    </ion-content>
  </ion-modal>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonSpinner,
} from '@ionic/vue';

interface Props {
  isOpen: boolean;
  isExporting?: boolean;
}

interface Emits {
  (e: 'export', format: 'json' | 'pdf', type: 'detailed' | 'structure'): void;
  (e: 'cancel'): void;
}

const props = withDefaults(defineProps<Props>(), {
  isExporting: false,
});

const emit = defineEmits<Emits>();

const selectedFormat = ref<'json' | 'pdf'>('pdf');
const selectedType = ref<'detailed' | 'structure'>('detailed');

const handleExport = () => {
  emit('export', selectedFormat.value, selectedType.value);
};

const handleModalClose = () => {
  const activeElement = document.activeElement as HTMLElement;
  if (activeElement && activeElement.blur) {
    activeElement.blur();
  }
  emit('cancel');
};
</script>

<style scoped>
.export-dialog-content {
  padding: 24px;
  max-width: 500px;
  margin: 0 auto;
}

.export-icon {
  text-align: center;
  margin-bottom: 20px;
}

.export-icon i {
  font-size: 3rem;
  color: var(--ion-color-primary);
}

.export-dialog-content h2 {
  margin: 0 0 24px 0;
  font-size: 24px;
  font-weight: 600;
  color: var(--ion-text-color);
  text-align: center;
}

.export-options {
  display: flex;
  flex-direction: column;
  gap: 24px;
  margin-bottom: 32px;
}

.option-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.option-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--ion-text-color);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.radio-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.radio-option {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.03);
  cursor: pointer;
  transition: all 0.2s;
}

.radio-option:hover:not(:has(input:disabled)) {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.3);
}

.radio-option input[type="radio"] {
  margin-right: 12px;
  cursor: pointer;
  width: 18px;
  height: 18px;
  accent-color: var(--ion-color-primary);
}

.radio-option:has(input:disabled) {
  opacity: 0.5;
  cursor: not-allowed;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  color: var(--ion-text-color);
  flex: 1;
}

.radio-label i {
  font-size: 16px;
  color: var(--ion-color-primary);
}

.radio-option:has(input:checked) {
  background: rgba(var(--ion-color-primary-rgb), 0.1);
  border-color: var(--ion-color-primary);
}

.dialog-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

.dialog-button {
  flex: 1;
  padding: 12px 20px;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 48px;
}

.cancel-button {
  background: rgba(255, 255, 255, 0.1);
  color: var(--ion-text-color);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.cancel-button:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
}

.export-button {
  background: var(--ion-color-primary);
  color: white;
}

.export-button:hover:not(:disabled) {
  background: var(--ion-color-primary);
}

.dialog-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.dialog-button i {
  font-size: 16px;
}

.dialog-button ion-spinner {
  width: 20px;
  height: 20px;
}
</style>

