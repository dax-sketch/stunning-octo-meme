import { renderHook, act } from '@testing-library/react';
import {
  useFormValidation,
  ValidationRules,
  commonValidationRules,
} from '../useFormValidation';

describe('useFormValidation', () => {
  const initialValues = {
    username: '',
    email: '',
    password: '',
    phoneNumber: '',
  };

  const validationRules: ValidationRules = {
    username: commonValidationRules.username,
    email: commonValidationRules.email,
    password: commonValidationRules.password,
    phoneNumber: commonValidationRules.phone,
  };

  it('should initialize with correct default values', () => {
    const { result } = renderHook(() =>
      useFormValidation(initialValues, validationRules)
    );

    expect(result.current.values).toEqual(initialValues);
    expect(result.current.errors).toEqual({});
    expect(result.current.touched).toEqual({});
    expect(result.current.isValid).toBe(true);
    expect(result.current.isSubmitting).toBe(false);
  });

  it('should update values correctly', () => {
    const { result } = renderHook(() =>
      useFormValidation(initialValues, validationRules)
    );

    act(() => {
      result.current.setValue('username', 'testuser');
    });

    expect(result.current.values.username).toBe('testuser');
  });

  it('should validate required fields', () => {
    const { result } = renderHook(() =>
      useFormValidation(initialValues, validationRules)
    );

    act(() => {
      result.current.touchField('username');
    });

    expect(result.current.errors.username).toBe('username is required');
    expect(result.current.touched.username).toBe(true);
    expect(result.current.isValid).toBe(false);
  });

  it('should validate email format', () => {
    const { result } = renderHook(() =>
      useFormValidation(initialValues, validationRules)
    );

    act(() => {
      result.current.setValue('email', 'invalid-email');
      result.current.touchField('email');
    });

    expect(result.current.errors.email).toBe(
      'Please enter a valid email address'
    );
  });

  it('should validate password strength', () => {
    const { result } = renderHook(() =>
      useFormValidation(initialValues, validationRules)
    );

    act(() => {
      result.current.setValue('password', 'weak');
      result.current.touchField('password');
    });

    expect(result.current.errors.password).toContain(
      'Password must be at least 8 characters long'
    );
  });

  it('should validate phone number format', () => {
    const { result } = renderHook(() =>
      useFormValidation(initialValues, validationRules)
    );

    act(() => {
      result.current.setValue('phoneNumber', 'invalid-phone');
      result.current.touchField('phoneNumber');
    });

    expect(result.current.errors.phoneNumber).toBe(
      'Please provide a valid phone number'
    );
  });

  it('should clear errors when valid values are set', () => {
    const { result } = renderHook(() =>
      useFormValidation(initialValues, validationRules)
    );

    // First set invalid value
    act(() => {
      result.current.setValue('email', 'invalid');
      result.current.touchField('email');
    });

    expect(result.current.errors.email).toBeDefined();

    // Then set valid value
    act(() => {
      result.current.setValue('email', 'valid@example.com');
    });

    expect(result.current.errors.email).toBeUndefined();
  });

  it('should validate entire form', () => {
    const { result } = renderHook(() =>
      useFormValidation(initialValues, validationRules)
    );

    act(() => {
      const isValid = result.current.validateForm();
      expect(isValid).toBe(false);
    });

    expect(Object.keys(result.current.errors).length).toBeGreaterThan(0);
  });

  it('should handle form submission', async () => {
    const mockSubmit = jest.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useFormValidation(initialValues, validationRules)
    );

    // Set valid values
    act(() => {
      result.current.setValue('username', 'testuser');
      result.current.setValue('email', 'test@example.com');
      result.current.setValue('password', 'TestPass123!');
      result.current.setValue('phoneNumber', '+1234567890');
    });

    await act(async () => {
      await result.current.handleSubmit(mockSubmit)();
    });

    expect(mockSubmit).toHaveBeenCalledWith({
      username: 'testuser',
      email: 'test@example.com',
      password: 'TestPass123!',
      phoneNumber: '+1234567890',
    });
  });

  it('should not submit form with validation errors', async () => {
    const mockSubmit = jest.fn();
    const { result } = renderHook(() =>
      useFormValidation(initialValues, validationRules)
    );

    await act(async () => {
      await result.current.handleSubmit(mockSubmit)();
    });

    expect(mockSubmit).not.toHaveBeenCalled();
    expect(Object.keys(result.current.errors).length).toBeGreaterThan(0);
  });

  it('should reset form correctly', () => {
    const { result } = renderHook(() =>
      useFormValidation(initialValues, validationRules)
    );

    // Make changes
    act(() => {
      result.current.setValue('username', 'testuser');
      result.current.setError('email', 'Test error');
      result.current.touchField('username');
    });

    // Reset
    act(() => {
      result.current.reset();
    });

    expect(result.current.values).toEqual(initialValues);
    expect(result.current.errors).toEqual({});
    expect(result.current.touched).toEqual({});
    expect(result.current.isSubmitting).toBe(false);
  });

  it('should handle custom validation rules', () => {
    const customRules: ValidationRules = {
      customField: {
        custom: (value) => {
          if (value === 'forbidden') {
            return 'This value is not allowed';
          }
          return null;
        },
      },
    };

    const { result } = renderHook(() =>
      useFormValidation({ customField: '' }, customRules)
    );

    act(() => {
      result.current.setValue('customField', 'forbidden');
      result.current.touchField('customField');
    });

    expect(result.current.errors.customField).toBe('This value is not allowed');
  });

  it('should handle min/max length validation', () => {
    const rules: ValidationRules = {
      shortField: { minLength: 5 },
      longField: { maxLength: 10 },
    };

    const { result } = renderHook(() =>
      useFormValidation({ shortField: '', longField: '' }, rules)
    );

    act(() => {
      result.current.setValue('shortField', 'abc');
      result.current.setValue('longField', 'this is too long');
      result.current.touchField('shortField');
      result.current.touchField('longField');
    });

    expect(result.current.errors.shortField).toContain(
      'must be at least 5 characters'
    );
    expect(result.current.errors.longField).toContain(
      'must not exceed 10 characters'
    );
  });

  it('should handle number validation', () => {
    const rules: ValidationRules = {
      numberField: { min: 0, max: 100 },
    };

    const { result } = renderHook(() =>
      useFormValidation({ numberField: 0 }, rules)
    );

    act(() => {
      result.current.setValue('numberField', -5);
      result.current.touchField('numberField');
    });

    expect(result.current.errors.numberField).toContain('must be at least 0');

    act(() => {
      result.current.setValue('numberField', 150);
    });

    expect(result.current.errors.numberField).toContain('must not exceed 100');
  });
});
