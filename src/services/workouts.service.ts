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
import { errorHandler } from '../utils/error-handler';
import { logger } from '../utils/logger';

class WorkoutsService extends BaseService<Workout, CreateWorkoutDto, UpdateWorkoutDto> {
  constructor() {
    super(API_ENDPOINTS.WORKOUTS);
  }

  /**
   * Get active workout
   * Returns null if no active workout (404 or 500 errors are treated as "no active workout")
   */
  async getActive(): Promise<Workout | null> {
    try {
      const response = await apiClient.get<{ data: Workout | null }>(
        API_ENDPOINTS.WORKOUT_ACTIVE
      );
      return response.data.data;
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
      const response = await apiClient.post<{ data: Workout }>(
        API_ENDPOINTS.WORKOUT_START(id)
      );
      logger.info('WorkoutsService: Workout started successfully');
      return response.data.data;
    } catch (error) {
      errorHandler.log(error, 'WorkoutsService.start');
      throw error;
    }
  }

  /**
   * Complete a workout
   */
  async complete(id: string, data: CompleteWorkoutDto): Promise<Workout> {
    try {
      const response = await apiClient.post<{ data: Workout }>(
        API_ENDPOINTS.WORKOUT_COMPLETE(id),
        data
      );
      logger.info('WorkoutsService: Workout completed successfully');
      return response.data.data;
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
      await apiClient.put(`/api/v1/workout-sets/${setId}`, data);
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
      await apiClient.delete(`/api/v1/workout-sets/${setId}`);
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
      const response = await apiClient.post('/api/v1/workout-sets', data);
      logger.info('WorkoutsService: Set created successfully');
      return response.data.data;
    } catch (error) {
      errorHandler.log(error, 'WorkoutsService.createSet');
      throw error;
    }
  }
}

export const workoutsService = new WorkoutsService();

