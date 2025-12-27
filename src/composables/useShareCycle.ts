/**
 * useShareCycle Composable
 * Manages share cycle modal state and logic
 */

import { computed, type ComputedRef } from 'vue';
import { useModal, type UseModalReturn } from './useModal';
import type { Cycle } from '@/types/models/cycle.types';

export interface UseShareCycleReturn {
  shareModal: UseModalReturn<Cycle>;
  cycleId: ComputedRef<number>;
  handleShare: (cycle: Cycle | null) => void;
}

/**
 * Composable for managing cycle sharing functionality
 */
export function useShareCycle(): UseShareCycleReturn {
  const shareModal = useModal<Cycle>();

  const cycleId = computed(() => shareModal.data.value?.id || 0);

  const handleShare = (cycle: Cycle | null): void => {
    if (!cycle) return;
    shareModal.open(cycle);
  };

  return {
    shareModal,
    cycleId,
    handleShare,
  };
}

