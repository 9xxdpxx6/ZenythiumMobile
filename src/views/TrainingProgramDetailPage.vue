<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button :default-href="'/training-programs'"></ion-back-button>
        </ion-buttons>
        <ion-title>Программа</ion-title>
      </ion-toolbar>
    </ion-header>

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
          <!-- Заголовок программы -->
          <div class="program-header-section">
            <div class="program-title-wrapper">
              <h1 class="program-name">{{ program.name }}</h1>
              <!-- Бейдж "Неактивна" для неактивных программ -->
              <div v-if="!program.is_active" class="inactive-badge">
                <span>Неактивна</span>
              </div>
            </div>
            <div v-if="program.description" class="program-description">
              {{ program.description }}
            </div>
            
            <!-- Информация о программе -->
            <div class="program-info-grid">
              <div class="info-item" v-if="program.author">
                <div class="info-label">Автор</div>
                <div class="info-value">{{ program.author.name }}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Продолжительность</div>
                <div class="info-value">{{ program.duration_weeks }} {{ formatWeeks(program.duration_weeks) }}</div>
              </div>
              <div class="info-item" v-if="program.cycles_count">
                <div class="info-label">Циклов</div>
                <div class="info-value">{{ program.cycles_count }}</div>
              </div>
              <div class="info-item" v-if="program.plans_count">
                <div class="info-label">Планов</div>
                <div class="info-value">{{ program.plans_count }}</div>
              </div>
              <div class="info-item" v-if="program.exercises_count">
                <div class="info-label">Упражнений</div>
                <div class="info-value">{{ program.exercises_count }}</div>
              </div>
            </div>

            <!-- Кнопка установки (только для активных программ) -->
            <button
              v-if="!program.is_installed && program.is_active"
              @click="handleInstallClick"
              class="install-button"
              :disabled="isInstalling"
            >
              <i v-if="isInstalling" class="fas fa-spinner fa-spin"></i>
              <i v-else class="fas fa-download"></i>
              <span>{{ isInstalling ? 'Установка...' : 'Установить программу' }}</span>
            </button>
            <div v-else-if="program.is_installed && program.is_active" class="installed-badge">
              <i class="fas fa-check-circle"></i>
              <span>Программа установлена</span>
            </div>
          </div>

          <!-- Структура программы -->
          <div v-if="program.structure && program.structure.cycles.length > 0" class="structure-section">
            <h2 class="section-title">Структура программы</h2>
            
            <div v-for="(cycle, cycleIndex) in program.structure.cycles" :key="cycleIndex" class="cycle-block">
              <h3 class="cycle-name">{{ cycle.name }}</h3>
              
              <div 
                v-for="(plan, planIndex) in cycle.plans" 
                :key="planIndex" 
                class="plan-block"
                :style="{ borderLeftColor: getPlanColor(plan.name) }"
              >
                <h4 class="plan-name" :style="{ color: getPlanColor(plan.name) }">{{ plan.name }}</h4>
                
                <div v-if="plan.exercises && plan.exercises.length > 0" class="exercises-list">
                  <div
                    v-for="(exercise, exerciseIndex) in plan.exercises"
                    :key="exerciseIndex"
                    class="exercise-item"
                  >
                    <div class="exercise-name">{{ exercise.name }}</div>
                    <div v-if="exercise.description" class="exercise-description">
                      {{ exercise.description }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-else-if="program.structure" class="empty-structure">
            <p>Структура программы пока не доступна</p>
          </div>
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
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
} from '@ionic/vue';
import { useToast } from '@/composables';
import { trainingProgramsService } from '@/services';
import PageContainer from '@/components/ui/PageContainer.vue';
import LoadingState from '@/components/ui/LoadingState.vue';
import InstallTrainingProgramModal from '@/components/modals/InstallTrainingProgramModal.vue';
import { getColorFromString } from '@/utils/formatters';
import type { TrainingProgramDetail } from '@/types/models/training-program.types';

const route = useRoute();
const router = useRouter();
const programId = route.params.id as string;

const program = ref<TrainingProgramDetail | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);
const isInstalling = ref(false);
const isInstallModalOpen = ref(false);

const { showSuccess, showError } = useToast();

const fetchProgram = async (): Promise<void> => {
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

const formatWeeks = (weeks: number): string => {
  const lastDigit = weeks % 10;
  const lastTwoDigits = weeks % 100;
  
  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
    return 'недель';
  }
  
  if (lastDigit === 1) {
    return 'неделя';
  }
  
  if (lastDigit >= 2 && lastDigit <= 4) {
    return 'недели';
  }
  
  return 'недель';
};

function getPlanColor(name: string): string {
  return getColorFromString(name);
}

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

onMounted(() => {
  fetchProgram();
});
</script>

<style scoped>
.program-details {
  padding: 0;
}

.program-header-section {
  margin-bottom: 32px;
}

.program-title-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.program-name {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  color: var(--ion-text-color);
  line-height: 1.2;
}

.inactive-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  background: rgba(156, 163, 175, 0.15);
  border: 1px solid rgba(156, 163, 175, 0.3);
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  width: fit-content;
}

.program-description {
  margin: 0 0 24px 0;
  font-size: 16px;
  color: var(--ion-color-medium);
  line-height: 1.5;
}

.program-info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.info-item {
  padding: 12px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.info-label {
  font-size: 12px;
  color: var(--ion-color-medium);
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-value {
  font-size: 18px;
  font-weight: 600;
  color: var(--ion-text-color);
}

.install-button {
  width: 100%;
  padding: 14px 20px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border: none;
  min-height: 48px;
  background: var(--ion-color-primary);
  color: white;
  margin-top: 16px;
}

.install-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.installed-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 20px;
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.3);
  border-radius: 12px;
  color: #22c55e;
  font-weight: 600;
  margin-top: 16px;
}

.structure-section {
  margin-top: 32px;
}

.section-title {
  margin: 0 0 24px 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--ion-text-color);
}

.cycle-block {
  margin-bottom: 32px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.cycle-name {
  margin: 0 0 16px 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--ion-color-primary);
}

.plan-block {
  margin-bottom: 20px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 10px;
  border-left: 3px solid var(--ion-color-primary);
}

.plan-block:last-child {
  margin-bottom: 0;
}

.plan-name {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--ion-text-color);
}

.exercises-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.exercise-item {
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
}

.exercise-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--ion-text-color);
  margin-bottom: 4px;
}

.exercise-description {
  font-size: 12px;
  color: var(--ion-color-medium);
  line-height: 1.4;
}

.empty-structure {
  text-align: center;
  padding: 40px 20px;
  color: var(--ion-color-medium);
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

