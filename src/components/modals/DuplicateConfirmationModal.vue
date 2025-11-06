<template>
  <ion-modal :is-open="isOpen" @did-dismiss="handleModalClose">
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ title }}</ion-title>
      </ion-toolbar>
    </ion-header>
    
    <ion-content>
      <div class="duplicate-dialog-content">
        <div class="duplicate-icon">
          <i class="fas fa-copy"></i>
        </div>
        
        <h2>{{ title }}</h2>
        <p>{{ message }} <strong v-if="itemName">"{{ itemName }}"</strong>?</p>
        
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
            class="dialog-button duplicate-button"
            @click="$emit('confirm')"
            :disabled="isDuplicating"
          >
            <ion-spinner v-if="isDuplicating" name="crescent"></ion-spinner>
            <span v-else>
              <i class="fas fa-copy"></i>
              Дублировать
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
  title: string;
  message: string;
  itemName?: string;
  isDuplicating?: boolean;
}

interface Emits {
  confirm: [];
  cancel: [];
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Функция для обработки закрытия модального окна
const handleModalClose = (): void => {
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
/* Duplicate Confirmation Dialog Styles */
.duplicate-dialog-content {
  padding: 24px;
  text-align: center;
  max-width: 400px;
  margin: 0 auto;
}

.duplicate-icon {
  margin-bottom: 20px;
}

.duplicate-icon i {
  font-size: 4rem;
  color: var(--ion-color-primary);
}

.duplicate-dialog-content h2 {
  margin: 0 0 16px 0;
  font-size: 24px;
  font-weight: 600;
  color: var(--ion-text-color);
}

.duplicate-dialog-content p {
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

.duplicate-button {
  background: var(--ion-color-primary);
  color: white;
}

.duplicate-button:hover {
  background: var(--ion-color-primary);
}

.duplicate-button:disabled {
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

