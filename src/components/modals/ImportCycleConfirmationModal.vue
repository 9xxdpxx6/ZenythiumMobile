<template>
  <ion-modal :is-open="isOpen" @did-dismiss="handleModalClose">
    <ion-header>
      <ion-toolbar>
        <ion-title>Импорт программы</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="handleModalClose">
            <i class="fas fa-times"></i>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    
    <ion-content>
      <div class="import-dialog-content">
        <div class="import-icon">
          <i class="fas fa-download"></i>
        </div>
        
        <h2>Импортировать программу?</h2>
        <p class="cycle-name">"{{ cycleName }}"</p>
        
        <div class="cycle-info">
          <div class="info-item">
            <i class="fas fa-calendar-week"></i>
            <span><strong>{{ plansCount }}</strong> {{ plansCountText }}</span>
          </div>
          <div class="info-item">
            <i class="fas fa-dumbbell"></i>
            <span><strong>{{ exercisesCount }}</strong> {{ exercisesCountText }}</span>
          </div>
        </div>

        <div class="warning-box">
          <i class="fas fa-info-circle"></i>
          <div class="warning-content">
            <p><strong>Внимание!</strong></p>
            <p>Будут созданы копии всех планов и упражнений. Программа будет добавлена в ваш аккаунт как новый цикл.</p>
          </div>
        </div>
        
        <div class="dialog-actions">
          <button
            type="button"
            class="dialog-button cancel-button"
            @click="$emit('cancel')"
            :disabled="isImporting"
          >
            <i class="fas fa-times"></i>
            Отмена
          </button>
          
          <button
            type="button"
            class="dialog-button import-button"
            @click="$emit('confirm')"
            :disabled="isImporting"
          >
            <ion-spinner v-if="isImporting" name="crescent"></ion-spinner>
            <span v-else>
              <i class="fas fa-download"></i>
              Импортировать
            </span>
          </button>
        </div>
      </div>
    </ion-content>
  </ion-modal>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonSpinner,
} from '@ionic/vue';

interface Props {
  isOpen: boolean;
  cycleName: string;
  plansCount: number;
  exercisesCount: number;
  isImporting?: boolean;
}

interface Emits {
  confirm: [];
  cancel: [];
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const plansCountText = computed(() => {
  const count = props.plansCount;
  if (count === 1) return 'план';
  if (count >= 2 && count <= 4) return 'плана';
  return 'планов';
});

const exercisesCountText = computed(() => {
  const count = props.exercisesCount;
  if (count === 1) return 'упражнение';
  if (count >= 2 && count <= 4) return 'упражнения';
  return 'упражнений';
});

const handleModalClose = () => {
  const activeElement = document.activeElement as HTMLElement;
  if (activeElement && activeElement.blur) {
    activeElement.blur();
  }
  emit('cancel');
};
</script>

<style scoped>
.import-dialog-content {
  padding: 24px;
  text-align: center;
  max-width: 400px;
  margin: 0 auto;
}

.import-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: var(--ion-color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px;
}

.import-icon i {
  font-size: 2.5rem;
  color: white;
}

.import-dialog-content h2 {
  margin: 0 0 12px 0;
  font-size: 26px;
  font-weight: 700;
  color: var(--ion-text-color);
  text-align: center;
}

.cycle-name {
  font-size: 20px;
  font-weight: 600;
  color: var(--ion-color-primary);
  margin: 0 0 24px 0;
  text-align: center;
}

.cycle-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 15px;
  color: var(--ion-text-color);
  text-align: left;
}

.info-item i {
  font-size: 18px;
  color: var(--ion-color-primary);
  width: 24px;
  text-align: center;
}

.info-item strong {
  font-weight: 600;
  color: var(--ion-color-primary);
}

.warning-box {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: 12px;
  margin-bottom: 24px;
  text-align: left;
}

.warning-box i {
  color: #f59e0b;
  font-size: 20px;
  flex-shrink: 0;
  margin-top: 2px;
}

.warning-content {
  flex: 1;
}

.warning-content p {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: var(--ion-text-color);
  line-height: 1.5;
}

.warning-content p:last-child {
  margin-bottom: 0;
}

.warning-content strong {
  color: #f59e0b;
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
  transition: opacity 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 48px;
}

.cancel-button {
  background: rgba(255, 255, 255, 0.05);
  color: var(--ion-text-color);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.import-button {
  background: var(--ion-color-primary);
  color: white;
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

