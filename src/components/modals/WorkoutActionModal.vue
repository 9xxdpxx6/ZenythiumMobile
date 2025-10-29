<template>
  <ion-modal :is-open="isOpen" @did-dismiss="handleModalClose">
    <ion-header>
      <ion-toolbar>
        <ion-title>Действия с тренировкой</ion-title>
      </ion-toolbar>
    </ion-header>
    
    <ion-content>
      <div class="action-dialog-content">
        <div class="workout-info">
          <h3>{{ workout?.plan?.name || 'Тренировка' }}</h3>
          <p>{{ formatDate(workout?.started_at) }}</p>
        </div>
        
        <div class="dialog-actions">
          <button
            type="button"
            class="dialog-button edit-button"
            @click="$emit('edit')"
          >
            <i class="fas fa-edit"></i>
            Редактировать
          </button>
          
          <button
            type="button"
            class="dialog-button delete-button"
            @click="$emit('delete')"
            :disabled="isDeleting"
          >
            <ion-spinner v-if="isDeleting" name="crescent"></ion-spinner>
            <span v-else>
              <i class="fas fa-trash"></i>
              Удалить
            </span>
          </button>
          
          <button
            type="button"
            class="dialog-button cancel-button"
            @click="$emit('cancel')"
          >
            <i class="fas fa-times"></i>
            Отмена
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
import { Workout } from '@/types/api';

interface Props {
  isOpen: boolean;
  workout?: Workout;
  isDeleting?: boolean;
}

interface Emits {
  edit: [];
  delete: [];
  cancel: [];
}

const props = defineProps<Props>();
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

// Форматирование даты
const formatDate = (dateString?: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};
</script>

<style scoped>
/* Action Dialog Styles */
.action-dialog-content {
  padding: 24px;
  text-align: center;
  max-width: 400px;
  margin: 0 auto;
}

.workout-info {
  margin-bottom: 32px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.workout-info h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--ion-text-color);
}

.workout-info p {
  margin: 0;
  font-size: 14px;
  color: var(--ion-color-medium);
}

.dialog-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.dialog-button {
  width: 100%;
  padding: 16px 20px;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 52px;
}

.edit-button {
  background: var(--ion-color-primary);
  color: white;
}

.edit-button:hover {
  background: var(--ion-color-primary-shade);
}

.delete-button {
  background: var(--ion-color-danger);
  color: white;
}

.delete-button:hover {
  background: var(--ion-color-danger-shade);
}

.delete-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.cancel-button {
  background: rgba(255, 255, 255, 0.1);
  color: var(--ion-text-color);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.cancel-button:hover {
  background: rgba(255, 255, 255, 0.15);
}

.dialog-button i {
  font-size: 16px;
}

.dialog-button ion-spinner {
  width: 20px;
  height: 20px;
}
</style>
