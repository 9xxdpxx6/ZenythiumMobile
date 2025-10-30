/**
 * useForm Composable
 * Form state management and validation
 */

import { reactive, ref, computed, type Ref, type ComputedRef } from 'vue';
import type { ValidatorFn } from '../utils/validators';

export type ValidationSchema<T> = {
  [K in keyof T]?: ValidatorFn | ValidatorFn[];
};

export interface UseFormReturn<T> {
  values: T & Record<string, any>;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isSubmitting: Ref<boolean>;
  isValid: ComputedRef<boolean>;
  isDirty: ComputedRef<boolean>;
  setFieldValue: (field: keyof T, value: any) => void;
  setFieldTouched: (field: keyof T, touched?: boolean) => void;
  setFieldError: (field: keyof T, error: string | null) => void;
  validateField: (field: keyof T) => boolean;
  validate: () => boolean;
  handleSubmit: (onSubmit: (values: T) => Promise<void> | void) => Promise<void>;
  reset: (newValues?: Partial<T>) => void;
}

/**
 * Composable for form state management and validation
 */
export function useForm<T extends Record<string, any>>(
  initialValues: T,
  validationSchema?: ValidationSchema<T>
): UseFormReturn<T> {
  const values = reactive<T>({ ...initialValues });
  const errors = reactive<Partial<Record<keyof T, string>>>({});
  const touched = reactive<Partial<Record<keyof T, boolean>>>({});
  const isSubmitting = ref(false);
  const initialValuesRef = { ...initialValues };

  /**
   * Check if form is valid (no errors)
   */
  const isValid = computed(() => {
    return Object.keys(errors).length === 0;
  });

  /**
   * Check if form is dirty (values changed)
   */
  const isDirty = computed(() => {
    return Object.keys(values).some(
      key => values[key] !== initialValuesRef[key as keyof T]
    );
  });

  /**
   * Set field value
   */
  const setFieldValue = (field: keyof T, value: any): void => {
    (values as any)[field] = value;
    // Validate field if it's been touched
    if ((touched as any)[field]) {
      validateField(field);
    }
  };

  /**
   * Set field touched state
   */
  const setFieldTouched = (field: keyof T, isTouched: boolean = true): void => {
    (touched as any)[field] = isTouched;
    if (isTouched) {
      validateField(field);
    }
  };

  /**
   * Set field error
   */
  const setFieldError = (field: keyof T, error: string | null): void => {
    if (error) {
      (errors as any)[field] = error;
    } else {
      delete (errors as any)[field];
    }
  };

  /**
   * Validate a single field
   */
  const validateField = (field: keyof T): boolean => {
    if (!validationSchema || !validationSchema[field]) {
      return true;
    }

    const validators = validationSchema[field];
    const value = (values as any)[field];

    // Handle single validator
    if (typeof validators === 'function') {
      const result = validators(value);
      if (result !== true) {
        setFieldError(field, result);
        return false;
      }
      setFieldError(field, null);
      return true;
    }

    // Handle array of validators
    if (Array.isArray(validators)) {
      for (const validator of validators) {
        const result = validator(value);
        if (result !== true) {
          setFieldError(field, result);
          return false;
        }
      }
      setFieldError(field, null);
      return true;
    }

    return true;
  };

  /**
   * Validate all fields
   */
  const validate = (): boolean => {
    if (!validationSchema) {
      return true;
    }

    let isFormValid = true;

    // Validate all fields
    Object.keys(validationSchema).forEach(field => {
      const fieldValid = validateField(field as keyof T);
      if (!fieldValid) {
        isFormValid = false;
      }
    });

    return isFormValid;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (
    onSubmit: (values: T) => Promise<void> | void
  ): Promise<void> => {
    // Mark all fields as touched
    Object.keys(values).forEach(field => {
      (touched as any)[field as keyof T] = true;
    });

    // Validate form
    const isFormValid = validate();

    if (!isFormValid) {
      return;
    }

    // Submit form
    isSubmitting.value = true;
    try {
      await onSubmit(values as T);
    } finally {
      isSubmitting.value = false;
    }
  };

  /**
   * Reset form to initial values
   */
  const reset = (newValues?: Partial<T>): void => {
    const resetValues = newValues ? { ...initialValues, ...newValues } : initialValues;

    Object.keys(resetValues).forEach(key => {
      (values as any)[key as keyof T] = resetValues[key as keyof T];
    });

    Object.keys(errors).forEach(key => {
      delete (errors as any)[key as keyof T];
    });

    Object.keys(touched).forEach(key => {
      delete (touched as any)[key as keyof T];
    });

    isSubmitting.value = false;
  };

  return {
    values: values as T & Record<string, any>,
    errors: errors as Partial<Record<keyof T, string>>,
    touched: touched as Partial<Record<keyof T, boolean>>,
    isSubmitting,
    isValid,
    isDirty,
    setFieldValue,
    setFieldTouched,
    setFieldError,
    validateField,
    validate,
    handleSubmit,
    reset,
  };
}

