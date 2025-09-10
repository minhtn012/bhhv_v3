import { tndsCategories, type CalculationResult, type EnhancedCalculationResult, parseCurrency } from '@/utils/insurance-calculator';
import PackageCard from './PackageCard';
import DynamicTNDSSelector from './DynamicTNDSSelector';
import PriceSummaryCard from './PriceSummaryCard';

interface PackageOption {
  index: number;
  name: string;
  details: string;
  rate: number;
  fee: number;
  available: boolean;
}

interface FormData {
  giaTriXe: string;
  soChoNgoi: number | '';
  trongTai: number | '';
  loaiHinhKinhDoanh: string;
  loaiDongCo: string;
  giaTriPin: string;
  selectedPackageIndex: number;
  includeTNDS: boolean;
  tndsCategory: string;
  includeNNTX: boolean;
  selectedNNTXPackage: string;
  tinhTrang: string;
  mucKhauTru: number;
  taiTucPercentage: number;
}

interface PackageSelectionStepProps {
  availablePackages: PackageOption[];
  calculationResult: CalculationResult;
  enhancedResult?: EnhancedCalculationResult;
  formData: FormData;
  totalAmount: number;
  nntxFee: number;
  loading: boolean;
  onFormInputChange: (field: keyof FormData, value: any) => void;
  onPackageSelect: (packageIndex: number) => void;
  onSubmit: () => void;
  onRateChange?: (index: number, newRate: number, newFee: number) => void;
  onRecalculate?: () => void;
  onNNTXFeeChange: (fee: number) => void;
  submitButtonText?: string;
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
  onRateChange,
  onRecalculate,
  onNNTXFeeChange,
  submitButtonText = "Tạo báo giá"
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
                  editable={true}
                  giaTriXe={parseCurrency(formData.giaTriXe)}
                  loaiHinhKinhDoanh={formData.loaiHinhKinhDoanh}
                  onRateChange={onRateChange}
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
              // Calculate adjustment based on vehicle value
              const vehicleValue = parseCurrency(formData.giaTriXe);
              return (vehicleValue * formData.taiTucPercentage) / 100;
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
          />
        </div>
      </div>
    </div>
  );
}