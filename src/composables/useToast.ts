/**
 * useToast Composable
 * Toast notifications wrapper for Ionic
 */

import { toastController } from '@ionic/vue';
import { appConfig } from '../config/app.config';

export interface ToastOptions {
  message: string;
  duration?: number;
  position?: 'top' | 'bottom' | 'middle';
  color?: 'success' | 'warning' | 'danger' | 'primary' | 'secondary';
  icon?: string;
}

export interface UseToastReturn {
  showToast: (options: ToastOptions) => Promise<void>;
  showSuccess: (message: string, duration?: number) => Promise<void>;
  showError: (message: string, duration?: number) => Promise<void>;
  showWarning: (message: string, duration?: number) => Promise<void>;
  showInfo: (message: string, duration?: number) => Promise<void>;
}

/**
 * Composable for toast notifications
 */
export function useToast(): UseToastReturn {
  /**
   * Show toast with custom options
   */
  const showToast = async (options: ToastOptions): Promise<void> => {
    const toastOptions: {
      message: string;
      duration: number;
      position: 'top' | 'bottom' | 'middle';
      color?: 'success' | 'warning' | 'danger' | 'primary' | 'secondary';
      icon?: string;
      buttons: Array<{ text: string; role: string }>;
    } = {
      message: options.message,
      duration: options.duration || appConfig.toastDuration,
      position: options.position || appConfig.toastPosition,
      color: options.color,
      buttons: [
        {
          text: 'Dismiss',
          role: 'cancel',
        },
      ],
    };
    
    // Only add icon if explicitly provided to avoid Ionic trying to load default icons
    if (options.icon) {
      toastOptions.icon = options.icon;
    }
    
    const toast = await toastController.create(toastOptions);

    await toast.present();
  };

  /**
   * Show success toast
   */
  const showSuccess = async (message: string, duration?: number): Promise<void> => {
    await showToast({
      message,
      duration,
      color: 'success',
    });
  };

  /**
   * Show error toast
   */
  const showError = async (message: string, duration?: number): Promise<void> => {
    await showToast({
      message,
      duration,
      color: 'danger',
    });
  };

  /**
   * Show warning toast
   */
  const showWarning = async (message: string, duration?: number): Promise<void> => {
    await showToast({
      message,
      duration,
      color: 'warning',
    });
  };

  /**
   * Show info toast
   */
  const showInfo = async (message: string, duration?: number): Promise<void> => {
    await showToast({
      message,
      duration,
      color: 'primary',
    });
  };

  return {
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
}

