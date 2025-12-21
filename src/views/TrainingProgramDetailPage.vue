<template>
  <BasePage>
    <PageHeader title="Программа">
      <template #start>
        <ion-button @click="router.push('/training-programs')">
          <i class="fas fa-arrow-left"></i>
        </ion-button>
      </template>
    </PageHeader>

    <ion-content :fullscreen="true">
      <PageContainer>
        <LoadingState v-if="loading" message="Загрузка программы..." />

        <div v-else-if="error" class="error-state">
          <i class="fas fa-exclamation-triangle error-icon"></i>
          <h2>Ошибка загрузки</h2>
          <p>{{ error }}</p>
          <button @click="fetchProgram" class="retry-button">
            Попробовать снова
          </button>
        </div>

        <div v-else-if="program" class="program-details">
          <ProgramHeaderSection
            :program="program"
            :is-installing="isInstalling"
            @install="handleInstallClick"
            @export="openExportModal"
          />

          <ProgramStructureSection :structure="program.structure" />
        </div>
      </PageContainer>

      <!-- Модалка подтверждения установки -->
      <InstallTrainingProgramModal
        :is-open="isInstallModalOpen"
        :program-name="program?.name || ''"
        :is-installing="isInstalling"
        @confirm="confirmInstall"
        @cancel="cancelInstall"
      />

      <!-- Модалка экспорта -->
      <ExportModal
        :is-open="isExportModalOpen"
        :is-exporting="isExporting"
        @export="handleExport"
        @cancel="closeExportModal"
      />
    </ion-content>
  </BasePage>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  IonPage,
  IonContent,
  IonButton,
} from '@ionic/vue';
import { useToast, useExport } from '@/composables';
import { trainingProgramsService } from '@/services';
import PageContainer from '@/components/ui/PageContainer.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import LoadingState from '@/components/ui/LoadingState.vue';
import InstallTrainingProgramModal from '@/components/modals/InstallTrainingProgramModal.vue';
import ExportModal from '@/components/modals/ExportModal.vue';
import ProgramHeaderSection from '@/components/program/ProgramHeaderSection.vue';
import ProgramStructureSection from '@/components/program/ProgramStructureSection.vue';
import type { TrainingProgramDetail } from '@/types/models/training-program.types';

const route = useRoute();
const router = useRouter();
const programId = route.params.id as string;

// Guard: don't fetch if programId is undefined (e.g., when rendered as previousPageComponent)
const isValidProgramId = computed(() => {
  return programId && programId !== 'undefined' && programId.trim() !== '';
});

const program = ref<TrainingProgramDetail | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);
const isInstalling = ref(false);
const isInstallModalOpen = ref(false);
const isExportModalOpen = ref(false);
const isExporting = ref(false);

const { showSuccess, showError } = useToast();
const { handleExport: handleExportDownload } = useExport();

// Swipe back is handled automatically by BasePage

const fetchProgram = async (): Promise<void> => {
  // Don't fetch if programId is invalid (e.g., when rendered as previousPageComponent)
  if (!isValidProgramId.value) {
    return;
  }
  
  loading.value = true;
  error.value = null;
  
  try {
    program.value = await trainingProgramsService.getById(programId);
  } catch (err: unknown) {
    const errorMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Ошибка при загрузке программы';
    error.value = errorMessage;
    await showError(errorMessage);
  } finally {
    loading.value = false;
  }
};

const handleInstallClick = (): void => {
  isInstallModalOpen.value = true;
};

const confirmInstall = async (): Promise<void> => {
  if (!program.value) return;
  
  isInstalling.value = true;
  
  try {
    await trainingProgramsService.install(program.value.id.toString());
    await showSuccess('Программа успешно установлена');
    isInstallModalOpen.value = false;
    // Обновляем данные программы
    await fetchProgram();
  } catch (err: unknown) {
    const errorMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Ошибка при установке программы';
    await showError(errorMessage);
  } finally {
    isInstalling.value = false;
  }
};

const cancelInstall = (): void => {
  isInstallModalOpen.value = false;
};

const openExportModal = (): void => {
  isExportModalOpen.value = true;
};

const closeExportModal = (): void => {
  isExportModalOpen.value = false;
};

const handleExport = async (format: 'json' | 'pdf', type: 'detailed' | 'structure'): Promise<void> => {
  if (!program.value) return;

  isExporting.value = true;
  try {
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `program-${program.value.id}-${type}-${timestamp}.${format}`;

    await handleExportDownload(
      () => trainingProgramsService.exportProgram(program.value!.id.toString(), format, type),
      filename,
      format
    );

    closeExportModal();
  } catch (error) {
    // Error handling is done in useExport
  } finally {
    isExporting.value = false;
  }
};

onMounted(() => {
  // Only fetch if programId is valid
  if (isValidProgramId.value) {
    fetchProgram();
  }
});
</script>

<style scoped>
.program-details {
  padding: 0;
}

.error-state {
  text-align: center;
  padding: 40px 20px;
}

.error-icon {
  font-size: 48px;
  color: var(--ion-color-danger);
  margin-bottom: 16px;
}

.error-state h2 {
  margin: 0 0 8px 0;
  color: var(--ion-text-color);
}

.error-state p {
  margin: 0 0 24px 0;
  color: var(--ion-color-medium);
}

.retry-button {
  padding: 12px 24px;
  background: var(--ion-color-primary);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}
</style>

