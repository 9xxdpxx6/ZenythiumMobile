<template>
  <ion-modal :is-open="isOpen" @did-dismiss="handleModalClose">
    <ion-header>
      <ion-toolbar>
        <ion-title>Установка программы</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="handleModalClose">
            <i class="fas fa-times"></i>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    
    <ion-content>
      <div class="install-dialog-content">
        <div class="install-icon">
          <i class="fas fa-rocket"></i>
        </div>
        
        <h2>Начать тренировки?</h2>
        <p class="program-name">"{{ programName }}"</p>
        <p class="benefits-text">После установки программа будет доступна в вашем кабинете. Вы сможете начать тренировки сразу!</p>
        <div v-if="warningText" class="warning-box">
          <i class="fas fa-info-circle"></i>
          <span>{{ warningText }}</span>
        </div>
        
        <div class="dialog-actions">
          <button
            type="button"
            class="dialog-button cancel-button"
            @click="$emit('cancel')"
            :disabled="isInstalling"
          >
            <span>Отмена</span>
          </button>
          
          <button
            type="button"
            class="dialog-button install-button"
            @click="$emit('confirm')"
            :disabled="isInstalling"
          >
            <ion-spinner v-if="isInstalling" name="crescent"></ion-spinner>
            <span v-else>
              <i class="fas fa-rocket"></i>
              Установить и начать
            </span>
          </button>
        </div>
      </div>
    </ion-content>
  </ion-modal>
</template>

<script setup lang="ts">
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
  programName: string;
  warningText?: string;
  isInstalling?: boolean;
}

interface Emits {
  confirm: [];
  cancel: [];
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const handleModalClose = () => {
  const activeElement = document.activeElement as HTMLElement;
  if (activeElement && activeElement.blur) {
    activeElement.blur();
  }
  emit('cancel');
};
</script>

<style scoped>
.install-dialog-content {
  padding: 24px;
  text-align: center;
  max-width: 400px;
  margin: 0 auto;
}

.install-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: var(--ion-color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px;
}

.install-icon i {
  font-size: 2.5rem;
  color: white;
}

.install-dialog-content h2 {
  margin: 0 0 12px 0;
  font-size: 26px;
  font-weight: 700;
  color: var(--ion-text-color);
  text-align: center;
}

.program-name {
  font-size: 20px;
  font-weight: 600;
  color: var(--ion-color-primary);
  margin: 0 0 16px 0;
  text-align: center;
}

.benefits-text {
  margin: 0 0 20px 0;
  font-size: 15px;
  color: var(--ion-color-medium);
  line-height: 1.6;
  text-align: center;
}

.warning-box {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: 10px;
  margin-bottom: 24px;
}

.warning-box i {
  color: #f59e0b;
  font-size: 18px;
  flex-shrink: 0;
}

.warning-box span {
  font-size: 14px;
  color: var(--ion-color-medium);
  line-height: 1.4;
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
  background: rgba(255, 255, 255, 0.05);
  color: var(--ion-text-color);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.install-button {
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

