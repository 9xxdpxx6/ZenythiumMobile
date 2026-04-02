/**
 * Plans Service
 * Handles all plans-related API operations
 */

import { BaseService } from './base.service';
import apiClient from './api';
import { API_ENDPOINTS } from '../constants/api-endpoints';
import type { Plan, PlanExercise } from '../types/api';
import { errorHandler } from '../utils/error-handler';
import { logger } from '../utils/logger';

class PlansService extends BaseService<Plan, any, any> {
  constructor() {
    super(API_ENDPOINTS.PLANS);
  }

  /**
   * Duplicate a plan
   */
  async duplicate(id: string): Promise<Plan> {
    try {
      const response = await apiClient.post<{ data: Plan }>(
        API_ENDPOINTS.PLAN_DUPLICATE(id)
      );
      logger.info('PlansService: Plan duplicated successfully');
      return response.data.data;
    } catch (error) {
      errorHandler.log(error, 'PlansService.duplicate');
      throw error;
    }
  }

  /**
   * Get exercises for a specific plan
   */
  async getExercises(planId: string): Promise<PlanExercise[]> {
    try {
      const response = await apiClient.get<{ data: PlanExercise[] }>(
        API_ENDPOINTS.PLAN_EXERCISES(planId)
      );
      return response.data.data;
    } catch (error) {
      errorHandler.log(error, 'PlansService.getExercises');
      throw error;
    }
  }

  /**
   * Add an exercise to a plan
   */
  async addExercise(
    planId: string,
    data: { exercise_id: number; order: number }
  ): Promise<PlanExercise> {
    try {
      const response = await apiClient.post<{ data: PlanExercise }>(
        API_ENDPOINTS.PLAN_EXERCISES(planId),
        data
      );
      logger.info('PlansService: Exercise added to plan successfully');
      return response.data.data;
    } catch (error) {
      errorHandler.log(error, 'PlansService.addExercise');
      throw error;
    }
  }

  /**
   * Update exercise order within a plan
   */
  async updateExerciseOrder(
    planId: string,
    planExerciseId: string,
    data: { order: number }
  ): Promise<PlanExercise> {
    try {
      const response = await apiClient.put<{ data: PlanExercise }>(
        API_ENDPOINTS.PLAN_EXERCISE_BY_ID(planId, planExerciseId),
        data
      );
      logger.info('PlansService: Plan exercise order updated successfully');
      return response.data.data;
    } catch (error) {
      errorHandler.log(error, 'PlansService.updateExerciseOrder');
      throw error;
    }
  }

  /**
   * Remove an exercise from a plan
   */
  async deleteExercise(planId: string, planExerciseId: string): Promise<void> {
    try {
      await apiClient.delete(
        API_ENDPOINTS.PLAN_EXERCISE_BY_ID(planId, planExerciseId)
      );
      logger.info('PlansService: Exercise removed from plan successfully');
    } catch (error) {
      errorHandler.log(error, 'PlansService.deleteExercise');
      throw error;
    }
  }
}

export const plansService = new PlansService();

