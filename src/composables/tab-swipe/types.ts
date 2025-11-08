/**
 * Tab Swipe Navigation Types
 * Type definitions for tab swipe navigation composable
 */

import { type Ref } from 'vue';

export interface UseTabSwipeNavigationOptions {
  currentTab: Ref<string>;
  tabs: readonly string[];
  onSwipe: (direction: 'left' | 'right') => void;
  swipeThreshold?: number; // Minimum distance to trigger swipe (default: 50px)
  preventVerticalScroll?: boolean; // Prevent vertical scroll during horizontal swipe (default: true)
}

export interface UseTabSwipeNavigationReturn {
  // Event handlers for template
  handleTouchStart: (event: TouchEvent) => void;
  handleTouchMove: (event: TouchEvent) => void;
  handleTouchEnd: () => void;
  
  // State
  translateX: Ref<number>;
  nextPageTranslateX: Ref<number>;
  isSwiping: Ref<boolean>;
  isCompleting: Ref<boolean>;
  nextTab: Ref<string | null>;
  
  // Tab indicator position
  activeTabIndicatorStyle: Ref<{ transform: string; width: string; left: string }>;
}

export interface TabSwipeState {
  touchStartX: Ref<number>;
  touchStartY: Ref<number>;
  currentX: Ref<number>;
  isSwiping: Ref<boolean>;
  isCompleting: Ref<boolean>;
  isVerticalSwipe: Ref<boolean>;
  swipeDirection: Ref<'left' | 'right' | null>;
  finalDirection: Ref<'left' | 'right' | null>;
  completingNextTab: Ref<string | null>;
  swipeStartTabIndex: Ref<number | null>;
  completingTargetTabIndex: Ref<number | null>;
}

