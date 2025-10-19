import apiClient from './api';
import { 
  StatisticsResponse,
  ExercisesResponse,
  MuscleGroupsResponse,
  ApiError,
  ExerciseResource,
  CreateExerciseRequest,
  UpdateExerciseRequest,
  ApiResponse,
  Cycle,
  Plan
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
      
      
      const response = await apiClient.get<ExercisesResponse>('/api/v1/exercises', {
        params
      });
      
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

  // Cycles
  static async getCycles(page: number = 1, perPage: number = 100): Promise<ApiResponse<Cycle[]>> {
    try {
      const response = await apiClient.get<ApiResponse<Cycle[]>>('/api/v1/cycles', {
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

  // Plans
  static async getPlans(page: number = 1, perPage: number = 100, cycleId?: number): Promise<ApiResponse<Plan[]>> {
    try {
      const params: any = {
        page,
        per_page: perPage
      };
      
      if (cycleId) {
        params.cycle_id = cycleId;
      }
      
      const response = await apiClient.get<ApiResponse<Plan[]>>('/api/v1/plans', {
        params
      });
      return response.data;
    } catch (error) {
      throw error as ApiError;
    }
  }

  // Helper method to determine if a cycle is active
  static isCycleActive(cycle: Cycle): boolean {
    if (!cycle.start_date) return false;
    
    const now = new Date();
    const startDate = new Date(cycle.start_date);
    
    // Cycle is active if it has started and either has no end date or end date is in the future
    if (cycle.end_date) {
      const endDate = new Date(cycle.end_date);
      return startDate <= now && endDate >= now;
    }
    
    return startDate <= now;
  }
}
