/**
 * useTabSwipeNavigation Composable
 * Handles swipe gestures for tab navigation with finger-following animation
 */

import { ref, computed, type Ref } from 'vue';

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

  const touchStartX = ref(0);
  const touchStartY = ref(0);
  const currentX = ref(0);
  const isSwiping = ref(false);
  const isCompleting = ref(false);
  const isVerticalSwipe = ref(false);
  const swipeDirection = ref<'left' | 'right' | null>(null);
  const finalDirection = ref<'left' | 'right' | null>(null);
  const completingNextTab = ref<string | null>(null); // Fixed next tab during completion
  const swipeStartTabIndex = ref<number | null>(null); // Fixed tab index at swipe start
  const completingTargetTabIndex = ref<number | null>(null); // Fixed target tab index during completion

  // Compute current tab index
  const currentTabIndex = computed(() => {
    return tabs.indexOf(currentTab.value);
  });

  // Compute next tab based on swipe direction
  const nextTab = computed<string | null>(() => {
    // During completion, use fixed next tab (don't recalculate based on currentTab changes)
    if (isCompleting.value && completingNextTab.value) {
      return completingNextTab.value;
    }
    
    // After completion, never show next tab (return null immediately)
    if (!isSwiping.value && !isCompleting.value) {
      return null;
    }
    
    const direction = swipeDirection.value || finalDirection.value;
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

  // Compute swipe progress (0 to 1) for tab indicator animation
  const swipeProgress = computed(() => {
    const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 0;
    if (windowWidth === 0) return 0;
    
    const currentTranslate = translateX.value;
    const absTranslate = Math.abs(currentTranslate);
    
    // Progress from 0 to 1 based on how far we've swiped
    return Math.min(absTranslate / windowWidth, 1);
  });

  // Compute translateX for current page based on touch position
  const translateX = computed(() => {
    const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 0;
    
    // If completing animation, move to final position
    if (isCompleting.value) {
      if (finalDirection.value === 'left') {
        // Swiping left: current page goes completely left (off screen)
        return -windowWidth;
      } else if (finalDirection.value === 'right') {
        // Swiping right: current page goes completely right (off screen)
        return windowWidth;
      } else {
        // No final direction = return to start (0)
        return 0;
      }
    }
    
    // After completion, ensure translateX is 0 (no transform)
    if (!isSwiping.value && !isCompleting.value) {
      return 0;
    }
    
    // During active swipe, follow finger
    if (!isSwiping.value) return 0;
    
    const deltaX = currentX.value - touchStartX.value;
    const clampedDelta = Math.max(-windowWidth, Math.min(windowWidth, deltaX));
    
    // If vertical swipe detected, don't apply horizontal transform
    if (isVerticalSwipe.value) return 0;
    
    return clampedDelta;
  });
  
  // Compute active tab indicator position and width
  const activeTabIndicatorStyle = computed(() => {
    const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 0;
    if (windowWidth === 0) {
      return { transform: 'translateX(0)', width: '80px', left: '0px' };
    }
    
    // Tab button styling: max-width: 80px, margin: 0 4px (left and right), flex: 1
    // With flex: 1 and justify-content: center, tabs are distributed evenly
    const tabMaxWidth = 80;
    const tabMargin = 4; // margin-left and margin-right each
    const tabCount = tabs.length;
    
    // Calculate actual tab width: tabs use flex: 1, so they share space equally
    // But are limited by max-width: 80px
    // Each tab has margin on both sides: left margin (4px) + width + right margin (4px)
    // Total width needed for tabs at max-width = tabCount * tabMaxWidth + (tabCount + 1) * tabMargin
    // But actually, flex layout distributes margins differently
    // Better approach: calculate based on actual flex behavior
    const totalMarginSpace = tabCount * tabMargin * 2; // Each tab has margin on both sides
    const totalContentWidth = windowWidth - totalMarginSpace;
    const flexTabWidth = totalContentWidth / tabCount;
    
    // Actual tab width is limited by max-width
    const actualTabWidth = Math.min(flexTabWidth, tabMaxWidth);
    
    // Calculate padding if tabs are centered (when at max-width)
    const totalWidthAtMax = (tabCount * tabMaxWidth) + totalMarginSpace;
    const tabBarPadding = windowWidth >= totalWidthAtMax 
      ? (windowWidth - totalWidthAtMax) / 2 
      : 0;
    
    // Calculate position of each tab
    // Each tab has: left margin (4px) + width + right margin (4px)
    // Position = padding + (left margin) + index * (width + left margin + right margin)
    const getTabLeft = (index: number): number => {
      return tabBarPadding + tabMargin + (index * (actualTabWidth + tabMargin * 2));
    };
    
    // If not swiping or completing, indicator is on current tab
    if (!isSwiping.value && !isCompleting.value) {
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
    if (isCompleting.value && completingTargetTabIndex.value !== null) {
      const targetIndex = completingTargetTabIndex.value;
      const targetTabLeft = getTabLeft(targetIndex);
      return {
        transform: 'translateX(0)',
        width: `${actualTabWidth}px`,
        left: `${targetTabLeft}px`,
      };
    }
    
    // During swipe, interpolate between start tab and next tab
    const baseIndex = swipeStartTabIndex.value !== null ? swipeStartTabIndex.value : currentTabIndex.value;
    if (baseIndex === -1) {
      return { transform: 'translateX(0)', width: '80px', left: '0px' };
    }
    
    const baseTabLeft = getTabLeft(baseIndex);
    let progress = swipeProgress.value;
    const direction = swipeDirection.value || finalDirection.value;
    
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

  // Compute translateX for next page - it starts from opposite side and follows
  const nextPageTranslateX = computed(() => {
    const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 0;
    
    // After completion, immediately hide next page (no transition)
    if (!isSwiping.value && !isCompleting.value) {
      return windowWidth; // Hide off screen
    }
    
    // If completing animation
    if (isCompleting.value) {
      if (finalDirection.value === 'left' || finalDirection.value === 'right') {
        // Swipe completed: move next page to center (0)
        return 0;
      } else {
        // Returning to start: hide next page off screen
        const direction = swipeDirection.value;
        if (direction === 'left') {
          return windowWidth;
        } else if (direction === 'right') {
          return -windowWidth;
        }
        return windowWidth; // Default
      }
    }
    
    // Only show next page during active swipe
    if (!isSwiping.value || !swipeDirection.value) {
      // Hide next page off screen when not swiping
      const direction = swipeDirection.value;
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
    if (swipeDirection.value === 'left') {
      nextIndex = currentIndex + 1;
    } else {
      nextIndex = currentIndex - 1;
    }
    
    if (nextIndex < 0 || nextIndex >= tabs.length) return windowWidth;
    
    const currentTranslate = translateX.value;
    
    // Next page starts from opposite side and moves together with current page
    if (swipeDirection.value === 'left') {
      // Swiping left: next page comes from right
      // Start position: windowWidth, then move left by translateX
      return windowWidth + currentTranslate;
    } else {
      // Swiping right: previous page comes from left
      // Start position: -windowWidth, then move right by translateX
      return -windowWidth + currentTranslate;
    }
  });

  // Check if swipe is allowed in given direction
  const canSwipe = (direction: 'left' | 'right'): boolean => {
    const index = currentTabIndex.value;
    // Swiping left goes to next tab (index + 1), so can't swipe left from last tab
    // Swiping right goes to previous tab (index - 1), so can't swipe right from first tab
    if (direction === 'left' && index === tabs.length - 1) return false;
    if (direction === 'right' && index === 0) return false;
    return true;
  };

  /**
   * Reset tab transform via direct DOM access
   * NOTE: This is a workaround for Ionic's built-in page transitions.
   * Direct DOM manipulation is required to override Ionic's internal animations
   * that interfere with custom swipe navigation.
   */
  const resetTabTransform = (): void => {
    requestAnimationFrame(() => {
      if (typeof window === 'undefined') return;
      
      const tabsElement = document.querySelector('.swipe-page.current-page');
      if (!tabsElement) return;
      
      const element = tabsElement as HTMLElement;
      element.style.transform = 'translateX(0)';
      element.style.transition = 'none';
    });
  };

  // Touch event handlers
  const handleTouchStart = (event: TouchEvent): void => {
    if (event.touches.length === 0) return;
    
    // Cancel any ongoing completion animation
    isCompleting.value = false;
    finalDirection.value = null;
    completingNextTab.value = null;
    swipeStartTabIndex.value = null;
    completingTargetTabIndex.value = null;
    
    isSwiping.value = false;
    isVerticalSwipe.value = false;
    swipeDirection.value = null;
    touchStartX.value = event.touches[0].clientX;
    touchStartY.value = event.touches[0].clientY;
    currentX.value = touchStartX.value;
    
    // Save current tab index at swipe start
    swipeStartTabIndex.value = currentTabIndex.value;
  };

  const handleTouchMove = (event: TouchEvent): void => {
    if (event.touches.length === 0) return;
    
    const newX = event.touches[0].clientX;
    const newY = event.touches[0].clientY;
    
    const deltaX = Math.abs(newX - touchStartX.value);
    const deltaY = Math.abs(newY - touchStartY.value);
    
    // Determine if this is a horizontal or vertical swipe
    if (!isSwiping.value && deltaX > 10) {
      // Start horizontal swipe if movement is more horizontal than vertical
      if (deltaX > deltaY) {
        isSwiping.value = true;
        isVerticalSwipe.value = false;
        // Determine swipe direction
        swipeDirection.value = newX > touchStartX.value ? 'right' : 'left';
      } else if (deltaY > deltaX) {
        // Vertical swipe detected, don't process horizontal swipe
        isVerticalSwipe.value = true;
        isSwiping.value = false;
        swipeDirection.value = null;
        return;
      }
    }
    
    if (isSwiping.value && !isVerticalSwipe.value) {
      currentX.value = newX;
      
      // Prevent default scrolling during horizontal swipe
      if (preventVerticalScroll && deltaX > 10) {
        event.preventDefault();
      }
    }
  };

  const handleTouchEnd = (): void => {
    if (!isSwiping.value || isVerticalSwipe.value) {
      // Reset state
      isSwiping.value = false;
      isVerticalSwipe.value = false;
      swipeDirection.value = null;
      finalDirection.value = null;
      isCompleting.value = false;
      completingNextTab.value = null;
      swipeStartTabIndex.value = null;
      completingTargetTabIndex.value = null;
      return;
    }
    
    const deltaX = currentX.value - touchStartX.value;
    const absDeltaX = Math.abs(deltaX);
    
    // Check if swipe meets threshold
    if (absDeltaX >= swipeThreshold && swipeDirection.value) {
      const direction = swipeDirection.value;
      
      // Check if swipe is allowed in this direction
      if (canSwipe(direction)) {
        // Calculate and fix next tab BEFORE router navigation
        const startIndex = swipeStartTabIndex.value !== null ? swipeStartTabIndex.value : currentTabIndex.value;
        let targetIndex: number;
        if (direction === 'left') {
          targetIndex = startIndex + 1;
        } else {
          targetIndex = startIndex - 1;
        }
        
        if (targetIndex >= 0 && targetIndex < tabs.length) {
          completingNextTab.value = tabs[targetIndex];
          completingTargetTabIndex.value = targetIndex; // Fix target index for indicator
        }
        
        // Start completing animation
        isSwiping.value = false;
        isCompleting.value = true;
        finalDirection.value = direction;
        
        // Trigger navigation
        onSwipe(direction);
        
        // Reset state after animation completes (300ms transition)
        // Clear completingNextTab first to hide component immediately
        setTimeout(() => {
          // Clear completingNextTab first to prevent nextTab from recalculating
          completingNextTab.value = null;
          swipeStartTabIndex.value = null;
          completingTargetTabIndex.value = null;
          // Then clear other state
          isCompleting.value = false;
          finalDirection.value = null;
          swipeDirection.value = null;
          currentX.value = touchStartX.value;
          
          // Force DOM update to ensure transform is reset and prevent Ionic animations
          // NOTE: Direct DOM access is required here to override Ionic's internal animations
          // This is a workaround for Ionic's built-in page transitions interfering with custom swipe
          resetTabTransform();
        }, 300);
      } else {
        // Can't swipe in this direction, return to start
        resetToStart();
      }
    } else {
      // Swipe didn't meet threshold, return to start
      resetToStart();
    }
  };
  
  const resetToStart = (): void => {
    // Return pages to start position with animation
    // Set final position to 0 for both pages
    isSwiping.value = false;
    isCompleting.value = true;
    finalDirection.value = null; // No final direction = return to start
    completingNextTab.value = null; // Clear fixed next tab
    
    // Reset after animation
    setTimeout(() => {
      isCompleting.value = false;
      swipeDirection.value = null;
      finalDirection.value = null;
      completingNextTab.value = null;
      swipeStartTabIndex.value = null;
      completingTargetTabIndex.value = null;
      currentX.value = touchStartX.value;
      
      // Force DOM update to ensure transform is reset
      resetTabTransform();
    }, 300);
  };

  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    translateX,
    nextPageTranslateX,
    isSwiping,
    isCompleting,
    nextTab,
    activeTabIndicatorStyle,
  };
}

