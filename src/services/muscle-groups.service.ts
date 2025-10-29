/**
 * Muscle Groups Service
 * Handles all muscle groups-related API operations
 */

import apiClient from './api';
import { API_ENDPOINTS } from '../constants/api-endpoints';
import type {
  MuscleGroup,
} from '../types/models/exercise.types';
import { errorHandler } from '../utils/error-handler';

class MuscleGroupsService {
  /**
   * Get all muscle groups
   */
  async getAll(): Promise<MuscleGroup[]> {
    try {
      const response = await apiClient.get<{ data: MuscleGroup[] }>(
        API_ENDPOINTS.MUSCLE_GROUPS
      );
      return response.data.data;
    } catch (error) {
      errorHandler.log(error, 'MuscleGroupsService.getAll');
      throw error;
    }
  }

}

export const muscleGroupsService = new MuscleGroupsService();

