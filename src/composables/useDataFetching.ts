/**
 * useDataFetching Composable
 * Generic data fetching with loading/error states
 */

import { ref, onMounted, type Ref } from 'vue';
import { errorHandler } from '../utils/error-handler';

// Глобальный кеш для данных
const globalCache = new Map<string, { data: any; timestamp: number }>();

/**
 * Очистить кеш по ключу или все кеши
 */
export function clearDataCache(cacheKey?: string): void {
  if (cacheKey) {
    globalCache.delete(cacheKey);
  } else {
    globalCache.clear();
  }
}

export interface UseDataFetchingOptions {
  immediate?: boolean;
  skipIfDataExists?: boolean; // Пропустить запрос, если данные уже есть в кеше
  cacheKey?: string; // Ключ для кеша (если не указан, используется hash функции)
  cacheTTL?: number; // Время жизни кеша в миллисекундах (по умолчанию 5 минут)
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
  const { 
    immediate = true, 
    skipIfDataExists = false, 
    cacheKey,
    cacheTTL = 5 * 60 * 1000, // 5 минут по умолчанию
    onSuccess, 
    onError 
  } = options;

  const data = ref<T | null>(null) as Ref<T | null>;
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Генерируем ключ кеша
  const getCacheKey = (): string => {
    if (cacheKey) return cacheKey;
    // Используем строковое представление функции как ключ
    return `fetch_${fetchFn.toString().slice(0, 50)}`;
  };

  const key = getCacheKey();

  // Проверяем кеш при инициализации и восстанавливаем данные сразу
  const checkCache = (): boolean => {
    if (!skipIfDataExists) return false;
    
    const cached = globalCache.get(key);
    if (cached) {
      const age = Date.now() - cached.timestamp;
      if (age < cacheTTL) {
        // Восстанавливаем данные из кеша сразу
        data.value = cached.data;
        return true; // Данные взяты из кеша
      } else {
        // Кеш устарел, удаляем
        globalCache.delete(key);
      }
    }
    return false;
  };

  // Проверяем кеш сразу при создании composable
  const hasCachedData = checkCache();

  /**
   * Execute the fetch function
   */
  const execute = async (): Promise<void> => {
    loading.value = true;
    error.value = null;

    try {
      const result = await fetchFn();
      data.value = result;

      // Сохраняем в кеш
      if (skipIfDataExists) {
        globalCache.set(key, { data: result, timestamp: Date.now() });
      }

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
      // Если данные уже есть в кеше, не делаем запрос
      if (hasCachedData) {
        return; // Данные взяты из кеша при инициализации, запрос не нужен
      }
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

