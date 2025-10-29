/**
 * usePagination Composable
 * Pagination state management
 */

import { ref, computed, type Ref, type ComputedRef } from 'vue';

export interface UsePaginationReturn {
  currentPage: Ref<number>;
  pageSize: Ref<number>;
  totalItems: Ref<number>;
  totalPages: ComputedRef<number>;
  hasNext: ComputedRef<boolean>;
  hasPrev: ComputedRef<boolean>;
  offset: ComputedRef<number>;
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  setPageSize: (size: number) => void;
  setTotalItems: (total: number) => void;
  reset: () => void;
}

/**
 * Composable for pagination state management
 */
export function usePagination(
  initialPage: number = 1,
  initialPageSize: number = 20
): UsePaginationReturn {
  const currentPage = ref(initialPage);
  const pageSize = ref(initialPageSize);
  const totalItems = ref(0);

  /**
   * Calculate total pages
   */
  const totalPages = computed(() => {
    if (totalItems.value === 0) return 0;
    return Math.ceil(totalItems.value / pageSize.value);
  });

  /**
   * Check if there's a next page
   */
  const hasNext = computed(() => {
    return currentPage.value < totalPages.value;
  });

  /**
   * Check if there's a previous page
   */
  const hasPrev = computed(() => {
    return currentPage.value > 1;
  });

  /**
   * Calculate offset for API requests
   */
  const offset = computed(() => {
    return (currentPage.value - 1) * pageSize.value;
  });

  /**
   * Go to specific page
   */
  const goToPage = (page: number): void => {
    if (page < 1 || page > totalPages.value) {
      return;
    }
    currentPage.value = page;
  };

  /**
   * Go to next page
   */
  const nextPage = (): void => {
    if (hasNext.value) {
      currentPage.value++;
    }
  };

  /**
   * Go to previous page
   */
  const prevPage = (): void => {
    if (hasPrev.value) {
      currentPage.value--;
    }
  };

  /**
   * Set page size
   */
  const setPageSize = (size: number): void => {
    pageSize.value = size;
    currentPage.value = 1; // Reset to first page
  };

  /**
   * Set total items
   */
  const setTotalItems = (total: number): void => {
    totalItems.value = total;
  };

  /**
   * Reset pagination
   */
  const reset = (): void => {
    currentPage.value = initialPage;
    pageSize.value = initialPageSize;
    totalItems.value = 0;
  };

  return {
    currentPage,
    pageSize,
    totalItems,
    totalPages,
    hasNext,
    hasPrev,
    offset,
    goToPage,
    nextPage,
    prevPage,
    setPageSize,
    setTotalItems,
    reset,
  };
}

