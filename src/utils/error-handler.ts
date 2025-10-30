/**
 * Error Handler Utility
 */

import { ERROR_MESSAGES } from '../constants/error-messages';
import type { ApiError } from '../types/common/api-response.types';
import { logger } from './logger';

export class ErrorHandler {
  /**
   * Format error into user-friendly message
   */
  format(error: unknown): string {
    if (typeof error === 'string') {
      return error;
    }

    if (error instanceof Error) {
      return error.message;
    }

    if (this.isApiError(error)) {
      return error.message || ERROR_MESSAGES.UNKNOWN_ERROR;
    }

    if (this.isAxiosError(error)) {
      return this.formatAxiosError(error);
    }

    return ERROR_MESSAGES.UNKNOWN_ERROR;
  }

  /**
   * Log error to console/external service
   */
  log(error: unknown, context?: string): void {
    const message = context ? `[${context}] ${this.format(error)}` : this.format(error);
    logger.error(message, error);
  }

  /**
   * Check if error is a network error
   */
  isNetworkError(error: unknown): boolean {
    if (this.isAxiosError(error)) {
      return !error.response && error.code === 'ERR_NETWORK';
    }
    return false;
  }

  /**
   * Check if error is an authentication error
   */
  isAuthError(error: unknown): boolean {
    if (this.isAxiosError(error)) {
      return error.response?.status === 401 || error.response?.status === 403;
    }
    return false;
  }

  /**
   * Check if error is a validation error
   */
  isValidationError(error: unknown): boolean {
    if (this.isAxiosError(error)) {
      return error.response?.status === 422;
    }
    return false;
  }

  /**
   * Check if error is a not found error
   */
  isNotFoundError(error: unknown): boolean {
    if (this.isAxiosError(error)) {
      return error.response?.status === 404;
    }
    return false;
  }

  /**
   * Extract validation errors from API response
   */
  getValidationErrors(error: unknown): Record<string, string[]> | null {
    if (this.isAxiosError(error) && this.isValidationError(error)) {
      return error.response?.data?.errors || null;
    }
    return null;
  }

  /**
   * Type guard for API error
   */
  private isApiError(error: unknown): error is ApiError {
    // Accept transformed ApiError from interceptor (may not include 'code')
    return (
      typeof error === 'object' &&
      error !== null &&
      'message' in (error as any)
    );
  }

  /**
   * Type guard for Axios error
   */
  private isAxiosError(error: unknown): error is any {
    return (
      typeof error === 'object' &&
      error !== null &&
      'isAxiosError' in error &&
      (error as any).isAxiosError === true
    );
  }

  /**
   * Format Axios error into user-friendly message
   */
  private formatAxiosError(error: any): string {
    // Network error
    if (!error.response) {
      if (error.code === 'ERR_NETWORK') {
        return ERROR_MESSAGES.NETWORK_ERROR;
      }
      if (error.code === 'ECONNABORTED') {
        return ERROR_MESSAGES.TIMEOUT_ERROR;
      }
      return ERROR_MESSAGES.NETWORK_ERROR;
    }

    // HTTP error
    const status = error.response.status;
    const data = error.response.data;

    // Use API error message if available
    if (data?.message) {
      return data.message;
    }

    // Default messages based on status code
    switch (status) {
      case 400:
        return ERROR_MESSAGES.VALIDATION_ERROR;
      case 401:
        return ERROR_MESSAGES.UNAUTHORIZED;
      case 403:
        return ERROR_MESSAGES.UNAUTHORIZED;
      case 404:
        return ERROR_MESSAGES.NOT_FOUND;
      case 409:
        return ERROR_MESSAGES.CONFLICT;
      case 422:
        return ERROR_MESSAGES.VALIDATION_ERROR;
      case 500:
        return ERROR_MESSAGES.SERVER_ERROR;
      default:
        return ERROR_MESSAGES.UNKNOWN_ERROR;
    }
  }
}

export const errorHandler = new ErrorHandler();

