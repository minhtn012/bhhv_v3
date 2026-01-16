'use client';

export type TimeRange = 'week' | 'month';

interface TimeRangeSelectorProps {
  value: TimeRange;
  onChange: (value: TimeRange) => void;
  disabled?: boolean;
}

export default function TimeRangeSelector({ value, onChange, disabled }: TimeRangeSelectorProps) {
  const options: { value: TimeRange; label: string }[] = [
    { value: 'week', label: 'Tuần này' },
    { value: 'month', label: 'Tháng này' }
  ];

  return (
    <div className="inline-flex rounded-lg bg-white/[0.03] p-0.5 border border-white/5">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          disabled={disabled}
          className={`
            px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200
            ${value === option.value
              ? 'bg-white/10 text-white shadow-sm'
              : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
