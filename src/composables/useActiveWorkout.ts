/**
 * Composable for active workout logic
 */

import { ref, computed } from 'vue';
import { workoutsService } from '@/services/workouts.service';
import { useToast } from './useToast';
import type { PlanExercise, WorkoutSet } from '@/types/api';

export function useActiveWorkout(workoutId: number) {
  const { showSuccess, showError } = useToast();
  
  const workout = ref<any>(null);
  const exercises = ref<PlanExercise[]>([]);
  const loading = ref(false);
  const addingSet = ref(false);
  const finishing = ref(false);
  const error = ref<string | null>(null);

  const newSets = ref<Record<number, { weight: number | null; reps: number | null }>>({});

  const canFinishWorkout = computed(() => {
    if (exercises.value.length === 0) return false;
    return exercises.value.every(exercise => {
      const currentSets = getCurrentSets(exercise.id);
      return currentSets.length > 0;
    });
  });

  const fetchWorkout = async () => {
    if (!Number.isFinite(workoutId) || isNaN(workoutId)) {
      error.value = 'Некорректный идентификатор тренировки';
      return;
    }
    loading.value = true;
    error.value = null;
    
    try {
      workout.value = await workoutsService.getById(workoutId.toString()) as any;
      
      if (workout.value?.exercises && workout.value.exercises.length > 0) {
        exercises.value = workout.value.exercises || [];
        
        exercises.value.forEach(exercise => {
          newSets.value[exercise.id] = {
            weight: null,
            reps: null,
          };
        });
      } else {
        error.value = 'Тренировка не содержит упражнений';
      }
    } catch (err: any) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  };

  const getCurrentSets = (exerciseId: number) => {
    const exercise = exercises.value.find(ex => ex.id === exerciseId);
    
    if (exercise && exercise.history) {
      const currentWorkoutHistory = exercise.history.find((h: any) => h.workout_id === workoutId);
      
      if (currentWorkoutHistory) {
        return currentWorkoutHistory.sets || [];
      }
    }
    return [];
  };

  const getLastHistoricalSet = (exerciseId: number) => {
    const exercise = exercises.value.find(ex => ex.id === exerciseId);
    if (exercise && exercise.history) {
      const previousHistory = exercise.history
        .filter((h: any) => h.workout_id !== workoutId)
        .sort((a: any, b: any) => new Date(b.workout_date).getTime() - new Date(a.workout_date).getTime());
      
      if (previousHistory.length > 0 && previousHistory[0].sets.length > 0) {
        return previousHistory[0].sets[previousHistory[0].sets.length - 1];
      }
    }
    return null;
  };

  const getPlaceholderValue = (exerciseId: number, field: 'weight' | 'reps') => {
    const lastSet = getLastHistoricalSet(exerciseId);
    if (lastSet) {
      if (field === 'weight') {
        return formatWeight(lastSet[field]);
      }
      return lastSet[field].toString();
    }
    return '';
  };

  const getPreviousSets = (exerciseId: number) => {
    const exercise = exercises.value.find(ex => ex.id === exerciseId);
    if (exercise && exercise.history) {
      return exercise.history
        .filter((h: any) => h.workout_id !== workoutId)
        .sort((a: any, b: any) => new Date(a.workout_date).getTime() - new Date(b.workout_date).getTime());
    }
    return [];
  };

  const groupAndFormatSets = (sets: any[]) => {
    if (!sets || sets.length === 0) return [];
    
    const sortedSets = [...sets].sort((a, b) => (a.id || 0) - (b.id || 0));
    const grouped = sortedSets.reduce((acc, set) => {
      const key = `${set.weight}x${set.reps}`;
      if (!acc[key]) {
        acc[key] = { weight: set.weight, reps: set.reps, count: 0 };
      }
      acc[key].count++;
      return acc;
    }, {} as Record<string, { weight: number; reps: number; count: number }>);
    
    return Object.values(grouped).map((group: unknown) => {
      const typedGroup = group as { weight: number; reps: number; count: number };
      const isSimple = Number(typedGroup.weight) === 0;
      return {
        weight: typedGroup.weight,
        reps: typedGroup.reps,
        count: typedGroup.count,
        isSimple,
      };
    });
  };

  const formatWeight = (weight: number) => {
    const rounded = Math.round(weight);
    if (Math.abs(weight - rounded) < 0.001) {
      return rounded.toString();
    }
    return weight.toString();
  };

  const addSet = async (exerciseId: number) => {
    const setData = newSets.value[exerciseId];
    
    if (setData.weight === null || setData.weight === undefined || !setData.reps || setData.weight < 0 || setData.reps <= 0) {
      error.value = 'Заполните вес (≥0) и повторения (положительные числа)';
      return;
    }

    addingSet.value = true;
    error.value = null;
    
    try {
      const newSet = await workoutsService.createSet({
        workout_id: workoutId,
        plan_exercise_id: exerciseId,
        weight: setData.weight,
        reps: setData.reps,
      });
      
      const exercise = exercises.value.find(ex => ex.id === exerciseId);
      if (exercise && exercise.history) {
        let currentWorkoutHistory = exercise.history.find((h: any) => h.workout_id === workoutId);
        
        if (!currentWorkoutHistory) {
          currentWorkoutHistory = {
            workout_id: workoutId,
            workout_date: workout.value?.startedAt || workout.value?.started_at || new Date().toISOString(),
            sets: []
          };
          exercise.history.push(currentWorkoutHistory);
        }
        
        currentWorkoutHistory.sets.push({
          id: newSet.id,
          weight: newSet.weight,
          reps: newSet.reps
        });
      }
      
      const lastCurrentSet = getLastCurrentSet(exerciseId);
      if (lastCurrentSet) {
        newSets.value[exerciseId] = {
          weight: lastCurrentSet.weight,
          reps: lastCurrentSet.reps,
        };
      } else {
        newSets.value[exerciseId] = {
          weight: null,
          reps: null,
        };
      }
    } catch (err: any) {
      error.value = err.message;
    } finally {
      addingSet.value = false;
    }
  };

  const getLastCurrentSet = (exerciseId: number) => {
    const exercise = exercises.value.find(ex => ex.id === exerciseId);
    if (!exercise || !exercise.history) return null;
    
    const currentWorkoutHistory = exercise.history.find((h: any) => h.workout_id === workoutId);
    if (!currentWorkoutHistory?.sets || currentWorkoutHistory.sets.length === 0) return null;
    
    return currentWorkoutHistory.sets[currentWorkoutHistory.sets.length - 1];
  };

  const deleteSet = async (exerciseId: number, setId: number) => {
    try {
      await workoutsService.deleteSet(setId);
      
      const exercise = exercises.value.find(ex => ex.id === exerciseId);
      if (exercise && exercise.history) {
        const currentWorkoutHistory = exercise.history.find((h: any) => h.workout_id === workoutId);
        if (currentWorkoutHistory) {
          const setIndex = currentWorkoutHistory.sets.findIndex((s: any) => s.id === setId);
          if (setIndex !== -1) {
            currentWorkoutHistory.sets.splice(setIndex, 1);
          }
        }
      }
      
      const lastCurrentSet = getLastCurrentSet(exerciseId);
      if (lastCurrentSet) {
        newSets.value[exerciseId] = {
          weight: lastCurrentSet.weight,
          reps: lastCurrentSet.reps,
        };
      } else {
        newSets.value[exerciseId] = {
          weight: null,
          reps: null,
        };
      }
    } catch (err: any) {
      error.value = err.message;
    }
  };

  const deleteLastSetFromGroup = async (exerciseId: number, groupedSet: { weight: number; reps: number; count: number }) => {
    const exercise = exercises.value.find(ex => ex.id === exerciseId);
    if (!exercise || !exercise.history) return;
    
    const currentWorkoutHistory = exercise.history.find((h: any) => h.workout_id === workoutId);
    if (!currentWorkoutHistory) return;
    
    const matchingSets = currentWorkoutHistory.sets.filter((s: any) => 
      s.weight === groupedSet.weight && s.reps === groupedSet.reps
    );
    
    if (matchingSets.length === 0) return;
    
    const lastSet = matchingSets[matchingSets.length - 1];
    await deleteSet(exerciseId, lastSet.id);
  };

  const finishWorkout = async () => {
    finishing.value = true;
    error.value = null;
    
    try {
      await workoutsService.complete(workoutId.toString(), {
        duration: 0 // TODO: Calculate actual duration
      });
      
      window.dispatchEvent(new CustomEvent('workout-finished', { 
        detail: { workoutId } 
      }));
      
      showSuccess('Тренировка завершена!');
      return true;
    } catch (err: any) {
      error.value = err.message;
      return false;
    } finally {
      finishing.value = false;
    }
  };

  const validateInput = (value: string, exerciseId: number, field: 'weight' | 'reps') => {
    const validPattern = /^[0-9.,]*$/;
    if (!validPattern.test(value)) {
      return;
    }
    
    const normalizedValue = value.replace(',', '.');
    const numValue = parseFloat(normalizedValue);
    
    if (numValue < 0) {
      newSets.value[exerciseId][field] = null;
      return;
    }
    
    if (field === 'reps' && numValue === 0) {
      newSets.value[exerciseId][field] = null;
      return;
    }
    
    if (!isNaN(numValue) && (field === 'weight' ? numValue >= 0 : numValue > 0)) {
      newSets.value[exerciseId][field] = numValue;
    } else if (value === '') {
      newSets.value[exerciseId][field] = null;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
    });
  };

  const formatStartTime = (dateString: string | undefined) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const clearError = () => {
    error.value = null;
  };

  return {
    workout,
    exercises,
    loading,
    addingSet,
    finishing,
    error,
    newSets,
    canFinishWorkout,
    fetchWorkout,
    getCurrentSets,
    getPlaceholderValue,
    getPreviousSets,
    groupAndFormatSets,
    formatWeight,
    addSet,
    deleteSet,
    deleteLastSetFromGroup,
    finishWorkout,
    validateInput,
    formatDate,
    formatStartTime,
    clearError,
  };
}


