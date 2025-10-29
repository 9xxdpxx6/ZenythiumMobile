/**
 * Composable for metrics management
 */

import { ref, watch } from 'vue';
import { metricsService } from '@/services/metrics.service';
import { useDataFetching, useToast, useModal } from '@/composables';
import type { Metric } from '@/types/models/metric.types';

export interface MetricFilters {
  search: string;
  dateFrom: Date | null;
  dateTo: Date | null;
  weightFrom: string;
  weightTo: string;
  sortBy: string;
  sortOrder: string;
}

export interface MetricFormData {
  date: Date | null;
  weight: string;
  note: string;
}

export function useMetrics() {
  const { showSuccess, showError } = useToast();
  
  const currentPage = ref(1);
  const totalPages = ref(1);
  const formModal = useModal<any>();
  const deleteModal = useModal<any>();
  const isEditing = ref(false);
  const isSaving = ref(false);
  const modalError = ref('');
  
  const filters = ref<MetricFilters>({
    search: '',
    dateFrom: null,
    dateTo: null,
    weightFrom: '',
    weightTo: '',
    sortBy: 'date',
    sortOrder: 'desc'
  });

  const formData = ref<MetricFormData>({
    date: null,
    weight: '',
    note: ''
  });

  const fetchMetricsWithFilters = async () => {
    const params: any = {
      page: currentPage.value,
      per_page: 15,
      sort_by: filters.value.sortBy,
      sort_order: filters.value.sortOrder
    };
    
    if (filters.value.search) params.search = filters.value.search;
    if (filters.value.dateFrom) {
      const dateFromWithTime = new Date(filters.value.dateFrom);
      dateFromWithTime.setHours(0, 0, 0, 0);
      params.date_from = dateFromWithTime.toISOString();
    }
    if (filters.value.dateTo) {
      const dateToWithTime = new Date(filters.value.dateTo);
      dateToWithTime.setHours(23, 59, 59, 999);
      params.date_to = dateToWithTime.toISOString();
    }
    if (filters.value.weightFrom) params.weight_from = filters.value.weightFrom;
    if (filters.value.weightTo) params.weight_to = filters.value.weightTo;
    
    const result = await metricsService.getPaginated(params);
    
    if (result.pagination) {
      totalPages.value = result.pagination.totalPages;
    }
    
    return result.data || [];
  };

  const { data: metrics, loading, execute: fetchData } = useDataFetching(fetchMetricsWithFilters);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const openAddModal = () => {
    isEditing.value = false;
    modalError.value = '';
    formData.value = {
      date: new Date(),
      weight: '',
      note: ''
    };
    formModal.open();
  };

  const openEditModal = (metric: any) => {
    isEditing.value = true;
    modalError.value = '';
    formModal.open(metric);
    formData.value = {
      date: new Date(metric.date),
      weight: metric.weight,
      note: metric.note || ''
    };
  };

  const handleCloseModal = () => {
    formModal.close();
    modalError.value = '';
    formData.value = {
      date: null,
      weight: '',
      note: ''
    };
  };

  const saveMetric = async () => {
    if (!formData.value.weight || !formData.value.date) return;
    
    modalError.value = '';
    
    const selectedDate = new Date(formData.value.date as any);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    if (selectedDate > today) {
      modalError.value = 'Дата не может быть в будущем';
      return;
    }
    
    const weight = parseFloat(formData.value.weight);
    if (isNaN(weight) || weight <= 0 || weight > 1000) {
      modalError.value = 'Вес должен быть от 0 до 1000 кг';
      return;
    }
    
    isSaving.value = true;
    
    try {
      const data = {
        date: (formData.value.date as any)?.toISOString().split('T')[0],
        weight: weight.toFixed(2),
        note: formData.value.note || null
      } as any;
      
      if (isEditing.value && formModal.data.value) {
        await metricsService.update(formModal.data.value.id.toString(), data as any);
        await showSuccess('Запись успешно обновлена!');
        window.dispatchEvent(new CustomEvent('metric-updated'));
      } else {
        await metricsService.create(data as any);
        await showSuccess('Запись успешно добавлена!');
        window.dispatchEvent(new CustomEvent('metric-added'));
      }
      
      handleCloseModal();
      await fetchData();
    } catch (error: any) {
      const errorData = error.response?.data || error;
      if (errorData.errors?.date) {
        modalError.value = Array.isArray(errorData.errors.date) 
          ? errorData.errors.date[0] 
          : String(errorData.errors.date);
      } else if (errorData.message) {
        modalError.value = errorData.message;
      } else {
        modalError.value = 'Произошла ошибка при сохранении записи';
      }
    } finally {
      isSaving.value = false;
    }
  };

  const confirmDelete = (metric: any) => {
    deleteModal.open(metric);
  };

  const handleCloseDeleteModal = () => {
    deleteModal.close();
  };

  const deleteMetric = async () => {
    if (!deleteModal.data.value) return;
    
    try {
      await metricsService.delete(deleteModal.data.value.id.toString());
      await showSuccess('Запись успешно удалена!');
      handleCloseDeleteModal();
      await fetchData();
    } catch (error: any) {
      await showError('Не удалось удалить запись');
    }
  };

  const handleDateFilterChange = () => {
    if (filters.value.dateFrom && filters.value.dateTo) {
      if (filters.value.dateTo < filters.value.dateFrom) {
        filters.value.dateTo = filters.value.dateFrom;
      }
    }
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
  };

  const applyFilters = async () => {
    currentPage.value = 1;
    await fetchData();
  };

  const goToPage = async (page: number) => {
    if (page >= 1 && page <= totalPages.value) {
      currentPage.value = page;
      await fetchData();
    }
  };

  // Hot filters - автоматическое применение фильтров с debounce
  let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  let weightDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  let dateDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  watch(() => filters.value.search, () => {
    if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => {
      currentPage.value = 1;
      fetchData();
    }, 500);
  });

  watch(() => [filters.value.weightFrom, filters.value.weightTo], () => {
    if (weightDebounceTimer) clearTimeout(weightDebounceTimer);
    weightDebounceTimer = setTimeout(() => {
      currentPage.value = 1;
      fetchData();
    }, 500);
  });

  watch(() => [filters.value.dateFrom, filters.value.dateTo], () => {
    if (dateDebounceTimer) clearTimeout(dateDebounceTimer);
    dateDebounceTimer = setTimeout(() => {
      currentPage.value = 1;
      fetchData();
    }, 500);
  });

  return {
    // State
    metrics,
    loading,
    filters,
    formData,
    currentPage,
    totalPages,
    isModalOpen: formModal.isOpen,
    isDeleteModalOpen: deleteModal.isOpen,
    selectedMetric: deleteModal.data,
    isEditing,
    isSaving,
    modalError,
    // Methods
    fetchData,
    formatDate,
    openAddModal,
    openEditModal,
    handleCloseModal,
    saveMetric,
    confirmDelete,
    handleCloseDeleteModal,
    deleteMetric,
    handleDateFilterChange,
    resetFilters,
    applyFilters,
    goToPage,
  };
}

