<template>
  <ion-modal :is-open="isOpen" @did-dismiss="handleModalClose">
    <ion-header>
      <ion-toolbar>
        <ion-title>Поделиться циклом</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="handleModalClose">
            <i class="fas fa-times"></i>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    
    <ion-content>
      <div class="share-dialog-content">
        <div v-if="loading" class="loading-state">
          <ion-spinner name="crescent"></ion-spinner>
          <p>Генерация ссылки...</p>
        </div>

        <div v-else-if="error" class="error-state">
          <div class="error-icon">
            <i class="fas fa-exclamation-triangle"></i>
          </div>
          <h3>Ошибка</h3>
          <p>{{ error }}</p>
          <button
            type="button"
            class="modern-button primary-button"
            @click="handleRetry"
          >
            <i class="fas fa-redo"></i>
            Попробовать снова
          </button>
        </div>

        <div v-else-if="shareLink" class="share-content">
          <div class="share-icon">
            <i class="fas fa-share-alt"></i>
          </div>
          
          <h2>Поделиться программой</h2>
          <p class="share-description">Отправьте эту ссылку друзьям, чтобы они могли просмотреть и импортировать ваш цикл тренировок.</p>
          
          <div class="share-link-container">
            <div class="link-input-wrapper">
              <input
                ref="linkInput"
                type="text"
                :value="shareLink"
                readonly
                class="link-input"
                @click="selectLink"
              />
              <button
                type="button"
                class="copy-button"
                @click="handleCopy"
                :disabled="isCopying"
                title="Копировать ссылку"
              >
                <i v-if="isCopying" class="fas fa-spinner fa-spin"></i>
                <i v-else-if="copied" class="fas fa-check"></i>
                <i v-else class="fas fa-copy"></i>
              </button>
            </div>
            <p v-if="copied" class="copy-success">
              <i class="fas fa-check-circle"></i>
              Ссылка скопирована!
            </p>
          </div>

          <div class="share-id-info">
            <p class="share-id-label">ID ссылки:</p>
            <p class="share-id-value">{{ shareId }}</p>
          </div>

          <div class="share-actions">
            <button
              v-if="canUseWebShare"
              type="button"
              class="modern-button primary-button share-button"
              @click="handleWebShare"
            >
              <i class="fas fa-share"></i>
              Поделиться
            </button>
            <button
              type="button"
              class="modern-button secondary-button"
              @click="handleModalClose"
            >
              Закрыть
            </button>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-modal>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
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
import { cyclesService } from '@/services';
import { copyToClipboard } from '@/utils/clipboard';
import { useToast } from '@/composables/useToast';
import { errorHandler } from '@/utils/error-handler';
import type { ShareLinkResponse } from '@/types/models/cycle.types';

interface Props {
  isOpen: boolean;
  cycleId: number;
}

interface Emits {
  close: [];
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const { showSuccess, showError } = useToast();

const loading = ref(false);
const error = ref<string | null>(null);
const shareLink = ref<string | null>(null);
const shareId = ref<string | null>(null);
const isCopying = ref(false);
const copied = ref(false);
const linkInput = ref<HTMLInputElement | null>(null);

// Check if Web Share API is available
const canUseWebShare = computed(() => {
  return typeof navigator !== 'undefined' && 'share' in navigator;
});

const fetchShareLink = async () => {
  if (!props.cycleId || props.cycleId <= 0) {
    error.value = 'Неверный ID цикла';
    loading.value = false;
    return;
  }

  loading.value = true;
  error.value = null;
  shareLink.value = null;
  shareId.value = null;
  copied.value = false;

  try {
    const response: ShareLinkResponse = await cyclesService.generateShareLink(
      props.cycleId.toString()
    );
    shareLink.value = response.share_link;
    shareId.value = response.share_id;
  } catch (err) {
    errorHandler.log(err, 'ShareCycleModal.fetchShareLink');
    const errorMessage = errorHandler.format(err);
    
    // Handle specific error cases
    if (errorMessage.includes('403') || errorMessage.includes('нет прав')) {
      error.value = 'Цикл не найден или у вас нет прав на обмен этой программой';
    } else if (errorMessage.includes('404')) {
      error.value = 'Цикл не найден';
    } else {
      error.value = errorMessage || 'Не удалось создать ссылку для обмена';
    }
  } finally {
    loading.value = false;
  }
};

const handleRetry = () => {
  fetchShareLink();
};

const handleCopy = async () => {
  if (!shareLink.value) return;

  isCopying.value = true;
  copied.value = false;

  try {
    const success = await copyToClipboard(shareLink.value);
    if (success) {
      copied.value = true;
      await showSuccess('Ссылка скопирована в буфер обмена');
      setTimeout(() => {
        copied.value = false;
      }, 3000);
    } else {
      await showError('Не удалось скопировать ссылку');
    }
  } catch (err) {
    errorHandler.log(err, 'ShareCycleModal.handleCopy');
    await showError('Ошибка при копировании ссылки');
  } finally {
    isCopying.value = false;
  }
};

const selectLink = () => {
  if (linkInput.value) {
    linkInput.value.select();
  }
};

const handleWebShare = async () => {
  if (!shareLink.value || !canUseWebShare.value) return;

  try {
    await navigator.share({
      title: 'Тренировочный цикл',
      text: 'Посмотрите мой тренировочный цикл',
      url: shareLink.value,
    });
  } catch (err: any) {
    // User cancelled or error occurred
    if (err.name !== 'AbortError') {
      errorHandler.log(err, 'ShareCycleModal.handleWebShare');
    }
  }
};

const handleModalClose = () => {
  const activeElement = document.activeElement as HTMLElement;
  if (activeElement && activeElement.blur) {
    activeElement.blur();
  }
  emit('close');
};

onMounted(() => {
  if (props.isOpen && props.cycleId > 0) {
    fetchShareLink();
  }
});

// Watch for modal opening
watch(() => props.isOpen, (newValue) => {
  if (newValue && props.cycleId > 0 && !shareLink.value) {
    fetchShareLink();
  }
});
</script>

<style scoped>
.share-dialog-content {
  padding: 24px;
  text-align: center;
  max-width: 500px;
  margin: 0 auto;
}

.loading-state,
.error-state {
  padding: 40px 20px;
  text-align: center;
}

.loading-state p {
  margin-top: 16px;
  color: var(--ion-color-medium);
}

.error-state {
  padding: 20px;
}

.error-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: rgba(239, 68, 68, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
}

.error-icon i {
  font-size: 2rem;
  color: #ef4444;
}

.error-state h3 {
  margin: 0 0 12px 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--ion-text-color);
}

.error-state p {
  margin: 0 0 24px 0;
  color: var(--ion-color-medium);
  line-height: 1.5;
}

.share-content {
  text-align: center;
}

.share-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: var(--ion-color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px;
}

.share-icon i {
  font-size: 2.5rem;
  color: white;
}

.share-content h2 {
  margin: 0 0 12px 0;
  font-size: 24px;
  font-weight: 700;
  color: var(--ion-text-color);
}

.share-description {
  margin: 0 0 24px 0;
  font-size: 15px;
  color: var(--ion-color-medium);
  line-height: 1.6;
  text-align: center;
}

.share-link-container {
  margin-bottom: 20px;
}

.link-input-wrapper {
  display: flex;
  gap: 8px;
  align-items: center;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 4px;
  margin-bottom: 8px;
}

.link-input {
  flex: 1;
  padding: 12px 16px;
  background: transparent;
  border: none;
  color: var(--ion-text-color);
  font-size: 14px;
  font-family: monospace;
  outline: none;
  cursor: text;
}

.link-input::selection {
  background: var(--ion-color-primary);
  color: white;
}

.copy-button {
  padding: 12px 16px;
  background: var(--ion-color-primary);
  border: none;
  border-radius: 8px;
  color: white;
  cursor: pointer;
  transition: opacity 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 48px;
}

.copy-button:hover:not(:disabled) {
  opacity: 0.9;
}

.copy-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.copy-button i {
  font-size: 16px;
}

.copy-success {
  margin: 8px 0 0 0;
  font-size: 14px;
  color: var(--ion-color-success);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.share-id-info {
  padding: 16px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  margin-bottom: 24px;
  text-align: left;
}

.share-id-label {
  margin: 0 0 4px 0;
  font-size: 12px;
  color: var(--ion-color-medium);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.share-id-value {
  margin: 0;
  font-size: 13px;
  font-family: monospace;
  color: var(--ion-text-color);
  word-break: break-all;
}

.share-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

.share-button {
  flex: 1;
}

.modern-button {
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

.primary-button {
  background: var(--ion-color-primary);
  color: white;
}

.secondary-button {
  background: rgba(255, 255, 255, 0.05);
  color: var(--ion-text-color);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.modern-button:hover:not(:disabled) {
  opacity: 0.9;
}

.modern-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.modern-button i {
  font-size: 16px;
}
</style>

