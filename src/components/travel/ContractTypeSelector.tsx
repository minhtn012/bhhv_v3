'use client';

interface Props {
  value: 'Individual' | 'Family';
  onChange: (type: 'Individual' | 'Family') => void;
  disabled?: boolean;
}

export default function ContractTypeSelector({ value, onChange, disabled }: Props) {
  const options: { value: 'Individual' | 'Family'; label: string }[] = [
    { value: 'Individual', label: 'Cá nhân' },
    { value: 'Family', label: 'Gia đình' },
  ];

  return (
    <div>
      <label className="block text-sm text-slate-400 mb-1.5">
        Loại hợp đồng <span className="text-orange-400">*</span>
      </label>
      <div className="flex gap-4">
        {options.map((option) => (
          <label
            key={option.value}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border cursor-pointer transition-all ${
              value === option.value
                ? 'bg-blue-600/20 border-blue-500 text-white'
                : 'bg-white/5 border-white/10 text-slate-300 hover:border-white/20'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <input
              type="radio"
              name="pocyType"
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              disabled={disabled}
              className="w-4 h-4 text-blue-600 bg-transparent border-white/30 focus:ring-blue-500 focus:ring-offset-0"
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
      {value === 'Family' && (
        <p className="text-xs text-blue-400 mt-2">
          Gói gia đình: Phí tính cho 2 người, không giới hạn số con dưới 18 tuổi
        </p>
      )}
    </div>
  );
}
