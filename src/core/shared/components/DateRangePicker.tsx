'use client';

/**
 * DateRangePicker - Insurance validity date range selector
 * Supports start date and end date with duration calculation
 */

import { useCallback, useMemo } from 'react';
import { calculateInsuranceDays } from '@/utils/dateFormatter';

export interface DateRangeValue {
  startDate: string;
  endDate: string;
}

interface DateRangePickerProps {
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
  errors?: {
    startDate?: string;
    endDate?: string;
  };
  disabled?: boolean;
  labels?: {
    startDate?: string;
    endDate?: string;
    duration?: string;
  };
  minStartDate?: string;
  maxDurationDays?: number;
  defaultDurationDays?: number;
  showDuration?: boolean;
  className?: string;
}

/**
 * Format date string to DD/MM/YYYY
 */
function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

/**
 * Calculate days between two dates (uses shared utility)
 */
function calculateDaysDifference(startDate: string, endDate: string): number {
  return calculateInsuranceDays(startDate, endDate);
}

/**
 * Add days to a date string
 */
function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

export default function DateRangePicker({
  value,
  onChange,
  errors = {},
  disabled = false,
  labels = {},
  minStartDate,
  maxDurationDays = 365,
  defaultDurationDays = 365,
  showDuration = true,
  className = '',
}: DateRangePickerProps) {
  // Calculate duration in days
  const durationDays = useMemo(() => {
    return calculateDaysDifference(value.startDate, value.endDate);
  }, [value.startDate, value.endDate]);

  // Handle start date change
  const handleStartDateChange = useCallback(
    (newStartDate: string) => {
      // Calculate new end date based on default duration
      const newEndDate = addDays(newStartDate, defaultDurationDays);
      onChange({
        startDate: newStartDate,
        endDate: newEndDate,
      });
    },
    [defaultDurationDays, onChange]
  );

  // Handle end date change
  const handleEndDateChange = useCallback(
    (newEndDate: string) => {
      onChange({
        ...value,
        endDate: newEndDate,
      });
    },
    [value, onChange]
  );

  // Calculate min/max dates
  const minStart = minStartDate || new Date().toISOString().split('T')[0];
  const maxEnd = value.startDate ? addDays(value.startDate, maxDurationDays) : undefined;

  const startLabel = labels.startDate || 'Ngày bắt đầu';
  const endLabel = labels.endDate || 'Ngày kết thúc';
  const durationLabel = labels.duration || 'Thời hạn';

  const baseInputClass = `w-full bg-slate-700/50 border rounded-xl px-4 py-3 text-white min-h-[48px]`;

  return (
    <div className={`grid md:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
      {/* Start Date */}
      <div>
        <label className="block text-white font-medium mb-2">{startLabel}</label>
        <input
          type="date"
          value={value.startDate}
          onChange={(e) => handleStartDateChange(e.target.value)}
          min={minStart}
          className={`${baseInputClass} ${
            errors.startDate ? 'border-red-500' : 'border-slate-500/30'
          }`}
          disabled={disabled}
        />
        {value.startDate && (
          <p className="text-xs text-white/50 mt-1">
            {formatDateDisplay(value.startDate)}
          </p>
        )}
        {errors.startDate && (
          <p className="text-xs text-red-400 mt-1">{errors.startDate}</p>
        )}
      </div>

      {/* End Date */}
      <div>
        <label className="block text-white font-medium mb-2">{endLabel}</label>
        <input
          type="date"
          value={value.endDate}
          onChange={(e) => handleEndDateChange(e.target.value)}
          min={value.startDate || minStart}
          max={maxEnd}
          className={`${baseInputClass} ${
            errors.endDate ? 'border-red-500' : 'border-slate-500/30'
          }`}
          disabled={disabled || !value.startDate}
        />
        {value.endDate && (
          <p className="text-xs text-white/50 mt-1">
            {formatDateDisplay(value.endDate)}
          </p>
        )}
        {errors.endDate && (
          <p className="text-xs text-red-400 mt-1">{errors.endDate}</p>
        )}
      </div>

      {/* Duration Display */}
      {showDuration && (
        <div>
          <label className="block text-white font-medium mb-2">{durationLabel}</label>
          <div className="bg-slate-700/50 border border-slate-500/30 rounded-xl px-4 py-3 text-white min-h-[48px] flex items-center">
            {durationDays > 0 ? (
              <span>
                {durationDays} ngày
                {durationDays >= 365 && (
                  <span className="text-white/50 ml-2">
                    (~{Math.floor(durationDays / 365)} năm)
                  </span>
                )}
              </span>
            ) : (
              <span className="text-white/50">Chọn ngày để tính</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
