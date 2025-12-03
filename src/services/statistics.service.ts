/**
 * Statistics Service
 * Handles all statistics-related API operations
 */

import apiClient from './api';
import { API_ENDPOINTS } from '../constants/api-endpoints';
import type {
  ChartData,
  ProgressData,
  DateRangeParams,
} from '../types/models/statistics.types';
import type {
  Statistics,
  PersonalRecord as LegacyPersonalRecord,
  TimeAnalytics,
  MuscleGroupStatistics,
  // Minimal typed shape used by widgets
  // Includes only fields we access in UI components
  // to keep API coupling low
  } from '../types/api';
import type {
  ExerciseStatistics,
} from '../types/api';
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
  async getPersonalRecords(): Promise<LegacyPersonalRecord[]> {
    try {
      const response = await apiClient.get<{ data: LegacyPersonalRecord[] }>(
        API_ENDPOINTS.STATISTICS.PERSONAL_RECORDS
      );
      return response.data.data;
    } catch (error) {
      errorHandler.log(error, 'StatisticsService.getPersonalRecords');
      throw error;
    }
  }

  /**
   * Get time analytics (weekly/monthly trends)
   */
  async getTimeAnalytics(): Promise<TimeAnalytics> {
    try {
      const response = await apiClient.get<{ data: TimeAnalytics }>(
        API_ENDPOINTS.STATISTICS.TIME_ANALYTICS
      );
      return response.data.data;
    } catch (error) {
      errorHandler.log(error, 'StatisticsService.getTimeAnalytics');
      throw error;
    }
  }

  /**
   * Get muscle group statistics with balance analysis
   */
  async getMuscleGroupStatistics(): Promise<MuscleGroupStatistics> {
    try {
      const response = await apiClient.get<{ data: any }>(
        API_ENDPOINTS.STATISTICS.MUSCLE_GROUP_STATISTICS
      );
      const raw = response.data.data || {};
      // Map API shape { muscle_group_stats: [...] } -> domain { muscle_groups: [...] }
      const mapped: MuscleGroupStatistics = {
        muscle_groups: raw.muscle_groups ?? raw.muscle_group_stats ?? [],
        balance_analysis: raw.balance_analysis ?? null,
      };
      return mapped;
    } catch (error) {
      errorHandler.log(error, 'StatisticsService.getMuscleGroupStatistics');
      throw error;
    }
  }

  /**
   * Get exercise statistics used by ProgressChartWidget
   */
  async getExerciseStatistics(): Promise<ExerciseStatistics> {
    try {
      const response = await apiClient.get<{ data: ExerciseStatistics }>(
        API_ENDPOINTS.STATISTICS.EXERCISE_STATISTICS
      );
      return response.data.data;
    } catch (error) {
      errorHandler.log(error, 'StatisticsService.getExerciseStatistics');
      throw error;
    }
  }
}

export const statisticsService = new StatisticsService();

