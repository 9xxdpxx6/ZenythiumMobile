/**
 * Validation Error Normalizer
 * Maps Laravel validation error keys to user-friendly messages
 */

import { ERROR_MESSAGES } from '@/constants/error-messages';

/**
 * Normalizes Laravel validation error message to user-friendly text
 * @param errorMessage - Raw error message from API (e.g., "validation.unique")
 * @param fieldName - Field name that has the error (e.g., "email", "name")
 * @returns User-friendly error message
 */
export function normalizeValidationError(
  errorMessage: string,
  fieldName?: string
): string {
  if (!errorMessage) {
    return ERROR_MESSAGES.VALIDATION_ERROR;
  }

  const lowerMessage = errorMessage.toLowerCase();
  const lowerField = fieldName?.toLowerCase() || '';

  // Unique validation errors
  if (lowerMessage.includes('unique')) {
    if (lowerField === 'email') {
      return ERROR_MESSAGES.EMAIL_ALREADY_EXISTS;
    }
    return ERROR_MESSAGES.VALUE_ALREADY_EXISTS;
  }

  // Required field errors
  if (lowerMessage.includes('required')) {
    return ERROR_MESSAGES.REQUIRED_FIELD;
  }

  // Email format errors
  if (lowerMessage.includes('email') || lowerMessage.includes('invalid email')) {
    return ERROR_MESSAGES.INVALID_EMAIL;
  }

  // Password length errors
  if (lowerMessage.includes('password') && lowerMessage.includes('min')) {
    return ERROR_MESSAGES.PASSWORD_TOO_SHORT;
  }

  // If message looks like a translation key (contains dots), return generic error
  if (errorMessage.includes('.') && !errorMessage.includes(' ')) {
    // It's likely a translation key like "validation.unique"
    if (lowerField === 'email' && lowerMessage.includes('unique')) {
      return ERROR_MESSAGES.EMAIL_ALREADY_EXISTS;
    }
    return ERROR_MESSAGES.VALIDATION_ERROR;
  }

  // Return original message if it looks like a user-friendly message
  return errorMessage;
}



