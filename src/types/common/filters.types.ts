/**
 * Filter and sort types
 */

export type SortOrder = 'asc' | 'desc';

export interface SortParams {
  sortBy?: string;
  sortOrder?: SortOrder;
}

export interface FilterParams extends SortParams {
  search?: string;
  [key: string]: any;
}

export interface DateRangeFilter {
  startDate?: string;
  endDate?: string;
}

export interface StatusFilter {
  status?: string | string[];
}

