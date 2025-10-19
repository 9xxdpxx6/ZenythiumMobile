<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button @click="router.back()">
            <i class="fas fa-arrow-left"></i>
          </ion-button>
        </ion-buttons>
        <ion-title>Записи веса</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="openAddModal">
            <i class="fas fa-plus"></i>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <div class="page-content">
        <!-- Filters Section -->
        <div class="filters-section">
          <div class="filter-row">
            <CustomInput
              v-model="filters.search"
              placeholder="Поиск по заметкам..."
              type="text"
              class="search-input"
            >
              <template #icon>
                <i class="fas fa-search"></i>
              </template>
            </CustomInput>
          </div>
          
           <div class="filter-row">
             <div class="date-filter-group">
               <VueDatePicker
                 v-model="filters.dateFrom"
                 format="dd.MM.yyyy"
                 placeholder="Дата с"
                 :enable-time-picker="false"
                 auto-apply
                 :dark="true"
                 locale="ru"
                 :week-start="1"
                 :month-name-format="'long'"
                 :year-range="[2020, 2030]"
                 @update:model-value="handleDateFilterChange"
               />
             </div>
             
             <div class="date-filter-group">
               <VueDatePicker
                 v-model="filters.dateTo"
                 format="dd.MM.yyyy"
                 placeholder="Дата по"
                 :enable-time-picker="false"
                 auto-apply
                 :dark="true"
                 :min-date="filters.dateFrom || undefined"
                 locale="ru"
                 :week-start="1"
                 :month-name-format="'long'"
                 :year-range="[2020, 2030]"
                 @update:model-value="handleDateFilterChange"
               />
             </div>
           </div>
          
           <div class="filter-row">
             <CustomInput
               v-model="filters.weightFrom"
               type="number"
               placeholder="Вес от"
               step="0.1"
             />
             <CustomInput
               v-model="filters.weightTo"
               type="number"
               placeholder="Вес до"
               step="0.1"
             />
           </div>
          
          <div class="filter-actions">
            <ion-button fill="outline" @click="resetFilters">
              <i class="fas fa-undo"></i>
              Сбросить
            </ion-button>
            <ion-button @click="applyFilters">
              <i class="fas fa-filter"></i>
              Применить
            </ion-button>
          </div>
        </div>

        <!-- Metrics List -->
        <div class="metrics-list">
          <div v-if="loading" class="loading-state">
            <ion-spinner name="crescent"></ion-spinner>
            <p>Загрузка записей...</p>
          </div>
          
          <div v-else-if="metrics.length === 0" class="no-data">
            <i class="fas fa-weight chart-icon"></i>
            <p>Нет записей веса</p>
            <p class="no-data-text">
              Начните отслеживать свой прогресс, добавив первую запись веса
            </p>
            <ion-button fill="outline" @click="openAddModal">
              Добавить запись
            </ion-button>
          </div>
          
          <div v-else class="metrics-grid">
            <div 
              v-for="metric in metrics" 
              :key="metric.id"
              class="metric-card modern-card"
              @click="openEditModal(metric)"
            >
              <div class="metric-header">
                <div class="metric-date">
                  {{ formatDate(metric.date) }}
                </div>
                <div class="metric-actions">
                  <ion-button 
                    fill="clear" 
                    size="small" 
                    @click.stop="openEditModal(metric)"
                    class="edit-btn"
                  >
                    <i class="fas fa-edit"></i>
                  </ion-button>
                  <ion-button 
                    fill="clear" 
                    size="small" 
                    @click.stop="confirmDelete(metric)"
                    class="delete-btn"
                  >
                    <i class="fas fa-trash"></i>
                  </ion-button>
                </div>
              </div>
              
              <div class="metric-content">
                <div class="metric-weight">
                  <span class="weight-value">{{ parseFloat(metric.weight).toFixed(1) }}</span>
                  <span class="weight-unit">кг</span>
                </div>
                
                <div v-if="metric.note" class="metric-note">
                  {{ metric.note }}
                </div>
                
                <div class="metric-meta">
                  <div class="metric-time">
                    <i class="fas fa-clock"></i>
                    {{ formatTime(metric.created_at) }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Pagination -->
        <div v-if="pagination && pagination.last_page > 1" class="pagination">
          <ion-button 
            fill="outline" 
            :disabled="pagination.current_page === 1"
            @click="changePage(pagination.current_page - 1)"
          >
            <i class="fas fa-chevron-left"></i>
            Назад
          </ion-button>
          
          <div class="page-info">
            {{ pagination.current_page }} из {{ pagination.last_page }}
          </div>
          
          <ion-button 
            fill="outline" 
            :disabled="pagination.current_page === pagination.last_page"
            @click="changePage(pagination.current_page + 1)"
          >
            Вперед
            <i class="fas fa-chevron-right"></i>
          </ion-button>
        </div>
      </div>
    </ion-content>

    <!-- Add/Edit Modal -->
    <ion-modal :is-open="isModalOpen" @did-dismiss="closeModal">
      <ion-header>
        <ion-toolbar>
          <ion-title>{{ isEditing ? 'Редактировать запись' : 'Добавить запись' }}</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="closeModal">
              <i class="fas fa-times"></i>
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      
      <ion-content class="modal-content">
        <div class="metric-form">
          <!-- Error message -->
          <div v-if="modalError" class="modal-error">
            <i class="fas fa-exclamation-triangle"></i>
            {{ modalError }}
          </div>
          
           <div class="form-group">
             <VueDatePicker
               v-model="formData.date"
               format="dd.MM.yyyy"
               placeholder="Дата измерения"
               :enable-time-picker="false"
               auto-apply
               :dark="true"
               :max-date="new Date()"
               locale="ru"
               :week-start="1"
               :month-name-format="'long'"
               :year-range="[2020, 2030]"
             />
           </div>
          
          <div class="form-group">
            <CustomInput
              v-model="formData.weight"
              label="Вес (кг)"
              type="number"
              placeholder="Введите вес"
              :min="0"
              :max="1000"
              step="0.01"
            />
          </div>
          
          <div class="form-group">
            <CustomTextarea
              v-model="formData.note"
              label="Заметка (необязательно)"
              placeholder="Добавьте заметку к измерению"
              :rows="3"
            />
          </div>
          
          <div class="form-actions">
            <ion-button 
              expand="block" 
              @click="saveMetric"
              :disabled="!formData.weight || !formData.date || isSaving"
              class="save-btn"
            >
              <ion-spinner v-if="isSaving" name="crescent"></ion-spinner>
              <span v-else>{{ isEditing ? 'Сохранить изменения' : 'Добавить запись' }}</span>
            </ion-button>
          </div>
        </div>
      </ion-content>
    </ion-modal>

    <!-- Delete Confirmation Modal -->
    <DeleteConfirmationModal
      :is-open="isDeleteModalOpen"
      title="Удалить запись"
      message="Вы уверены, что хотите удалить"
      :item-name="`запись от ${selectedMetric ? formatDate(selectedMetric.date) : ''}`"
      @confirm="deleteMetric"
      @cancel="closeDeleteModal"
    />
    
    <!-- Toast notifications -->
    <CustomToast
      :is-open="isToastOpen"
      :message="toastMessage"
      :color="toastColor"
      position="bottom"
      :duration="4000"
      @didDismiss="onToastDismiss"
    />
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonSpinner,
  IonModal,
  IonButtons,
} from '@ionic/vue';
import apiClient from '@/services/api';
import CustomInput from '@/components/CustomInput.vue';
import CustomTextarea from '@/components/CustomTextarea.vue';
import CustomToast from '@/components/CustomToast.vue';
import DeleteConfirmationModal from '@/components/DeleteConfirmationModal.vue';
import VueDatePicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';

// Router
const router = useRouter();

// Types
interface Metric {
  id: number;
  date: string;
  weight: string;
  note?: string;
  user: {
    id: number;
    name: string;
  };
  created_at: string;
  updated_at: string;
}

interface Pagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

// Reactive data
const metrics = ref<Metric[]>([]);
const loading = ref(false);
const pagination = ref<Pagination | null>(null);
const isModalOpen = ref(false);
const isEditing = ref(false);
const isSaving = ref(false);
const isDeleteModalOpen = ref(false);
const selectedMetric = ref<Metric | null>(null);

// Filters
const filters = ref({
  search: '',
  dateFrom: null as Date | null,
  dateTo: null as Date | null,
  weightFrom: '',
  weightTo: '',
  sortBy: 'date',
  sortOrder: 'desc'
});

// Form data
const formData = ref({
  date: null as Date | null,
  weight: '',
  note: ''
});

// Modal error state
const modalError = ref('');

// Toast state
const isToastOpen = ref(false);
const toastMessage = ref('');
const toastColor = ref<'primary' | 'secondary' | 'success' | 'warning' | 'danger'>('primary');

// Methods
const fetchMetrics = async (page = 1) => {
  loading.value = true;
  
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: '15',
      sort_by: filters.value.sortBy,
      sort_order: filters.value.sortOrder
    });
    
    // Add filters
    if (filters.value.search) params.append('search', filters.value.search);
    if (filters.value.dateFrom) {
      const dateFromWithTime = new Date(filters.value.dateFrom);
      dateFromWithTime.setHours(0, 0, 0, 0);
      params.append('date_from', dateFromWithTime.toISOString());
    }
    if (filters.value.dateTo) {
      const dateToWithTime = new Date(filters.value.dateTo);
      dateToWithTime.setHours(23, 59, 59, 999);
      params.append('date_to', dateToWithTime.toISOString());
    }
    if (filters.value.weightFrom) params.append('weight_from', filters.value.weightFrom);
    if (filters.value.weightTo) params.append('weight_to', filters.value.weightTo);
    
    const response = await apiClient.get(`/api/v1/metrics?${params}`);
    metrics.value = response.data.data || [];
    pagination.value = response.data.meta || null;
  } catch (error) {
    console.error('Error fetching metrics:', error);
    showErrorToast('Ошибка загрузки записей');
  } finally {
    loading.value = false;
  }
};

const openAddModal = () => {
  isEditing.value = false;
  modalError.value = '';
  formData.value = {
    date: new Date(),
    weight: '',
    note: ''
  };
  isModalOpen.value = true;
};

const openEditModal = (metric: Metric) => {
  isEditing.value = true;
  modalError.value = '';
  selectedMetric.value = metric;
  formData.value = {
    date: new Date(metric.date),
    weight: metric.weight,
    note: metric.note || ''
  };
  isModalOpen.value = true;
};

const closeModal = () => {
  isModalOpen.value = false;
  modalError.value = '';
  selectedMetric.value = null;
  formData.value = {
    date: null,
    weight: '',
    note: ''
  };
};

const saveMetric = async () => {
  if (!formData.value.weight || !formData.value.date) return;
  
  // Очищаем предыдущие ошибки
  modalError.value = '';
  
  // Validate date is not in the future
  const selectedDate = new Date(formData.value.date);
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  
  if (selectedDate > today) {
    modalError.value = 'Дата не может быть в будущем';
    return;
  }
  
  // Validate weight
  const weight = parseFloat(formData.value.weight);
  if (isNaN(weight) || weight <= 0 || weight > 1000) {
    modalError.value = 'Вес должен быть от 0 до 1000 кг';
    return;
  }
  
  isSaving.value = true;
  
  try {
    const data = {
      date: formData.value.date?.toISOString().split('T')[0],
      weight: weight.toFixed(2),
      note: formData.value.note || null
    };
    
    if (isEditing.value && selectedMetric.value) {
      await apiClient.put(`/api/v1/metrics/${selectedMetric.value.id}`, data);
      showSuccessToast('Запись успешно обновлена!');
      
      // Уведомляем другие страницы об обновлении метрики
      window.dispatchEvent(new CustomEvent('metric-updated'));
    } else {
      await apiClient.post('/api/v1/metrics', data);
      showSuccessToast('Запись успешно добавлена!');
      
      // Уведомляем другие страницы о добавлении метрики
      window.dispatchEvent(new CustomEvent('metric-added'));
    }
    
    closeModal();
    await fetchMetrics(pagination.value?.current_page || 1);
  } catch (error: any) {
    console.error('Error saving metric:', error);
    console.error('Error response:', error.response?.data);
    console.error('Error status:', error.response?.status);
    
    // Получаем данные ошибки из разных возможных мест
    const errorData = error.response?.data || error.data || error;
    const status = error.response?.status || error.status;
    
    if (status === 422) {
      // Специальная обработка для ошибки дублирования даты
      if (errorData.errors && errorData.errors.date) {
        const dateError = Array.isArray(errorData.errors.date) 
          ? errorData.errors.date[0] 
          : String(errorData.errors.date);
        modalError.value = `Запись на эту дату уже существует. ${dateError}`;
      } else if (errorData.message) {
        modalError.value = errorData.message;
      } else if (errorData.errors) {
        const firstError = Object.values(errorData.errors)[0];
        if (Array.isArray(firstError)) {
          modalError.value = firstError[0];
        } else {
          modalError.value = String(firstError);
        }
      } else {
        modalError.value = 'Ошибка валидации данных';
      }
    } else if (status === 401) {
      modalError.value = 'Необходимо войти в систему';
    } else if (status >= 500) {
      modalError.value = 'Ошибка сервера. Попробуйте позже';
    } else {
      // Показываем конкретную ошибку от сервера, если есть
      if (errorData?.message) {
        modalError.value = errorData.message;
      } else {
        modalError.value = 'Произошла ошибка при сохранении записи';
      }
    }
  } finally {
    isSaving.value = false;
  }
};

const confirmDelete = (metric: Metric) => {
  selectedMetric.value = metric;
  isDeleteModalOpen.value = true;
};

const closeDeleteModal = () => {
  isDeleteModalOpen.value = false;
  selectedMetric.value = null;
};

const deleteMetric = async () => {
  if (!selectedMetric.value) return;
  
  try {
    await apiClient.delete(`/api/v1/metrics/${selectedMetric.value.id}`);
    showSuccessToast('Запись успешно удалена!');
    closeDeleteModal();
    await fetchMetrics(pagination.value?.current_page || 1);
  } catch (error: any) {
    console.error('Error deleting metric:', error);
    
    if (error.response?.status === 401) {
      showErrorToast('Необходимо войти в систему');
    } else if (error.response?.status >= 500) {
      showErrorToast('Ошибка сервера. Попробуйте позже');
    } else {
      showErrorToast('Произошла ошибка при удалении записи');
    }
  }
};

const applyFilters = () => {
  fetchMetrics(1);
};

const resetFilters = () => {
  filters.value = {
    search: '',
    dateFrom: null,
    dateTo: null,
    weightFrom: '',
    weightTo: '',
    sortBy: 'date',
    sortOrder: 'desc'
  };
  fetchMetrics(1);
};

// Функции фильтрации по датам
const handleDateFilterChange = () => {
  fetchMetrics(1);
};

const changePage = (page: number) => {
  fetchMetrics(page);
};

// Utility functions
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Toast functions
const showToast = (message: string, color: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' = 'primary') => {
  toastMessage.value = message;
  toastColor.value = color;
  isToastOpen.value = true;
};

const showSuccessToast = (message: string) => {
  showToast(message, 'success');
};

const showErrorToast = (message: string) => {
  showToast(message, 'danger');
};

const onToastDismiss = () => {
  isToastOpen.value = false;
};

onMounted(() => {
  fetchMetrics();
});
</script>

<style scoped>
.page-content {
  padding: 16px;
  padding-bottom: 120px;
}

/* Filters Section */
.filters-section {
  background: var(--ion-color-step-50);
  border-radius: 12px;
  margin-bottom: 20px;
}

.filter-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 16px;
}

.filter-row:first-child {
  grid-template-columns: 1fr;
}

.search-input {
  margin-bottom: 0;
}

.filter-actions {
  display: flex;
  gap: 12px;
  justify-content: space-between;
}

.filter-actions ion-button {
  flex: 1;
  --padding-start: 16px;
  --padding-end: 16px;
}

/* Стили для фильтра по датам */
.date-filter-group {
  flex: 1;
}

/* Vue Datepicker стили */
:deep(.dp__input_wrap) {
  position: relative !important;
  display: flex !important;
  align-items: center !important;
}

:deep(.dp__input) {
  background: rgba(255, 255, 255, 0.05) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  border-radius: 12px !important;
  color: var(--ion-text-color) !important;
  padding: 12px 40px 12px 40px !important;
  height: 48px !important;
  font-size: 16px !important;
  width: 100% !important;
  box-sizing: border-box !important;
}

:deep(.dp__input::placeholder) {
  color: var(--ion-color-medium) !important;
}

:deep(.dp__input:focus) {
  border-color: var(--ion-color-primary) !important;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2) !important;
}

/* Иконки */
:deep(.dp__input_icon) {
  position: absolute !important;
  left: 6px !important;
  top: 50% !important;
  transform: translateY(-50%) !important;
  z-index: 2 !important;
  pointer-events: none !important;
}

:deep(.dp__input_clear) {
  position: absolute !important;
  right: 12px !important;
  top: 50% !important;
  transform: translateY(-50%) !important;
  z-index: 2 !important;
}

:deep(.dp__menu) {
  background: var(--ion-background-color) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  border-radius: 12px !important;
}

:deep(.dp__calendar_header) {
  background: var(--ion-background-color) !important;
}

:deep(.dp__calendar_header_item) {
  color: var(--ion-text-color) !important;
}

:deep(.dp__calendar_item) {
  color: var(--ion-text-color) !important;
}

:deep(.dp__date_selected) {
  background: var(--ion-color-primary) !important;
  color: white !important;
}

/* Metrics List */
.metrics-list {
  margin-bottom: 20px;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
  color: var(--ion-color-medium);
  gap: 16px;
  min-height: 120px;
}

.loading-state ion-spinner {
  margin-bottom: 0;
  --color: var(--ion-color-primary);
}

.loading-state p {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  color: var(--ion-color-medium);
}

.no-data {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  text-align: center;
  color: var(--ion-color-medium);
  padding: 20px;
  gap: 16px;
}

.chart-icon {
  margin-bottom: 0;
  font-size: 3rem;
  color: var(--ion-color-primary);
  opacity: 0.8;
}

.no-data p {
  margin: 0;
  font-size: 16px;
  line-height: 1.4;
}

.no-data-text {
  font-size: 14px !important;
  opacity: 0.8;
  max-width: 280px;
}

.no-data ion-button {
  --padding-start: 20px;
  --padding-end: 20px;
  --padding-top: 12px;
  --padding-bottom: 12px;
  font-size: 14px;
  font-weight: 500;
  text-align: center;
  min-width: 140px;
  --border-radius: 8px;
}

/* Metrics Grid */
.metrics-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.metric-card {
  padding: 16px !important;
  background: var(--ion-color-step-50);
  border-radius: 12px;
  margin: 0 !important;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.metric-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.metric-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.metric-date {
  font-size: 14px;
  font-weight: 600;
  color: var(--ion-text-color);
}

.metric-actions {
  display: flex;
  gap: 4px;
}

.edit-btn, .delete-btn {
  --color: var(--ion-color-medium);
  --background: transparent;
  --border-radius: 50%;
  width: 32px;
  height: 32px;
  min-width: 32px;
  min-height: 32px;
  margin: 0;
  padding: 0;
}

.edit-btn:hover {
  --color: var(--ion-color-primary);
}

.delete-btn:hover {
  --color: var(--ion-color-danger);
}

.metric-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.metric-weight {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.weight-value {
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--ion-color-primary);
}

.weight-unit {
  font-size: 1rem;
  color: var(--ion-color-medium);
  font-weight: 500;
}

.metric-note {
  font-size: 14px;
  color: var(--ion-text-color);
  line-height: 1.4;
  background: rgba(255, 255, 255, 0.05);
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.metric-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.metric-time {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--ion-color-medium);
}

.metric-time i {
  font-size: 10px;
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  border-top: 1px solid var(--ion-color-step-200);
}

.page-info {
  font-size: 14px;
  color: var(--ion-color-medium);
  font-weight: 500;
}

/* Modal Styles */
.modal-content {
  --background: var(--ion-color-step-50);
}

.metric-form {
  padding: 20px;
  max-width: 400px;
  margin: 0 auto;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--ion-text-color);
}

.form-actions {
  margin-top: 30px;
}

.save-btn {
  --background: var(--ion-color-primary);
  --color: white;
  --border-radius: 8px;
  height: 48px;
  font-weight: 600;
}

.save-btn:disabled {
  --background: var(--ion-color-step-200);
  --color: var(--ion-color-medium);
}

/* Modal Error Styles */
.modal-error {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: rgba(244, 67, 54, 0.1);
  border: 1px solid var(--ion-color-danger);
  border-radius: 8px;
  color: var(--ion-color-danger);
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 20px;
}

.modal-error i {
  font-size: 16px;
  flex-shrink: 0;
}

/* Back Button */
ion-toolbar ion-button i {
  font-size: 20px;
  color: white;
}
</style>
