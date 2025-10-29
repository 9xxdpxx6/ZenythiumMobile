/**
 * useLongPress Composable
 * Handles long press gestures with swipe detection to prevent accidental activation
 */

import { ref, type Ref } from 'vue';

export interface UseLongPressOptions {
  threshold?: number; // Movement threshold in pixels (default: 10)
  onPressStart?: () => void; // Callback when press starts
  onPressEnd?: () => void; // Callback when press ends
}

export interface UseLongPressReturn {
  // Event handlers for template
  handleTouchStart: (event: TouchEvent) => void;
  handleTouchMove: (event: TouchEvent) => void;
  handleTouchEnd: () => void;
  handleMouseDown: (event: MouseEvent) => void;
  handleMouseMove: (event: MouseEvent) => void;
  handleMouseUp: () => void;
  handleMouseLeave: () => void;
  handleClick: (onClick?: () => void) => void;
  
  // State
  hasMoved: Ref<boolean>;
}

/**
 * Composable for long press gesture handling with swipe detection
 */
export function useLongPress(options: UseLongPressOptions = {}): UseLongPressReturn {
  const {
    threshold = 10,
    onPressStart,
    onPressEnd,
  } = options;

  const touchStartX = ref(0);
  const touchStartY = ref(0);
  const hasMoved = ref(false);

  // Touch event handlers
  const handleTouchStart = (event: TouchEvent) => {
    hasMoved.value = false;
    touchStartX.value = event.touches[0].clientX;
    touchStartY.value = event.touches[0].clientY;
    onPressStart?.();
  };

  const handleTouchMove = (event: TouchEvent) => {
    if (!hasMoved.value && event.touches.length > 0) {
      const currentX = event.touches[0].clientX;
      const currentY = event.touches[0].clientY;
      const deltaX = Math.abs(currentX - touchStartX.value);
      const deltaY = Math.abs(currentY - touchStartY.value);
      
      // If movement exceeds threshold, cancel long press
      if (deltaX > threshold || deltaY > threshold) {
        hasMoved.value = true;
        onPressEnd?.();
      }
    }
  };

  const handleTouchEnd = () => {
    onPressEnd?.();
    hasMoved.value = false;
  };

  // Mouse event handlers (for desktop)
  const handleMouseDown = (event: MouseEvent) => {
    hasMoved.value = false;
    touchStartX.value = event.clientX;
    touchStartY.value = event.clientY;
    onPressStart?.();
  };

  const handleMouseMove = (event: MouseEvent) => {
    if (!hasMoved.value) {
      const deltaX = Math.abs(event.clientX - touchStartX.value);
      const deltaY = Math.abs(event.clientY - touchStartY.value);
      
      // If movement exceeds threshold, cancel long press
      if (deltaX > threshold || deltaY > threshold) {
        hasMoved.value = true;
        onPressEnd?.();
      }
    }
  };

  const handleMouseUp = () => {
    onPressEnd?.();
    hasMoved.value = false;
  };

  const handleMouseLeave = () => {
    onPressEnd?.();
    hasMoved.value = false;
  };

  const handleClick = (onClick?: () => void) => {
    // Only trigger onClick if no significant movement occurred
    if (!hasMoved.value && onClick) {
      onClick();
    }
    // Reset movement state for next interaction
    hasMoved.value = false;
  };

  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
    handleClick,
    hasMoved,
  };
}

