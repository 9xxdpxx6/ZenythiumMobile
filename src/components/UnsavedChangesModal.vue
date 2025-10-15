<template>
  <ion-modal :is-open="isOpen" @did-dismiss="handleCancel">
    <ion-header>
      <ion-toolbar>
        <ion-title>Несохраненные изменения</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="handleCancel">
            <i class="fas fa-times"></i>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    
    <ion-content>
      <div class="modal-content">
        <p>У вас есть несохраненные изменения. Вы уверены, что хотите покинуть страницу?</p>
        
        <div class="modal-actions">
          <button
            type="button"
            class="modern-button secondary-button"
            @click="handleCancel"
          >
            ОСТАТЬСЯ
          </button>
          
          <button
            type="button"
            class="modern-button primary-button"
            @click="handleConfirm"
          >
            ПОКИНУТЬ
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
} from '@ionic/vue';

interface Props {
  isOpen: boolean;
}

interface Emits {
  confirm: [];
  cancel: [];
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const handleConfirm = () => {
  emit('confirm');
};

const handleCancel = () => {
  emit('cancel');
};
</script>

<style scoped>
.modal-content {
  padding: 20px;
  text-align: center;
}

.modal-content p {
  margin: 0 0 24px 0;
  font-size: 16px;
  color: var(--ion-text-color);
  line-height: 1.5;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.modal-actions .modern-button {
  flex: 1;
  max-width: 120px;
}

.modern-button {
  background: var(--ion-color-primary);
  color: white;
  border: none;
  border-radius: 12px;
  padding: 14px 24px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  min-height: 48px;
}

.modern-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.modern-button.primary-button {
  background: var(--ion-color-primary);
}

.modern-button.secondary-button {
  background: rgba(255, 255, 255, 0.1);
  color: var(--ion-text-color);
}

.modern-button i {
  font-size: 16px;
}
</style>
