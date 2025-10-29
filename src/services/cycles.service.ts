/**
 * Cycles Service
 * Handles all cycles-related API operations
 */

import { BaseService } from './base.service';
import apiClient from './api';
import { API_ENDPOINTS } from '../constants/api-endpoints';
import type {
  Cycle,
  CreateCycleDto,
  UpdateCycleDto,
} from '../types/models/cycle.types';
import { errorHandler } from '../utils/error-handler';
import { logger } from '../utils/logger';

class CyclesService extends BaseService<Cycle, CreateCycleDto, UpdateCycleDto> {
  constructor() {
    super(API_ENDPOINTS.CYCLES);
  }

  /**
   * Get active cycle
   */
  async getActive(): Promise<Cycle | null> {
    try {
      const response = await apiClient.get<{ data: Cycle | null }>(
        API_ENDPOINTS.CYCLE_ACTIVE
      );
      return response.data.data;
    } catch (error) {
      errorHandler.log(error, 'CyclesService.getActive');
      throw error;
    }
  }

  /**
   * Start a cycle
   */
  async start(id: string): Promise<Cycle> {
    try {
      const response = await apiClient.post<{ data: Cycle }>(
        API_ENDPOINTS.CYCLE_START(id)
      );
      logger.info('CyclesService: Cycle started successfully');
      return response.data.data;
    } catch (error) {
      errorHandler.log(error, 'CyclesService.start');
      throw error;
    }
  }

  /**
   * Complete a cycle
   */
  async complete(id: string): Promise<Cycle> {
    try {
      const response = await apiClient.post<{ data: Cycle }>(
        API_ENDPOINTS.CYCLE_COMPLETE(id)
      );
      logger.info('CyclesService: Cycle completed successfully');
      return response.data.data;
    } catch (error) {
      errorHandler.log(error, 'CyclesService.complete');
      throw error;
    }
  }
}

export const cyclesService = new CyclesService();

