'use client';

import { useState } from 'react';

// Inline SVG icons to avoid @heroicons/react dependency
const ChevronDownIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const ChevronUpIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
  </svg>
);

interface StepWrapperProps {
  stepNumber: number;
  title: string;
  currentStep: number;
  isCompleted: boolean;
  isCollapsible?: boolean;
  children: React.ReactNode;
  summary?: React.ReactNode;
}

export default function StepWrapper({
  stepNumber,
  title,
  currentStep,
  isCompleted,
  isCollapsible = true,
  children,
  summary
}: StepWrapperProps) {
  const [isExpanded, setIsExpanded] = useState(stepNumber === currentStep);

  const getStepStatus = () => {
    if (stepNumber < currentStep) return 'completed';
    if (stepNumber === currentStep) return 'current';
    return 'upcoming';
  };

  const getStepIcon = () => {
    const status = getStepStatus();
    switch (status) {
      case 'completed':
        return (
          <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case 'current':
        return (
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center animate-pulse">
            <div className="w-3 h-3 rounded-full bg-white"></div>
          </div>
        );
      case 'upcoming':
        return (
          <div className="w-8 h-8 rounded-full border-2 border-gray-400 flex items-center justify-center">
            <span className="text-gray-400 text-sm font-semibold">{stepNumber}</span>
          </div>
        );
    }
  };

  const getStepStyles = () => {
    const status = getStepStatus();
    switch (status) {
      case 'completed':
        return isExpanded 
          ? 'bg-slate-800/90 border border-green-500/40'
          : 'bg-slate-800/60 border border-green-500/20 opacity-90';
      case 'current':
        return 'bg-slate-800/90 border border-blue-500/40';
      case 'upcoming':
        return 'bg-slate-800/40 border border-slate-600/30 opacity-70';
    }
  };

  const handleToggle = () => {
    if (isCollapsible && (isCompleted || stepNumber < currentStep)) {
      setIsExpanded(!isExpanded);
    }
  };

  const status = getStepStatus();
  const canExpand = isCollapsible && (isCompleted || stepNumber < currentStep || stepNumber === currentStep);

  return (
    <div className={`rounded-2xl p-6 lg:p-5 transition-all duration-200 ${getStepStyles()}`}>
      {/* Step Header */}
      <div className="flex items-center justify-between mb-6 lg:mb-4">
        <div className="flex items-center gap-4">
          {getStepIcon()}
          <div>
            <h2 className={`text-xl lg:text-lg font-semibold ${
              status === 'upcoming' ? 'text-slate-400' : 'text-white'
            }`}>
              {title}
            </h2>
            {status === 'completed' && (
              <p className="text-sm text-green-400 mt-1">Đã hoàn thành</p>
            )}
            {status === 'current' && (
              <p className="text-sm text-blue-400 mt-1">Đang thực hiện</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Expand/Collapse Button */}
          {canExpand && (
            <button
              onClick={handleToggle}
              className="p-3 hover:bg-slate-700 rounded-xl transition-all duration-200 min-h-[48px] min-w-[48px] flex items-center justify-center"
            >
              {isExpanded ? (
                <ChevronUpIcon className="w-6 h-6 text-white" />
              ) : (
                <ChevronDownIcon className="w-6 h-6 text-white" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Step Content */}
      <div className={`transition-all duration-300 ${
        isExpanded ? 'block' : 'hidden'
      }`}>
        {children}
      </div>

      {/* Step Summary (when collapsed) */}
      {!isExpanded && summary && (
        <div className="mt-4 p-4 bg-slate-700/30 rounded-xl border border-slate-600/20">
          {summary}
        </div>
      )}
    </div>
  );
}