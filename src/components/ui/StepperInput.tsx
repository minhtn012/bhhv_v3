import React from 'react';

interface StepperInputProps {
  value: number | string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onStep: (adjustment: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  placeholder?: string;
  className?: string; // For the wrapper
  inputClassName?: string; // For the input itself
  buttonClassName?: string; // For the buttons
}

export default function StepperInput({
  value,
  onChange,
  onStep,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  placeholder,
  className = 'flex items-center border border-white/20 rounded-md bg-gray-800', // Default wrapper style
  inputClassName = 'w-16 text-right p-1 bg-transparent text-white font-semibold focus:outline-none', // Default input style
  buttonClassName = 'px-2 py-1 text-white font-bold disabled:opacity-50' // Default button style
}: StepperInputProps) {
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => onStep(-step)}
        disabled={disabled || (numericValue != null && numericValue <= min)}
        className={buttonClassName}
      >
        -
      </button>
      <input
        type="number"
        step={step}
        min={min}
        max={max}
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        className={inputClassName}
      />
      <button
        type="button"
        onClick={() => onStep(step)}
        disabled={disabled || (numericValue != null && numericValue >= max)}
        className={buttonClassName}
      >
        +
      </button>
    </div>
  );
}