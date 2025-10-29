/**
 * useModal Composable
 * Modal state management
 */

import { ref, type Ref } from 'vue';

export interface UseModalReturn<T = any> {
  isOpen: Ref<boolean>;
  data: Ref<T | null>;
  open: (modalData?: T) => void;
  close: () => void;
  toggle: () => void;
}

/**
 * Composable for modal state management
 */
export function useModal<T = any>(): UseModalReturn<T> {
  const isOpen = ref(false);
  const data = ref<T | null>(null) as Ref<T | null>;

  /**
   * Open modal with optional data
   */
  const open = (modalData?: T): void => {
    if (modalData !== undefined) {
      data.value = modalData;
    }
    isOpen.value = true;
  };

  /**
   * Close modal and clear data
   */
  const close = (): void => {
    isOpen.value = false;
    // Clear data after animation completes
    setTimeout(() => {
      data.value = null;
    }, 300);
  };

  /**
   * Toggle modal state
   */
  const toggle = (): void => {
    if (isOpen.value) {
      close();
    } else {
      open();
    }
  };

  return {
    isOpen,
    data,
    open,
    close,
    toggle,
  };
}

