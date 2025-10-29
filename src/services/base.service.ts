/**
 * Base Service Class
 * Provides common CRUD operations for all services
 */

import apiClient from './api';
import type { FilterParams } from '../types/common/filters.types';
import type { PaginatedResponse } from '../types/common/pagination.types';
import { logger } from '../utils/logger';
import { errorHandler } from '../utils/error-handler';

export abstract class BaseService<T, CreateDto, UpdateDto> {
  protected baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * Get all resources with optional filters
   */
  async getAll(filters?: FilterParams): Promise<T[]> {
    try {
      const params = this.buildQueryParams(filters);
      const response = await apiClient.get<{ data: T[] }>(this.baseUrl, { params });
      return response.data.data;
    } catch (error) {
      errorHandler.log(error, `${this.constructor.name}.getAll`);
      throw error;
    }
  }

  /**
   * Get paginated resources
   */
  async getPaginated(filters?: FilterParams): Promise<PaginatedResponse<T>> {
    try {
      const params = this.buildQueryParams(filters);
      const response = await apiClient.get<PaginatedResponse<T>>(this.baseUrl, { params });
      return response.data;
    } catch (error) {
      errorHandler.log(error, `${this.constructor.name}.getPaginated`);
      throw error;
    }
  }

  /**
   * Get resource by ID
   */
  async getById(id: string): Promise<T> {
    try {
      const response = await apiClient.get<{ data: T }>(`${this.baseUrl}/${id}`);
      return response.data.data;
    } catch (error) {
      errorHandler.log(error, `${this.constructor.name}.getById`);
      throw error;
    }
  }

  /**
   * Create new resource
   */
  async create(data: CreateDto): Promise<T> {
    try {
      const response = await apiClient.post<{ data: T }>(this.baseUrl, data);
      logger.info(`${this.constructor.name}: Resource created successfully`);
      return response.data.data;
    } catch (error) {
      errorHandler.log(error, `${this.constructor.name}.create`);
      throw error;
    }
  }

  /**
   * Update existing resource
   */
  async update(id: string, data: UpdateDto): Promise<T> {
    try {
      const response = await apiClient.put<{ data: T }>(`${this.baseUrl}/${id}`, data);
      logger.info(`${this.constructor.name}: Resource updated successfully`);
      return response.data.data;
    } catch (error) {
      errorHandler.log(error, `${this.constructor.name}.update`);
      throw error;
    }
  }

  /**
   * Delete resource
   */
  async delete(id: string): Promise<void> {
    try {
      await apiClient.delete(`${this.baseUrl}/${id}`);
      logger.info(`${this.constructor.name}: Resource deleted successfully`);
    } catch (error) {
      errorHandler.log(error, `${this.constructor.name}.delete`);
      throw error;
    }
  }

  /**
   * Build query parameters from filters
   */
  protected buildQueryParams(filters?: FilterParams): Record<string, any> {
    if (!filters) return {};

    const params: Record<string, any> = {};

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params[key] = value;
      }
    });

    return params;
  }
}

