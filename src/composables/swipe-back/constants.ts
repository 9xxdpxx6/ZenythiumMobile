/**
 * Swipe Back Constants
 * Animation duration and configuration constants
 */

/**
 * Get animation duration from CSS variable or use default
 */
export const getAnimationDuration = (): { ms: number; css: string } => {
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    try {
      const root = document.documentElement;
      const duration = getComputedStyle(root).getPropertyValue('--swipe-back-duration').trim();
      if (duration) {
        // Parse CSS duration (e.g., "0.2s" -> 200ms)
        const ms = parseFloat(duration) * 1000;
        return { ms, css: duration };
      }
    } catch (e) {
      // Fallback if CSS variable not available
    }
  }
  // Default fallback
  return { ms: 200, css: '0.2s' };
};

// Animation duration - read from CSS variable
export const ANIMATION_DURATION = getAnimationDuration();

/**
 * Interactive element selectors that should not trigger swipe-back
 */
export const INTERACTIVE_SELECTORS = [
  'button',
  'a',
  'input',
  'select',
  'textarea',
  '[role="button"]',
  'ion-button',
  'ion-tab-button',
  'ion-back-button',
  'ion-buttons',
  '.clickable'
] as const;

