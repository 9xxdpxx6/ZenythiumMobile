/**
 * Metric domain types
 */

export interface Metric {
  id: string;
  userId: string;
  categoryId: string;
  name: string;
  value: number;
  unit: string;
  date: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MetricCategory {
  id: string;
  name: string;
  description?: string;
  unit: string;
  icon?: string;
}

export interface MetricValue {
  date: string;
  value: number;
}

export interface MetricHistory {
  metricId: string;
  values: MetricValue[];
}

export interface CreateMetricDto {
  categoryId: string;
  name: string;
  value: number;
  unit: string;
  date: string;
  notes?: string;
}

export interface UpdateMetricDto {
  categoryId?: string;
  name?: string;
  value?: number;
  unit?: string;
  date?: string;
  notes?: string;
}

