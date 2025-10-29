/**
 * Metrics Service
 * Handles all metrics-related API operations
 */

import { BaseService } from './base.service';
import apiClient from './api';
import { API_ENDPOINTS } from '../constants/api-endpoints';
import type {
  Metric,
  MetricCategory,
  CreateMetricDto,
  UpdateMetricDto,
} from '../types/models/metric.types';
import { errorHandler } from '../utils/error-handler';

class MetricsService extends BaseService<Metric, CreateMetricDto, UpdateMetricDto> {
  constructor() {
    super(API_ENDPOINTS.METRICS);
  }

  /**
   * Get all metric categories
   */
  async getCategories(): Promise<MetricCategory[]> {
    try {
      const response = await apiClient.get<{ data: MetricCategory[] }>(
        API_ENDPOINTS.METRIC_CATEGORIES
      );
      return response.data.data;
    } catch (error) {
      errorHandler.log(error, 'MetricsService.getCategories');
      throw error;
    }
  }
}

export const metricsService = new MetricsService();

