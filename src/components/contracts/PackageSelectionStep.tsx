import { tndsCategories, type CalculationResult, parseCurrency } from '@/utils/insurance-calculator';
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
  formData: FormData;
  totalAmount: number;
  loading: boolean;
  onFormInputChange: (field: keyof FormData, value: any) => void;
  onPackageSelect: (packageIndex: number) => void;
  onSubmit: () => void;
  onRateChange?: (index: number, newRate: number, newFee: number) => void;
  onRecalculate?: () => void;
}

export default function PackageSelectionStep({
  availablePackages,
  calculationResult,
  formData,
  totalAmount,
  loading,
  onFormInputChange,
  onPackageSelect,
  onSubmit,
  onRateChange,
  onRecalculate
}: PackageSelectionStepProps) {
  return (
    <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
      <h2 className="text-xl font-semibold text-white mb-4">Bước 3: Lựa chọn Gói bảo hiểm</h2>
      
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
            availablePackages={availablePackages}
            calculationResult={calculationResult}
            formData={formData}
            totalAmount={totalAmount}
            loading={loading}
            onSubmit={onSubmit}
          />
        </div>
      </div>
    </div>
  );
}