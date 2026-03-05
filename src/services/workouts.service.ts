/**
 * Workouts Service
 * Handles all workouts-related API operations
 */

import { BaseService } from './base.service';
import apiClient from './api';
import { API_ENDPOINTS } from '../constants/api-endpoints';
import type {
  Workout,
  CreateWorkoutDto,
  UpdateWorkoutDto,
  CompleteWorkoutDto,
  UpdateSetDto,
} from '../types/models/workout.types';
import { WorkoutStatus } from '../types/models/workout.types';
import type { Workout as ApiWorkout } from '../types/api';
import type { PaginatedResponse, ApiPaginationMeta } from '../types/common/pagination.types';
import { errorHandler } from '../utils/error-handler';
import { logger } from '../utils/logger';

class WorkoutsService extends BaseService<Workout, CreateWorkoutDto, UpdateWorkoutDto> {
  constructor() {
    super(API_ENDPOINTS.WORKOUTS);
  }

  private extractPlanIdFromApiWorkout(workout: Partial<ApiWorkout> | any): number | null {
    const raw = workout?.plan_id ?? workout?.planId ?? workout?.plan?.id;
    const num = Number(raw);
    if (!num || Number.isNaN(num)) return null;
    return num;
  }

  private extractStartedAtFromApiWorkout(workout: Partial<ApiWorkout> | any): string | null {
    return (workout?.started_at ?? workout?.startedAt ?? workout?.start_date ?? null) as string | null;
  }

  /**
   * Get workout by ID (raw API shape)
   * Needed for screens that rely on snake_case fields and/or nested history structures.
   */
  async getApiById(id: string): Promise<ApiWorkout> {
    try {
      const response = await apiClient.get<{ data: ApiWorkout }>(
        API_ENDPOINTS.WORKOUT_BY_ID(id)
      );
      return response.data.data;
    } catch (error) {
      errorHandler.log(error, 'WorkoutsService.getApiById');
      throw error;
    }
  }

  /**
   * Update workout by ID (raw API shape)
   * Backend may require started_at and plan_id for updates.
   */
  async updateApiById(
    id: string,
    data: { plan_id?: number | null; started_at?: string | null; finished_at?: string | null }
  ): Promise<ApiWorkout> {
    try {
      let planId = data.plan_id ?? null;
      let startedAt = data.started_at ?? null;

      // Fill required fields if missing (avoid 422 due to omitted undefined keys)
      if (!planId || !startedAt) {
        const currentWorkout = await this.getApiById(id);
        if (!planId) planId = this.extractPlanIdFromApiWorkout(currentWorkout);
        if (!startedAt) startedAt = this.extractStartedAtFromApiWorkout(currentWorkout);
      }

      const normalizedPlanId = Number(planId);
      if (!normalizedPlanId || Number.isNaN(normalizedPlanId)) {
        throw new Error('План обязателен');
      }
      if (!startedAt) {
        throw new Error('Дата начала обязательна');
      }

      const requestBody: { plan_id: number; started_at: string; finished_at?: string | null } = {
        plan_id: normalizedPlanId,
        started_at: startedAt,
      };
      if (data.finished_at !== undefined) {
        requestBody.finished_at = data.finished_at;
      }

      const response = await apiClient.put<{ data: ApiWorkout }>(
        API_ENDPOINTS.WORKOUT_BY_ID(id),
        requestBody
      );
      logger.info('WorkoutsService: Workout updated successfully');
      return response.data.data;
    } catch (error) {
      errorHandler.log(error, 'WorkoutsService.updateApiById');
      throw error;
    }
  }

  /**
   * Override getAll to map API response
   */
  async getAll(filters?: any): Promise<Workout[]> {
    try {
      const params = this.buildQueryParams(filters);
      const response = await apiClient.get<{ data: ApiWorkout[] }>(this.baseUrl, { params });
      return response.data.data.map(workout => this.mapWorkoutFromApi(workout));
    } catch (error) {
      errorHandler.log(error, `${this.constructor.name}.getAll`);
      throw error;
    }
  }

  /**
   * Override getPaginated to map API response
   * API returns: { data: Workout[], meta: { current_page, last_page, per_page, total, from, to }, message }
   */
  async getPaginated(filters?: Record<string, any>): Promise<PaginatedResponse<Workout>> {
    try {
      const params = this.buildQueryParams(filters);
      const response = await apiClient.get<{ data: ApiWorkout[]; meta: ApiPaginationMeta; message?: string }>(this.baseUrl, { params });
      return {
        data: response.data.data.map(workout => this.mapWorkoutFromApi(workout)),
        meta: response.data.meta,
        message: response.data.message,
      };
    } catch (error) {
      errorHandler.log(error, `${this.constructor.name}.getPaginated`);
      throw error;
    }
  }

  /**
   * Override getById to map API response
   */
  async getById(id: string): Promise<Workout> {
    try {
      const response = await apiClient.get<{ data: ApiWorkout }>(`${this.baseUrl}/${id}`);
      return this.mapWorkoutFromApi(response.data.data);
    } catch (error) {
      errorHandler.log(error, `${this.constructor.name}.getById`);
      throw error;
    }
  }

  /**
   * Map API response to Workout model
   */
  private mapWorkoutFromApi(apiWorkout: ApiWorkout): Workout {
    // Map status from API format to domain format
    let status: WorkoutStatus = WorkoutStatus.SCHEDULED;
    if (apiWorkout.status === 'active') {
      status = WorkoutStatus.IN_PROGRESS;
    } else if (apiWorkout.status === 'completed') {
      status = WorkoutStatus.COMPLETED;
    }

    return {
      id: String(apiWorkout.id),
      userId: String(apiWorkout.user_id),
      name: apiWorkout.plan?.name || 'Тренировка',
      status,
      startedAt: apiWorkout.started_at,
      completedAt: apiWorkout.finished_at || undefined,
      // Keep exercises as-is from API to preserve history structure for useActiveWorkout
      // exercises will be PlanExercise[] with history property from API
      exercises: apiWorkout.exercises || [],
      createdAt: apiWorkout.created_at,
      updatedAt: apiWorkout.updated_at,
      // Keep plan from API for components that need it
      plan: apiWorkout.plan,
    } as any;
  }

  /**
   * Get active workout
   * Returns null if no active workout (404 or 500 errors are treated as "no active workout")
   */
  async getActive(): Promise<Workout | null> {
    try {
      const response = await apiClient.get<{ data: ApiWorkout | null }>(
        API_ENDPOINTS.WORKOUT_ACTIVE
      );
      if (!response.data.data) {
        return null;
      }
      return this.mapWorkoutFromApi(response.data.data);
    } catch (error: any) {
      // 404 or 500 means no active workout - this is normal, not an error
      if (error?.response?.status === 404 || error?.response?.status === 500) {
        return null;
      }
      // Log and throw other errors
      errorHandler.log(error, 'WorkoutsService.getActive');
      throw error;
    }
  }

  /**
   * Start a workout
   */
  async start(id: string): Promise<Workout> {
    try {
      // According to API docs: POST /workouts with optional plan_id
      const payload: any = {};
      if (id && id !== 'auto') {
        const numericPlanId = Number(id);
        if (!isNaN(numericPlanId)) {
          payload.plan_id = numericPlanId;
        }
      }

      const response = await apiClient.post<{ data: ApiWorkout }>(
        API_ENDPOINTS.WORKOUTS_START,
        payload
      );
      logger.info('WorkoutsService: Workout started successfully');
      return this.mapWorkoutFromApi(response.data.data);
    } catch (error) {
      errorHandler.log(error, 'WorkoutsService.start');
      throw error;
    }
  }

  /**
   * Finish (complete) a workout
   * Uses dedicated POST /workouts/{id}/finish — server sets finished_at and calculates duration.
   */
  async complete(id: string, _data?: CompleteWorkoutDto): Promise<Workout> {
    try {
      const response = await apiClient.post<{ data: ApiWorkout; message?: string; duration_minutes?: number }>(
        API_ENDPOINTS.WORKOUT_FINISH(id)
      );
      logger.info('WorkoutsService: Workout finished successfully');
      return this.mapWorkoutFromApi(response.data.data);
    } catch (error) {
      errorHandler.log(error, 'WorkoutsService.complete');
      throw error;
    }
  }

  /**
   * Update exercise set
   */
  async updateExerciseSet(
    workoutId: string,
    exerciseId: string,
    setId: string,
    data: UpdateSetDto
  ): Promise<void> {
    try {
      await apiClient.put(
        API_ENDPOINTS.WORKOUT_EXERCISE_SET(workoutId, exerciseId, setId),
        data
      );
      logger.info('WorkoutsService: Exercise set updated successfully');
    } catch (error) {
      errorHandler.log(error, 'WorkoutsService.updateExerciseSet');
      throw error;
    }
  }

  /**
   * Update set (by set ID)
   */
  async updateSet(setId: number, data: UpdateSetDto): Promise<void> {
    try {
      await apiClient.put(`/workout-sets/${setId}`, data);
      logger.info('WorkoutsService: Set updated successfully');
    } catch (error) {
      errorHandler.log(error, 'WorkoutsService.updateSet');
      throw error;
    }
  }

  /**
   * Delete set
   */
  async deleteSet(setId: number): Promise<void> {
    try {
      await apiClient.delete(`/workout-sets/${setId}`);
      logger.info('WorkoutsService: Set deleted successfully');
    } catch (error) {
      errorHandler.log(error, 'WorkoutsService.deleteSet');
      throw error;
    }
  }

  /**
   * Create set
   */
  async createSet(data: any): Promise<any> {
    try {
      const response = await apiClient.post('/workout-sets', data);
      logger.info('WorkoutsService: Set created successfully');
      return response.data.data;
    } catch (error) {
      errorHandler.log(error, 'WorkoutsService.createSet');
      throw error;
    }
  }
}

export const workoutsService = new WorkoutsService();

