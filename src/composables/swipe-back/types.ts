/**
 * Swipe Back Types
 * Type definitions for swipe-back composable
 */

import { type Ref, type Component } from 'vue';

export interface UseSwipeBackOptions {
  enabled?: boolean; // Enable/disable swipe back (default: true)
  edgeThreshold?: number; // Percentage of screen width from left edge to detect swipe start (default: 0.3 = 30%)
  swipeThreshold?: number; // Minimum distance to trigger back navigation (default: 100px)
  preventVerticalScroll?: boolean; // Prevent vertical scroll during horizontal swipe (default: true)
  onBeforeBack?: () => boolean | Promise<boolean>; // Callback before navigation, return false to cancel
  // Vertical dead zones (percentages of screen height)
  topDeadZone?: number; // Top dead zone percentage (default: 0.25 = 25%)
  bottomDeadZone?: number; // Bottom dead zone percentage (default: 0.1 = 10%)
}

export interface UseSwipeBackReturn {
  // Event handlers for template
  handleTouchStart: (event: TouchEvent) => void;
  handleTouchMove: (event: TouchEvent) => void;
  handleTouchEnd: (event?: TouchEvent) => void;
  
  // State
  translateX: Ref<number>;
  isSwiping: Ref<boolean>;
  isCompleting: Ref<boolean>;
  
  // Previous page rendering
  previousPageComponent: Ref<Component | null>;
  previousPageTranslateX: Ref<number>;
  shouldRenderPreviousPage: Ref<boolean>;
  previousPageOpacity: Ref<number>;
}

export interface SwipeBackState {
  touchStartX: Ref<number>;
  touchStartY: Ref<number>;
  currentX: Ref<number>;
  isSwiping: Ref<boolean>;
  isCompleting: Ref<boolean>;
  isVerticalSwipe: Ref<boolean>;
  startedFromEdge: Ref<boolean>;
  previousPageComponent: Ref<Component | null>;
  previousPagePath: Ref<string | null>;
  shouldRenderPreviousPage: Ref<boolean>;
  previousPageOpacity: Ref<number>;
}

