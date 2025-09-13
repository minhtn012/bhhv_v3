'use client';

import { ReactNode } from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  icon: ReactNode;
  iconColor: string;
  subtitle?: string;
  isLoading?: boolean;
  onClick?: () => void;
}

export default function StatsCard({
  title,
  value,
  change,
  changeType = 'neutral',
  icon,
  iconColor,
  subtitle,
  isLoading = false,
  onClick
}: StatsCardProps) {
  const formatValue = (val: string | number) => {
    if (typeof val === 'number') {
      if (val >= 1000000000) {
        return `${(val / 1000000000).toFixed(1)}B`;
      }
      if (val >= 1000000) {
        return `${(val / 1000000).toFixed(1)}M`;
      }
      if (val >= 1000) {
        return `${(val / 1000).toFixed(1)}K`;
      }
      return val.toLocaleString();
    }
    return val;
  };

  const getChangeColor = () => {
    switch (changeType) {
      case 'increase':
        return 'text-green-400';
      case 'decrease':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getChangeIcon = () => {
    switch (changeType) {
      case 'increase':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7h-10" />
          </svg>
        );
      case 'decrease':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 7l-9.2 9.2M7 7v10h10" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
        <div className="animate-pulse">
          <div className="flex items-center gap-4 mb-4">
            <div className={`w-12 h-12 ${iconColor} rounded-xl flex-shrink-0 bg-gray-600`}></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-600 rounded w-24 mb-2"></div>
              <div className="h-3 bg-gray-700 rounded w-16"></div>
            </div>
          </div>
          <div className="h-8 bg-gray-600 rounded w-20 mb-2"></div>
          <div className="h-3 bg-gray-700 rounded w-16"></div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 transition-all duration-300 hover:bg-white/15 hover:border-white/30 hover:scale-[1.02] hover:shadow-2xl ${
        onClick ? 'cursor-pointer' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-center gap-4 mb-4">
        <div className={`w-12 h-12 ${iconColor} rounded-xl flex items-center justify-center flex-shrink-0`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-semibold text-sm truncate">{title}</h3>
          {subtitle && (
            <p className="text-gray-300 text-xs mt-1 truncate">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-2xl font-bold text-white">
          {formatValue(value)}
        </div>

        {change !== undefined && (
          <div className={`flex items-center gap-1 text-sm ${getChangeColor()}`}>
            {getChangeIcon()}
            <span>
              {Math.abs(change)}% từ tháng trước
            </span>
          </div>
        )}
      </div>
    </div>
  );
}