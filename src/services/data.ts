import apiClient from './api';
import { 
  StatisticsResponse,
  ExercisesResponse,
  MuscleGroupsResponse,
  ApiError,
  ExerciseResource,
  CreateExerciseRequest,
  UpdateExerciseRequest,
  ApiResponse
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
  static async getExercises(page: number = 1, perPage: number = 100, additionalParams: any = {}): Promise<ExercisesResponse> {
    try {
      const params = {
        page,
        per_page: perPage,
        ...additionalParams
      };
      
      console.log('DataService.getExercises - params:', params);
      
      const response = await apiClient.get<ExercisesResponse>('/api/v1/exercises', {
        params
      });
      
      console.log('DataService.getExercises - response:', response.data);
      return response.data;
    } catch (error) {
      throw error as ApiError;
    }
  }

  static async getExercise(id: number): Promise<ApiResponse<ExerciseResource>> {
    try {
      const response = await apiClient.get<ApiResponse<ExerciseResource>>(`/api/v1/exercises/${id}`);
      return response.data;
    } catch (error) {
      throw error as ApiError;
    }
  }

  static async createExercise(data: CreateExerciseRequest): Promise<ApiResponse<ExerciseResource>> {
    try {
      const response = await apiClient.post<ApiResponse<ExerciseResource>>('/api/v1/exercises', data);
      return response.data;
    } catch (error) {
      throw error as ApiError;
    }
  }

  static async updateExercise(id: number, data: UpdateExerciseRequest): Promise<ApiResponse<ExerciseResource>> {
    try {
      const response = await apiClient.put<ApiResponse<ExerciseResource>>(`/api/v1/exercises/${id}`, data);
      return response.data;
    } catch (error) {
      throw error as ApiError;
    }
  }

  static async deleteExercise(id: number): Promise<ApiResponse<null>> {
    try {
      const response = await apiClient.delete<ApiResponse<null>>(`/api/v1/exercises/${id}`);
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
