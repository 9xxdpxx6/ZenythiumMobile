/**
 * Training Programs Service
 * Handles all training-programs-related API operations
 */

import { BaseService } from './base.service';
import apiClient from './api';
import { API_ENDPOINTS } from '../constants/api-endpoints';
import type { TrainingProgram, TrainingProgramDetail, InstallTrainingProgramResponse } from '../types/models/training-program.types';
import { errorHandler } from '../utils/error-handler';
import { logger } from '../utils/logger';

interface TrainingProgramFilters {
  page?: number;
  per_page?: number;
  search?: string;
  is_active?: string;
}

class TrainingProgramsService extends BaseService<TrainingProgram, never, never> {
  constructor() {
    super(API_ENDPOINTS.TRAINING_PROGRAMS);
  }

  /**
   * Get paginated training programs
   */
  async getPaginated(filters?: TrainingProgramFilters): Promise<{ data: TrainingProgram[]; meta: any }> {
    try {
      const params = this.buildQueryParams(filters);
      const response = await apiClient.get<{ data: TrainingProgram[]; message?: string; meta: any }>(this.baseUrl, { params });
      return {
        data: response.data.data,
        meta: response.data.meta,
      };
    } catch (error) {
      errorHandler.log(error, 'TrainingProgramsService.getPaginated');
      throw error;
    }
  }

  /**
   * Get training program by ID with details
   */
  async getById(id: string): Promise<TrainingProgramDetail> {
    try {
      const response = await apiClient.get<{ data: TrainingProgramDetail }>(
        API_ENDPOINTS.TRAINING_PROGRAM_BY_ID(id)
      );
      return response.data.data;
    } catch (error) {
      errorHandler.log(error, 'TrainingProgramsService.getById');
      throw error;
    }
  }

  /**
   * Install training program
   */
  async install(id: string): Promise<InstallTrainingProgramResponse> {
    try {
      const response = await apiClient.post<{ data: InstallTrainingProgramResponse }>(
        API_ENDPOINTS.TRAINING_PROGRAM_INSTALL(id)
      );
      logger.info('TrainingProgramsService: Program installed successfully');
      return response.data.data;
    } catch (error) {
      errorHandler.log(error, 'TrainingProgramsService.install');
      throw error;
    }
  }

  /**
   * Uninstall training program
   */
  async uninstall(installId: string): Promise<void> {
    try {
      await apiClient.delete(API_ENDPOINTS.TRAINING_PROGRAM_UNINSTALL(installId));
      logger.info('TrainingProgramsService: Program uninstalled successfully');
    } catch (error) {
      errorHandler.log(error, 'TrainingProgramsService.uninstall');
      throw error;
    }
  }
}

export const trainingProgramsService = new TrainingProgramsService();

