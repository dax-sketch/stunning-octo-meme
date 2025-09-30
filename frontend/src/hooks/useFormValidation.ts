import { useState, useCallback, useMemo } from 'react';

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  email?: boolean;
  phone?: boolean;
  url?: boolean;
  min?: number;
  max?: number;
  custom?: (value: any) => string | null;
}

export interface ValidationRules {
  [fieldName: string]: ValidationRule;
}

export interface ValidationErrors {
  [fieldName: string]: string;
}

export interface FormValidationResult<T extends Record<string, any> = any> {
  values: T;
  errors: ValidationErrors;
  touched: { [fieldName: string]: boolean };
  isValid: boolean;
  isSubmitting: boolean;
  setValue: (field: string, value: any) => void;
  setError: (field: string, error: string) => void;
  clearError: (field: string) => void;
  clearAllErrors: () => void;
  touchField: (field: string) => void;
  touchAllFields: () => void;
  validateField: (field: string) => string | null;
  validateForm: () => boolean;
  handleSubmit: (
    onSubmit: (values: T) => Promise<void> | void
  ) => (e?: React.FormEvent) => Promise<void>;
  reset: (newValues?: T) => void;
}

export function useFormValidation<T extends Record<string, any> = any>(
  initialValues: T = {} as T,
  validationRules: ValidationRules = {}
): FormValidationResult<T> {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<{ [fieldName: string]: boolean }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation functions
  const validateField = useCallback(
    (field: string): string | null => {
      const value = values[field];
      const rules = validationRules[field];

      if (!rules) return null;

      // Required validation
      if (
        rules.required &&
        (value === undefined || value === null || value === '')
      ) {
        return `${field} is required`;
      }

      // Skip other validations if field is empty and not required
      if (
        !rules.required &&
        (value === undefined || value === null || value === '')
      ) {
        return null;
      }

      // String validations
      if (typeof value === 'string') {
        // Min length validation
        if (rules.minLength && value.length < rules.minLength) {
          return `${field} must be at least ${rules.minLength} characters`;
        }

        // Max length validation
        if (rules.maxLength && value.length > rules.maxLength) {
          return `${field} must not exceed ${rules.maxLength} characters`;
        }

        // Email validation
        if (rules.email && !isValidEmail(value)) {
          return 'Please enter a valid email address';
        }

        // Phone validation
        if (rules.phone && !isValidPhone(value)) {
          return 'Please enter a valid phone number';
        }

        // URL validation
        if (rules.url && !isValidUrl(value)) {
          return 'Please enter a valid URL';
        }

        // Pattern validation
        if (rules.pattern && !rules.pattern.test(value)) {
          return `${field} format is invalid`;
        }
      }

      // Number validations
      if (typeof value === 'number') {
        // Min value validation
        if (rules.min !== undefined && value < rules.min) {
          return `${field} must be at least ${rules.min}`;
        }

        // Max value validation
        if (rules.max !== undefined && value > rules.max) {
          return `${field} must not exceed ${rules.max}`;
        }
      }

      // Custom validation
      if (rules.custom) {
        return rules.custom(value);
      }

      return null;
    },
    [values, validationRules]
  );

  const validateForm = useCallback((): boolean => {
    const newErrors: ValidationErrors = {};
    let isValid = true;

    Object.keys(validationRules).forEach((field) => {
      const error = validateField(field);
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [validateField, validationRules]);

  // Field manipulation functions
  const setValue = useCallback(
    (field: string, value: any) => {
      setValues((prev: T) => ({ ...prev, [field]: value }));

      // Clear error when value changes
      if (errors[field]) {
        setErrors((prev: ValidationErrors) => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }
    },
    [errors]
  );

  const setError = useCallback((field: string, error: string) => {
    setErrors((prev: ValidationErrors) => ({ ...prev, [field]: error }));
  }, []);

  const clearError = useCallback((field: string) => {
    setErrors((prev: ValidationErrors) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors({});
  }, []);

  const touchField = useCallback(
    (field: string) => {
      setTouched((prev: { [fieldName: string]: boolean }) => ({
        ...prev,
        [field]: true,
      }));

      // Validate field when touched
      const error = validateField(field);
      if (error) {
        setError(field, error);
      }
    },
    [validateField, setError]
  );

  const touchAllFields = useCallback(() => {
    const allFields = Object.keys(validationRules);
    const newTouched: { [fieldName: string]: boolean } = {};

    allFields.forEach((field) => {
      newTouched[field] = true;
    });

    setTouched(newTouched);
    validateForm();
  }, [validationRules, validateForm]);

  const handleSubmit = useCallback(
    (onSubmit: (values: T) => Promise<void> | void) => {
      return async (e?: React.FormEvent) => {
        if (e) {
          e.preventDefault();
        }

        setIsSubmitting(true);
        touchAllFields();

        try {
          if (validateForm()) {
            await onSubmit(values);
          }
        } catch (error) {
          console.error('Form submission error:', error);
        } finally {
          setIsSubmitting(false);
        }
      };
    },
    [values, validateForm, touchAllFields]
  );

  const reset = useCallback(
    (newValues?: T) => {
      setValues(newValues || initialValues);
      setErrors({});
      setTouched({});
      setIsSubmitting(false);
    },
    [initialValues]
  );

  // Computed properties
  const isValid = useMemo(() => {
    return Object.keys(errors).length === 0;
  }, [errors]);

  return {
    values,
    errors,
    touched,
    isValid,
    isSubmitting,
    setValue,
    setError,
    clearError,
    clearAllErrors,
    touchField,
    touchAllFields,
    validateField,
    validateForm,
    handleSubmit,
    reset,
  };
}

// Utility validation functions
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidPhone(phone: string): boolean {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phone.replace(/[\s-()]/g, ''));
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Common validation rule presets
export const commonValidationRules = {
  email: {
    required: true,
    email: true,
  },
  password: {
    required: true,
    minLength: 8,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
  },
  phone: {
    required: true,
    phone: true,
  },
  username: {
    required: true,
    minLength: 3,
    maxLength: 30,
    pattern: /^[a-zA-Z0-9_]+$/,
  },
  companyName: {
    required: true,
    minLength: 1,
    maxLength: 255,
  },
  website: {
    url: true,
  },
  adSpend: {
    min: 0,
  },
};
