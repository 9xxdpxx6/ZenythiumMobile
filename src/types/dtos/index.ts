/**
 * Data Transfer Objects (DTOs)
 * Re-export all DTOs from model files
 */

// Metric DTOs
export type { CreateMetricDto, UpdateMetricDto } from '../models/metric.types';

// Cycle DTOs
export type { CreateCycleDto, UpdateCycleDto } from '../models/cycle.types';

// Plan DTOs
export type { CreatePlanDto, UpdatePlanDto } from '../models/plan.types';

// Workout DTOs
export type {
  CreateWorkoutDto,
  UpdateWorkoutDto,
  CompleteWorkoutDto,
  UpdateSetDto,
} from '../models/workout.types';

// Exercise DTOs
export type { CreateExerciseDto, UpdateExerciseDto } from '../models/exercise.types';

// User DTOs
export type { UpdateProfileDto, UpdateSettingsDto } from '../models/user.types';

// Auth DTOs
export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  username: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    username: string;
  };
  token: string;
  refreshToken?: string;
}

export interface RefreshTokenDto {
  refreshToken: string;
}

