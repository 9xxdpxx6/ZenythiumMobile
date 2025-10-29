/**
 * Statistics Service
 * Handles all statistics-related API operations
 */

import apiClient from './api';
import { API_ENDPOINTS } from '../constants/api-endpoints';
import type {
  Statistics,
  ChartData,
  ProgressData,
  PersonalRecord,
  DateRangeParams,
} from '../types/models/statistics.types';
import { errorHandler } from '../utils/error-handler';

class StatisticsService {
  /**
   * Get statistics overview
   */
  async getOverview(): Promise<Statistics> {
    try {
      const response = await apiClient.get<{ data: Statistics }>(
        API_ENDPOINTS.STATISTICS.OVERVIEW
      );
      return response.data.data;
    } catch (error) {
      errorHandler.log(error, 'StatisticsService.getOverview');
      throw error;
    }
  }

  /**
   * Get workout history chart data
   */
  async getWorkoutHistory(params: DateRangeParams): Promise<ChartData> {
    try {
      const response = await apiClient.get<{ data: ChartData }>(
        API_ENDPOINTS.STATISTICS.WORKOUT_HISTORY,
        { params }
      );
      return response.data.data;
    } catch (error) {
      errorHandler.log(error, 'StatisticsService.getWorkoutHistory');
      throw error;
    }
  }

  /**
   * Get progress by exercise
   */
  async getProgressByExercise(exerciseId: string): Promise<ProgressData> {
    try {
      const response = await apiClient.get<{ data: ProgressData }>(
        API_ENDPOINTS.STATISTICS.PROGRESS_BY_EXERCISE(exerciseId)
      );
      return response.data.data;
    } catch (error) {
      errorHandler.log(error, 'StatisticsService.getProgressByExercise');
      throw error;
    }
  }

  /**
   * Get volume by muscle group
   */
  async getVolumeByMuscleGroup(params: DateRangeParams): Promise<ChartData> {
    try {
      const response = await apiClient.get<{ data: ChartData }>(
        API_ENDPOINTS.STATISTICS.VOLUME_BY_MUSCLE_GROUP,
        { params }
      );
      return response.data.data;
    } catch (error) {
      errorHandler.log(error, 'StatisticsService.getVolumeByMuscleGroup');
      throw error;
    }
  }

  /**
   * Get personal records
   */
  async getPersonalRecords(): Promise<PersonalRecord[]> {
    try {
      const response = await apiClient.get<{ data: PersonalRecord[] }>(
        API_ENDPOINTS.STATISTICS.PERSONAL_RECORDS
      );
      return response.data.data;
    } catch (error) {
      errorHandler.log(error, 'StatisticsService.getPersonalRecords');
      throw error;
    }
  }
}

export const statisticsService = new StatisticsService();

