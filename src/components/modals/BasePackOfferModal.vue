<template>
  <ion-modal :is-open="isOpen" @did-dismiss="handleModalClose">
    <ion-header>
      <ion-toolbar>
        <ion-title>Базовый набор</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="handleModalClose">
            <i class="fas fa-times"></i>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div class="offer-content">
        <div class="offer-icon">
          <i class="fas fa-dumbbell"></i>
        </div>

        <h2>Начать с базовых упражнений?</h2>
        <p class="offer-description">
          Установите стартовый набор из <strong>~37 упражнений</strong>,
          покрывающих все основные группы мышц: грудь, спина, ноги, плечи, руки, пресс и другие.
        </p>

        <div class="info-box">
          <i class="fas fa-info-circle"></i>
          <span>Вы сможете удалить пакет в любой момент на странице упражнений</span>
        </div>

        <div class="dialog-actions">
          <button
            type="button"
            class="dialog-button skip-button"
            @click="$emit('skip')"
            :disabled="isInstalling"
          >
            <span>Пропустить</span>
          </button>

          <button
            type="button"
            class="dialog-button install-button"
            @click="$emit('install')"
            :disabled="isInstalling"
          >
            <ion-spinner v-if="isInstalling" name="crescent"></ion-spinner>
            <span v-else>
              <i class="fas fa-download"></i>
              Установить
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
  isInstalling?: boolean;
}

interface Emits {
  install: [];
  skip: [];
}

defineProps<Props>();
const emit = defineEmits<Emits>();

const handleModalClose = () => {
  const activeElement = document.activeElement as HTMLElement;
  if (activeElement && activeElement.blur) {
    activeElement.blur();
  }
  emit('skip');
};
</script>

<style scoped>
.offer-content {
  padding: 24px;
  text-align: center;
  max-width: 400px;
  margin: 0 auto;
}

.offer-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: var(--ion-color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px;
}

.offer-icon i {
  font-size: 2.5rem;
  color: white;
}

.offer-content h2 {
  margin: 0 0 12px 0;
  font-size: 24px;
  font-weight: 700;
  color: var(--ion-text-color);
  text-align: center;
}

.offer-description {
  margin: 0 0 20px 0;
  font-size: 15px;
  color: var(--ion-color-medium);
  line-height: 1.6;
  text-align: center;
}

.offer-description strong {
  color: var(--ion-text-color);
}

.info-box {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: rgba(99, 102, 241, 0.1);
  border: 1px solid rgba(99, 102, 241, 0.2);
  border-radius: 10px;
  margin-bottom: 24px;
}

.info-box i {
  color: var(--ion-color-primary);
  font-size: 18px;
  flex-shrink: 0;
}

.info-box span {
  font-size: 14px;
  color: var(--ion-color-medium);
  line-height: 1.4;
  text-align: left;
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

.skip-button {
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
