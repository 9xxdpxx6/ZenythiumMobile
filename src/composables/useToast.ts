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
    const toast = await toastController.create({
      message: options.message,
      duration: options.duration || appConfig.toastDuration,
      position: options.position || appConfig.toastPosition,
      color: options.color,
      icon: options.icon,
      buttons: [
        {
          text: 'Dismiss',
          role: 'cancel',
        },
      ],
    });

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
      icon: 'checkmark-circle-outline',
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
      icon: 'alert-circle-outline',
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
      icon: 'warning-outline',
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
      icon: 'information-circle-outline',
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

