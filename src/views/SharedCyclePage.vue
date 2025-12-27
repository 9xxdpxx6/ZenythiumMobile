<template>
  <BasePage>
    <PageHeader title="Общая программа">
      <template #start>
        <ion-button @click="handleBack">
          <i class="fas fa-arrow-left"></i>
        </ion-button>
      </template>
    </PageHeader>

    <ion-content :fullscreen="true">
      <PageContainer>
        <LoadingState v-if="loading" message="Загрузка программы..." />

        <div v-else-if="error" class="error-state">
          <div class="error-icon">
            <i class="fas fa-exclamation-triangle"></i>
          </div>
          <h2>{{ errorTitle }}</h2>
          <p>{{ errorMessage }}</p>
          <button @click="handleBack" class="modern-button primary-button">
            <i class="fas fa-arrow-left"></i>
            Назад
          </button>
        </div>

        <div v-else-if="sharedCycle" class="shared-cycle-details">
          <!-- Badge indicating this is a shared cycle -->
          <div class="shared-badge">
            <i class="fas fa-share-alt"></i>
            <span>Общая программа</span>
          </div>

          <!-- Header Section -->
          <div class="cycle-header-section">
            <h1 class="cycle-title">{{ sharedCycle.name }}</h1>
            
            <div v-if="sharedCycle.author" class="author-info">
              <i class="fas fa-user"></i>
              <span>Автор: <strong>{{ sharedCycle.author.name }}</strong></span>
            </div>

            <div class="cycle-stats">
              <div class="stat-item">
                <i class="fas fa-calendar-week"></i>
                <span><strong>{{ sharedCycle.weeks }}</strong> {{ weeksText }}</span>
              </div>
              <div class="stat-item">
                <i class="fas fa-list"></i>
                <span><strong>{{ sharedCycle.plans_count }}</strong> {{ plansText }}</span>
              </div>
              <div class="stat-item">
                <i class="fas fa-dumbbell"></i>
                <span><strong>{{ sharedCycle.exercises_count }}</strong> {{ exercisesText }}</span>
              </div>
            </div>

            <div class="view-stats">
              <div class="view-stat-item">
                <i class="fas fa-eye"></i>
                <span>{{ sharedCycle.view_count }} {{ viewCountText }}</span>
              </div>
              <div class="view-stat-item">
                <i class="fas fa-download"></i>
                <span>{{ sharedCycle.import_count }} {{ importCountText }}</span>
              </div>
            </div>
          </div>

          <!-- Structure Section -->
          <SharedCycleStructureSection :structure="sharedCycle.structure" />

          <!-- Import Button -->
          <div class="import-section">
            <button
              class="modern-button primary-button import-button"
              @click="handleImportClick"
              :disabled="isImporting"
            >
              <ion-spinner v-if="isImporting" name="crescent"></ion-spinner>
              <span v-else>
                <i class="fas fa-download"></i>
                Импортировать программу
              </span>
            </button>
          </div>
        </div>
      </PageContainer>

      <!-- Import Confirmation Modal -->
      <ImportCycleConfirmationModal
        v-if="sharedCycle"
        :is-open="isImportModalOpen"
        :cycle-name="sharedCycle.name"
        :plans-count="sharedCycle.plans_count"
        :exercises-count="sharedCycle.exercises_count"
        :is-importing="isImporting"
        @confirm="confirmImport"
        @cancel="cancelImport"
      />
    </ion-content>
  </BasePage>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  IonContent,
  IonButton,
  IonSpinner,
} from '@ionic/vue';
import { useToast } from '@/composables/useToast';
import { cyclesService } from '@/services';
import { errorHandler } from '@/utils/error-handler';
import { isValidUUID } from '@/utils/validators';
import PageContainer from '@/components/ui/PageContainer.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import LoadingState from '@/components/ui/LoadingState.vue';
import BasePage from '@/components/swipe-back/BasePage.vue';
import ImportCycleConfirmationModal from '@/components/modals/ImportCycleConfirmationModal.vue';
import SharedCycleStructureSection from '@/components/program/SharedCycleStructureSection.vue';
import type { SharedCycle } from '@/types/models/cycle.types';

const route = useRoute();
const router = useRouter();
const shareId = route.params.shareId as string;

const sharedCycle = ref<SharedCycle | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);
const errorTitle = ref('Ошибка загрузки');
const errorMessage = ref('');
const isImporting = ref(false);
const isImportModalOpen = ref(false);

const { showSuccess, showError } = useToast();

// Computed for pluralization
const weeksText = computed(() => {
  const count = sharedCycle.value?.weeks || 0;
  if (count === 1) return 'неделя';
  if (count >= 2 && count <= 4) return 'недели';
  return 'недель';
});

const plansText = computed(() => {
  const count = sharedCycle.value?.plans_count || 0;
  if (count === 1) return 'план';
  if (count >= 2 && count <= 4) return 'плана';
  return 'планов';
});

const exercisesText = computed(() => {
  const count = sharedCycle.value?.exercises_count || 0;
  if (count === 1) return 'упражнение';
  if (count >= 2 && count <= 4) return 'упражнения';
  return 'упражнений';
});

const viewCountText = computed(() => {
  const count = sharedCycle.value?.view_count || 0;
  if (count === 1) return 'просмотр';
  if (count >= 2 && count <= 4) return 'просмотра';
  return 'просмотров';
});

const importCountText = computed(() => {
  const count = sharedCycle.value?.import_count || 0;
  if (count === 1) return 'импорт';
  if (count >= 2 && count <= 4) return 'импорта';
  return 'импортов';
});

const fetchSharedCycle = async (): Promise<void> => {
  // Validate UUID format
  if (!isValidUUID(shareId)) {
    error.value = 'invalid_uuid';
    errorTitle.value = 'Неверная ссылка';
    errorMessage.value = 'Формат ссылки неверный. Проверьте правильность ссылки.';
    return;
  }

  loading.value = true;
  error.value = null;
  errorTitle.value = 'Ошибка загрузки';
  errorMessage.value = '';

  try {
    sharedCycle.value = await cyclesService.getSharedCycle(shareId);
  } catch (err: unknown) {
    errorHandler.log(err, 'SharedCyclePage.fetchSharedCycle');
    const errorMsg = errorHandler.format(err);
    
    // Handle specific HTTP status codes
    if (errorMsg.includes('401') || errorMsg.includes('Unauthenticated')) {
      error.value = 'unauthorized';
      errorTitle.value = 'Требуется авторизация';
      errorMessage.value = 'Для просмотра программы необходимо войти в аккаунт.';
      // Redirect to login with shareId saved
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('pendingShareId', shareId);
      }
      router.push('/login');
      return;
    } else if (errorMsg.includes('404')) {
      error.value = 'not_found';
      errorTitle.value = 'Программа не найдена';
      errorMessage.value = 'Общая программа не найдена или была удалена.';
    } else if (errorMsg.includes('410')) {
      error.value = 'expired';
      errorTitle.value = 'Ссылка истекла';
      errorMessage.value = 'Ссылка истекла или была деактивирована автором.';
    } else if (errorMsg.includes('422')) {
      error.value = 'validation_error';
      errorTitle.value = 'Ошибка валидации';
      errorMessage.value = 'Невалидный формат ссылки.';
    } else {
      error.value = 'unknown';
      errorTitle.value = 'Ошибка загрузки';
      errorMessage.value = errorMsg || 'Не удалось загрузить программу. Попробуйте позже.';
    }
  } finally {
    loading.value = false;
  }
};

const handleImportClick = (): void => {
  isImportModalOpen.value = true;
};

const confirmImport = async (): Promise<void> => {
  if (!shareId) return;

  isImporting.value = true;

  try {
    const result = await cyclesService.importSharedCycle(shareId);
    await showSuccess(
      `Программа успешно импортирована! Создано ${result.plans_count} планов и ${result.exercises_count} упражнений.`
    );
    isImportModalOpen.value = false;
    // Redirect to the imported cycle
    router.push(`/cycle/${result.cycle_id}`);
  } catch (err: unknown) {
    errorHandler.log(err, 'SharedCyclePage.confirmImport');
    const errorMsg = errorHandler.format(err);
    
    // Handle specific error cases
    if (errorMsg.includes('400') || errorMsg.includes('свою собственную')) {
      await showError('Нельзя импортировать свою собственную программу');
    } else if (errorMsg.includes('404')) {
      await showError('Программа не найдена');
    } else if (errorMsg.includes('410')) {
      await showError('Ссылка истекла или деактивирована');
    } else if (errorMsg.includes('422')) {
      await showError('Программа слишком большая для импорта (максимум 100 планов, 500 упражнений)');
    } else {
      await showError(errorMsg || 'Ошибка при импорте программы');
    }
  } finally {
    isImporting.value = false;
  }
};

const cancelImport = (): void => {
  isImportModalOpen.value = false;
};

const handleBack = (): void => {
  router.push('/tabs/cycles');
};

onMounted(() => {
  fetchSharedCycle();
});
</script>

<style scoped>
.shared-cycle-details {
  padding-bottom: 40px;
}

.shared-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 20px;
  margin-bottom: 24px;
  font-size: 14px;
  color: #3b82f6;
}

.shared-badge i {
  font-size: 14px;
}

.cycle-header-section {
  margin-bottom: 32px;
}

.cycle-title {
  margin: 0 0 16px 0;
  font-size: 28px;
  font-weight: 700;
  color: var(--ion-text-color);
  line-height: 1.2;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
  font-size: 15px;
  color: var(--ion-color-medium);
}

.author-info i {
  color: var(--ion-color-primary);
}

.author-info strong {
  color: var(--ion-text-color);
}

.cycle-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 16px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  font-size: 14px;
  color: var(--ion-text-color);
}

.stat-item i {
  color: var(--ion-color-primary);
  font-size: 16px;
}

.stat-item strong {
  color: var(--ion-color-primary);
  font-weight: 600;
}

.view-stats {
  display: flex;
  gap: 20px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.view-stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--ion-color-medium);
}

.view-stat-item i {
  font-size: 14px;
}

.import-section {
  margin-top: 40px;
  padding-top: 32px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.import-button {
  width: 100%;
  padding: 16px 24px;
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.error-state {
  text-align: center;
  padding: 40px 20px;
}

.error-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: rgba(239, 68, 68, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px;
}

.error-icon i {
  font-size: 2.5rem;
  color: #ef4444;
}

.error-state h2 {
  margin: 0 0 12px 0;
  font-size: 24px;
  font-weight: 600;
  color: var(--ion-text-color);
}

.error-state p {
  margin: 0 0 24px 0;
  font-size: 15px;
  color: var(--ion-color-medium);
  line-height: 1.6;
}

.modern-button {
  padding: 12px 24px;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.primary-button {
  background: var(--ion-color-primary);
  color: white;
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

