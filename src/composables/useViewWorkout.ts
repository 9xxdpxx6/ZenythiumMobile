/**
 * Composable for viewing workout details
 */

import { ref } from 'vue';
import { workoutsService } from '@/services/workouts.service';
import { useModal } from './useModal';
import apiClient from '@/services/api';
import { API_ENDPOINTS } from '@/constants/api-endpoints';
import type { DetailedWorkout, ApiError } from '@/types/api';

export function useViewWorkout(workoutId: string) {
  const workout = ref<DetailedWorkout | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const toastMessage = ref<string | null>(null);
  const toastColor = ref<'success' | 'danger' | 'warning'>('danger');

  const deleteModal = useModal();
  const isDeleting = ref(false);

  const fetchWorkout = async () => {
    if (!workoutId) {
      error.value = 'ID тренировки не найден';
      return;
    }

    loading.value = true;
    error.value = null;
    
    try {
      // For view page, we need DetailedWorkout with plan structure from API
      // Use direct API call instead of mapped service to get DetailedWorkout
      const response = await apiClient.get<{ data: DetailedWorkout }>(
        API_ENDPOINTS.WORKOUT_BY_ID(workoutId)
      );
      workout.value = response.data.data;
    } catch (err) {
      console.error('Workout fetch error:', err);
      console.error('Error details:', {
        message: (err as ApiError).message,
        status: (err as any).response?.status,
        statusText: (err as any).response?.statusText,
        data: (err as any).response?.data
      });
      error.value = (err as ApiError).message || 'Ошибка загрузки тренировки';
    } finally {
      loading.value = false;
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}ч ${mins}м`;
    }
    return `${mins}м`;
  };

  const formatWeight = (weight: number | null | undefined) => {
    if (weight === null || weight === undefined || isNaN(weight)) {
      return '0';
    }
    return Math.round(Number(weight)).toString();
  };

  interface GroupedSet {
    weight: number;
    reps: number;
    count: number;
    isSimple: boolean;
  }

  const groupAndFormatSets = (sets: any[]): GroupedSet[] => {
    if (!sets || sets.length === 0) return [];
    
    const sortedSets = [...sets].sort((a, b) => (a.id || 0) - (b.id || 0));
    
    const grouped = sortedSets.reduce((acc, set) => {
      const key = `${set.weight}x${set.reps}`;
      if (!acc[key]) {
        acc[key] = {
          weight: set.weight,
          reps: set.reps,
          count: 0
        };
      }
      acc[key].count++;
      return acc;
    }, {} as Record<string, { weight: number; reps: number; count: number }>);
    
    return Object.values(grouped).map((group) => {
      const typedGroup = group as { weight: number; reps: number; count: number };
      const isSimple = Number(typedGroup.weight) === 0;
      
      return {
        weight: typedGroup.weight,
        reps: typedGroup.reps,
        count: typedGroup.count,
        isSimple: isSimple
      };
    });
  };

  const getSortedHistory = (history: any[], currentWorkoutId: number) => {
    if (!history) return [];
    
    return [...history].sort((a, b) => {
      if (a.workout_id === currentWorkoutId && b.workout_id !== currentWorkoutId) return -1;
      if (a.workout_id !== currentWorkoutId && b.workout_id === currentWorkoutId) return 1;
      if (a.workout_id === currentWorkoutId && b.workout_id === currentWorkoutId) return 0;
      
      return new Date(b.workout_date).getTime() - new Date(a.workout_date).getTime();
    });
  };

  const isCurrentWorkout = (historyItem: any, currentWorkoutId: number) => {
    return historyItem.workout_id === currentWorkoutId;
  };

  const clearToast = () => {
    toastMessage.value = null;
  };

  const handleEdit = (workoutId: number) => {
    return `/edit-workout/${workoutId}`;
  };

  const handleDelete = () => {
    deleteModal.open();
  };

  const handleDeleteConfirm = async () => {
    if (!workout.value) return;
    
    isDeleting.value = true;
    try {
      await workoutsService.delete(workout.value.id.toString());
      
      toastMessage.value = 'Тренировка успешно удалена';
      toastColor.value = 'success';
      
      return true;
    } catch (err) {
      console.error('Delete workout error:', err);
      toastMessage.value = (err as ApiError).message || 'Ошибка удаления тренировки';
      toastColor.value = 'danger';
      return false;
    } finally {
      isDeleting.value = false;
      deleteModal.close();
    }
  };

  const handleDeleteCancel = () => {
    deleteModal.close();
  };

  return {
    workout,
    loading,
    error,
    toastMessage,
    toastColor,
    showDeleteModal: deleteModal.isOpen,
    isDeleting,
    fetchWorkout,
    formatDateTime,
    formatDate,
    formatDuration,
    formatWeight,
    groupAndFormatSets,
    getSortedHistory,
    isCurrentWorkout,
    clearToast,
    handleEdit,
    handleDelete,
    handleDeleteConfirm,
    handleDeleteCancel,
  };
}


