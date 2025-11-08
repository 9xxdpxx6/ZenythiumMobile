/**
 * Tab Swipe Navigation Computed
 * Computed properties for tab swipe navigation
 */

import { computed, type Ref } from 'vue';
import type { TabSwipeState } from './types';
import { TAB_MAX_WIDTH, TAB_MARGIN } from './constants';

/**
 * Create computed properties for tab swipe navigation
 */
export function createTabSwipeComputed(
  state: TabSwipeState,
  currentTab: Ref<string>,
  tabs: readonly string[]
) {
  // Compute current tab index
  const currentTabIndex = computed(() => {
    return tabs.indexOf(currentTab.value);
  });

  // Compute next tab based on swipe direction
  const nextTab = computed<string | null>(() => {
    // During completion, use fixed next tab (don't recalculate based on currentTab changes)
    if (state.isCompleting.value && state.completingNextTab.value) {
      return state.completingNextTab.value;
    }
    
    // After completion, never show next tab (return null immediately)
    if (!state.isSwiping.value && !state.isCompleting.value) {
      return null;
    }
    
    const direction = state.swipeDirection.value || state.finalDirection.value;
    if (!direction) return null;
    
    const index = currentTabIndex.value;
    if (index === -1) return null;
    
    let nextIndex: number;
    if (direction === 'left') {
      nextIndex = index + 1;
    } else {
      nextIndex = index - 1;
    }
    
    if (nextIndex < 0 || nextIndex >= tabs.length) return null;
    return tabs[nextIndex];
  });

  // Compute translateX for current page based on touch position
  const translateX = computed(() => {
    const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 0;
    
    // If completing animation, move to final position
    if (state.isCompleting.value) {
      if (state.finalDirection.value === 'left') {
        // Swiping left: current page goes completely left (off screen)
        return -windowWidth;
      } else if (state.finalDirection.value === 'right') {
        // Swiping right: current page goes completely right (off screen)
        return windowWidth;
      } else {
        // No final direction = return to start (0)
        return 0;
      }
    }
    
    // After completion, ensure translateX is 0 (no transform)
    if (!state.isSwiping.value && !state.isCompleting.value) {
      return 0;
    }
    
    // During active swipe, follow finger
    if (!state.isSwiping.value) return 0;
    
    const deltaX = state.currentX.value - state.touchStartX.value;
    const clampedDelta = Math.max(-windowWidth, Math.min(windowWidth, deltaX));
    
    // If vertical swipe detected, don't apply horizontal transform
    if (state.isVerticalSwipe.value) return 0;
    
    return clampedDelta;
  });

  // Compute swipe progress (0 to 1) for tab indicator animation
  const swipeProgress = computed(() => {
    const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 0;
    if (windowWidth === 0) return 0;
    
    const currentTranslate = translateX.value;
    const absTranslate = Math.abs(currentTranslate);
    
    // Progress from 0 to 1 based on how far we've swiped
    return Math.min(absTranslate / windowWidth, 1);
  });

  // Compute translateX for next page - it starts from opposite side and follows
  const nextPageTranslateX = computed(() => {
    const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 0;
    
    // After completion, immediately hide next page (no transition)
    if (!state.isSwiping.value && !state.isCompleting.value) {
      return windowWidth; // Hide off screen
    }
    
    // If completing animation
    if (state.isCompleting.value) {
      if (state.finalDirection.value === 'left' || state.finalDirection.value === 'right') {
        // Swipe completed: move next page to center (0)
        return 0;
      } else {
        // Returning to start: hide next page off screen
        const direction = state.swipeDirection.value;
        if (direction === 'left') {
          return windowWidth;
        } else if (direction === 'right') {
          return -windowWidth;
        }
        return windowWidth; // Default
      }
    }
    
    // Only show next page during active swipe
    if (!state.isSwiping.value || !state.swipeDirection.value) {
      // Hide next page off screen when not swiping
      const direction = state.swipeDirection.value;
      if (direction === 'left') {
        return windowWidth;
      } else if (direction === 'right') {
        return -windowWidth;
      }
      return windowWidth; // Default: hide on right
    }
    
    // Check if we have a valid next tab
    const currentIndex = currentTabIndex.value;
    if (currentIndex === -1) return windowWidth;
    
    let nextIndex: number;
    if (state.swipeDirection.value === 'left') {
      nextIndex = currentIndex + 1;
    } else {
      nextIndex = currentIndex - 1;
    }
    
    if (nextIndex < 0 || nextIndex >= tabs.length) return windowWidth;
    
    const currentTranslate = translateX.value;
    
    // Next page starts from opposite side and moves together with current page
    if (state.swipeDirection.value === 'left') {
      // Swiping left: next page comes from right
      // Start position: windowWidth, then move left by translateX
      return windowWidth + currentTranslate;
    } else {
      // Swiping right: previous page comes from left
      // Start position: -windowWidth, then move right by translateX
      return -windowWidth + currentTranslate;
    }
  });

  // Compute active tab indicator position and width
  const activeTabIndicatorStyle = computed(() => {
    const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 0;
    if (windowWidth === 0) {
      return { transform: 'translateX(0)', width: '80px', left: '0px' };
    }
    
    const tabCount = tabs.length;
    const totalMarginSpace = tabCount * TAB_MARGIN * 2;
    const totalContentWidth = windowWidth - totalMarginSpace;
    const flexTabWidth = totalContentWidth / tabCount;
    const actualTabWidth = Math.min(flexTabWidth, TAB_MAX_WIDTH);
    
    // Calculate padding if tabs are centered (when at max-width)
    const totalWidthAtMax = (tabCount * TAB_MAX_WIDTH) + totalMarginSpace;
    const tabBarPadding = windowWidth >= totalWidthAtMax 
      ? (windowWidth - totalWidthAtMax) / 2 
      : 0;
    
    // Calculate position of each tab
    const getTabLeft = (index: number): number => {
      return tabBarPadding + TAB_MARGIN + (index * (actualTabWidth + TAB_MARGIN * 2));
    };
    
    // If not swiping or completing, indicator is on current tab
    if (!state.isSwiping.value && !state.isCompleting.value) {
      const currentIndex = currentTabIndex.value;
      if (currentIndex === -1) {
        return { transform: 'translateX(0)', width: '80px', left: '0px' };
      }
      const currentTabLeft = getTabLeft(currentIndex);
      return {
        transform: 'translateX(0)',
        width: `${actualTabWidth}px`,
        left: `${currentTabLeft}px`,
      };
    }
    
    // During completion, use fixed target index to prevent double jump
    if (state.isCompleting.value && state.completingTargetTabIndex.value !== null) {
      const targetIndex = state.completingTargetTabIndex.value;
      const targetTabLeft = getTabLeft(targetIndex);
      return {
        transform: 'translateX(0)',
        width: `${actualTabWidth}px`,
        left: `${targetTabLeft}px`,
      };
    }
    
    // During swipe, interpolate between start tab and next tab
    const baseIndex = state.swipeStartTabIndex.value !== null ? state.swipeStartTabIndex.value : currentTabIndex.value;
    if (baseIndex === -1) {
      return { transform: 'translateX(0)', width: '80px', left: '0px' };
    }
    
    const baseTabLeft = getTabLeft(baseIndex);
    let progress = swipeProgress.value;
    const direction = state.swipeDirection.value || state.finalDirection.value;
    
    if (!direction || !nextTab.value) {
      return {
        transform: 'translateX(0)',
        width: `${actualTabWidth}px`,
        left: `${baseTabLeft}px`,
      };
    }
    
    // Calculate next index based on base index (start index), not current index
    let nextIndex: number;
    if (direction === 'left') {
      nextIndex = baseIndex + 1;
    } else {
      nextIndex = baseIndex - 1;
    }
    
    if (nextIndex < 0 || nextIndex >= tabs.length) {
      return {
        transform: 'translateX(0)',
        width: `${actualTabWidth}px`,
        left: `${baseTabLeft}px`,
      };
    }
    
    const nextTabLeft = getTabLeft(nextIndex);
    const deltaLeft = nextTabLeft - baseTabLeft;
    
    // Apply transform based on swipe progress
    const translateXValue = deltaLeft * progress;
    
    return {
      transform: `translateX(${translateXValue}px)`,
      width: `${actualTabWidth}px`,
      left: `${baseTabLeft}px`,
    };
  });

  return {
    currentTabIndex,
    nextTab,
    swipeProgress,
    translateX,
    nextPageTranslateX,
    activeTabIndicatorStyle,
  };
}

