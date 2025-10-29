/**
 * Plan domain types
 */

export interface Plan {
  id: string;
  userId: string;
  name: string;
  description?: string;
  durationWeeks: number;
  workoutsPerWeek: number;
  workouts: PlanWorkout[];
  isTemplate: boolean;
  isPublic: boolean;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PlanWorkout {
  id: string;
  planId: string;
  name: string;
  description?: string;
  dayOfWeek: number;
  weekNumber: number;
  exercises: PlanExercise[];
  estimatedDuration?: number;
  notes?: string;
}

export interface PlanExercise {
  id: string;
  planWorkoutId: string;
  exerciseId: string;
  order: number;
  sets: number;
  reps?: string;
  weight?: number;
  restSeconds?: number;
  tempo?: string;
  notes?: string;
}

export interface CreatePlanDto {
  name: string;
  description?: string;
  durationWeeks: number;
  workoutsPerWeek: number;
  isTemplate?: boolean;
  isPublic?: boolean;
  tags?: string[];
}

export interface UpdatePlanDto {
  name?: string;
  description?: string;
  durationWeeks?: number;
  workoutsPerWeek?: number;
  isTemplate?: boolean;
  isPublic?: boolean;
  tags?: string[];
}

