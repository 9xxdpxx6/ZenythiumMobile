<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>Программы</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-refresher slot="fixed" @ionRefresh="handleRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <PageContainer>
        <div class="page-header">
          <h1 class="page-title">Каталог программ</h1>
          <p class="page-subtitle">Выберите программу тренировок от экспертов и начните свой путь к результатам</p>
        </div>
        
        <div class="search-filters-row">
          <SearchInput
            v-model="searchQuery"
            placeholder="Поиск программ..."
            @search="handleSearch"
            @clear="clearSearch"
            class="search-input"
          />
          
          <TrainingProgramsFilters
            :filters="currentFilters"
            @filters-changed="handleFiltersChanged"
            @reset-filters="resetFilters"
            class="filters-component"
          />
        </div>

        <LoadingState v-if="loading" message="Загрузка программ..." />

        <div v-else-if="programs && programs.length > 0">
          <SearchLoading v-if="searchLoading" message="Поиск программ..." />
          
          <div class="programs-grid card-grid">
            <TrainingProgramCard
              v-for="program in programs"
              :key="program.id"
              :program="program"
              :is-installing="installingProgramId === program.id"
              :is-uninstalling="uninstallingProgramId === program.id"
              @click="handleProgramClick"
              @install="handleInstallClick"
              @uninstall="handleUninstallClick"
              v-show="!searchLoading"
            />
          </div>

          <!-- Пагинация -->
          <div v-if="meta && meta.last_page > 1" class="pagination">
            <button
              @click="loadPage(meta.current_page - 1)"
              :disabled="meta.current_page === 1 || loading"
              class="pagination-button"
            >
              <i class="fas fa-chevron-left"></i>
              Назад
            </button>
            <span class="pagination-info">
              Страница {{ meta.current_page }} из {{ meta.last_page }}
            </span>
            <button
              @click="loadPage(meta.current_page + 1)"
              :disabled="meta.current_page === meta.last_page || loading"
              class="pagination-button"
            >
              Вперёд
              <i class="fas fa-chevron-right"></i>
            </button>
          </div>
        </div>

        <EmptyState
          v-else-if="!searchLoading"
          icon="fas fa-dumbbell"
          title="Программы не найдены"
          :message="searchQuery ? 'Попробуйте изменить поисковый запрос' : 'Программы тренировок будут доступны в ближайшее время'"
        />
      </PageContainer>

      <!-- Модалка подтверждения установки -->
      <InstallTrainingProgramModal
        :is-open="isInstallModalOpen"
        :program-name="selectedProgramName"
        :is-installing="isInstalling"
        @confirm="confirmInstall"
        @cancel="cancelInstall"
      />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonRefresher,
  IonRefresherContent,
} from '@ionic/vue';
import { useToast } from '@/composables';
import { trainingProgramsService } from '@/services';
import SearchInput from '@/components/ui/SearchInput.vue';
import TrainingProgramsFilters from '@/components/filters/TrainingProgramsFilters.vue';
import LoadingState from '@/components/ui/LoadingState.vue';
import EmptyState from '@/components/ui/EmptyState.vue';
import SearchLoading from '@/components/ui/SearchLoading.vue';
import PageContainer from '@/components/ui/PageContainer.vue';
import TrainingProgramCard from '@/components/cards/TrainingProgramCard.vue';
import InstallTrainingProgramModal from '@/components/modals/InstallTrainingProgramModal.vue';
import type { TrainingProgram } from '@/types/models/training-program.types';

const router = useRouter();
const searchQuery = ref('');
const searchTimeout = ref<NodeJS.Timeout | null>(null);
const programs = ref<TrainingProgram[]>([]);
const meta = ref<{
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
} | null>(null);
const loading = ref(false);
const searchLoading = ref(false);
const installingProgramId = ref<number | null>(null);
const uninstallingProgramId = ref<number | null>(null);
const isInstallModalOpen = ref(false);
const selectedProgram = ref<TrainingProgram | null>(null);
const selectedProgramName = ref('');
const isInstalling = ref(false);

const FILTERS_STORAGE_KEY = 'training-programs-filters';

const saveFilters = (filters: Record<string, any>): void => {
  try {
    localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(filters));
  } catch (e) {
    console.warn('Failed to save filters:', e);
  }
};

const loadFilters = (): Record<string, any> | null => {
  try {
    const saved = localStorage.getItem(FILTERS_STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch (e) {
    return null;
  }
};

const defaultFilters = {
  is_active: null,
  is_installed: null,
};

const currentFilters = ref(loadFilters() || defaultFilters);
const currentPage = ref(1);

const { showSuccess, showError } = useToast();

const fetchData = async (): Promise<void> => {
  loading.value = true;
  try {
    const params: Record<string, string | number> = {
      page: currentPage.value,
      per_page: 15,
    };
    
    if (searchQuery.value.trim()) {
      params.search = searchQuery.value.trim();
    }
    
    const f = currentFilters.value;
    if (f.is_active !== null && f.is_active !== undefined) {
      params.is_active = String(f.is_active);
    }
    
    const response = await trainingProgramsService.getPaginated(params);
    programs.value = response.data;
    meta.value = response.meta || null;
  } catch (error) {
    await showError('Ошибка при загрузке программ');
  } finally {
    loading.value = false;
  }
};

const handleRefresh = async (event: CustomEvent): Promise<void> => {
  await fetchData();
  event.detail.complete();
};

const handleProgramClick = (program: TrainingProgram): void => {
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }
  // Можно добавить переход на детальную страницу
  // router.push(`/training-program/${program.id}`);
};

const handleInstallClick = (program: TrainingProgram): void => {
  selectedProgram.value = program;
  selectedProgramName.value = program.name;
  isInstallModalOpen.value = true;
};

const handleUninstallClick = async (program: TrainingProgram): Promise<void> => {
  // Для uninstall можно использовать простой confirm или тоже модалку
  if (!confirm(`Вы уверены, что хотите удалить программу "${program.name}"?`)) {
    return;
  }
  
  uninstallingProgramId.value = program.id;
  try {
    // Для uninstall нужен install_id, но в API он передаётся как id в пути
    // Пока используем id программы, но нужно будет уточнить логику
    await trainingProgramsService.uninstall(program.id.toString());
    await showSuccess('Программа успешно удалена');
    await fetchData();
  } catch (err) {
    await showError('Ошибка при удалении программы');
  } finally {
    uninstallingProgramId.value = null;
  }
};

const confirmInstall = async (): Promise<void> => {
  if (!selectedProgram.value) return;
  
  isInstalling.value = true;
  installingProgramId.value = selectedProgram.value.id;
  
  try {
    await trainingProgramsService.install(selectedProgram.value.id.toString());
    await showSuccess('Программа успешно установлена');
    isInstallModalOpen.value = false;
    selectedProgram.value = null;
    selectedProgramName.value = '';
    await fetchData();
  } catch (err: any) {
    const errorMessage = err?.response?.data?.message || 'Ошибка при установке программы';
    await showError(errorMessage);
  } finally {
    isInstalling.value = false;
    installingProgramId.value = null;
  }
};

const cancelInstall = (): void => {
  isInstallModalOpen.value = false;
  selectedProgram.value = null;
  selectedProgramName.value = '';
};

const handleSearch = (value: string): void => {
  searchQuery.value = value;
  if (searchTimeout.value) clearTimeout(searchTimeout.value);
  searchLoading.value = true;
  currentPage.value = 1;
  searchTimeout.value = setTimeout(async () => {
    await fetchData();
    searchLoading.value = false;
  }, 300);
};

const clearSearch = (): void => {
  searchQuery.value = '';
  if (searchTimeout.value) clearTimeout(searchTimeout.value);
  searchLoading.value = true;
  currentPage.value = 1;
  fetchData();
  setTimeout(() => { searchLoading.value = false; }, 300);
};

const handleFiltersChanged = (filters: Record<string, any>): void => {
  currentFilters.value = { ...filters };
  saveFilters(filters);
  currentPage.value = 1;
  fetchData();
};

const resetFilters = (): void => {
  currentFilters.value = { ...defaultFilters };
  try {
    localStorage.removeItem(FILTERS_STORAGE_KEY);
  } catch (e) {}
  currentPage.value = 1;
  fetchData();
};

const loadPage = async (page: number): Promise<void> => {
  if (page < 1 || (meta.value && page > meta.value.last_page)) return;
  currentPage.value = page;
  await fetchData();
};

onMounted(() => {
  fetchData();
});

onUnmounted(() => {
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value);
  }
});
</script>

<style scoped>
.search-filters-row {
  display: flex;
  align-items: flex-start;
  width: 100%;
}

.search-input {
  flex: 1;
  min-width: 0;
  margin-right: 8px !important;
}

.filters-component {
  flex-shrink: 0;
}

.page-header {
  margin-bottom: 32px;
  text-align: center;
}

.page-title {
  font-size: 32px;
  font-weight: 700;
  margin: 0 0 12px 0;
  color: var(--ion-text-color);
}

.page-subtitle {
  font-size: 16px;
  color: var(--ion-color-medium);
  margin: 0;
  line-height: 1.5;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.programs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 20px;
}

@media (max-width: 768px) {
  .programs-grid {
    grid-template-columns: 1fr;
  }
  
  .page-title {
    font-size: 28px;
  }
  
  .page-subtitle {
    font-size: 14px;
  }
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 24px;
  padding: 16px;
}

.pagination-button {
  background: var(--ion-color-step-100);
  border: 1px solid var(--ion-color-step-200);
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  color: var(--ion-text-color);
  cursor: pointer;
  transition: none;
  display: flex;
  align-items: center;
  gap: 8px;
}

.pagination-button:hover:not(:disabled) {
  background: var(--ion-color-step-200);
}

.pagination-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-info {
  font-size: 14px;
  color: var(--ion-color-medium);
}
</style>

