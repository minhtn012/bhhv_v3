'use client';

import { useState, useRef, useEffect } from 'react';

interface DateRangeFilterProps {
  startDate: string;
  endDate: string;
  onFilterChange: (filter: { startDate: string; endDate: string }) => void;
  className?: string;
}

type PresetOption = 'all' | 'this_month' | 'last_month' | 'custom';

/**
 * Date range filter component with preset options
 * Presets: All, This Month, Last Month, Custom
 * Style matches existing filter dropdowns
 */
export default function DateRangeFilter({
  startDate,
  endDate,
  onFilterChange,
  className = ''
}: DateRangeFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [preset, setPreset] = useState<PresetOption>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Detect preset from startDate/endDate on mount
  useEffect(() => {
    if (!startDate && !endDate) {
      setPreset('all');
    } else {
      // Check if matches this month
      const now = new Date();
      const thisMonthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const thisMonthEnd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${lastDay}`;

      if (startDate === thisMonthStart && endDate === thisMonthEnd) {
        setPreset('this_month');
      } else {
        // Check last month
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthStart = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}-01`;
        const lastMonthLastDay = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0).getDate();
        const lastMonthEnd = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}-${lastMonthLastDay}`;

        if (startDate === lastMonthStart && endDate === lastMonthEnd) {
          setPreset('last_month');
        } else {
          setPreset('custom');
        }
      }
    }
  }, [startDate, endDate]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePresetChange = (newPreset: PresetOption) => {
    setPreset(newPreset);
    const now = new Date();

    if (newPreset === 'all') {
      onFilterChange({ startDate: '', endDate: '' });
      setIsOpen(false);
    } else if (newPreset === 'this_month') {
      const start = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const end = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${lastDay}`;
      onFilterChange({ startDate: start, endDate: end });
      setIsOpen(false);
    } else if (newPreset === 'last_month') {
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const start = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}-01`;
      const lastDay = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0).getDate();
      const end = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}-${lastDay}`;
      onFilterChange({ startDate: start, endDate: end });
      setIsOpen(false);
    }
    // For 'custom', keep dropdown open to show date inputs
  };

  const getDisplayText = () => {
    if (preset === 'all' || (!startDate && !endDate)) return 'Thời gian';
    if (preset === 'this_month') return 'Tháng này';
    if (preset === 'last_month') return 'Tháng trước';
    if (startDate && endDate) {
      // Format: DD/MM - DD/MM
      const formatDate = (d: string) => {
        const [y, m, day] = d.split('-');
        return `${day}/${m}`;
      };
      return `${formatDate(startDate)} - ${formatDate(endDate)}`;
    }
    return 'Tùy chỉnh';
  };

  const hasFilter = startDate || endDate;

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-gray-800/50 border border-white/10 rounded-xl px-4 py-2 text-white hover:border-blue-500/50 transition-colors flex items-center gap-2 min-w-[140px]"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="truncate max-w-[120px]">{getDisplayText()}</span>
        {hasFilter && (
          <span className="ml-auto bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full">1</span>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-gray-800 border border-white/10 rounded-xl shadow-xl z-50 min-w-[280px]">
          <div className="p-2 space-y-1">
            {/* Preset Options */}
            <label className="flex items-center gap-2 px-3 py-2 hover:bg-white/5 rounded-lg cursor-pointer transition-colors">
              <input
                type="radio"
                name="date-preset"
                checked={preset === 'all'}
                onChange={() => handlePresetChange('all')}
                className="w-4 h-4 text-blue-500 bg-white/5 border-white/30 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-300">Tất cả</span>
            </label>

            <label className="flex items-center gap-2 px-3 py-2 hover:bg-white/5 rounded-lg cursor-pointer transition-colors">
              <input
                type="radio"
                name="date-preset"
                checked={preset === 'this_month'}
                onChange={() => handlePresetChange('this_month')}
                className="w-4 h-4 text-blue-500 bg-white/5 border-white/30 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-300">Tháng này</span>
            </label>

            <label className="flex items-center gap-2 px-3 py-2 hover:bg-white/5 rounded-lg cursor-pointer transition-colors">
              <input
                type="radio"
                name="date-preset"
                checked={preset === 'last_month'}
                onChange={() => handlePresetChange('last_month')}
                className="w-4 h-4 text-blue-500 bg-white/5 border-white/30 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-300">Tháng trước</span>
            </label>

            <label className="flex items-center gap-2 px-3 py-2 hover:bg-white/5 rounded-lg cursor-pointer transition-colors">
              <input
                type="radio"
                name="date-preset"
                checked={preset === 'custom'}
                onChange={() => setPreset('custom')}
                className="w-4 h-4 text-blue-500 bg-white/5 border-white/30 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-300">Tùy chỉnh</span>
            </label>

            {/* Custom Date Inputs */}
            {preset === 'custom' && (
              <div className="pt-2 mt-2 border-t border-white/10 space-y-3 px-3 pb-2">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Từ ngày</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => onFilterChange({ startDate: e.target.value, endDate })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500/50"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Đến ngày</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => onFilterChange({ startDate, endDate: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500/50"
                  />
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded-lg transition-colors"
                >
                  Áp dụng
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
