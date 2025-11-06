/**
 * useLocalStorageFilters Composable
 * Filter state management with localStorage persistence
 */

import { ref, type Ref } from 'vue';
import { logger } from '@/utils/logger';
import { useFilters, type UseFiltersReturn } from './useFilters';

export interface UseLocalStorageFiltersOptions<T> {
  storageKey: string;
  defaultFilters: T;
}

/**
 * Composable for filters with localStorage persistence
 */
export function useLocalStorageFilters<T extends Record<string, any>>(
  options: UseLocalStorageFiltersOptions<T>
): UseFiltersReturn<T> & { resetFilters: () => void } {
  const { storageKey, defaultFilters } = options;

  const saveFilters = (filters: T): void => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(filters));
    } catch (e) {
      logger.warn('Failed to save filters', e);
    }
  };

  const loadFilters = (): T | null => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (!saved) return null;
      const parsed = JSON.parse(saved) as T;
      return parsed;
    } catch (e) {
      logger.warn('Failed to load filters', e);
      return null;
    }
  };

  const loadedFilters = loadFilters();
  const initialFilters = loadedFilters || defaultFilters;
  
  // Сохраняем дефолтные фильтры если их не было сохранено
  if (!loadedFilters) {
    saveFilters(defaultFilters);
  }

  const filtersComposable = useFilters<T>(initialFilters);

  // Переопределяем updateFilter для сохранения в localStorage
  const originalUpdateFilter = filtersComposable.updateFilter;
  const wrappedUpdateFilter = (key: keyof T, value: any): void => {
    originalUpdateFilter(key, value);
    saveFilters(filtersComposable.filters as T);
  };

  // Переопределяем clearFilters для удаления из localStorage
  const originalClearFilters = filtersComposable.clearFilters;
  const resetFilters = (): void => {
    originalClearFilters();
    try {
      localStorage.removeItem(storageKey);
    } catch (e) {
      logger.warn('Failed to remove filters', e);
    }
    saveFilters(defaultFilters);
  };

  return {
    ...filtersComposable,
    updateFilter: wrappedUpdateFilter,
    resetFilters,
  };
}

