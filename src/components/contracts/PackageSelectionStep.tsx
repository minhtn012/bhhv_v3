import { tndsCategories, type CalculationResult, type EnhancedCalculationResult, parseCurrency, calculateTotalVehicleValue } from '@/utils/insurance-calculator';
import PackageCard from './PackageCard';
import DynamicTNDSSelector from './DynamicTNDSSelector';
import PriceSummaryCard from './PriceSummaryCard';
import { PackageSelectionFormData } from '@/types/contract';

interface PackageOption {
  index: number;
  name: string;
  details: string;
  rate: number;
  fee: number;
  available: boolean;
}

// Extended form data for component-specific fields
interface ExtendedPackageFormData extends PackageSelectionFormData {
  selectedNNTXPackage: string;
  tinhTrang: string;
  phiTaiTucInfo?: {
    soVu: number;
    phanTramChiPhi: number;
  };
}

interface PackageSelectionStepProps {
  availablePackages: PackageOption[];
  calculationResult: CalculationResult;
  enhancedResult?: EnhancedCalculationResult;
  formData: ExtendedPackageFormData;
  totalAmount: number;
  nntxFee: number;
  loading: boolean;
  onFormInputChange: (field: keyof ExtendedPackageFormData, value: string | number | boolean) => void;
  onPackageSelect: (packageIndex: number) => void;
  onSubmit: () => void;
  onRecalculate?: () => void;
  onNNTXFeeChange: (fee: number) => void;
  onCustomRateChange?: (customRate: number | null, isModified: boolean) => void;
  submitButtonText?: string;
  initialCustomRate?: number | null;
}

export default function PackageSelectionStep({
  availablePackages,
  calculationResult,
  enhancedResult,
  formData,
  totalAmount,
  nntxFee,
  loading,
  onFormInputChange,
  onPackageSelect,
  onSubmit,
  onRecalculate,
  onNNTXFeeChange,
  onCustomRateChange,
  submitButtonText = "Tạo báo giá",
  initialCustomRate = null
}: PackageSelectionStepProps) {
  return (
    <div>
      
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Package Options */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">A. Bảo hiểm Vật chất Thân vỏ (Chọn 1 gói)</h3>
            <div className="space-y-3">
              {availablePackages.map((pkg) => (
                <PackageCard
                  key={pkg.index}
                  package={pkg}
                  isSelected={formData.selectedPackageIndex === pkg.index}
                  onSelect={() => pkg.available && onPackageSelect(pkg.index)}
                  loaiDongCo={formData.loaiDongCo}
                  giaTriXe={formData.giaTriXe}
                  giaTriPin={formData.giaTriPin}
                  loaiHinhKinhDoanh={formData.loaiHinhKinhDoanh}
                />
              ))}
            </div>
          </div>

          <DynamicTNDSSelector
            loaiHinhKinhDoanh={formData.loaiHinhKinhDoanh}
            soChoNgoi={Number(formData.soChoNgoi) || 0}
            trongTai={Number(formData.trongTai) || 0}
            includeTNDS={formData.includeTNDS}
            tndsCategory={formData.tndsCategory}
            includeNNTX={formData.includeNNTX}
            selectedNNTXPackage={formData.selectedNNTXPackage}
            tinhTrang={formData.tinhTrang}
            mucKhauTru={formData.mucKhauTru}
            taiTucPercentage={formData.taiTucPercentage}
            adjustmentAmount={(() => {
              // Calculate adjustment based on total vehicle value (including battery for electric/hybrid)
              const totalVehicleValue = calculateTotalVehicleValue(
                parseCurrency(formData.giaTriXe),
                formData.giaTriPin,
                formData.loaiDongCo
              );
              return (totalVehicleValue * formData.taiTucPercentage) / 100;
            })()}
            onTNDSChange={(includeTNDS, tndsCategory) => {
              onFormInputChange('includeTNDS', includeTNDS);
              onFormInputChange('tndsCategory', tndsCategory);
            }}
            onNNTXChange={(includeNNTX, packageValue) => {
              onFormInputChange('includeNNTX', includeNNTX);
              if (packageValue !== undefined) {
                onFormInputChange('selectedNNTXPackage', packageValue);
              }
            }}
            onNNTXFeeChange={onNNTXFeeChange}
            onTinhTrangChange={(tinhTrang) => onFormInputChange('tinhTrang', tinhTrang)}
            onSoChoNgoiChange={(soChoNgoi) => onFormInputChange('soChoNgoi', soChoNgoi)}
            onMucKhauTruChange={(mucKhauTru) => onFormInputChange('mucKhauTru', mucKhauTru)}
            onTaiTucPercentageChange={(percentage) => onFormInputChange('taiTucPercentage', percentage)}
            phiTaiTucInfo={formData.phiTaiTucInfo}
            onPhiTaiTucInfoChange={(info) => onFormInputChange('phiTaiTucInfo', info)}
            onRecalculate={onRecalculate}
          />
        </div>

        {/* Right: Summary */}
        <div>
          <PriceSummaryCard
            enhancedResult={enhancedResult}
            formData={formData}
            totalAmount={totalAmount}
            nntxFee={nntxFee}
            loading={loading}
            onSubmit={onSubmit}
            submitButtonText={submitButtonText}
            availablePackages={availablePackages}
            onCustomRateChange={onCustomRateChange}
            initialCustomRate={initialCustomRate}
          />
        </div>
      </div>
    </div>
  );
}