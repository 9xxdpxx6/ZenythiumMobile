/**
 * useDataFetching Composable
 * Generic data fetching with loading/error states
 */

import { ref, onMounted, type Ref } from 'vue';
import { errorHandler } from '../utils/error-handler';

export interface UseDataFetchingOptions {
  immediate?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

export interface UseDataFetchingReturn<T> {
  data: Ref<T | null>;
  loading: Ref<boolean>;
  error: Ref<string | null>;
  execute: () => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Composable for data fetching with loading and error states
 */
export function useDataFetching<T>(
  fetchFn: () => Promise<T>,
  options: UseDataFetchingOptions = {}
): UseDataFetchingReturn<T> {
  const { immediate = true, onSuccess, onError } = options;

  const data = ref<T | null>(null) as Ref<T | null>;
  const loading = ref(false);
  const error = ref<string | null>(null);

  /**
   * Execute the fetch function
   */
  const execute = async (): Promise<void> => {
    loading.value = true;
    error.value = null;

    try {
      const result = await fetchFn();
      data.value = result;

      if (onSuccess) {
        onSuccess(result);
      }
    } catch (err) {
      const errorMessage = errorHandler.format(err);
      error.value = errorMessage;

      if (onError) {
        onError(err as Error);
      }
    } finally {
      loading.value = false;
    }
  };

  /**
   * Refresh data (alias for execute)
   */
  const refresh = execute;

  // Execute immediately if requested
  if (immediate) {
    onMounted(() => {
      execute();
    });
  }

  return {
    data,
    loading,
    error,
    execute,
    refresh,
  };
}

