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
        <div v-if="loading" class="loading-state">
          <ion-spinner name="crescent"></ion-spinner>
          <p>Загрузка упражнений...</p>
        </div>

        <div v-else-if="exercises.length > 0" class="exercises-container">
          <div class="exercises-header">
            <h1>Мои упражнения</h1>
            <p>{{ totalExercises }} упражнений</p>
          </div>

          <!-- Search and Filters -->
          <div class="search-filters-section">
            <SearchInput
              v-model="searchQuery"
              placeholder="Поиск упражнений..."
              @search="handleSearch"
              @clear="clearSearch"
            />
            <ExercisesFilters
              :filters="filters"
              :muscle-groups="muscleGroups"
              @filters-changed="handleFiltersChanged"
              @reset-filters="resetFilters"
            />
          </div>

          <div class="exercises-list card-list">
            <!-- Локальный спиннер для поиска -->
            <SearchLoading v-if="searchLoading" message="Поиск упражнений..." />
            
            <!-- Список упражнений (скрываем во время поиска) -->
            <div 
              v-for="exercise in exercises" 
              :key="exercise.id"
              class="exercise-card modern-card"
              v-show="!searchLoading"
            >
              <div class="exercise-header">
                <div class="exercise-icon">
                  <i class="fas fa-dumbbell"></i>
                </div>
                <div class="exercise-info">
                  <h3 class="exercise-name">{{ exercise.name }}</h3>
                  <div class="exercise-muscle-group">
                    {{ exercise.muscle_group.name }}
                    <span v-if="!exercise.is_active" class="inactive-badge">неактивен</span>
                  </div>
                </div>
                <div class="exercise-actions">
                  <ion-button 
                    fill="clear" 
                    size="small" 
                    @click="openEditModal(exercise)"
                    class="action-button"
                  >
                    <i class="fas fa-edit"></i>
                  </ion-button>
                  <ion-button 
                    fill="clear" 
                    size="small" 
                    @click="confirmDelete(exercise)"
                    class="action-button delete-button"
                  >
                    <i class="fas fa-trash"></i>
                  </ion-button>
                </div>
              </div>
              
              <div v-if="exercise.description" class="exercise-description">
                {{ exercise.description }}
              </div>
            </div>
          </div>

          <!-- Pagination (скрываем во время поиска) -->
          <div v-if="totalPages > 1 && !searchLoading" class="pagination">
            <ion-button 
              fill="outline" 
              :disabled="currentPage === 1"
              @click="prevPage"
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
              @click="nextPage"
              class="pagination-button"
            >
              Следующая
              <i class="fas fa-chevron-right"></i>
            </ion-button>
          </div>
        </div>

        <EmptyState
          v-else
          icon="fas fa-dumbbell"
          title="Нет упражнений"
          message="У вас пока нет созданных упражнений"
          action-text="Создать упражнение"
          action-icon="fas fa-plus"
          :action-handler="openCreateModal"
        />
      </PageContainer>
    </ion-content>

    <!-- Create/Edit Exercise Modal -->
    <ion-modal :is-open="isModalOpen" @didDismiss="closeModal">
      <ion-header>
        <ion-toolbar>
          <ion-title>{{ isEditing ? 'Редактировать упражнение' : 'Создать упражнение' }}</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="closeModal">
              <i class="fas fa-times"></i>
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      
      <ion-content class="modal-content">
        <form @submit.prevent="submitForm" class="exercise-form">
          <CustomInput
            v-model="form.name"
            label="Название упражнения *"
            placeholder="Введите название упражнения"
            :error="!!errors.name"
            :error-message="errors.name?.[0]"
            required
          />

          <div class="form-group">
            <label class="form-label">Группа мышц *</label>
            <CustomSelect
              v-model="form.muscle_group_id"
              :options="muscleGroupOptions"
              placeholder="Выберите группу мышц"
              search-placeholder="Поиск группы мышц..."
            />
            <div v-if="errors.muscle_group_id" class="error-message">{{ errors.muscle_group_id[0] }}</div>
          </div>

          <CustomTextarea
            v-model="form.description"
            label="Описание"
            placeholder="Описание упражнения (необязательно)"
            :rows="3"
          />

          <div class="form-group">
            <label class="form-label">Статус</label>
            <div class="checkbox-container">
              <label class="checkbox-label">
                <input
                  type="checkbox"
                  v-model="form.is_active"
                  class="checkbox-input"
                />
                <span class="checkbox-text">Активное упражнение</span>
              </label>
            </div>
          </div>

          <div class="form-actions">
            <ion-button 
              type="button" 
              fill="outline" 
              @click="closeModal"
              :disabled="submitting"
              expand="block"
            >
              Отмена
            </ion-button>
            <ion-button 
              type="submit" 
              :disabled="submitting"
              class="submit-button"
              expand="block"
            >
              <ion-spinner v-if="submitting" name="crescent"></ion-spinner>
              {{ isEditing ? 'Сохранить' : 'Создать' }}
            </ion-button>
          </div>
        </form>
      </ion-content>
    </ion-modal>

    <!-- Delete Confirmation Modal -->
    <ion-modal :is-open="isDeleteModalOpen" @didDismiss="closeDeleteModal">
      <ion-header>
        <ion-toolbar>
          <ion-title>Подтверждение удаления</ion-title>
        </ion-toolbar>
      </ion-header>
      
      <ion-content class="modal-content">
        <div class="delete-confirmation">
          <i class="fas fa-exclamation-triangle warning-icon"></i>
          <h3>Удалить упражнение?</h3>
          <p>Вы уверены, что хотите удалить упражнение <strong>"{{ exerciseToDelete?.name }}"</strong>?</p>
          <p class="warning-text">Это действие нельзя отменить. Все связанные записи в планах тренировок также будут удалены.</p>
          
          <div class="delete-actions">
            <ion-button 
              fill="outline" 
              @click="closeDeleteModal"
              :disabled="deleting"
              expand="block"
            >
              Отмена
            </ion-button>
            <ion-button 
              color="danger" 
              @click="deleteExercise"
              :disabled="deleting"
              expand="block"
            >
              <ion-spinner v-if="deleting" name="crescent"></ion-spinner>
              Удалить
            </ion-button>
          </div>
        </div>
      </ion-content>
    </ion-modal>

    <ion-toast
      :is-open="!!error"
      :message="error"
      duration="3000"
      @didDismiss="clearError"
    ></ion-toast>

    <ion-toast
      :is-open="!!successMessage"
      :message="successMessage"
      duration="3000"
      @didDismiss="clearSuccess"
    ></ion-toast>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonSpinner,
  IonToast,
  IonModal,
} from '@ionic/vue';
import CustomInput from '@/components/CustomInput.vue';
import CustomSelect from '@/components/CustomSelect.vue';
import CustomTextarea from '@/components/CustomTextarea.vue';
import SearchInput from '@/components/SearchInput.vue';
import ExercisesFilters from '@/components/ExercisesFilters.vue';
import EmptyState from '@/components/EmptyState.vue';
import SearchLoading from '@/components/SearchLoading.vue';
import PageContainer from '@/components/PageContainer.vue';
import { DataService } from '@/services/data';
import { 
  ExerciseResource, 
  MuscleGroupResource, 
  CreateExerciseRequest, 
  UpdateExerciseRequest,
  ApiError 
} from '@/types/api';

const router = useRouter();

// Data
const exercises = ref<ExerciseResource[]>([]);
const muscleGroups = ref<MuscleGroupResource[]>([]);
const loading = ref(false);
const searchLoading = ref(false);
const error = ref<string | null>(null);
const successMessage = ref<string | null>(null);

// Pagination
const currentPage = ref(1);
const totalPages = ref(1);
const totalExercises = ref(0);
const perPage = ref(100);

// Search and filters
const searchQuery = ref('');
const searchTimeout = ref<NodeJS.Timeout | null>(null);
const filters = ref({
  is_active: null as boolean | null,
  muscle_group_id: null as number | null,
  date_from: '',
  date_to: '',
  sort_by: 'created_at',
  sort_order: 'desc'
});

// Modal states
const isModalOpen = ref(false);
const isDeleteModalOpen = ref(false);
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
const exerciseToDelete = ref<ExerciseResource | null>(null);
const exerciseToEdit = ref<ExerciseResource | null>(null);

// Computed
const muscleGroupOptions = computed(() => {
  return muscleGroups.value.map(group => ({
    value: group.id,
    label: group.name
  }));
});

// Methods
const clearError = () => {
  error.value = null;
};

const clearSuccess = () => {
  successMessage.value = null;
};

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
  isModalOpen.value = true;
};

const openEditModal = (exercise: ExerciseResource) => {
  exerciseToEdit.value = exercise;
  form.value = {
    name: exercise.name,
    description: exercise.description || '',
    muscle_group_id: exercise.muscle_group.id,
    is_active: (exercise as any).is_active ?? true
  };
  isEditing.value = true;
  isModalOpen.value = true;
};

const closeModal = () => {
  isModalOpen.value = false;
  resetForm();
  exerciseToEdit.value = null;
};

const confirmDelete = (exercise: ExerciseResource) => {
  exerciseToDelete.value = exercise;
  isDeleteModalOpen.value = true;
};

const closeDeleteModal = () => {
  isDeleteModalOpen.value = false;
  exerciseToDelete.value = null;
};

const submitForm = async () => {
  submitting.value = true;
  errors.value = {};

  try {
    // Convert muscle_group_id to number if it's a string
    const formData = {
      ...form.value,
      muscle_group_id: typeof form.value.muscle_group_id === 'string' 
        ? parseInt(form.value.muscle_group_id) 
        : form.value.muscle_group_id
    };

    if (isEditing.value && exerciseToEdit.value) {
      // Update existing exercise
      await DataService.updateExercise(exerciseToEdit.value.id, formData);
      successMessage.value = 'Упражнение успешно обновлено';
    } else {
      // Create new exercise
      await DataService.createExercise(formData);
      successMessage.value = 'Упражнение успешно создано';
    }
    
    closeModal();
    await fetchExercises(currentPage.value);
  } catch (err: any) {
    const apiError = err as ApiError;
    if (apiError.errors) {
      errors.value = apiError.errors;
    } else {
      error.value = apiError.message || 'Произошла ошибка при сохранении упражнения';
    }
  } finally {
    submitting.value = false;
  }
};

const deleteExercise = async () => {
  if (!exerciseToDelete.value) return;
  
  deleting.value = true;
  try {
    await DataService.deleteExercise(exerciseToDelete.value.id);
    successMessage.value = 'Упражнение успешно удалено';
    closeDeleteModal();
    await fetchExercises(currentPage.value);
  } catch (err: any) {
    const apiError = err as ApiError;
    error.value = apiError.message || 'Произошла ошибка при удалении упражнения';
  } finally {
    deleting.value = false;
  }
};

const fetchExercises = async (page: number = 1, isSearch: boolean = false) => {
  // Используем searchLoading для поиска, loading для обычной загрузки
  if (isSearch) {
    searchLoading.value = true;
  } else {
    loading.value = true;
  }
  
  try {
    const params: any = {
      page,
      per_page: perPage.value
    };

    // Add search query
    if (searchQuery.value.trim()) {
      params.search = searchQuery.value.trim();
    }

    // Add filters
    if (filters.value.is_active !== null) {
      params.is_active = filters.value.is_active ? '1' : '0';
    }
    if (filters.value.muscle_group_id !== null) {
      params.muscle_group_id = filters.value.muscle_group_id;
    }
    if (filters.value.date_from) {
      params.date_from = filters.value.date_from;
    }
    if (filters.value.date_to) {
      params.date_to = filters.value.date_to;
    }
    if (filters.value.sort_by) {
      params.sort_by = filters.value.sort_by;
    }
    if (filters.value.sort_order) {
      params.sort_order = filters.value.sort_order;
    }

    const response = await DataService.getExercises(page, perPage.value, params);
    exercises.value = response.data;
    
    // Update pagination info
    if (response.meta) {
      currentPage.value = response.meta.current_page;
      totalPages.value = response.meta.last_page;
      totalExercises.value = response.meta.total;
    }
  } catch (err: any) {
    const apiError = err as ApiError;
    error.value = apiError.message || 'Ошибка загрузки упражнений';
    console.error('Failed to fetch exercises:', err);
  } finally {
    if (isSearch) {
      searchLoading.value = false;
    } else {
      loading.value = false;
    }
  }
};

const fetchMuscleGroups = async () => {
  try {
    const response = await DataService.getMuscleGroups();
    muscleGroups.value = response.data;
  } catch (err: any) {
    console.error('Failed to fetch muscle groups:', err);
  }
};

// Pagination methods
const goToPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    fetchExercises(page);
  }
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    goToPage(currentPage.value + 1);
  }
};

const prevPage = () => {
  if (currentPage.value > 1) {
    goToPage(currentPage.value - 1);
  }
};

// Search and filter methods
const handleSearch = (query: string) => {
  searchQuery.value = query;
  
  // Очищаем предыдущий таймаут
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value);
  }
  
  // Устанавливаем новый таймаут для дебаунса (300ms)
  searchTimeout.value = setTimeout(() => {
    fetchExercises(1, true); // Используем локальную загрузку для поиска
  }, 300);
};

const clearSearch = () => {
  searchQuery.value = '';
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value);
  }
  fetchExercises(1, true); // Используем локальную загрузку для поиска
};

const handleFiltersChanged = (newFilters: any) => {
  filters.value = { ...newFilters };
  goToPage(1); // Reset to first page when filtering
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
  goToPage(1);
};

onMounted(async () => {
  await Promise.all([
    fetchExercises(),
    fetchMuscleGroups()
  ]);
});

onUnmounted(() => {
  // Очищаем таймаут при размонтировании компонента
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value);
  }
});
</script>

<style scoped>
/* Page content styles now handled by PageContainer component */

/* Loading and empty states now handled by LoadingState and EmptyState components */

.create-button {
  margin-top: 1rem;
}


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

.search-container {
  margin-left: 0 !important;
  width: 100%;
}

.exercises-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Search loading styles now handled by SearchLoading component */
/* .search-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
  color: var(--ion-color-medium);
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  margin: 8px 16px;
}

.search-loading ion-spinner {
  margin-bottom: 1rem;
}

.search-loading p {
  margin: 0;
  font-size: 14px;
} */

.exercise-card {
  margin: 0 !important;
}

.exercise-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.exercise-icon {
  width: 40px;
  height: 40px;
  background: var(--ion-color-primary);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
}

.exercise-icon i {
  font-size: 16px;
  color: white;
}

.exercise-info {
  flex: 1;
}

.exercise-name {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--ion-text-color);
}

.exercise-muscle-group {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: var(--ion-color-medium);
}

.exercise-muscle-group i {
  font-size: 12px;
}

.inactive-badge {
  background: var(--ion-color-medium);
  color: var(--ion-color-light);
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  margin-left: 8px;
  font-weight: 500;
}

.exercise-actions {
  display: flex;
  gap: 4px;
}

.action-button {
  --padding-start: 8px;
  --padding-end: 8px;
  --padding-top: 8px;
  --padding-bottom: 8px;
  margin: 0;
}

.action-button i {
  font-size: 16px;
}

.delete-button {
  color: var(--ion-color-danger);
}

.exercise-description {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 14px;
  color: var(--ion-color-medium);
  line-height: 1.4;
}

/* Modal Styles */
.modal-content {
  padding: 20px;
}

.exercise-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin: 0 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-weight: 600;
  color: var(--ion-text-color);
  font-size: 14px;
}

.error-message {
  color: var(--ion-color-danger);
  font-size: 12px;
  margin-top: 4px;
}

/* Checkbox styles */
.checkbox-container {
  margin-top: 8px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  gap: 12px;
}

.checkbox-input {
  width: 18px;
  height: 18px;
  accent-color: var(--ion-color-primary);
  cursor: pointer;
}

.checkbox-text {
  font-size: 14px;
  color: var(--ion-text-color);
  user-select: none;
}

.form-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 20px;
  width: 100%;
}

.submit-button {
  --padding-start: 24px;
  --padding-end: 24px;
}

/* Delete Confirmation Modal */
.delete-confirmation {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 20px;
}

.warning-icon {
  font-size: 3rem;
  color: var(--ion-color-warning);
  margin-bottom: 1rem;
}

.delete-confirmation h3 {
  margin: 0 0 1rem 0;
  color: var(--ion-text-color);
}

.delete-confirmation p {
  margin: 0 0 1rem 0;
  color: var(--ion-color-medium);
  line-height: 1.4;
}

.warning-text {
  font-size: 0.9rem;
  color: var(--ion-color-danger);
  font-weight: 500;
}

.delete-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 2rem;
  width: 100%;
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
</style>
