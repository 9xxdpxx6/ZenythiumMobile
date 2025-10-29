/**
 * useFilters Composable
 * Filter state management
 */

import { reactive, computed, type ComputedRef } from 'vue';

export interface UseFiltersReturn<T> {
  filters: T;
  activeFiltersCount: ComputedRef<number>;
  updateFilter: (key: keyof T, value: any) => void;
  clearFilters: () => void;
  clearFilter: (key: keyof T) => void;
  hasActiveFilters: ComputedRef<boolean>;
}

/**
 * Composable for filter state management
 */
export function useFilters<T extends Record<string, any>>(
  initialFilters: T
): UseFiltersReturn<T> {
  const filters = reactive<T>({ ...initialFilters });
  const initialFiltersRef = { ...initialFilters };

  /**
   * Count active filters (non-empty values)
   */
  const activeFiltersCount = computed(() => {
    return Object.entries(filters).filter(([key, value]) => {
      const initialValue = initialFiltersRef[key as keyof T];

      // Check if value is different from initial value
      if (value === initialValue) {
        return false;
      }

      // Check if value is empty
      if (value === null || value === undefined || value === '') {
        return false;
      }

      // Check if array is empty
      if (Array.isArray(value) && value.length === 0) {
        return false;
      }

      return true;
    }).length;
  });

  /**
   * Check if there are any active filters
   */
  const hasActiveFilters = computed(() => {
    return activeFiltersCount.value > 0;
  });

  /**
   * Update a single filter
   */
  const updateFilter = (key: keyof T, value: any): void => {
    filters[key] = value;
  };

  /**
   * Clear all filters
   */
  const clearFilters = (): void => {
    Object.keys(filters).forEach(key => {
      filters[key as keyof T] = initialFiltersRef[key as keyof T];
    });
  };

  /**
   * Clear a single filter
   */
  const clearFilter = (key: keyof T): void => {
    filters[key] = initialFiltersRef[key];
  };

  return {
    filters,
    activeFiltersCount,
    updateFilter,
    clearFilters,
    clearFilter,
    hasActiveFilters,
  };
}

