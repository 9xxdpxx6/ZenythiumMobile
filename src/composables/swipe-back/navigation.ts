/**
 * Swipe Back Navigation
 * Logic for loading and managing previous page component
 */

import { type Ref, type Component, markRaw } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import type { SwipeBackState } from './types';

/**
 * Load previous page component from router history
 */
export function createLoadPreviousPage(
  state: SwipeBackState,
  router: ReturnType<typeof useRouter>,
  route: ReturnType<typeof useRoute>
) {
  return async (): Promise<void> => {
    try {
      // Get previous route from sessionStorage (set by router.beforeEach)
      let previousPath: string | null = null;
      
      if (typeof sessionStorage !== 'undefined') {
        const storedPath = sessionStorage.getItem('previousRoute');
        if (storedPath && storedPath !== route.path) {
          previousPath = storedPath;
        }
      }
      
      // Fallback: try to get from window.history.state
      if (!previousPath && typeof window !== 'undefined' && window.history && window.history.length > 1) {
        const state = window.history.state;
        if (state && state.back) {
          previousPath = state.back;
        }
      }
      
      if (!previousPath || previousPath === route.path) {
        state.shouldRenderPreviousPage.value = false;
        state.previousPageComponent.value = null;
        return;
      }
      
      // Resolve route to get component
      try {
        const resolvedRoute = router.resolve(previousPath);
        
        if (resolvedRoute && resolvedRoute.matched && resolvedRoute.matched.length > 0) {
          const routeRecord = resolvedRoute.matched[resolvedRoute.matched.length - 1];
          
          // Skip pages with route parameters (e.g., /training-program/:id)
          // These pages require proper route params to work correctly and will fail
          // when rendered as previousPageComponent with wrong/undefined params
          if (routeRecord.path && routeRecord.path.includes(':')) {
            // This route has parameters, skip rendering as previous page
            state.shouldRenderPreviousPage.value = false;
            state.previousPageComponent.value = null;
            return;
          }
          
          if (routeRecord && routeRecord.components) {
            // Get component (handle both default and named views)
            const component = routeRecord.components.default || routeRecord.components[Object.keys(routeRecord.components)[0]];
            
            // Handle lazy-loaded components
            const componentValue = component as any;
            if (componentValue && typeof componentValue === 'function') {
              try {
                const result = componentValue();
                // Check if it returns a Promise (lazy loader)
                if (result && typeof result.then === 'function') {
                  const loadedComponent = await result;
                  state.previousPageComponent.value = markRaw(loadedComponent.default || loadedComponent);
                } else {
                  // It's a regular component function
                  state.previousPageComponent.value = markRaw(result);
                }
              } catch (e) {
                state.previousPageComponent.value = null;
              }
            } else if (componentValue) {
              // It's already a component
              state.previousPageComponent.value = markRaw(componentValue as Component);
            }
            
            if (state.previousPageComponent.value) {
              state.previousPagePath.value = previousPath;
              state.shouldRenderPreviousPage.value = true;
              // Start with opacity 0, will fade in during swipe
              state.previousPageOpacity.value = 0;
              return;
            }
          }
        }
      } catch (e) {
        // Route resolution failed
      }
      
      // Fallback: don't render previous page
      state.shouldRenderPreviousPage.value = false;
      state.previousPageComponent.value = null;
    } catch (e) {
      state.shouldRenderPreviousPage.value = false;
      state.previousPageComponent.value = null;
    }
  };
}

/**
 * Reset page transform via direct DOM access
 * NOTE: This is a workaround for Ionic's built-in page transitions.
 * Direct DOM manipulation is required to override Ionic's internal animations
 * that interfere with custom swipe navigation.
 */
export const resetPageTransform = (): void => {
  requestAnimationFrame(() => {
    if (typeof window === 'undefined') return;
    
    const pageElement = document.querySelector('.swipe-back-page');
    if (!pageElement) return;
    
    const element = pageElement as HTMLElement;
    element.style.transform = 'translateX(0)';
    element.style.transition = 'none';
  });
};

/**
 * Disable Ionic transitions before navigation
 */
export const disableIonicTransitions = (): void => {
  if (typeof document === 'undefined') return;
  
  const routerOutlet = document.querySelector('ion-router-outlet');
  if (routerOutlet) {
    const outlet = routerOutlet as HTMLElement;
    outlet.style.setProperty('--transition-duration', '0ms', 'important');
    outlet.style.setProperty('--transition-easing', 'linear', 'important');
    
    // Try to access shadow DOM
    try {
      const shadowRoot = outlet.shadowRoot;
      if (shadowRoot) {
        const container = shadowRoot.querySelector('[part="container"]');
        if (container) {
          (container as HTMLElement).style.transition = 'none';
          (container as HTMLElement).style.animation = 'none';
        }
        const page = shadowRoot.querySelector('[part="page"]');
        if (page) {
          (page as HTMLElement).style.transition = 'none';
          (page as HTMLElement).style.animation = 'none';
        }
      }
    } catch (e) {
      // Shadow DOM access might fail
    }
  }
  
  // Disable transitions on all ion-page elements
  const allPages = document.querySelectorAll('ion-page');
  allPages.forEach((page) => {
    const pageEl = page as HTMLElement;
    pageEl.style.transition = 'none';
    pageEl.style.animation = 'none';
    pageEl.style.setProperty('--transition-duration', '0ms', 'important');
    pageEl.style.setProperty('--offset-bottom', '0px', 'important');
    pageEl.style.setProperty('--offset-end', '0px', 'important');
    pageEl.style.setProperty('--offset-start', '0px', 'important');
    pageEl.style.setProperty('--offset-top', '0px', 'important');
  });
};

/**
 * Reset all styles after navigation
 */
export const resetAllStyles = (): void => {
  if (typeof document === 'undefined') return;
  
  const routerOutlet = document.querySelector('ion-router-outlet');
  if (routerOutlet) {
    const outlet = routerOutlet as HTMLElement;
    outlet.style.setProperty('--transition-duration', '');
    outlet.style.setProperty('--transition-easing', '');
  }
  
  // Reset page styles - ensure all pages are visible and interactive
  const allPages = document.querySelectorAll('ion-page');
  allPages.forEach((page) => {
    const pageEl = page as HTMLElement;
    pageEl.style.transition = '';
    pageEl.style.animation = '';
    pageEl.style.display = '';
    pageEl.style.visibility = '';
    pageEl.style.setProperty('--transition-duration', '');
    pageEl.style.setProperty('--offset-bottom', '');
    pageEl.style.setProperty('--offset-end', '');
    pageEl.style.setProperty('--offset-start', '');
    pageEl.style.setProperty('--offset-top', '');
    pageEl.style.pointerEvents = '';
    pageEl.style.touchAction = '';
  });
  
  // Reset swipe-back containers (now they are ion-page elements themselves)
  const containers = document.querySelectorAll('.swipe-back-container');
  containers.forEach((container) => {
    const containerEl = container as HTMLElement;
    const isHidden = containerEl.style.display === 'none' || 
                     containerEl.style.visibility === 'hidden';
    if (!isHidden) {
      containerEl.style.display = '';
      containerEl.style.visibility = '';
      containerEl.style.pointerEvents = '';
      containerEl.style.touchAction = '';
    }
  });
  
  // Remove orphaned swipe-back-previous-page elements (teleported to body)
  const previousPages = document.querySelectorAll('.swipe-back-previous-page');
  previousPages.forEach((page) => {
    page.remove();
  });
  
  // Ensure body doesn't have any leftover teleported elements
  const body = typeof document !== 'undefined' ? document.body : null;
  if (body) {
    const teleportedElements = body.querySelectorAll('.swipe-back-previous-page');
    teleportedElements.forEach((el) => {
      el.remove();
    });
  }
  
  // Ensure router outlet and all pages are interactive
  const outletElement = document.querySelector('ion-router-outlet');
  if (outletElement) {
    const outlet = outletElement as HTMLElement;
    outlet.style.pointerEvents = '';
    outlet.style.touchAction = '';
  }
};

/**
 * Cleanup teleported elements
 */
export const cleanupTeleportedElements = (): void => {
  if (typeof document === 'undefined') return;
  
  const previousPages = document.querySelectorAll('.swipe-back-previous-page');
  previousPages.forEach((page) => {
    page.remove();
  });
  
  const body = document.body;
  if (body) {
    const teleportedElements = body.querySelectorAll('.swipe-back-previous-page');
    teleportedElements.forEach((el) => {
      el.remove();
    });
  }
};

