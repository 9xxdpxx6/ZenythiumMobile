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

