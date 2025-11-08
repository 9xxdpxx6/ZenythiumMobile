/**
 * Tab Swipe Navigation Handlers
 * Touch event handlers for tab swipe navigation
 */

import type { TabSwipeState, UseTabSwipeNavigationOptions } from './types';
import { TAB_SWIPE_ANIMATION_DURATION } from './constants';
import { resetTabTransform, canSwipe } from './utils';

/**
 * Create touch event handlers for tab swipe navigation
 */
export function createTabSwipeHandlers(
  state: TabSwipeState,
  options: Required<Pick<UseTabSwipeNavigationOptions, 'swipeThreshold' | 'preventVerticalScroll'>> & { 
    onSwipe: UseTabSwipeNavigationOptions['onSwipe'];
    currentTabIndex: () => number;
    tabs: readonly string[];
  }
) {
  const handleTouchStart = (event: TouchEvent): void => {
    if (event.touches.length === 0) return;
    
    // Cancel any ongoing completion animation
    state.isCompleting.value = false;
    state.finalDirection.value = null;
    state.completingNextTab.value = null;
    state.swipeStartTabIndex.value = null;
    state.completingTargetTabIndex.value = null;
    
    state.isSwiping.value = false;
    state.isVerticalSwipe.value = false;
    state.swipeDirection.value = null;
    state.touchStartX.value = event.touches[0].clientX;
    state.touchStartY.value = event.touches[0].clientY;
    state.currentX.value = state.touchStartX.value;
    
    // Save current tab index at swipe start
    state.swipeStartTabIndex.value = options.currentTabIndex();
  };

  const handleTouchMove = (event: TouchEvent): void => {
    if (event.touches.length === 0) return;
    
    const newX = event.touches[0].clientX;
    const newY = event.touches[0].clientY;
    
    const deltaX = Math.abs(newX - state.touchStartX.value);
    const deltaY = Math.abs(newY - state.touchStartY.value);
    
    // Determine if this is a horizontal or vertical swipe
    if (!state.isSwiping.value && deltaX > 10) {
      // Start horizontal swipe if movement is more horizontal than vertical
      if (deltaX > deltaY) {
        state.isSwiping.value = true;
        state.isVerticalSwipe.value = false;
        // Determine swipe direction
        state.swipeDirection.value = newX > state.touchStartX.value ? 'right' : 'left';
      } else if (deltaY > deltaX) {
        // Vertical swipe detected, don't process horizontal swipe
        state.isVerticalSwipe.value = true;
        state.isSwiping.value = false;
        state.swipeDirection.value = null;
        return;
      }
    }
    
    if (state.isSwiping.value && !state.isVerticalSwipe.value) {
      state.currentX.value = newX;
      
      // Prevent default scrolling during horizontal swipe
      if (options.preventVerticalScroll && deltaX > 10 && event.cancelable) {
        event.preventDefault();
      }
    }
  };

  const resetToStart = (): void => {
    // Return pages to start position with animation
    state.isSwiping.value = false;
    state.isCompleting.value = true;
    state.finalDirection.value = null; // No final direction = return to start
    state.completingNextTab.value = null; // Clear fixed next tab
    
    // Reset after animation
    setTimeout(() => {
      state.isCompleting.value = false;
      state.swipeDirection.value = null;
      state.finalDirection.value = null;
      state.completingNextTab.value = null;
      state.swipeStartTabIndex.value = null;
      state.completingTargetTabIndex.value = null;
      state.currentX.value = state.touchStartX.value;
      
      // Force DOM update to ensure transform is reset
      resetTabTransform();
    }, TAB_SWIPE_ANIMATION_DURATION);
  };

  const handleTouchEnd = (): void => {
    if (!state.isSwiping.value || state.isVerticalSwipe.value) {
      // Reset state
      state.isSwiping.value = false;
      state.isVerticalSwipe.value = false;
      state.swipeDirection.value = null;
      state.finalDirection.value = null;
      state.isCompleting.value = false;
      state.completingNextTab.value = null;
      state.swipeStartTabIndex.value = null;
      state.completingTargetTabIndex.value = null;
      return;
    }
    
    const deltaX = state.currentX.value - state.touchStartX.value;
    const absDeltaX = Math.abs(deltaX);
    
    // Check if swipe meets threshold
    if (absDeltaX >= options.swipeThreshold && state.swipeDirection.value) {
      const direction = state.swipeDirection.value;
      const currentIndex = options.currentTabIndex();
      
      // Check if swipe is allowed in this direction
      if (canSwipe(direction, currentIndex, options.tabs.length)) {
        // Calculate and fix next tab BEFORE router navigation
        const startIndex = state.swipeStartTabIndex.value !== null ? state.swipeStartTabIndex.value : currentIndex;
        let targetIndex: number;
        if (direction === 'left') {
          targetIndex = startIndex + 1;
        } else {
          targetIndex = startIndex - 1;
        }
        
        if (targetIndex >= 0 && targetIndex < options.tabs.length) {
          state.completingNextTab.value = options.tabs[targetIndex];
          state.completingTargetTabIndex.value = targetIndex; // Fix target index for indicator
        }
        
        // Start completing animation
        state.isSwiping.value = false;
        state.isCompleting.value = true;
        state.finalDirection.value = direction;
        
        // Trigger navigation
        options.onSwipe(direction);
        
        // Reset state after animation completes
        setTimeout(() => {
          // Clear completingNextTab first to prevent nextTab from recalculating
          state.completingNextTab.value = null;
          state.swipeStartTabIndex.value = null;
          state.completingTargetTabIndex.value = null;
          // Then clear other state
          state.isCompleting.value = false;
          state.finalDirection.value = null;
          state.swipeDirection.value = null;
          state.currentX.value = state.touchStartX.value;
          
          // Force DOM update to ensure transform is reset and prevent Ionic animations
          resetTabTransform();
        }, TAB_SWIPE_ANIMATION_DURATION);
      } else {
        // Can't swipe in this direction, return to start
        resetToStart();
      }
    } else {
      // Swipe didn't meet threshold, return to start
      resetToStart();
    }
  };

  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    resetToStart,
  };
}

