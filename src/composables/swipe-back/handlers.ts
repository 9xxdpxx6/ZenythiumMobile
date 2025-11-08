/**
 * Swipe Back Handlers
 * Touch event handlers for swipe-back gesture
 */

import { computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import type { SwipeBackState, UseSwipeBackOptions } from './types';
import { ANIMATION_DURATION, INTERACTIVE_SELECTORS } from './constants';
import { 
  createLoadPreviousPage, 
  resetPageTransform, 
  disableIonicTransitions, 
  resetAllStyles,
  cleanupTeleportedElements 
} from './navigation';

/**
 * Create touch event handlers for swipe-back
 */
export function createSwipeBackHandlers(
  state: SwipeBackState,
  options: Required<Pick<UseSwipeBackOptions, 'enabled' | 'edgeThreshold' | 'swipeThreshold' | 'preventVerticalScroll' | 'topDeadZone' | 'bottomDeadZone'>> & { onBeforeBack?: UseSwipeBackOptions['onBeforeBack'] },
  router: ReturnType<typeof useRouter>,
  route: ReturnType<typeof useRoute>
) {
  const loadPreviousPage = createLoadPreviousPage(state, router, route);

  // Compute translateX for previous page (it stays at position 0, only fades in)
  const previousPageTranslateX = computed(() => {
    return 0;
  });

  // Compute translateX for current page based on touch position
  const translateX = computed(() => {
    if (!options.enabled) {
      return 0;
    }

    if (state.isCompleting.value) {
      if (!state.startedFromEdge.value) {
        return 0; // Returning to start position
      }
      // Navigating back - move page completely off screen to the right
      const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 0;
      return windowWidth;
    }

    if (!state.isSwiping.value || !state.startedFromEdge.value) {
      return 0;
    }

    if (state.isVerticalSwipe.value) {
      return 0;
    }

    const deltaX = state.currentX.value - state.touchStartX.value;
    // Only allow positive deltaX (swipe to the right)
    return Math.max(0, Math.min(deltaX, typeof window !== 'undefined' ? window.innerWidth : 0));
  });

  const handleTouchStart = (event: TouchEvent): void => {
    if (!options.enabled || event.touches.length === 0) return;

    // Check if touch started on an interactive element
    const target = event.target as HTMLElement;
    if (target) {
      const isInteractive = INTERACTIVE_SELECTORS.some(selector => {
        try {
          return target.closest(selector) !== null;
        } catch {
          return false;
        }
      });
      
      if (isInteractive) {
        return;
      }
    }

    // Cancel any ongoing completion animation
    state.isCompleting.value = false;
    state.isSwiping.value = false;
    state.isVerticalSwipe.value = false;
    state.startedFromEdge.value = false;

    const touchX = event.touches[0].clientX;
    const touchY = event.touches[0].clientY;

    const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 0;
    const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 0;

    if (windowWidth === 0 || windowHeight === 0) return;

    const edgeThresholdPx = windowWidth * options.edgeThreshold;
    const topDeadZonePx = windowHeight * options.topDeadZone;
    const bottomDeadZonePx = windowHeight * (1 - options.bottomDeadZone);

    const isInHorizontalZone = touchX <= edgeThresholdPx;
    const isInVerticalZone = touchY >= topDeadZonePx && touchY <= bottomDeadZonePx;

    if (isInHorizontalZone && isInVerticalZone) {
      state.startedFromEdge.value = true;
      state.touchStartX.value = touchX;
      state.touchStartY.value = touchY;
      state.currentX.value = touchX;
      
      loadPreviousPage();
    }
  };

  const handleTouchMove = (event: TouchEvent): void => {
    if (!options.enabled || !state.startedFromEdge.value || event.touches.length === 0) return;

    const newX = event.touches[0].clientX;
    const newY = event.touches[0].clientY;

    const deltaX = Math.abs(newX - state.touchStartX.value);
    const deltaY = Math.abs(newY - state.touchStartY.value);

    // Determine if this is a horizontal or vertical swipe
    if (!state.isSwiping.value && deltaX > 10) {
      if (deltaX > deltaY && newX > state.touchStartX.value) {
        state.isSwiping.value = true;
        state.isVerticalSwipe.value = false;
        if (state.previousPageComponent.value) {
          state.shouldRenderPreviousPage.value = true;
        }
      } else if (deltaY > deltaX) {
        state.isVerticalSwipe.value = true;
        state.isSwiping.value = false;
        state.startedFromEdge.value = false;
        state.shouldRenderPreviousPage.value = false;
        return;
      }
    }

    if (state.isSwiping.value && !state.isVerticalSwipe.value && newX > state.touchStartX.value) {
      state.currentX.value = newX;
      
      if (state.shouldRenderPreviousPage.value) {
        const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 0;
        const progress = Math.min((newX - state.touchStartX.value) / windowWidth, 1);
        state.previousPageOpacity.value = progress;
      }

      if (options.preventVerticalScroll && deltaX > 10 && event.cancelable && state.isSwiping.value) {
        event.preventDefault();
      }
    }
  };

  const resetToStart = (): void => {
    state.isSwiping.value = false;
    state.isCompleting.value = true;
    state.startedFromEdge.value = false;
    state.shouldRenderPreviousPage.value = false;
    state.previousPageOpacity.value = 0;

    setTimeout(() => {
      state.isCompleting.value = false;
      state.isVerticalSwipe.value = false;
      state.startedFromEdge.value = false;
      state.currentX.value = state.touchStartX.value;
      state.previousPageComponent.value = null;
      state.previousPagePath.value = null;
      state.previousPageOpacity.value = 0;
      
      cleanupTeleportedElements();
      
      if (typeof document !== 'undefined') {
        const allPages = document.querySelectorAll('ion-page');
        allPages.forEach((page) => {
          const pageEl = page as HTMLElement;
          pageEl.style.pointerEvents = '';
          pageEl.style.touchAction = '';
        });
        
        const containers = document.querySelectorAll('.swipe-back-container');
        containers.forEach((container) => {
          const containerEl = container as HTMLElement;
          containerEl.style.pointerEvents = '';
          containerEl.style.touchAction = '';
        });
      }
      
      resetPageTransform();
    }, ANIMATION_DURATION.ms);
  };

  const handleTouchEnd = async (event?: TouchEvent): Promise<void> => {
    if (!options.enabled || !state.isSwiping.value || !state.startedFromEdge.value || state.isVerticalSwipe.value) {
      state.isSwiping.value = false;
      state.isVerticalSwipe.value = false;
      state.startedFromEdge.value = false;
      state.shouldRenderPreviousPage.value = false;
      state.previousPageOpacity.value = 0;
      return;
    }

    if (event) {
      event.stopPropagation();
      event.stopImmediatePropagation();
      if (event.cancelable) {
        event.preventDefault();
      }
    }

    const deltaX = state.currentX.value - state.touchStartX.value;

    if (deltaX >= options.swipeThreshold) {
      let shouldNavigate = true;
      if (options.onBeforeBack) {
        const result = await options.onBeforeBack();
        shouldNavigate = result !== false;
      }

      if (shouldNavigate) {
        state.isSwiping.value = false;
        state.isCompleting.value = true;
        state.previousPageOpacity.value = 1;

        disableIonicTransitions();

        setTimeout(() => {
          if (typeof document !== 'undefined') {
            const currentPage = document.querySelector('.swipe-back-page.swipe-back-container');
            if (currentPage) {
              const pageEl = currentPage as HTMLElement;
              pageEl.style.display = 'none';
              pageEl.style.visibility = 'hidden';
              pageEl.style.pointerEvents = 'none';
            }
          }
          
          if (typeof window !== 'undefined' && window.history && window.history.length > 1) {
            window.history.back();
          } else {
            router.back();
          }

          const cleanup = router.afterEach(() => {
            cleanup();
            
            setTimeout(() => {
              state.isCompleting.value = false;
              state.startedFromEdge.value = false;
              state.currentX.value = state.touchStartX.value;
              state.shouldRenderPreviousPage.value = false;
              state.previousPageComponent.value = null;
              state.previousPagePath.value = null;
              state.previousPageOpacity.value = 0;
              
              resetAllStyles();
              resetPageTransform();
            }, 50);
          });
        }, ANIMATION_DURATION.ms);
      } else {
        resetToStart();
      }
    } else {
      resetToStart();
    }
  };

  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    translateX,
    previousPageTranslateX,
    resetToStart,
  };
}

