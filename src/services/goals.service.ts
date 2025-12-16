/**
 * Goals Service
 * Handles all goals-related API operations
 */

import { BaseService } from './base.service';
import apiClient from './api';
import { API_ENDPOINTS } from '../constants/api-endpoints';
import type {
  Goal,
  GoalStatus,
  CreateGoalDto,
  UpdateGoalDto,
  GoalStatistics,
  GoalTypeInfo,
} from '../types/models/goal.types';
import { errorHandler } from '../utils/error-handler';
import { logger } from '../utils/logger';

class GoalsService extends BaseService<Goal, CreateGoalDto, UpdateGoalDto> {
  constructor() {
    super(API_ENDPOINTS.GOALS);
  }

  /**
   * Get all goals with optional status filter
   */
  async getAll(filters?: { status?: GoalStatus }): Promise<Goal[]> {
    try {
      const params = filters?.status ? { status: filters.status } : {};
      const response = await apiClient.get<{ data: Goal[] }>(this.baseUrl, { params });
      return response.data.data;
    } catch (error) {
      errorHandler.log(error, 'GoalsService.getAll');
      throw error;
    }
  }

  /**
   * Get available goal types
   */
  async getTypes(): Promise<GoalTypeInfo[]> {
    try {
      const response = await apiClient.get<{ data: GoalTypeInfo[] }>(
        API_ENDPOINTS.GOALS_TYPES
      );
      return response.data.data;
    } catch (error) {
      errorHandler.log(error, 'GoalsService.getTypes');
      throw error;
    }
  }

  /**
   * Get goals statistics
   */
  async getStatistics(): Promise<GoalStatistics> {
    try {
      const response = await apiClient.get<{ data: GoalStatistics }>(
        API_ENDPOINTS.GOALS_STATISTICS
      );
      return response.data.data;
    } catch (error) {
      errorHandler.log(error, 'GoalsService.getStatistics');
      throw error;
    }
  }

  /**
   * Get completed goals
   */
  async getCompleted(): Promise<Goal[]> {
    try {
      const response = await apiClient.get<{ data: Goal[] }>(
        API_ENDPOINTS.GOALS_COMPLETED
      );
      return response.data.data;
    } catch (error) {
      errorHandler.log(error, 'GoalsService.getCompleted');
      throw error;
    }
  }

  /**
   * Get failed goals
   */
  async getFailed(): Promise<Goal[]> {
    try {
      const response = await apiClient.get<{ data: Goal[] }>(
        API_ENDPOINTS.GOALS_FAILED
      );
      return response.data.data;
    } catch (error) {
      errorHandler.log(error, 'GoalsService.getFailed');
      throw error;
    }
  }

  /**
   * Override create to add logging
   */
  async create(data: CreateGoalDto): Promise<Goal> {
    try {
      const response = await apiClient.post<{ data: Goal }>(this.baseUrl, data);
      logger.info('GoalsService: Goal created successfully');
      return response.data.data;
    } catch (error) {
      errorHandler.log(error, 'GoalsService.create');
      throw error;
    }
  }

  /**
   * Override update to add logging
   */
  async update(id: string, data: UpdateGoalDto): Promise<Goal> {
    try {
      const response = await apiClient.put<{ data: Goal }>(`${this.baseUrl}/${id}`, data);
      logger.info('GoalsService: Goal updated successfully');
      return response.data.data;
    } catch (error) {
      errorHandler.log(error, 'GoalsService.update');
      throw error;
    }
  }

  /**
   * Override delete to add logging
   */
  async delete(id: string): Promise<void> {
    try {
      await apiClient.delete(`${this.baseUrl}/${id}`);
      logger.info('GoalsService: Goal deleted successfully');
    } catch (error) {
      errorHandler.log(error, 'GoalsService.delete');
      throw error;
    }
  }
}

export const goalsService = new GoalsService();

