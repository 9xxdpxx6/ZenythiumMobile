// User related types
export interface User {
  id: number;
  name: string;
  email: string;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
}

// Authentication types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  token_type: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export interface RegisterResponse {
  token: string;
  token_type: string;
}

// Workout related types
export interface Workout {
  id: number;
  user_id: number;
  plan_id: number;
  started_at: string;
  finished_at: string | null;
  status: 'active' | 'completed';
  created_at: string;
  updated_at: string;
  plan?: Plan;
  sets?: WorkoutSet[];
  exercises?: PlanExercise[];
}

// Detailed workout types for view page
export interface DetailedWorkout {
  id: number;
  started_at: string;
  finished_at: string | null;
  duration_minutes: number;
  exercise_count: number;
  total_volume: number;
  plan: {
    id: number;
    name: string;
  };
  user: {
    id: number;
    name: string;
  };
  exercises: DetailedWorkoutExercise[];
  created_at: string;
  updated_at: string;
}

export interface DetailedWorkoutExercise {
  id: number;
  order: number;
  exercise: {
    id: number;
    name: string;
    description: string;
    muscle_group: {
      id: number;
      name: string;
    };
  };
  history: DetailedExerciseHistory[];
}

export interface DetailedExerciseHistory {
  workout_id: number;
  workout_date: string | null; // null для незавершенной тренировки
  sets: DetailedWorkoutSet[];
}

export interface DetailedWorkoutSet {
  id: number;
  weight: number;
  reps: number;
}

export interface WorkoutSet {
  id: number;
  workout_id: number;
  plan_exercise_id: number;
  weight: number | null;
  reps: number | null;
  created_at: string;
  updated_at: string;
  exercise?: Exercise;
}

export interface StartWorkoutRequest {
  plan_id?: number; // Необязательный параметр согласно API
}

export interface StartWorkoutResponse {
  data: Workout;
  message: string;
}

export interface FinishWorkoutResponse {
  workout: Workout;
}

// Plan related types
export interface Plan {
  id: number;
  name: string;
  order: number;
  is_active: boolean;
  exercise_count: number;
  cycle?: {
    id: number;
    name: string;
  };
  exercises?: Exercise[];
  created_at: string;
  updated_at: string;
}

// Cycle related types
export interface Cycle {
  id: number;
  name: string;
  weeks: number;
  start_date: string | null;
  end_date: string | null;
  progress_percentage: number;
  completed_workouts_count: number;
  plans_count: number;
  created_at: string;
  updated_at: string;
  plans?: CyclePlan[];
}

export interface CyclePlan {
  id: number;
  cycle_id: number;
  plan_id: number;
  order: number;
  plan: Plan;
}

export interface Exercise {
  id: number;
  plan_id: number;
  name: string;
  order: number;
  description: string | null;
  muscle_group?: {
    id: number;
    name: string;
  };
  created_at: string;
  updated_at: string;
}

export interface ExerciseHistory {
  workout_id: number;
  workout_date: string;
  sets: Array<{
    id: number;
    weight: number;
    reps: number;
  }>;
}

export interface PlanExercise {
  id: number;
  order: number;
  exercise: Exercise;
  history: ExerciseHistory[];
}

// Statistics types
export interface Statistics {
  total_workouts: number;
  completed_workouts: number;
  total_training_time: number;
  total_volume: number;
  active_cycles_count: number;
  weight_change_30_days: number;
  training_frequency_4_weeks: number;
  training_streak_days: number;
}

export interface StatisticsResponse {
  data: Statistics;
  message: string;
}

// Metrics types
export interface Metric {
  id: number;
  user_id: number;
  weight: string; // API возвращает вес как строку
  body_fat_percentage?: string;
  muscle_mass?: string;
  date: string;
  note?: string;
  created_at: string;
  updated_at: string;
  user?: {
    id: number;
    name: string;
    email: string;
  };
}

export interface MetricsResponse {
  data: Metric[];
  message: string;
  meta?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

// API Error types
export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}

// Generic API response wrapper
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

// Exercise Resource (from API)
export interface ExerciseResource {
  id: number;
  name: string;
  description: string | null;
  muscle_group: {
    id: number;
    name: string;
  };
  user: {
    id: number;
    name: string;
  };
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Muscle Group Resource (from API)
export interface MuscleGroupResource {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

// Exercise CRUD request types
export interface CreateExerciseRequest {
  name: string;
  description?: string;
  muscle_group_id: number;
  is_active?: boolean;
}

export interface UpdateExerciseRequest {
  name?: string;
  description?: string;
  muscle_group_id?: number;
  is_active?: boolean;
}

// Exercise responses
export interface ExercisesResponse {
  data: ExerciseResource[];
  message: string;
  meta?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
  };
}

export interface MuscleGroupsResponse {
  data: MuscleGroupResource[];
  message: string;
  meta?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
  };
}
