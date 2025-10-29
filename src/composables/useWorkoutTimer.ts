/**
 * useWorkoutTimer Composable
 * Workout timer logic for active workouts
 */

import { ref, onUnmounted, type Ref } from 'vue';

export interface UseWorkoutTimerReturn {
  elapsedTime: Ref<number>;
  isRunning: Ref<boolean>;
  restTimer: Ref<number>;
  isResting: Ref<boolean>;
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  startRestTimer: (seconds: number) => void;
  stopRestTimer: () => void;
  formatTime: (seconds: number) => string;
}

/**
 * Composable for workout timer
 */
export function useWorkoutTimer(): UseWorkoutTimerReturn {
  const elapsedTime = ref(0);
  const isRunning = ref(false);
  const restTimer = ref(0);
  const isResting = ref(false);

  let workoutInterval: number | null = null;
  let restInterval: number | null = null;

  /**
   * Start workout timer
   */
  const start = (): void => {
    if (isRunning.value) return;

    isRunning.value = true;
    workoutInterval = window.setInterval(() => {
      elapsedTime.value++;
    }, 1000);
  };

  /**
   * Pause workout timer
   */
  const pause = (): void => {
    if (!isRunning.value) return;

    isRunning.value = false;
    if (workoutInterval !== null) {
      clearInterval(workoutInterval);
      workoutInterval = null;
    }
  };

  /**
   * Resume workout timer
   */
  const resume = (): void => {
    start();
  };

  /**
   * Reset workout timer
   */
  const reset = (): void => {
    pause();
    elapsedTime.value = 0;
    stopRestTimer();
  };

  /**
   * Start rest timer
   */
  const startRestTimer = (seconds: number): void => {
    stopRestTimer(); // Stop any existing rest timer

    restTimer.value = seconds;
    isResting.value = true;

    restInterval = window.setInterval(() => {
      restTimer.value--;

      if (restTimer.value <= 0) {
        stopRestTimer();
      }
    }, 1000);
  };

  /**
   * Stop rest timer
   */
  const stopRestTimer = (): void => {
    isResting.value = false;
    restTimer.value = 0;

    if (restInterval !== null) {
      clearInterval(restInterval);
      restInterval = null;
    }
  };

  /**
   * Format time in seconds to MM:SS or HH:MM:SS
   */
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Cleanup on unmount
  onUnmounted(() => {
    if (workoutInterval !== null) {
      clearInterval(workoutInterval);
    }
    if (restInterval !== null) {
      clearInterval(restInterval);
    }
  });

  return {
    elapsedTime,
    isRunning,
    restTimer,
    isResting,
    start,
    pause,
    resume,
    reset,
    startRestTimer,
    stopRestTimer,
    formatTime,
  };
}

