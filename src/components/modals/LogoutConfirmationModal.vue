<template>
  <ion-modal :is-open="isOpen" @did-dismiss="handleModalClose">
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ title }}</ion-title>
      </ion-toolbar>
    </ion-header>
    
    <ion-content>
      <div class="logout-dialog-content">
        <div class="logout-icon">
          <i class="fas fa-sign-out-alt"></i>
        </div>
        
        <h2>{{ title }}</h2>
        <p>{{ message }}</p>
        
        <div class="dialog-actions">
          <button
            type="button"
            class="dialog-button cancel-button"
            @click="$emit('cancel')"
          >
            <i class="fas fa-times"></i>
            Отмена
          </button>
          
          <button
            type="button"
            class="dialog-button logout-button"
            @click="$emit('confirm')"
            :disabled="isLoggingOut"
          >
            <ion-spinner v-if="isLoggingOut" name="crescent"></ion-spinner>
            <span v-else>
              <i class="fas fa-sign-out-alt"></i>
              Выйти
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
  IonSpinner,
} from '@ionic/vue';

interface Props {
  isOpen: boolean;
  title?: string;
  message?: string;
  isLoggingOut?: boolean;
}

interface Emits {
  confirm: [];
  cancel: [];
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Выход из аккаунта',
  message: 'Вы уверены, что хотите выйти из аккаунта?',
  isLoggingOut: false,
});

const emit = defineEmits<Emits>();

// Функция для обработки закрытия модального окна
const handleModalClose = () => {
  // Убираем фокус с любого активного элемента
  const activeElement = document.activeElement as HTMLElement;
  if (activeElement && activeElement.blur) {
    activeElement.blur();
  }
  
  // Эмитим событие отмены
  emit('cancel');
};
</script>

<style scoped>
.logout-dialog-content {
  padding: 24px;
  text-align: center;
  max-width: 400px;
  margin: 0 auto;
}

.logout-icon {
  margin-bottom: 20px;
}

.logout-icon i {
  font-size: 4rem;
  color: var(--ion-color-warning);
}

.logout-dialog-content h2 {
  margin: 0 0 16px 0;
  font-size: 24px;
  font-weight: 600;
  color: var(--ion-text-color);
}

.logout-dialog-content p {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: var(--ion-color-medium);
  line-height: 1.5;
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

.cancel-button:hover {
  background: rgba(255, 255, 255, 0.1);
}

.logout-button {
  background: var(--ion-color-danger);
  color: white;
}

.logout-button:hover {
  background: var(--ion-color-danger);
}

.logout-button:disabled {
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

