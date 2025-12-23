'use client';

/**
 * DynamicForm - Renders forms from JSON schema
 * Supports conditional visibility, validation, and custom field types
 */

import React, { useState, useCallback, useMemo } from 'react';
import type { FormSchema, FormSection, FieldDefinition, Condition } from './types';
import { fieldRegistry } from './field-registry';

interface DynamicFormProps {
  schema: FormSchema;
  initialValues?: Record<string, unknown>;
  onSubmit: (values: Record<string, unknown>) => void | Promise<void>;
  onChange?: (values: Record<string, unknown>) => void;
  className?: string;
  disabled?: boolean;
  hideSubmitButton?: boolean;
  submitButtonText?: string;
}

/**
 * Evaluate a condition against current form values
 */
function evaluateCondition(condition: Condition, values: Record<string, unknown>): boolean {
  const fieldValue = values[condition.field];

  switch (condition.operator) {
    case 'equals':
      return fieldValue === condition.value;
    case 'not_equals':
      return fieldValue !== condition.value;
    case 'contains':
      return String(fieldValue).includes(String(condition.value));
    case 'in':
      return Array.isArray(condition.value) && condition.value.includes(fieldValue);
    case 'not_in':
      return Array.isArray(condition.value) && !condition.value.includes(fieldValue);
    case 'exists':
      return fieldValue !== undefined && fieldValue !== null && fieldValue !== '';
    default:
      return true;
  }
}

/**
 * Default field renderer for basic field types
 */
function DefaultField({
  name,
  label,
  value,
  onChange,
  error,
  required,
  disabled,
  placeholder,
  type,
  options,
}: {
  name: string;
  label: string;
  value: unknown;
  onChange: (value: unknown) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  type: string;
  options?: Array<{ value: string; label: string }>;
}) {
  const baseInputClass = `w-full bg-slate-700/50 border rounded-xl px-4 py-3 text-white min-h-[48px] ${
    error ? 'border-red-500' : 'border-slate-500/30'
  }`;

  switch (type) {
    case 'text':
    case 'number':
    case 'currency':
      return (
        <div>
          <label className="block text-white font-medium mb-2">
            {label} {required && '*'}
          </label>
          <input
            type={type === 'currency' ? 'text' : type}
            name={name}
            value={String(value ?? '')}
            onChange={(e) => onChange(e.target.value)}
            className={baseInputClass}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
          />
          {error && <p className="text-red-400 text-sm mt-1">{error}</p>}
        </div>
      );

    case 'textarea':
      return (
        <div>
          <label className="block text-white font-medium mb-2">
            {label} {required && '*'}
          </label>
          <textarea
            name={name}
            value={String(value ?? '')}
            onChange={(e) => onChange(e.target.value)}
            className={`${baseInputClass} h-24 resize-none`}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
          />
          {error && <p className="text-red-400 text-sm mt-1">{error}</p>}
        </div>
      );

    case 'select':
      return (
        <div>
          <label className="block text-white font-medium mb-2">
            {label} {required && '*'}
          </label>
          <select
            name={name}
            value={String(value ?? '')}
            onChange={(e) => onChange(e.target.value)}
            className={baseInputClass}
            disabled={disabled}
            required={required}
          >
            <option value="">{placeholder || 'Chọn...'}</option>
            {options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {error && <p className="text-red-400 text-sm mt-1">{error}</p>}
        </div>
      );

    case 'radio':
      return (
        <div>
          <label className="block text-white font-medium mb-2">
            {label} {required && '*'}
          </label>
          <div className="flex flex-wrap gap-4">
            {options?.map((opt) => (
              <label key={opt.value} className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name={name}
                  value={opt.value}
                  checked={value === opt.value}
                  onChange={(e) => onChange(e.target.value)}
                  className="w-4 h-4 text-blue-500 bg-slate-700/50 border-slate-500/30"
                  disabled={disabled}
                />
                <span className="ml-2 text-white">{opt.label}</span>
              </label>
            ))}
          </div>
          {error && <p className="text-red-400 text-sm mt-1">{error}</p>}
        </div>
      );

    case 'checkbox':
      return (
        <div>
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              name={name}
              checked={Boolean(value)}
              onChange={(e) => onChange(e.target.checked)}
              className="w-4 h-4 text-blue-500 bg-slate-700/50 border-slate-500/30 rounded"
              disabled={disabled}
            />
            <span className="ml-2 text-white">
              {label} {required && '*'}
            </span>
          </label>
          {error && <p className="text-red-400 text-sm mt-1">{error}</p>}
        </div>
      );

    case 'date':
      return (
        <div>
          <label className="block text-white font-medium mb-2">
            {label} {required && '*'}
          </label>
          <input
            type="date"
            name={name}
            value={String(value ?? '')}
            onChange={(e) => onChange(e.target.value)}
            className={baseInputClass}
            disabled={disabled}
            required={required}
          />
          {error && <p className="text-red-400 text-sm mt-1">{error}</p>}
        </div>
      );

    default:
      return (
        <div className="text-yellow-400">
          Unknown field type: {type}
        </div>
      );
  }
}

/**
 * Render a single field
 */
function FieldRenderer({
  field,
  value,
  onChange,
  error,
  disabled,
}: {
  field: FieldDefinition;
  value: unknown;
  onChange: (value: unknown) => void;
  error?: string;
  disabled?: boolean;
}) {
  // Check for custom component in registry
  const CustomComponent = fieldRegistry.get(field.type);

  if (CustomComponent) {
    return (
      <CustomComponent
        name={field.name}
        label={field.label}
        value={value}
        onChange={onChange}
        error={error}
        required={field.required}
        disabled={disabled}
        placeholder={field.placeholder}
        options={field.options}
        props={field.props}
      />
    );
  }

  // Use default field renderer
  return (
    <DefaultField
      name={field.name}
      label={field.label}
      value={value}
      onChange={onChange}
      error={error}
      required={field.required}
      disabled={disabled}
      placeholder={field.placeholder}
      type={field.type}
      options={field.options}
    />
  );
}

/**
 * Render a form section
 */
function SectionRenderer({
  section,
  values,
  errors,
  onChange,
  disabled,
}: {
  section: FormSection;
  values: Record<string, unknown>;
  errors: Record<string, string>;
  onChange: (name: string, value: unknown) => void;
  disabled?: boolean;
}) {
  // Check section visibility
  if (section.showWhen && !evaluateCondition(section.showWhen, values)) {
    return null;
  }

  // Filter visible fields
  const visibleFields = section.fields.filter(
    (field) => !field.showWhen || evaluateCondition(field.showWhen, values)
  );

  if (visibleFields.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold text-white mb-4">{section.title}</h3>
      {section.description && (
        <p className="text-white/60 mb-4">{section.description}</p>
      )}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleFields.map((field) => (
          <FieldRenderer
            key={field.name}
            field={field}
            value={values[field.name]}
            onChange={(value) => onChange(field.name, value)}
            error={errors[field.name]}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * DynamicForm Component
 */
export default function DynamicForm({
  schema,
  initialValues = {},
  onSubmit,
  onChange,
  className = '',
  disabled = false,
  hideSubmitButton = false,
  submitButtonText = 'Tiếp theo',
}: DynamicFormProps) {
  const [values, setValues] = useState<Record<string, unknown>>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get all field names from schema
  const fieldNames = useMemo(() => {
    const names: string[] = [];
    schema.sections.forEach((section) => {
      section.fields.forEach((field) => {
        names.push(field.name);
      });
    });
    return names;
  }, [schema]);

  // Handle field change
  const handleFieldChange = useCallback(
    (name: string, value: unknown) => {
      const newValues = { ...values, [name]: value };
      setValues(newValues);

      // Clear error on change
      if (errors[name]) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next[name];
          return next;
        });
      }

      // Notify parent
      onChange?.(newValues);
    },
    [values, errors, onChange]
  );

  // Validate form
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    schema.sections.forEach((section) => {
      // Check section visibility
      if (section.showWhen && !evaluateCondition(section.showWhen, values)) {
        return;
      }

      section.fields.forEach((field) => {
        // Check field visibility
        if (field.showWhen && !evaluateCondition(field.showWhen, values)) {
          return;
        }

        const value = values[field.name];

        // Required validation
        if (field.required && (value === undefined || value === null || value === '')) {
          newErrors[field.name] = `${field.label} là bắt buộc`;
          return;
        }

        // Field-specific validation
        if (field.validation && value) {
          const { min, max, minLength, maxLength, pattern, patternMessage } = field.validation;

          if (typeof value === 'number') {
            if (min !== undefined && value < min) {
              newErrors[field.name] = `Giá trị tối thiểu là ${min}`;
            }
            if (max !== undefined && value > max) {
              newErrors[field.name] = `Giá trị tối đa là ${max}`;
            }
          }

          if (typeof value === 'string') {
            if (minLength !== undefined && value.length < minLength) {
              newErrors[field.name] = `Độ dài tối thiểu là ${minLength} ký tự`;
            }
            if (maxLength !== undefined && value.length > maxLength) {
              newErrors[field.name] = `Độ dài tối đa là ${maxLength} ký tự`;
            }
            if (pattern && !new RegExp(pattern).test(value)) {
              newErrors[field.name] = patternMessage || 'Định dạng không hợp lệ';
            }
          }
        }
      });
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [schema, values]);

  // Handle form submission
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!validateForm()) {
        return;
      }

      setIsSubmitting(true);
      try {
        await onSubmit(values);
      } finally {
        setIsSubmitting(false);
      }
    },
    [validateForm, onSubmit, values]
  );

  return (
    <form onSubmit={handleSubmit} className={className}>
      {schema.sections.map((section) => (
        <SectionRenderer
          key={section.id}
          section={section}
          values={values}
          errors={errors}
          onChange={handleFieldChange}
          disabled={disabled || isSubmitting}
        />
      ))}

      {!hideSubmitButton && (
        <div className="flex justify-end mt-6">
          <button
            type="submit"
            disabled={disabled || isSubmitting}
            className="px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-medium min-h-[48px] flex items-center justify-center disabled:opacity-50"
          >
            {isSubmitting ? 'Đang xử lý...' : submitButtonText}
          </button>
        </div>
      )}
    </form>
  );
}
