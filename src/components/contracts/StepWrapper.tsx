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
  onEdit?: () => void;
  children: React.ReactNode;
  summary?: React.ReactNode;
}

export default function StepWrapper({
  stepNumber,
  title,
  currentStep,
  isCompleted,
  isCollapsible = true,
  onEdit,
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
          ? 'bg-white/10 backdrop-blur-xl border border-green-500/30'
          : 'bg-white/5 backdrop-blur-sm border border-green-500/20 opacity-80';
      case 'current':
        return 'bg-white/10 backdrop-blur-xl border border-blue-500/30';
      case 'upcoming':
        return 'bg-white/5 backdrop-blur-sm border border-gray-500/20 opacity-60';
    }
  };

  const handleToggle = () => {
    if (isCollapsible && (isCompleted || stepNumber < currentStep)) {
      setIsExpanded(!isExpanded);
    }
  };

  const handleEdit = () => {
    if (onEdit && (isCompleted || stepNumber < currentStep)) {
      setIsExpanded(true);
      onEdit();
    }
  };

  const status = getStepStatus();
  const canExpand = isCollapsible && (isCompleted || stepNumber < currentStep || stepNumber === currentStep);
  const canEdit = onEdit && (isCompleted || stepNumber < currentStep);

  return (
    <div className={`rounded-2xl p-6 transition-all duration-300 ${getStepStyles()}`}>
      {/* Step Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          {getStepIcon()}
          <div>
            <h2 className={`text-xl font-semibold ${
              status === 'upcoming' ? 'text-gray-400' : 'text-white'
            }`}>
              {title}
            </h2>
            {status === 'completed' && (
              <p className="text-sm text-green-400">Đã hoàn thành</p>
            )}
            {status === 'current' && (
              <p className="text-sm text-blue-400">Đang thực hiện</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Edit Button */}
          {canEdit && (
            <button
              onClick={handleEdit}
              className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Chỉnh sửa
            </button>
          )}

          {/* Expand/Collapse Button */}
          {canExpand && (
            <button
              onClick={handleToggle}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              {isExpanded ? (
                <ChevronUpIcon className="w-5 h-5 text-white" />
              ) : (
                <ChevronDownIcon className="w-5 h-5 text-white" />
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
        <div className="mt-4 p-3 bg-white/5 rounded-lg">
          {summary}
        </div>
      )}
    </div>
  );
}