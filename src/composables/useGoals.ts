/**
 * Composable for goals management
 */

import { ref, computed, watch } from 'vue';
import { goalsService } from '@/services/goals.service';
import { exercisesService } from '@/services/exercises.service';
import { useDataFetching, useToast, useModal } from '@/composables';
import type { Goal, GoalStatus, CreateGoalDto, UpdateGoalDto, GoalTypeInfo } from '@/types/models/goal.types';
import { requiresExercise, getGoalTypeOptions } from '@/constants/goal-types';

export interface GoalFilters {
  status: GoalStatus | null;
}

export interface GoalFormData {
  type: string;
  title: string;
  description: string;
  target_value: string;
  start_date: Date | null;
  end_date: Date | null;
  exercise_id: number | string;
}

export function useGoals() {
  const { showSuccess, showError } = useToast();
  
  const filters = ref<GoalFilters>({
    status: null,
  });

  const formData = ref<GoalFormData>({
    type: '',
    title: '',
    description: '',
    target_value: '',
    start_date: null,
    end_date: null,
    exercise_id: '',
  });

  const formModal = useModal<Goal>();
  const deleteModal = useModal<Goal>();
  const isEditing = ref(false);
  const isSaving = ref(false);
  const modalError = ref('');

  // Fetch goals with filters
  const fetchGoalsWithFilters = async (): Promise<Goal[]> => {
    const params = filters.value.status ? { status: filters.value.status } : {};
    return await goalsService.getAll(params);
  };

  const { data: goals, loading, execute: fetchData } = useDataFetching(
    fetchGoalsWithFilters,
    { immediate: true }
  );

  // Fetch exercises for exercise selection
  const { data: exercises, execute: fetchExercises } = useDataFetching(
    async () => await exercisesService.getAll(),
    { immediate: false }
  );

  const exerciseOptions = computed<Array<{ value: number; label: string }>>(() => {
    // Exercise.id is typed as string in domain types, but goal `exercise_id` is numeric in API.
    // Normalize to number for selects and payload mapping.
    return (exercises.value || [])
      .map((exercise) => ({
        value: Number(exercise.id),
        label: exercise.name,
      }))
      .filter((opt) => Number.isFinite(opt.value));
  });

  // Fetch goal types from API
  const { data: goalTypes, execute: fetchGoalTypes } = useDataFetching(
    async () => await goalsService.getTypes(),
    { immediate: true }
  );

  const goalTypeOptions = computed(() => {
    return getGoalTypeOptions(goalTypes.value || undefined);
  });

  const showExerciseField = computed<boolean>(() => {
    return !!formData.value.type && requiresExercise(formData.value.type, goalTypes.value || undefined);
  });

  const openAddModal = () => {
    isEditing.value = false;
    modalError.value = '';
    formData.value = {
      type: '',
      title: '',
      description: '',
      target_value: '',
      start_date: new Date(),
      end_date: null,
      exercise_id: '',
    };
    formModal.open();
    if (!exercises.value) {
      fetchExercises();
    }
  };

  const openEditModal = (goal: Goal) => {
    isEditing.value = true;
    modalError.value = '';
    formModal.open(goal);
    formData.value = {
      type: goal.type,
      title: goal.title,
      description: goal.description || '',
      target_value: goal.target_value.toString(),
      start_date: new Date(goal.start_date),
      end_date: goal.end_date ? new Date(goal.end_date) : null,
      exercise_id: goal.exercise?.id || '',
    };
    if (!exercises.value) {
      fetchExercises();
    }
  };

  const handleCloseModal = () => {
    formModal.close();
    modalError.value = '';
    formData.value = {
      type: '',
      title: '',
      description: '',
      target_value: '',
      start_date: null,
      end_date: null,
      exercise_id: '',
    };
  };

  const normalizeGoalPayload = (localForm: GoalFormData): CreateGoalDto | UpdateGoalDto => {
    const payload: CreateGoalDto | UpdateGoalDto = {
      type: localForm.type as any,
      title: localForm.title.trim(),
      description: localForm.description.trim() || null,
      target_value: parseFloat(localForm.target_value),
      start_date: localForm.start_date ? localForm.start_date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      end_date: localForm.end_date ? localForm.end_date.toISOString().split('T')[0] : null,
    };

    if (requiresExercise(localForm.type, goalTypes.value || undefined) && localForm.exercise_id) {
      payload.exercise_id = typeof localForm.exercise_id === 'number' 
        ? localForm.exercise_id 
        : parseInt(localForm.exercise_id, 10) || null;
    } else {
      payload.exercise_id = null;
    }

    return payload;
  };

  const saveGoal = async (localForm: GoalFormData) => {
    // Validation
    if (!localForm.type) {
      modalError.value = 'Выберите тип цели';
      return;
    }

    if (!localForm.title.trim()) {
      modalError.value = 'Введите название цели';
      return;
    }

    const targetValue = parseFloat(localForm.target_value);
    if (isNaN(targetValue) || targetValue <= 0) {
      modalError.value = 'Целевое значение должно быть больше 0';
      return;
    }

    if (!localForm.start_date) {
      modalError.value = 'Выберите дату начала';
      return;
    }

    if (localForm.end_date && localForm.start_date && localForm.end_date < localForm.start_date) {
      modalError.value = 'Дата окончания не может быть раньше даты начала';
      return;
    }

    if (requiresExercise(localForm.type, goalTypes.value || undefined) && (!localForm.exercise_id || localForm.exercise_id === '')) {
      modalError.value = 'Выберите упражнение';
      return;
    }

    modalError.value = '';
    isSaving.value = true;

    try {
      const payload = normalizeGoalPayload(localForm);

      if (isEditing.value && formModal.data.value) {
        await goalsService.update(formModal.data.value.id.toString(), payload as UpdateGoalDto);
        await showSuccess('Цель успешно обновлена!');
      } else {
        await goalsService.create(payload as CreateGoalDto);
        await showSuccess('Цель успешно создана!');
      }

      handleCloseModal();
      await fetchData();
    } catch (error: any) {
      const errorData = error.response?.data || error;
      if (errorData.errors) {
        const firstError = Object.values(errorData.errors)[0];
        modalError.value = Array.isArray(firstError) 
          ? firstError[0] 
          : String(firstError);
      } else if (errorData.message) {
        modalError.value = errorData.message;
      } else {
        modalError.value = 'Произошла ошибка при сохранении цели';
      }
    } finally {
      isSaving.value = false;
    }
  };

  const confirmDelete = (goal: Goal) => {
    deleteModal.open(goal);
  };

  const handleCloseDeleteModal = () => {
    deleteModal.close();
  };

  const deleteGoal = async () => {
    if (!deleteModal.data.value) return;
    
    const goal = deleteModal.data.value;
    const isActive = goal.status === 'active';
    
    try {
      await goalsService.delete(goal.id.toString());
      await showSuccess(
        isActive 
          ? 'Цель отменена. Вы можете восстановить её позже.' 
          : 'Цель успешно удалена!'
      );
      handleCloseDeleteModal();
      await fetchData();
    } catch (error: any) {
      await showError('Не удалось удалить цель');
    }
  };

  const restoreGoal = async (goal: Goal) => {
    try {
      await goalsService.update(goal.id.toString(), { 
        status: 'active' as any 
      });
      await showSuccess('Цель восстановлена!');
      await fetchData();
    } catch (error: any) {
      await showError('Не удалось восстановить цель');
    }
  };

  const resetFilters = () => {
    filters.value = {
      status: null,
    };
  };

  const applyFilters = async () => {
    await fetchData();
  };

  // Watch for filter changes
  watch(() => filters.value.status, () => {
    fetchData();
  });

  return {
    // State
    goals,
    loading,
    filters,
    formData,
    isModalOpen: formModal.isOpen,
    isDeleteModalOpen: deleteModal.isOpen,
    selectedGoal: deleteModal.data,
    isEditing,
    isSaving,
    modalError,
    exerciseOptions,
    goalTypeOptions,
    showExerciseField,
    goalTypes,
    // Methods
    fetchData,
    openAddModal,
    openEditModal,
    handleCloseModal,
    saveGoal,
    confirmDelete,
    handleCloseDeleteModal,
    deleteGoal,
    restoreGoal,
    resetFilters,
    applyFilters,
  };
}

