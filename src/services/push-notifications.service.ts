/**
 * Push Notifications Service
 * Handles FCM token registration and push notification events
 */

import { PushNotifications } from '@capacitor/push-notifications';
import { FCM } from '@capacitor-community/fcm';
import { Capacitor } from '@capacitor/core';
import apiClient from './api';
import { API_ENDPOINTS } from '../constants/api-endpoints';
import { errorHandler } from '../utils/error-handler';
import { logger } from '../utils/logger';
import { AuthService } from './auth';

export interface PushNotificationPayload {
  title?: string;
  body?: string;
  data?: Record<string, any>;
}

export interface PushNotificationAction {
  actionId: string;
  notification: PushNotificationPayload;
}

export class PushNotificationService {
  private static instance: PushNotificationService;
  private fcmToken: string | null = null;
  private isInitialized: boolean = false;

  private constructor() {}

  static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  /**
   * Initialize push notifications service
   * Should be called once when app starts
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      logger.info('PushNotificationService: Already initialized');
      return;
    }

    if (!Capacitor.isNativePlatform()) {
      logger.info('PushNotificationService: Push notifications only work on native platforms');
      return;
    }

    // Check if user is authenticated
    if (!AuthService.isAuthenticated()) {
      logger.info('PushNotificationService: User not authenticated, skipping initialization');
      return;
    }

    try {
      // Request permissions
      let permStatus = await PushNotifications.checkPermissions();
      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions();
      }

      if (permStatus.receive !== 'granted') {
        logger.warn('PushNotificationService: User denied push notification permissions');
        return;
      }

      // Register for push notifications
      await PushNotifications.register();
      logger.info('PushNotificationService: Registered for push notifications');

      // Get FCM token
      await this.getFCMToken();

      // Setup listeners
      this.setupListeners();

      this.isInitialized = true;
    } catch (error) {
      errorHandler.log(error, 'PushNotificationService.initialize');
      throw error;
    }
  }

  /**
   * Get FCM token and send to server
   */
  private async getFCMToken(): Promise<void> {
    try {
      const token = await FCM.getToken();
      this.fcmToken = token.token;
      logger.info('PushNotificationService: FCM token received', { token: token.token });

      // Send token to server
      await this.sendTokenToServer(token.token);
    } catch (error) {
      errorHandler.log(error, 'PushNotificationService.getFCMToken');
    }
  }

  /**
   * Send FCM token to server
   */
  private async sendTokenToServer(token: string): Promise<void> {
    try {
      const platform = Capacitor.getPlatform();
      
      await apiClient.post(API_ENDPOINTS.USER.DEVICE_TOKENS, {
        device_token: token,
        platform: platform === 'ios' ? 'ios' : 'android',
      });

      logger.info('PushNotificationService: Token sent to server successfully');
    } catch (error) {
      errorHandler.log(error, 'PushNotificationService.sendTokenToServer');
    }
  }

  /**
   * Setup push notification listeners
   */
  private setupListeners(): void {
    // Handle notification received (when app is in foreground)
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      logger.info('PushNotificationService: Notification received', { notification });
      // You can emit custom event here if needed
      window.dispatchEvent(new CustomEvent('push-notification-received', {
        detail: notification
      }));
    });

    // Handle notification action (when user taps notification)
    PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      logger.info('PushNotificationService: Notification action performed', { action });
      window.dispatchEvent(new CustomEvent('push-notification-action', {
        detail: action
      }));
    });

    // Handle registration token
    PushNotifications.addListener('registration', async (token) => {
      logger.info('PushNotificationService: Registration token received', { token: token.value });
      // NOTE: @capacitor-community/fcm does not expose an `onTokenRefresh` listener in this project version.
      // Re-fetch the FCM token when native registration happens (covers initial registration and potential re-registrations).
      await this.getFCMToken();
    });

    // Handle registration errors
    PushNotifications.addListener('registrationError', (error) => {
      errorHandler.log(error, 'PushNotificationService.registrationError');
    });

    // FCM token refresh is not available as an event in the current @capacitor-community/fcm typings.
    // If you need periodic refresh, use `FCM.refreshToken()` on app resume or after login.
  }

  /**
   * Subscribe to notification received events
   */
  onNotificationReceived(callback: (notification: PushNotificationPayload) => void): void {
    window.addEventListener('push-notification-received', ((event: CustomEvent) => {
      callback(event.detail);
    }) as EventListener);
  }

  /**
   * Subscribe to notification action events
   */
  onNotificationActionPerformed(callback: (action: PushNotificationAction) => void): void {
    window.addEventListener('push-notification-action', ((event: CustomEvent) => {
      callback(event.detail);
    }) as EventListener);
  }

  /**
   * Get current FCM token
   */
  getToken(): string | null {
    return this.fcmToken;
  }

  /**
   * Check if service is initialized
   */
  isServiceInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Re-initialize service (useful after login)
   */
  async reinitialize(): Promise<void> {
    this.isInitialized = false;
    await this.initialize();
  }
}




