/**
 * useTabSwipeNavigation Composable
 * Main composable for tab swipe navigation with finger-following animation
 */

import { ref } from 'vue';
import type { UseTabSwipeNavigationOptions, UseTabSwipeNavigationReturn, TabSwipeState } from './types';
import { createTabSwipeComputed } from './computed';
import { createTabSwipeHandlers } from './handlers';

/**
 * Composable for tab swipe navigation with finger-following animation
 */
export function useTabSwipeNavigation(
  options: UseTabSwipeNavigationOptions
): UseTabSwipeNavigationReturn {
  const {
    currentTab,
    tabs,
    onSwipe,
    swipeThreshold = 50,
    preventVerticalScroll = true,
  } = options;

  // Initialize state
  const state: TabSwipeState = {
    touchStartX: ref(0),
    touchStartY: ref(0),
    currentX: ref(0),
    isSwiping: ref(false),
    isCompleting: ref(false),
    isVerticalSwipe: ref(false),
    swipeDirection: ref(null),
    finalDirection: ref(null),
    completingNextTab: ref(null),
    swipeStartTabIndex: ref(null),
    completingTargetTabIndex: ref(null),
  };

  // Create computed properties
  const computedProps = createTabSwipeComputed(state, currentTab, tabs);

  // Create handlers
  const handlers = createTabSwipeHandlers(
    state,
    {
      swipeThreshold,
      preventVerticalScroll,
      onSwipe,
      currentTabIndex: () => computedProps.currentTabIndex.value,
      tabs,
    }
  );

  return {
    handleTouchStart: handlers.handleTouchStart,
    handleTouchMove: handlers.handleTouchMove,
    handleTouchEnd: handlers.handleTouchEnd,
    translateX: computedProps.translateX,
    nextPageTranslateX: computedProps.nextPageTranslateX,
    isSwiping: state.isSwiping,
    isCompleting: state.isCompleting,
    nextTab: computedProps.nextTab,
    activeTabIndicatorStyle: computedProps.activeTabIndicatorStyle,
  };
}

