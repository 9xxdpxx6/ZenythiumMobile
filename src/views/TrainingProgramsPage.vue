<template>
  <ion-page>
    <PageHeader title="Программы" show-back-button default-back-href="/tabs/home" />

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
              :is-top="isTopProgram(program.id)"
              :is-installing="installingProgramId === program.id"
              :is-uninstalling="uninstallingProgramId === program.id"
              @click="handleProgramClick"
              @install="handleInstallClick"
              @uninstall="handleUninstallClick"
              v-show="!searchLoading"
            />
          </div>

          <PaginationControls
            :meta="meta"
            :loading="loading"
            @page-change="loadPage"
          />
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

      <!-- Модалка подтверждения удаления программы -->
      <DeleteConfirmationModal
        :is-open="isUninstallModalOpen"
        title="Удалить программу"
        message="Вы уверены, что хотите удалить программу"
        :item-name="selectedUninstallProgram?.name"
        warning-text="Это действие нельзя отменить."
        :is-deleting="uninstallingProgramId !== null"
        @confirm="confirmUninstall"
        @cancel="cancelUninstall"
      />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage,
  IonContent,
  IonRefresher,
  IonRefresherContent,
} from '@ionic/vue';
import { useToast, useSearch, useLocalStorageFilters } from '@/composables';
import { trainingProgramsService } from '@/services';
import { errorHandler } from '@/utils/error-handler';
import type { PaginationMeta } from '@/types/api';
import SearchInput from '@/components/ui/SearchInput.vue';
import TrainingProgramsFilters from '@/components/filters/TrainingProgramsFilters.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import LoadingState from '@/components/ui/LoadingState.vue';
import EmptyState from '@/components/ui/EmptyState.vue';
import SearchLoading from '@/components/ui/SearchLoading.vue';
import PageContainer from '@/components/ui/PageContainer.vue';
import PaginationControls from '@/components/ui/PaginationControls.vue';
import TrainingProgramCard from '@/components/cards/TrainingProgramCard.vue';
import InstallTrainingProgramModal from '@/components/modals/InstallTrainingProgramModal.vue';
import DeleteConfirmationModal from '@/components/modals/DeleteConfirmationModal.vue';
import type { TrainingProgram } from '@/types/models/training-program.types';

const router = useRouter();
const programs = ref<TrainingProgram[]>([]);
const meta = ref<PaginationMeta | null>(null);
const loading = ref(false);
const installingProgramId = ref<number | null>(null);
const uninstallingProgramId = ref<number | null>(null);
const isInstallModalOpen = ref(false);
const selectedProgram = ref<TrainingProgram | null>(null);
const selectedProgramName = ref('');
const isInstalling = ref(false);
const isUninstallModalOpen = ref(false);
const selectedUninstallProgram = ref<TrainingProgram | null>(null);

interface Filters {
  is_active: string | null;
  is_installed: boolean | null;
}

const defaultFilters: Filters = {
  is_active: '1',
  is_installed: null,
};

const {
  filters: currentFilters,
  updateFilter,
  resetFilters: resetFiltersComposable,
} = useLocalStorageFilters<Filters>({
  storageKey: 'training-programs-filters',
  defaultFilters,
});

const currentPage = ref(1);

const { searchQuery, searchLoading, handleSearch: handleSearchInput, clearSearch } = useSearch({
  debounceMs: 300,
  onSearch: async () => {
    currentPage.value = 1;
    await fetchData();
  },
  onClear: async () => {
    currentPage.value = 1;
    await fetchData();
  },
});

const { showSuccess, showError } = useToast();

// Определяем топ-3 программы (installations_count > 5)
const topProgramIds = computed(() => {
  const programsWithInstalls = programs.value
    .filter(p => (p.installations_count ?? 0) > 5)
    .sort((a, b) => (b.installations_count ?? 0) - (a.installations_count ?? 0))
    .slice(0, 3)
    .map(p => p.id);
  
  return new Set(programsWithInstalls);
});

const isTopProgram = (programId: number): boolean => {
  return topProgramIds.value.has(programId);
};

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
    
    const f = currentFilters;
    if (f.is_active !== null && f.is_active !== undefined) {
      params.is_active = String(f.is_active);
    }
    
    const response = await trainingProgramsService.getPaginated(params);
    programs.value = response.data;
    meta.value = response.meta || null;
  } catch (error: unknown) {
    errorHandler.log(error, 'TrainingProgramsPage.fetchData');
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
  router.push(`/training-program/${program.id}`);
};

const handleInstallClick = (program: TrainingProgram): void => {
  selectedProgram.value = program;
  selectedProgramName.value = program.name;
  isInstallModalOpen.value = true;
};

const handleUninstallClick = (program: TrainingProgram): void => {
  if (uninstallingProgramId.value) return;
  selectedUninstallProgram.value = program;
  isUninstallModalOpen.value = true;
};

const confirmUninstall = async (): Promise<void> => {
  const program = selectedUninstallProgram.value;
  if (!program) return;
  
  if (!program.install_id) {
    await showError('ID установки программы не найден');
    return;
  }
  
  uninstallingProgramId.value = program.id;
  try {
    await trainingProgramsService.uninstall(program.install_id.toString());
    await showSuccess('Программа успешно удалена');
    await fetchData();
  } catch (err: unknown) {
    errorHandler.log(err, 'TrainingProgramsPage.confirmUninstall');
    const errorMessage = errorHandler.format(err);
    await showError(errorMessage);
  } finally {
    uninstallingProgramId.value = null;
    isUninstallModalOpen.value = false;
    selectedUninstallProgram.value = null;
  }
};

const cancelUninstall = (): void => {
  isUninstallModalOpen.value = false;
  selectedUninstallProgram.value = null;
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
  } catch (err: unknown) {
    errorHandler.log(err, 'TrainingProgramsPage.confirmInstall');
    const errorMessage = errorHandler.format(err);
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
  handleSearchInput(value);
};

const handleFiltersChanged = (filters: Filters): void => {
  Object.keys(filters).forEach(key => {
    updateFilter(key as keyof Filters, filters[key as keyof Filters]);
  });
  currentPage.value = 1;
  fetchData();
};

const resetFilters = (): void => {
  resetFiltersComposable();
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

</style>

