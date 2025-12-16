/**
 * Goal domain types
 */

export type GoalType =
  | 'total_workouts'
  | 'completed_workouts'
  | 'target_weight'
  | 'weight_loss'
  | 'weight_gain'
  | 'total_volume'
  | 'weekly_volume'
  | 'total_training_time'
  | 'weekly_training_time'
  | 'training_frequency'
  | 'exercise_max_weight'
  | 'exercise_max_reps'
  | 'exercise_volume';

export type GoalStatus = 'active' | 'completed' | 'failed' | 'cancelled';

export interface GoalExercise {
  id: number;
  name: string;
}

export interface Goal {
  id: number;
  type: GoalType;
  title: string;
  description: string | null;
  target_value: number;
  current_value: number | null;
  progress_percentage: number | null;
  start_date: string;
  end_date: string | null;
  exercise: GoalExercise | null;
  status: GoalStatus;
  completed_at: string | null;
  achieved_value: number | null;
  days_to_complete: number | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface CreateGoalDto {
  type: GoalType;
  title: string;
  description?: string | null;
  target_value: number;
  start_date: string;
  end_date?: string | null;
  exercise_id?: number | null;
}

export interface UpdateGoalDto {
  type?: GoalType;
  title?: string;
  description?: string | null;
  target_value?: number;
  start_date?: string;
  end_date?: string | null;
  exercise_id?: number | null;
  status?: GoalStatus;
}

export interface GoalTypeInfo {
  value: GoalType;
  requires_exercise: boolean;
}

export interface GoalStatistics {
  total_workouts?: number;
  completed_workouts?: number;
  total_training_time?: number;
  total_volume?: string;
  current_weight?: number;
  active_cycles_count?: number;
  weight_change_30_days?: number;
  training_frequency_4_weeks?: number;
  [key: string]: unknown;
}

