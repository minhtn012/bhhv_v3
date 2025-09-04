interface StepIndicatorProps {
  currentStep: number;
}

export default function StepIndicator({ currentStep }: StepIndicatorProps) {
  const steps = [
    { number: 1, label: 'Tải ảnh', shortLabel: 'Tải ảnh' },
    { number: 2, label: 'Xác nhận thông tin', shortLabel: 'Xác nhận' },
    { number: 3, label: 'Chọn gói & Tạo báo giá', shortLabel: 'Tạo báo giá' }
  ];

  const getStepStatus = (stepNumber: number) => {
    if (stepNumber < currentStep) return 'completed';
    if (stepNumber === currentStep) return 'current';
    return 'upcoming';
  };

  const getStepIcon = (step: { number: number }, status: string) => {
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
          <div className="w-8 h-8 rounded-full bg-gray-600 text-gray-300 flex items-center justify-center text-sm font-medium">
            {step.number}
          </div>
        );
    }
  };

  const getStepStyles = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-400';
      case 'current':
        return 'text-blue-400';
      case 'upcoming':
        return 'text-gray-400';
    }
  };

  return (
    <>
      {/* Desktop Steps */}
      <div className="hidden md:flex items-center gap-4">
        {steps.map((step, index) => {
          const status = getStepStatus(step.number);
          return (
            <div key={step.number} className="flex items-center">
              {getStepIcon(step, status)}
              <span className={`ml-2 text-sm font-medium ${getStepStyles(status)}`}>
                {step.label}
              </span>
              {index < steps.length - 1 && (
                <div className={`w-12 h-px mx-4 ${
                  step.number < currentStep ? 'bg-green-400' : 'bg-gray-600'
                }`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile Steps */}
      <div className="md:hidden flex items-center justify-between">
        {steps.map((step) => {
          const status = getStepStatus(step.number);
          return (
            <div key={step.number} className="flex flex-col items-center flex-1">
              <div className="mb-2">
                {getStepIcon(step, status)}
              </div>
              <span className={`text-xs text-center font-medium ${getStepStyles(status)}`}>
                {step.shortLabel}
              </span>
            </div>
          );
        })}
      </div>
    </>
  );
}