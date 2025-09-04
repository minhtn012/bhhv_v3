interface StepIndicatorProps {
  currentStep: number;
}

export default function StepIndicator({ currentStep }: StepIndicatorProps) {
  const steps = [
    { number: 1, label: 'Tải ảnh' },
    { number: 2, label: 'Xác nhận thông tin' },
    { number: 3, label: 'Chọn gói & Tạo báo giá' }
  ];

  return (
    <>
      {/* Desktop Steps */}
      <div className="hidden md:flex items-center gap-4">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep >= step.number 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-600 text-gray-300'
            }`}>
              {step.number}
            </div>
            <span className={`ml-2 text-sm ${
              currentStep >= step.number ? 'text-white' : 'text-gray-400'
            }`}>
              {step.label}
            </span>
            {index < steps.length - 1 && <div className="w-12 h-px bg-gray-600 mx-4" />}
          </div>
        ))}
      </div>

      {/* Mobile Steps */}
      <div className="md:hidden flex items-center justify-between">
        {steps.map((step) => (
          <div key={step.number} className="flex flex-col items-center flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium mb-2 ${
              currentStep >= step.number 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-600 text-gray-300'
            }`}>
              {step.number}
            </div>
            <span className={`text-xs text-center ${
              currentStep >= step.number ? 'text-white' : 'text-gray-400'
            }`}>
              {step.number === 1 && 'Tải ảnh'}
              {step.number === 2 && 'Xác nhận'}
              {step.number === 3 && 'Tạo báo giá'}
            </span>
          </div>
        ))}
      </div>
    </>
  );
}