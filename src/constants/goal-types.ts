/**
 * Goal Types Constants
 * Descriptions and utilities for goal types
 * 
 * Note: Type info (value, requires_exercise) comes from API
 * Labels are kept here for localization
 */

import type { GoalType, GoalTypeInfo } from '@/types/models/goal.types';

// Labels for goal types (localization)
export const GOAL_TYPE_LABELS: Record<GoalType, string> = {
  total_workouts: 'Всего тренировок',
  completed_workouts: 'Завершенных тренировок',
  target_weight: 'Целевой вес',
  weight_loss: 'Похудение',
  weight_gain: 'Набор веса',
  total_volume: 'Общий объем',
  weekly_volume: 'Недельный объем',
  total_training_time: 'Общее время тренировок',
  weekly_training_time: 'Недельное время тренировок',
  training_frequency: 'Частота тренировок',
  exercise_max_weight: 'Максимальный вес упражнения',
  exercise_max_reps: 'Максимальные повторения упражнения',
  exercise_volume: 'Объем упражнения',
};

/**
 * Get human-readable label for goal type
 */
export function getGoalTypeLabel(type: string): string {
  return GOAL_TYPE_LABELS[type as GoalType] || type;
}

/**
 * Check if goal type requires exercise selection
 * Uses data from API if provided, otherwise falls back to known types
 */
export function requiresExercise(type: string, typesFromApi?: GoalTypeInfo[]): boolean {
  if (typesFromApi) {
    const typeInfo = typesFromApi.find(t => t.value === type);
    return typeInfo?.requires_exercise ?? false;
  }
  // Fallback for backward compatibility
  const typesRequiringExercise: GoalType[] = [
    'exercise_max_weight',
    'exercise_max_reps',
    'exercise_volume',
  ];
  return typesRequiringExercise.includes(type as GoalType);
}

/**
 * Get all goal types as options for select
 * Uses data from API if provided
 */
export function getGoalTypeOptions(typesFromApi?: GoalTypeInfo[]): Array<{ value: GoalType; label: string }> {
  if (typesFromApi) {
    return typesFromApi.map((typeInfo) => ({
      value: typeInfo.value,
      label: getGoalTypeLabel(typeInfo.value),
    }));
  }
  // Fallback for backward compatibility
  return Object.entries(GOAL_TYPE_LABELS).map(([value, label]) => ({
    value: value as GoalType,
    label,
  }));
}

