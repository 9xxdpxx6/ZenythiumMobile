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
import { errorHandler } from '../utils/error-handler';

class ExercisesService extends BaseService<Exercise, CreateExerciseDto, UpdateExerciseDto> {
  constructor() {
    super(API_ENDPOINTS.EXERCISES);
  }

  /**
   * Search exercises by query
   */
  async search(query: string): Promise<Exercise[]> {
    try {
      const response = await apiClient.get<{ data: Exercise[] }>(
        API_ENDPOINTS.EXERCISE_SEARCH,
        { params: { q: query } }
      );
      return response.data.data;
    } catch (error) {
      errorHandler.log(error, 'ExercisesService.search');
      throw error;
    }
  }
}

export const exercisesService = new ExercisesService();

