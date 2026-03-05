/**
 * Exercises Service
 * Handles all exercises-related API operations
 */

import { BaseService } from './base.service';
import apiClient from './api';
import { API_ENDPOINTS } from '../constants/api-endpoints';
import type {
  Exercise,
  CreateExerciseDto,
  UpdateExerciseDto,
} from '../types/models/exercise.types';
import type {
  BasePackInstallResponse,
  BasePackStatusResponse,
  BasePackUninstallResponse,
} from '../types/api';
import { errorHandler } from '../utils/error-handler';
import { logger } from '../utils/logger';

class ExercisesService extends BaseService<Exercise, CreateExerciseDto, UpdateExerciseDto> {
  constructor() {
    super(API_ENDPOINTS.EXERCISES);
  }

  /**
   * Install base exercise pack (~37 exercises covering all major muscle groups).
   * Safe to call repeatedly — duplicates are skipped.
   */
  async installBasePack(): Promise<BasePackInstallResponse> {
    try {
      const response = await apiClient.post<BasePackInstallResponse>(
        API_ENDPOINTS.EXERCISE_INSTALL_BASE_PACK
      );
      logger.info('ExercisesService: Base pack installed successfully');
      return response.data;
    } catch (error) {
      errorHandler.log(error, 'ExercisesService.installBasePack');
      throw error;
    }
  }

  /**
   * Check whether the base exercise pack is installed for the current user.
   */
  async getBasePackStatus(): Promise<BasePackStatusResponse> {
    try {
      const response = await apiClient.get<BasePackStatusResponse>(
        API_ENDPOINTS.EXERCISE_BASE_PACK_STATUS
      );
      return response.data;
    } catch (error) {
      errorHandler.log(error, 'ExercisesService.getBasePackStatus');
      throw error;
    }
  }

  /**
   * Uninstall (rollback) the base exercise pack.
   * Exercises used in workouts are deactivated instead of deleted.
   */
  async uninstallBasePack(): Promise<BasePackUninstallResponse> {
    try {
      const response = await apiClient.delete<BasePackUninstallResponse>(
        API_ENDPOINTS.EXERCISE_UNINSTALL_BASE_PACK
      );
      logger.info('ExercisesService: Base pack uninstalled successfully');
      return response.data;
    } catch (error) {
      errorHandler.log(error, 'ExercisesService.uninstallBasePack');
      throw error;
    }
  }
}

export const exercisesService = new ExercisesService();
