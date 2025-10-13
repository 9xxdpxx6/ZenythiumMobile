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
}

export interface WorkoutSet {
  id: number;
  workout_id: number;
  exercise_id: number;
  weight: number;
  reps: number;
  rest_seconds: number;
  created_at: string;
  updated_at: string;
  exercise?: Exercise;
}

export interface StartWorkoutRequest {
  plan_id: number;
}

export interface StartWorkoutResponse {
  workout: Workout;
}

export interface FinishWorkoutResponse {
  workout: Workout;
}

// Plan related types
export interface Plan {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  exercises?: Exercise[];
  difficulty?: string;
  duration?: number;
  exercises_count?: number;
  category?: string;
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
  description: string | null;
  created_at: string;
  updated_at: string;
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
