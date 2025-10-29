/**
 * Logger Utility
 */

import { appConfig } from '../config/app.config';

export class Logger {
  private enabled: boolean;

  constructor() {
    this.enabled = appConfig.enableLogging;
  }

  /**
   * Log info message
   */
  info(message: string, ...args: any[]): void {
    if (this.enabled) {
      console.log(`[INFO] ${message}`, ...args);
    }
  }

  /**
   * Log warning message
   */
  warn(message: string, ...args: any[]): void {
    if (this.enabled) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }

  /**
   * Log error message
   */
  error(message: string, ...args: any[]): void {
    if (this.enabled) {
      console.error(`[ERROR] ${message}`, ...args);
    }
  }

  /**
   * Log debug message
   */
  debug(message: string, ...args: any[]): void {
    if (this.enabled && appConfig.enableDebugMode) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  }

  /**
   * Log API request
   */
  logRequest(method: string, url: string, data?: any): void {
    this.debug(`API Request: ${method} ${url}`, data);
  }

  /**
   * Log API response
   */
  logResponse(method: string, url: string, status: number, data?: any): void {
    this.debug(`API Response: ${method} ${url} - ${status}`, data);
  }

  /**
   * Enable logging
   */
  enable(): void {
    this.enabled = true;
  }

  /**
   * Disable logging
   */
  disable(): void {
    this.enabled = false;
  }
}

export const logger = new Logger();

