import { formatCurrency } from '@/utils/insurance-calculator';
import EditablePackageCard from './EditablePackageCard';

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
  editable?: boolean;
  giaTriXe?: number;
  loaiHinhKinhDoanh?: string;
  onRateChange?: (index: number, newRate: number, newFee: number) => void;
}

export default function PackageCard({ 
  package: pkg, 
  isSelected, 
  onSelect,
  editable = false,
  giaTriXe = 0,
  loaiHinhKinhDoanh = '',
  onRateChange
}: PackageCardProps) {
  // Use EditablePackageCard when in editable mode
  if (editable && giaTriXe > 0 && loaiHinhKinhDoanh && onRateChange) {
    return (
      <EditablePackageCard
        package={{
          ...pkg,
          originalRate: pkg.rate,
          currentRate: pkg.rate
        }}
        isSelected={isSelected}
        giaTriXe={giaTriXe}
        loaiHinhKinhDoanh={loaiHinhKinhDoanh}
        onSelect={onSelect}
        onRateChange={onRateChange}
      />
    );
  }

  // Regular PackageCard for backward compatibility
  return (
    <div 
      className={`p-4 border rounded-xl ${
        pkg.available 
          ? 'border-white/20 hover:border-blue-400/50' 
          : 'border-gray-600 opacity-50'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center">
          <input 
            type="radio" 
            name="package"
            checked={isSelected}
            onChange={onSelect}
            disabled={!pkg.available}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
          />
          <div className="ml-3">
            <label className="font-semibold text-white">{pkg.name}</label>
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