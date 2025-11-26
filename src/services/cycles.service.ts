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
  CycleStatus,
} from '../types/models/cycle.types';
import { CycleStatus as StatusEnum } from '../types/models/cycle.types';
import { errorHandler } from '../utils/error-handler';
import { logger } from '../utils/logger';

// API response format for Cycle
interface CycleApiResponse {
  id: number;
  name: string;
  weeks: number;
  start_date: string | null;
  end_date: string | null;
  progress_percentage: number;
  current_week: number;
  completed_workouts_count: number;
  plans_count: number;
  created_at?: string;
  updated_at?: string;
  plans?: any[];
}

class CyclesService extends BaseService<Cycle, CreateCycleDto, UpdateCycleDto> {
  constructor() {
    super(API_ENDPOINTS.CYCLES);
  }

  /**
   * Map API response to Cycle model
   */
  private mapCycleFromApi(apiCycle: CycleApiResponse): Cycle {
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Reset time to compare dates only
    const endDate = apiCycle.end_date ? new Date(apiCycle.end_date) : null;
    if (endDate) {
      endDate.setHours(0, 0, 0, 0); // Reset time to compare dates only
    }
    
    // Determine status:
    // - If end_date exists and is in the past or today, cycle is completed
    // - Otherwise, cycle is active (even if not started yet)
    const status: CycleStatus = 
      endDate && endDate <= now 
        ? StatusEnum.COMPLETED 
        : StatusEnum.ACTIVE;

    return {
      id: apiCycle.id,
      name: apiCycle.name,
      status,
      plans_count: apiCycle.plans_count,
      workouts_count: apiCycle.completed_workouts_count,
      started_at: apiCycle.start_date || '',
      finished_at: apiCycle.end_date || undefined,
      progress: apiCycle.progress_percentage || 0,
      // Additional fields for backward compatibility
      weeks: apiCycle.weeks,
      current_week: apiCycle.current_week,
      start_date: apiCycle.start_date,
      end_date: apiCycle.end_date,
      plans: apiCycle.plans,
    };
  }

  /**
   * Get all resources with optional filters
   */
  async getAll(filters?: any): Promise<Cycle[]> {
    try {
      const params = this.buildQueryParams(filters);
      const response = await apiClient.get<{ data: CycleApiResponse[] }>(
        this.baseUrl,
        { params }
      );
      return response.data.data.map((cycle) => this.mapCycleFromApi(cycle));
    } catch (error) {
      errorHandler.log(error, `${this.constructor.name}.getAll`);
      throw error;
    }
  }

  /**
   * Get resource by ID
   */
  async getById(id: string): Promise<Cycle> {
    try {
      const response = await apiClient.get<{ data: CycleApiResponse }>(
        `${this.baseUrl}/${id}`
      );
      return this.mapCycleFromApi(response.data.data);
    } catch (error) {
      errorHandler.log(error, `${this.constructor.name}.getById`);
      throw error;
    }
  }

  /**
   * Get active cycle
   */
  async getActive(): Promise<Cycle | null> {
    try {
      const response = await apiClient.get<{ data: CycleApiResponse | null }>(
        API_ENDPOINTS.CYCLE_ACTIVE
      );
      if (!response.data.data) {
        return null;
      }
      return this.mapCycleFromApi(response.data.data);
    } catch (error) {
      errorHandler.log(error, 'CyclesService.getActive');
      throw error;
    }
  }

  /**
   * Create new resource
   */
  async create(data: CreateCycleDto): Promise<Cycle> {
    try {
      const response = await apiClient.post<{ data: CycleApiResponse }>(
        this.baseUrl,
        data
      );
      logger.info(`${this.constructor.name}: Resource created successfully`);
      return this.mapCycleFromApi(response.data.data);
    } catch (error) {
      errorHandler.log(error, `${this.constructor.name}.create`);
      throw error;
    }
  }

  /**
   * Update existing resource
   */
  async update(id: string, data: UpdateCycleDto): Promise<Cycle> {
    try {
      const response = await apiClient.put<{ data: CycleApiResponse }>(
        `${this.baseUrl}/${id}`,
        data
      );
      logger.info(`${this.constructor.name}: Resource updated successfully`);
      return this.mapCycleFromApi(response.data.data);
    } catch (error) {
      errorHandler.log(error, `${this.constructor.name}.update`);
      throw error;
    }
  }

  /**
   * Start a cycle
   */
  async start(id: string): Promise<Cycle> {
    try {
      const response = await apiClient.post<{ data: CycleApiResponse }>(
        API_ENDPOINTS.CYCLE_START(id)
      );
      logger.info('CyclesService: Cycle started successfully');
      return this.mapCycleFromApi(response.data.data);
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
      const response = await apiClient.post<{ data: CycleApiResponse }>(
        API_ENDPOINTS.CYCLE_COMPLETE(id)
      );
      logger.info('CyclesService: Cycle completed successfully');
      return this.mapCycleFromApi(response.data.data);
    } catch (error) {
      errorHandler.log(error, 'CyclesService.complete');
      throw error;
    }
  }
}

export const cyclesService = new CyclesService();

