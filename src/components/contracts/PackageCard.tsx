import { formatCurrency, isElectricOrHybridEngine, parseCurrency, calculateTotalVehicleValue } from '@/utils/insurance-calculator';

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
  loaiDongCo?: string; // Add vehicle engine type to detect electric/hybrid
  giaTriXe?: string; // Vehicle value for fee calculation
  giaTriPin?: string; // Battery value for electric/hybrid vehicles
  loaiHinhKinhDoanh?: string; // Business type for fee calculation
}

export default function PackageCard({ 
  package: pkg, 
  isSelected, 
  onSelect,
  loaiDongCo,
  giaTriXe,
  giaTriPin,
  loaiHinhKinhDoanh
}: PackageCardProps) {
  // Calculate dynamic fee using same logic as PriceSummaryCard
  const calculateDynamicFee = (): number => {
    if (!giaTriXe) {
      return pkg.fee; // Fallback to static fee
    }

    const giaTriXeValue = parseCurrency(giaTriXe);
    if (giaTriXeValue <= 0) {
      return pkg.fee;
    }

    // Calculate effective rate (add 0.10% for electric/hybrid)
    const effectiveRate = isElectricOrHybridEngine(loaiDongCo) && giaTriPin && parseCurrency(giaTriPin) > 0 
      ? pkg.rate + 0.10
      : pkg.rate;

    // Use same formula as PriceSummaryCard: (xe + pin) * rate%
    const totalVehicleValue = calculateTotalVehicleValue(
      giaTriXeValue,
      giaTriPin,
      loaiDongCo
    );
    
    return (totalVehicleValue * effectiveRate) / 100;
  };

  const displayFee = calculateDynamicFee();

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
            <span>{pkg.rate.toFixed(2)}%</span>
            {isElectricOrHybridEngine(loaiDongCo) && (
              <span className="text-sm text-amber-400 font-medium ml-1">+0.10%</span>
            )}
          </div>
          <div className="font-bold text-blue-400">
            {pkg.available ? formatCurrency(displayFee) : 'N/A'}
          </div>
        </div>
      </div>
    </div>
  );
}