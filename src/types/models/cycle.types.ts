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

