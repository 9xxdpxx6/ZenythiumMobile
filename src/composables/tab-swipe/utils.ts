/**
 * Tab Swipe Navigation Utils
 * Utility functions for tab swipe navigation
 */

/**
 * Reset tab transform via direct DOM access
 * NOTE: This is a workaround for Ionic's built-in page transitions.
 * Direct DOM manipulation is required to override Ionic's internal animations
 * that interfere with custom swipe navigation.
 */
export const resetTabTransform = (): void => {
  requestAnimationFrame(() => {
    if (typeof window === 'undefined') return;
    
    const tabsElement = document.querySelector('.swipe-page.current-page');
    if (!tabsElement) return;
    
    const element = tabsElement as HTMLElement;
    element.style.transform = 'translateX(0)';
    element.style.transition = 'none';
  });
};

/**
 * Check if swipe is allowed in given direction
 */
export const canSwipe = (
  direction: 'left' | 'right',
  currentTabIndex: number,
  tabsLength: number
): boolean => {
  // Swiping left goes to next tab (index + 1), so can't swipe left from last tab
  // Swiping right goes to previous tab (index - 1), so can't swipe right from first tab
  if (direction === 'left' && currentTabIndex === tabsLength - 1) return false;
  if (direction === 'right' && currentTabIndex === 0) return false;
  return true;
};

