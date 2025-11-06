/**
 * useSearch Composable
 * Search functionality with debounce
 */

import { ref, onUnmounted, type Ref } from 'vue';

export interface UseSearchOptions {
  debounceMs?: number;
  onSearch?: (query: string) => void | Promise<void>;
  onClear?: () => void | Promise<void>;
}

export interface UseSearchReturn {
  searchQuery: Ref<string>;
  searchLoading: Ref<boolean>;
  handleSearch: (value: string) => void;
  clearSearch: () => void;
}

/**
 * Composable for search with debounce
 */
export function useSearch(options: UseSearchOptions = {}): UseSearchReturn {
  const { debounceMs = 300, onSearch, onClear } = options;
  
  const searchQuery = ref('');
  const searchLoading = ref(false);
  const searchTimeout = ref<NodeJS.Timeout | null>(null);

  const handleSearch = (value: string): void => {
    searchQuery.value = value;
    if (searchTimeout.value) clearTimeout(searchTimeout.value);
    searchLoading.value = true;
    
    searchTimeout.value = setTimeout(async () => {
      if (onSearch) {
        await onSearch(value);
      }
      searchLoading.value = false;
    }, debounceMs);
  };

  const clearSearch = (): void => {
    searchQuery.value = '';
    if (searchTimeout.value) clearTimeout(searchTimeout.value);
    searchLoading.value = true;
    
    if (onClear) {
      onClear();
    }
    
    setTimeout(() => { 
      searchLoading.value = false; 
    }, debounceMs);
  };

  onUnmounted(() => {
    if (searchTimeout.value) {
      clearTimeout(searchTimeout.value);
    }
  });

  return {
    searchQuery,
    searchLoading,
    handleSearch,
    clearSearch,
  };
}

