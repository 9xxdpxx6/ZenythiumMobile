/**
 * Workout domain types
 */

export enum WorkoutStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  SKIPPED = 'skipped',
  CANCELLED = 'cancelled',
}

export interface Workout {
  id: string;
  userId: string;
  cycleId?: string;
  planWorkoutId?: string;
  name: string;
  description?: string;
  status: WorkoutStatus;
  scheduledDate?: string;
  startedAt?: string;
  completedAt?: string;
  duration?: number;
  // For active workout, exercises come from API as PlanExercise[] with history
  // This allows useActiveWorkout to access exercise.history structure
  exercises: any[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkoutExercise {
  id: string;
  workoutId: string;
  exerciseId: string;
  order: number;
  sets: WorkoutSet[];
  notes?: string;
}

export interface WorkoutSet {
  id: string;
  workoutExerciseId: string;
  setNumber: number;
  reps?: number;
  weight?: number;
  duration?: number;
  distance?: number;
  completed: boolean;
  rpe?: number;
  notes?: string;
}

export interface CreateWorkoutDto {
  cycleId?: string;
  planWorkoutId?: string;
  name: string;
  description?: string;
  scheduledDate?: string;
}

export interface UpdateWorkoutDto {
  name?: string;
  description?: string;
  status?: WorkoutStatus;
  scheduledDate?: string;
  notes?: string;
}

export interface CompleteWorkoutDto {
  duration: number;
  notes?: string;
}

export interface UpdateSetDto {
  reps?: number;
  weight?: number;
  duration?: number;
  distance?: number;
  completed?: boolean;
  rpe?: number;
  notes?: string;
}

