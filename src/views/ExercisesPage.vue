<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button @click="router.back()">
            <i class="fas fa-arrow-left"></i>
          </ion-button>
        </ion-buttons>
        <ion-title>Упражнения</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="openCreateModal">
            <i class="fas fa-plus"></i>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <PageContainer>
        <div class="exercises-container">
          <div class="exercises-header">
            <h1>Мои упражнения</h1>
            <p>{{ exercises?.length || 0 }} упражнений</p>
          </div>

          <!-- Search and Filters -->
          <div class="search-filters-section">
            <SearchInput
              v-model="searchQuery"
              placeholder="Поиск упражнений..."
              @search="handleSearch"
              @clear="clearSearch"
              class="search-input"
            />
          <ExercisesFilters
            :filters="filters"
            :muscle-groups="(muscleGroups || []) as any"
            @filters-changed="handleFiltersChanged"
            @reset-filters="resetFilters"
          />
          </div>

          <LoadingState v-if="searchLoading || loading" :message="searchLoading ? 'Поиск упражнений...' : 'Загрузка упражнений...'" />
          
          <template v-else-if="exercises && exercises.length > 0">
            <div class="exercises-list card-list">
              <ExerciseCard
                v-for="exercise in exercises"
                :key="exercise.id"
                :exercise="exercise"
                @edit="openEditModal"
                @delete="confirmDelete"
              />
            </div>
          </template>
          
          <div v-else class="no-results">
            <div class="no-results-icon">
              <i class="fas fa-search"></i>
            </div>
            <p class="no-results-title">Упражнения не найдены</p>
            <p class="no-results-message">
              {{ searchQuery || filters.is_active !== null || filters.muscle_group_id !== null 
                ? 'Попробуйте изменить поисковый запрос или фильтры' 
                : 'Создайте первое упражнение' }}
            </p>
          </div>

          <div v-if="totalPages > 1 && exercises && exercises.length > 0" class="pagination">
            <ion-button 
              fill="outline" 
              :disabled="currentPage === 1"
              @click="() => { prevPage(); fetchData(); }"
              class="pagination-button"
            >
              <i class="fas fa-chevron-left"></i>
              Предыдущая
            </ion-button>
            <div class="pagination-info">
              Страница {{ currentPage }} из {{ totalPages }}
            </div>
            <ion-button 
              fill="outline" 
              :disabled="currentPage === totalPages"
              @click="() => { nextPage(); fetchData(); }"
              class="pagination-button"
            >
              Следующая
              <i class="fas fa-chevron-right"></i>
            </ion-button>
          </div>
        </div>

        <!-- Empty state only when there are no exercises at all -->
        <EmptyState
          v-if="(!exercises || exercises.length === 0) && !loading && !searchLoading && !searchQuery && filters.is_active === null && filters.muscle_group_id === null"
          icon="fas fa-dumbbell"
          title="Нет упражнений"
          message="У вас пока нет созданных упражнений"
          action-text="Создать упражнение"
          action-icon="fas fa-plus"
          :action-handler="openCreateModal"
        />
      </PageContainer>
    </ion-content>

    <ExerciseFormModal
      :is-open="formModal.isOpen.value"
      :form="form"
      :errors="errors"
      :muscle-group-options="muscleGroupOptions"
      :is-editing="isEditing"
      :submitting="submitting"
      @close="closeModal"
      @submit="submitForm"
    />

    <DeleteConfirmationModal
      :is-open="deleteModal.isOpen.value"
      title="Удалить упражнение"
      message="Вы уверены, что хотите удалить упражнение"
      :item-name="deleteModal.data.value?.name"
      warning-text="Это действие нельзя отменить. Все связанные записи в планах тренировок также будут удалены."
      :is-deleting="deleting"
      @confirm="deleteExercise"
      @cancel="closeDeleteModal"
    />

  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
} from '@ionic/vue';
import { useDataFetching, useToast, usePagination, useModal } from '@/composables';
import { exercisesService, muscleGroupsService } from '@/services';
import SearchInput from '@/components/ui/SearchInput.vue';
import ExercisesFilters from '@/components/filters/ExercisesFilters.vue';
import EmptyState from '@/components/ui/EmptyState.vue';
import PageContainer from '@/components/ui/PageContainer.vue';
import ExerciseCard from '@/components/cards/ExerciseCard.vue';
import ExerciseFormModal from '@/components/modals/ExerciseFormModal.vue';
import DeleteConfirmationModal from '@/components/modals/DeleteConfirmationModal.vue';
import LoadingState from '@/components/ui/LoadingState.vue';
import type { ExerciseResource } from '@/types/api';

const router = useRouter();

const searchQuery = ref('');
const searchTimeout = ref<NodeJS.Timeout | null>(null);
const searchLoading = ref(false);
const { currentPage, totalPages, setTotalItems, nextPage, prevPage } = usePagination(1, 100);
const filters = ref({
  is_active: null as boolean | null,
  muscle_group_id: null as number | null,
  date_from: '',
  date_to: '',
  sort_by: 'created_at',
  sort_order: 'desc'
});

// Composables
const { showSuccess, showError } = useToast();

// Fetch muscle groups
const { data: muscleGroups, execute: fetchMuscleGroups } = useDataFetching(
  async () => await muscleGroupsService.getAll(),
  { immediate: true }
);

// Fetch exercises with manual control
const exercises = ref<any[]>([]);
const loading = ref(false);

const fetchData = async () => {
  loading.value = true;
  try {
    const params: any = { page: currentPage.value, per_page: 100 };
    const f = filters.value;
    if (searchQuery.value.trim()) params.search = searchQuery.value.trim();
    if (f.is_active !== null) params.is_active = f.is_active ? '1' : '0';
    if (f.muscle_group_id !== null) params.muscle_group_id = f.muscle_group_id;
    if (f.date_from) params.date_from = f.date_from;
    if (f.date_to) params.date_to = f.date_to;
    if (f.sort_by) params.sort_by = f.sort_by;
    if (f.sort_order) params.sort_order = f.sort_order;
    const response = await exercisesService.getPaginated(params);
    if (response.pagination) {
      setTotalItems(response.pagination.totalItems);
    }
    exercises.value = response.data;
  } catch (err) {
    await showError('Ошибка загрузки упражнений');
  } finally {
    loading.value = false;
  }
};

// Modal states
const formModal = useModal<ExerciseResource>();
const deleteModal = useModal<ExerciseResource>();
const isEditing = ref(false);
const submitting = ref(false);
const deleting = ref(false);

// Form data
const form = ref<{
  name: string;
  description: string;
  muscle_group_id: number | string;
  is_active: boolean;
}>({
  name: '',
  description: '',
  muscle_group_id: 0,
  is_active: true
});

const errors = ref<Record<string, string[]>>({});
const exerciseToEdit = ref<ExerciseResource | null>(null);

// Computed
const muscleGroupOptions = computed(() => {
  return (muscleGroups.value || []).map((group: any) => ({
    value: group.id,
    label: group.name
  }));
});

// Methods

const resetForm = () => {
  form.value = {
    name: '',
    description: '',
    muscle_group_id: 0,
    is_active: true
  };
  errors.value = {};
};

const openCreateModal = () => {
  resetForm();
  isEditing.value = false;
  formModal.open();
};

const openEditModal = (exercise: ExerciseResource) => {
  formModal.open(exercise);
  exerciseToEdit.value = exercise;
  form.value = {
    name: exercise.name,
    description: exercise.description || '',
    muscle_group_id: exercise.muscle_group.id,
    is_active: (exercise as any).is_active ?? true
  };
  isEditing.value = true;
};

const closeModal = () => {
  formModal.close();
  resetForm();
  exerciseToEdit.value = null;
};

const confirmDelete = (exercise: ExerciseResource) => {
  deleteModal.open(exercise);
};

const closeDeleteModal = () => {
  deleteModal.close();
};

const submitForm = async (payload?: { name: string; description: string; muscle_group_id: number | string; is_active: boolean }) => {
  submitting.value = true;
  errors.value = {};

  try {
    const source = payload || form.value;
    const normalizedMuscleGroupId = typeof source.muscle_group_id === 'string'
      ? parseInt(source.muscle_group_id)
      : source.muscle_group_id;

    const formData = {
      name: (source.name || '').trim(),
      description: source.description || '',
      muscle_group_id: normalizedMuscleGroupId,
      is_active: !!source.is_active,
    } as const;

    if (isEditing.value && exerciseToEdit.value) {
      await exercisesService.update(exerciseToEdit.value.id.toString(), formData as any);
      await showSuccess('Упражнение успешно обновлено');
    } else {
      await exercisesService.create(formData as any);
      await showSuccess('Упражнение успешно создано');
    }
    
    closeModal();
    await fetchData();
  } catch (err: any) {
    const apiError = err;
    if (apiError.errors) {
      errors.value = apiError.errors;
    } else {
      await showError('Произошла ошибка при сохранении упражнения');
    }
  } finally {
    submitting.value = false;
  }
};

const deleteExercise = async () => {
  if (!deleteModal.data.value) return;
  deleting.value = true;
  try {
    await exercisesService.delete(deleteModal.data.value.id.toString());
    await showSuccess('Упражнение успешно удалено');
    closeDeleteModal();
    await fetchData();
  } catch (err: any) {
    await showError('Произошًا ошибка при удалении упражнения');
  } finally {
    deleting.value = false;
  }
};

watch(currentPage, () => fetchData());

const handleSearch = (query: string) => {
  searchQuery.value = query;
  if (searchTimeout.value) clearTimeout(searchTimeout.value);
  searchLoading.value = true;
  searchTimeout.value = setTimeout(async () => {
    currentPage.value = 1;
    await fetchData();
    searchLoading.value = false;
  }, 300);
};

const clearSearch = () => {
  searchQuery.value = '';
  if (searchTimeout.value) clearTimeout(searchTimeout.value);
  currentPage.value = 1;
  searchLoading.value = true;
  fetchData();
  setTimeout(() => { searchLoading.value = false; }, 300);
};

const handleFiltersChanged = (newFilters: any) => {
  filters.value = { ...newFilters };
  currentPage.value = 1;
  fetchData();
};

const resetFilters = () => {
  filters.value = {
    is_active: null,
    muscle_group_id: null,
    date_from: '',
    date_to: '',
    sort_by: 'created_at',
    sort_order: 'desc'
  };
  currentPage.value = 1;
  fetchData();
};

onMounted(async () => {
  await fetchData();
  await fetchMuscleGroups();
});

onUnmounted(() => {
  if (searchTimeout.value) clearTimeout(searchTimeout.value);
});
</script>

<style scoped>
.exercises-header {
  margin-bottom: 20px;
}

.exercises-header h1 {
  margin: 0 0 4px 0;
  font-size: 1.5rem;
  color: var(--ion-text-color);
}

.exercises-header p {
  margin: 0;
  color: var(--ion-color-medium);
  font-size: 0.9rem;
}

.search-filters-section {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 20px;
}

.search-input {
  flex: 1;
}

.exercises-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}


/* Pagination Styles */
.pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 24px;
  padding: 16px 0;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.pagination-button {
  display: flex;
  align-items: center;
  gap: 8px;
  --padding-start: 16px;
  --padding-end: 16px;
}

.pagination-info {
  color: var(--ion-color-medium);
  font-size: 14px;
  font-weight: 500;
}

/* No results styles */
.no-results {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;
  text-align: center;
}

.no-results-icon {
  width: 80px;
  height: 80px;
  background: rgba(99, 102, 241, 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.5rem;
}

.no-results-icon i {
  font-size: 2rem;
  color: var(--ion-color-primary);
}

.no-results-title {
  margin: 0 0 0.5rem 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--ion-text-color);
}

.no-results-message {
  margin: 0;
  font-size: 0.9rem;
  color: var(--ion-color-medium);
  line-height: 1.5;
  max-width: 300px;
}

/* Disable hover effects on this page */
:deep(ion-button) {
  --background-hover: transparent;
  --background-activated: transparent;
  --color-hover: inherit;
  --border-color-hover: inherit;
  transition: none;
}

/* Precisely neutralize modern-card hover coming from utilities.css */
:deep(.card-list .modern-card) {
  transition: none !important;
}

:deep(.card-list .modern-card:hover) {
  transform: none !important;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
  background: var(--ion-card-background) !important;
  filter: none !important;
}
</style>
