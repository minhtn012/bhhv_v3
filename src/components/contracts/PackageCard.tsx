import { formatCurrency } from '@/utils/insurance-calculator';

interface PackageOption {
  index: number;
  name: string;
  details: string;
  rate: number;
  fee: number;
  available: boolean;
}

interface PackageCardProps {
  package: PackageOption;
  isSelected: boolean;
  onSelect: () => void;
}

export default function PackageCard({ 
  package: pkg, 
  isSelected, 
  onSelect
}: PackageCardProps) {

  return (
    <div 
      className={`p-4 border rounded-xl cursor-pointer transition-all ${
        isSelected 
          ? 'border-blue-400 bg-blue-500/10' 
          : pkg.available 
            ? 'border-white/20 hover:border-blue-400/50 hover:bg-blue-500/5' 
            : 'border-gray-600 opacity-50 cursor-not-allowed'
      }`}
      onClick={() => pkg.available && onSelect()}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center">
          <input 
            type="radio" 
            name="package"
            checked={isSelected}
            onChange={onSelect}
            disabled={!pkg.available}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 pointer-events-none"
          />
          <div className="ml-3">
            <label className="font-semibold text-white cursor-pointer">{pkg.name}</label>
            <p className="text-xs text-gray-400">{pkg.details}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-300">
            {pkg.rate.toFixed(2)}%
          </div>
          <div className="font-bold text-blue-400">
            {pkg.available ? formatCurrency(pkg.fee) : 'N/A'}
          </div>
        </div>
      </div>
    </div>
  );
}