/**
 * Cycle domain types
 */

export enum CycleStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
}

export interface Cycle {
  id: number;
  name: string;
  status: CycleStatus;
  plans_count?: number;
  workouts_count?: number;
  started_at: string;
  finished_at?: string;
  progress?: number;
  // Additional fields for backward compatibility and form usage
  weeks?: number;
  current_week?: number;
  start_date?: string | null;
  end_date?: string | null;
  plans?: any[];
}

export interface CreateCycleDto {
  planId?: number;
  name: string;
  startDate?: string;
  endDate?: string;
}

export interface UpdateCycleDto {
  planId?: number;
  name?: string;
  status?: CycleStatus;
  startDate?: string;
  endDate?: string;
}

/**
 * Share link response
 */
export interface ShareLinkResponse {
  share_link: string;
  share_id: string;
  message: string;
}

/**
 * Author of shared cycle
 */
export interface SharedCycleAuthor {
  id: number;
  name: string;
}

/**
 * Muscle group in shared cycle structure
 */
export interface SharedCycleMuscleGroup {
  id: number;
  name: string;
}

/**
 * Exercise in shared cycle structure
 */
export interface SharedCycleExercise {
  name: string;
  muscle_group?: SharedCycleMuscleGroup | null;
  description?: string | null;
}

/**
 * Plan in shared cycle structure
 */
export interface SharedCyclePlan {
  name: string;
  exercises: SharedCycleExercise[];
}

/**
 * Cycle in shared cycle structure
 */
export interface SharedCycleStructureCycle {
  name: string;
  plans: SharedCyclePlan[];
}

/**
 * Structure of shared cycle
 */
export interface SharedCycleStructure {
  cycles: SharedCycleStructureCycle[];
}

/**
 * Shared cycle resource
 */
export interface SharedCycle {
  id: number;
  name: string;
  weeks: number;
  author?: SharedCycleAuthor | null;
  plans_count: number;
  exercises_count: number;
  view_count: number;
  import_count: number;
  structure?: SharedCycleStructure | null;
  created_at: string;
  updated_at: string;
}

/**
 * Import cycle response
 */
export interface ImportCycleResponse {
  cycle_id: number;
  plans_count: number;
  exercises_count: number;
}

