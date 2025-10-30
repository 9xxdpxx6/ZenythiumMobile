/**
 * Plans Service
 * Handles all plans-related API operations
 */

import { BaseService } from './base.service';
import apiClient from './api';
import { API_ENDPOINTS } from '../constants/api-endpoints';
import type { Plan } from '../types/api';
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
}

export const plansService = new PlansService();

