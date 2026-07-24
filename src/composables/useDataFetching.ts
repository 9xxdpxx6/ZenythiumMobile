/**
 * useDataFetching Composable
 * Generic data fetching with loading/error states
 */

import { ref, onMounted, type Ref } from 'vue';
import { errorHandler } from '../utils/error-handler';

interface CacheEntry {
  data: any;
  timestamp: number;
}

// In-memory кеш для данных (быстрый доступ в рамках текущей сессии)
const globalCache = new Map<string, CacheEntry>();

// Персистентный слой поверх localStorage — переживает перезапуск приложения,
// а не только переключение вкладок в рамках одного запуска.
const STORAGE_PREFIX = 'datacache:';

function readFromStorage(key: string): CacheEntry | null {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    return raw ? (JSON.parse(raw) as CacheEntry) : null;
  } catch {
    return null;
  }
}

function writeToStorage(key: string, entry: CacheEntry): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(entry));
  } catch {
    // localStorage может быть недоступен/переполнен — in-memory кеш всё равно работает в рамках сессии.
  }
}

function removeFromStorage(key: string): void {
  try {
    localStorage.removeItem(STORAGE_PREFIX + key);
  } catch {
    // ignore
  }
}

function setCache(key: string, entry: CacheEntry): void {
  globalCache.set(key, entry);
  writeToStorage(key, entry);
}

/**
 * Прочитать запись кеша по ключу, включая восстановление из localStorage,
 * если её ещё нет в памяти (например, после перезапуска приложения).
 */
function getCache(key: string): CacheEntry | null {
  const inMemory = globalCache.get(key);
  if (inMemory) return inMemory;

  const persisted = readFromStorage(key);
  if (persisted) {
    globalCache.set(key, persisted);
    return persisted;
  }

  return null;
}

/**
 * Очистить кеш по ключу или все кеши (и in-memory, и localStorage).
 */
export function clearDataCache(cacheKey?: string): void {
  if (cacheKey) {
    globalCache.delete(cacheKey);
    removeFromStorage(cacheKey);
    return;
  }

  globalCache.clear();
  try {
    Object.keys(localStorage)
      .filter((key) => key.startsWith(STORAGE_PREFIX))
      .forEach((key) => localStorage.removeItem(key));
  } catch {
    // ignore
  }
}

/**
 * Прогреть кеш заранее (например, во время сплеш-скрина, пока страница ещё не
 * смонтирована) — так composable с тем же cacheKey и skipIfDataExists заберёт
 * данные из кеша сразу при монтировании, без своего собственного лоадера.
 * Ошибки не пробрасываются: страница сама повторит запрос при монтировании.
 */
export async function prefetchData<T>(cacheKey: string, fetchFn: () => Promise<T>): Promise<void> {
  try {
    const result = await fetchFn();
    setCache(cacheKey, { data: result, timestamp: Date.now() });
  } catch {
    // Best-effort — реальный запрос всё равно выполнится при монтировании страницы.
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
  // When immediate=true and no cache, start with loading=true to prevent
  // a brief "empty state" flash before onMounted fires execute().
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
  // (включая восстановление из localStorage после перезапуска приложения)
  const checkCache = (): boolean => {
    if (!skipIfDataExists) return false;

    const cached = getCache(key);
    if (cached) {
      const age = Date.now() - cached.timestamp;
      if (age < cacheTTL) {
        // Восстанавливаем данные из кеша сразу
        data.value = cached.data;
        return true; // Данные взяты из кеша
      } else {
        // Кеш устарел, удаляем
        clearDataCache(key);
      }
    }
    return false;
  };

  // Проверяем кеш сразу при создании composable
  const hasCachedData = checkCache();

  // If immediate fetch is scheduled and no cache — set loading right away
  // so the template renders <LoadingState> instead of <EmptyState> before onMounted.
  if (immediate && !hasCachedData) {
    loading.value = true;
  }

  /**
   * Execute the fetch function
   */
  const execute = async (): Promise<void> => {
    loading.value = true;
    error.value = null;

    try {
      const result = await fetchFn();
      data.value = result;

      // Сохраняем в кеш (память + localStorage)
      if (skipIfDataExists) {
        setCache(key, { data: result, timestamp: Date.now() });
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

