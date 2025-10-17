import apiClient from './api';
import { 
  StatisticsResponse,
  ExercisesResponse,
  MuscleGroupsResponse,
  ApiError 
} from '@/types/api';

export class DataService {
  // User statistics
  static async getUserStatistics(): Promise<StatisticsResponse> {
    try {
      const response = await apiClient.get<StatisticsResponse>('/api/v1/user/statistics');
      return response.data;
    } catch (error) {
      throw error as ApiError;
    }
  }

  // Exercises
  static async getExercises(page: number = 1, perPage: number = 15): Promise<ExercisesResponse> {
    try {
      const response = await apiClient.get<ExercisesResponse>('/api/v1/exercises', {
        params: {
          page,
          per_page: perPage
        }
      });
      return response.data;
    } catch (error) {
      throw error as ApiError;
    }
  }

  // Muscle Groups
  static async getMuscleGroups(page: number = 1, perPage: number = 15): Promise<MuscleGroupsResponse> {
    try {
      const response = await apiClient.get<MuscleGroupsResponse>('/api/v1/muscle-groups', {
        params: {
          page,
          per_page: perPage
        }
      });
      return response.data;
    } catch (error) {
      throw error as ApiError;
    }
  }
}
