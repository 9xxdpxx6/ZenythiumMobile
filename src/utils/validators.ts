/**
 * Validators Utility
 */

import { VALIDATION_RULES } from '../constants/validation-rules';
import { ERROR_MESSAGES } from '../constants/error-messages';

export type ValidationResult = string | true;
export type ValidatorFn = (value: any) => ValidationResult;

export const validators = {
  /**
   * Required field validator
   */
  required: (value: any): ValidationResult => {
    if (value === null || value === undefined || value === '') {
      return ERROR_MESSAGES.REQUIRED_FIELD;
    }
    if (Array.isArray(value) && value.length === 0) {
      return ERROR_MESSAGES.REQUIRED_FIELD;
    }
    return true;
  },

  /**
   * Email validator
   */
  email: (value: string): ValidationResult => {
    if (!value) return true; // Use with required() for mandatory emails
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value) || ERROR_MESSAGES.INVALID_EMAIL;
  },

  /**
   * Minimum length validator
   */
  minLength: (min: number) => (value: string): ValidationResult => {
    if (!value) return true;
    return value.length >= min || `Минимум ${min} символов`;
  },

  /**
   * Maximum length validator
   */
  maxLength: (max: number) => (value: string): ValidationResult => {
    if (!value) return true;
    return value.length <= max || `Максимум ${max} символов`;
  },

  /**
   * Number validator
   */
  number: (value: any): ValidationResult => {
    if (value === null || value === undefined || value === '') return true;
    return !isNaN(Number(value)) || 'Должно быть числом';
  },

  /**
   * Positive number validator
   */
  positive: (value: number): ValidationResult => {
    if (value === null || value === undefined) return true;
    return value > 0 || 'Должно быть положительным';
  },

  /**
   * Non-negative number validator
   */
  nonNegative: (value: number): ValidationResult => {
    if (value === null || value === undefined) return true;
    return value >= 0 || 'Должно быть неотрицательным';
  },

  /**
   * Range validator
   */
  range: (min: number, max: number) => (value: number): ValidationResult => {
    if (value === null || value === undefined) return true;
    return (value >= min && value <= max) || `Должно быть от ${min} до ${max}`;
  },

  /**
   * Password validator
   */
  password: (value: string): ValidationResult => {
    if (!value) return true;
    if (value.length < VALIDATION_RULES.PASSWORD_MIN_LENGTH) {
      return ERROR_MESSAGES.PASSWORD_TOO_SHORT;
    }
    return true;
  },

  /**
   * Username validator
   */
  username: (value: string): ValidationResult => {
    if (!value) return true;
    if (value.length < VALIDATION_RULES.USERNAME_MIN_LENGTH) {
      return `Минимум ${VALIDATION_RULES.USERNAME_MIN_LENGTH} символов`;
    }
    if (value.length > VALIDATION_RULES.USERNAME_MAX_LENGTH) {
      return `Максимум ${VALIDATION_RULES.USERNAME_MAX_LENGTH} символов`;
    }
    return true;
  },

  /**
   * Date validator
   */
  date: (value: string): ValidationResult => {
    if (!value) return true;
    const date = new Date(value);
    return !isNaN(date.getTime()) || 'Неверная дата';
  },

  /**
   * Future date validator
   */
  futureDate: (value: string): ValidationResult => {
    if (!value) return true;
    const date = new Date(value);
    const now = new Date();
    return date > now || 'Дата должна быть в будущем';
  },

  /**
   * Past date validator
   */
  pastDate: (value: string): ValidationResult => {
    if (!value) return true;
    const date = new Date(value);
    const now = new Date();
    return date < now || 'Дата должна быть в прошлом';
  },

  /**
   * URL validator
   */
  url: (value: string): ValidationResult => {
    if (!value) return true;
    try {
      new URL(value);
      return true;
    } catch {
      return 'Неверный URL';
    }
  },

  /**
   * Pattern validator
   */
  pattern: (regex: RegExp, message: string) => (value: string): ValidationResult => {
    if (!value) return true;
    return regex.test(value) || message;
  },

  /**
   * Match validator (for password confirmation)
   */
  match: (otherValue: any, fieldName: string) => (value: any): ValidationResult => {
    return value === otherValue || `Должно совпадать с ${fieldName}`;
  },

  /**
   * Reps validator
   */
  reps: (value: number): ValidationResult => {
    if (value === null || value === undefined) return true;
    return validators.range(VALIDATION_RULES.MIN_REPS, VALIDATION_RULES.MAX_REPS)(value);
  },

  /**
   * Weight validator
   */
  weight: (value: number): ValidationResult => {
    if (value === null || value === undefined) return true;
    return validators.range(VALIDATION_RULES.MIN_WEIGHT, VALIDATION_RULES.MAX_WEIGHT)(value);
  },

  /**
   * RPE validator
   */
  rpe: (value: number): ValidationResult => {
    if (value === null || value === undefined) return true;
    return validators.range(VALIDATION_RULES.MIN_RPE, VALIDATION_RULES.MAX_RPE)(value);
  },

  /**
   * UUID validator
   */
  uuid: (value: string): ValidationResult => {
    if (!value) return true;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value) || 'Невалидный UUID';
  },
};

/**
 * Combine multiple validators
 */
export function combineValidators(...validators: ValidatorFn[]): ValidatorFn {
  return (value: any): ValidationResult => {
    for (const validator of validators) {
      const result = validator(value);
      if (result !== true) {
        return result;
      }
    }
    return true;
  };
}

/**
 * Check if string is valid UUID
 */
export function isValidUUID(value: string): boolean {
  if (!value) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

