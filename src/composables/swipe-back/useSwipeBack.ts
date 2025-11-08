/**
 * useSwipeBack Composable
 * Main composable for swipe-back navigation (swipe from left edge to right)
 */

import { ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import type { UseSwipeBackOptions, UseSwipeBackReturn, SwipeBackState } from './types';
import { createSwipeBackHandlers } from './handlers';

/**
 * Composable for swipe back navigation (swipe from left edge to right)
 */
export function useSwipeBack(
  options: UseSwipeBackOptions = {}
): UseSwipeBackReturn {
  const {
    enabled = true,
    edgeThreshold = 0.3,
    swipeThreshold = 100,
    preventVerticalScroll = true,
    onBeforeBack,
    topDeadZone = 0.25,
    bottomDeadZone = 0.1,
  } = options;

  const router = useRouter();
  const route = useRoute();

  // Initialize state
  const state: SwipeBackState = {
    touchStartX: ref(0),
    touchStartY: ref(0),
    currentX: ref(0),
    isSwiping: ref(false),
    isCompleting: ref(false),
    isVerticalSwipe: ref(false),
    startedFromEdge: ref(false),
    previousPageComponent: ref(null),
    previousPagePath: ref(null),
    shouldRenderPreviousPage: ref(false),
    previousPageOpacity: ref(0),
  };

  // Create handlers with state and options
  const handlers = createSwipeBackHandlers(
    state,
    {
      enabled,
      edgeThreshold,
      swipeThreshold,
      preventVerticalScroll,
      topDeadZone,
      bottomDeadZone,
      onBeforeBack,
    },
    router,
    route
  );

  return {
    handleTouchStart: handlers.handleTouchStart,
    handleTouchMove: handlers.handleTouchMove,
    handleTouchEnd: handlers.handleTouchEnd,
    translateX: handlers.translateX,
    isSwiping: state.isSwiping,
    isCompleting: state.isCompleting,
    previousPageComponent: state.previousPageComponent,
    previousPageTranslateX: handlers.previousPageTranslateX,
    shouldRenderPreviousPage: state.shouldRenderPreviousPage,
    previousPageOpacity: state.previousPageOpacity,
  };
}

