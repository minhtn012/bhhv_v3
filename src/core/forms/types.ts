/**
 * Form Schema Types - Type definitions for dynamic form rendering
 * Re-exports from provider types for form-specific usage
 */

export type {
  FormSchema,
  FormSection,
  FieldDefinition,
  FieldType,
  SelectOption,
  Condition,
  FieldValidation,
  ValidationRule,
} from '../providers/types';

/**
 * Form field component props passed to field renderers
 */
export interface FieldComponentProps<T = unknown> {
  name: string;
  label: string;
  value: T;
  onChange: (value: T) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  props?: Record<string, unknown>;
}

/**
 * Form state interface for DynamicForm
 */
export interface FormState {
  values: Record<string, unknown>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  isValid: boolean;
}

/**
 * Form context for nested components
 */
export interface FormContextValue {
  values: Record<string, unknown>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  setValue: (name: string, value: unknown) => void;
  setError: (name: string, error: string) => void;
  setTouched: (name: string, touched: boolean) => void;
  validateField: (name: string) => Promise<string | undefined>;
}

/**
 * DynamicForm props interface
 */
export interface DynamicFormProps {
  schema: import('../providers/types').FormSchema;
  initialValues?: Record<string, unknown>;
  onSubmit: (values: Record<string, unknown>) => void | Promise<void>;
  onChange?: (values: Record<string, unknown>) => void;
  className?: string;
  disabled?: boolean;
  hideSubmitButton?: boolean;
  submitButtonText?: string;
}
