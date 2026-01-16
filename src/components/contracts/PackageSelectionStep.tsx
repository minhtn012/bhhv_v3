import { tndsCategories, type CalculationResult, type EnhancedCalculationResult, parseCurrency, calculateTotalVehicleValue } from '@/utils/insurance-calculator';
import PackageCard from './PackageCard';
import DynamicTNDSSelector from './DynamicTNDSSelector';
import PriceSummaryCard from './PriceSummaryCard';
import ExtraPackage from './ExtraPackage';
import { isExtraPackagesEnabled } from '@/config/extra-packages';
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
  extraPackages?: Array<{
    code: string;
    name: string;
    value: string;
  }>;
  ghiChu?: string;
}

interface PackageSelectionStepProps {
  availablePackages: PackageOption[];
  calculationResult: CalculationResult;
  enhancedResult?: EnhancedCalculationResult;
  formData: ExtendedPackageFormData;
  totalAmount: number;
  nntxFee: number;
  loading: boolean;
  onFormInputChange: (
    field: keyof ExtendedPackageFormData,
    value: string | number | boolean | Array<{code: string; name: string; value: string}> | {soVu: number; phanTramChiPhi: number}
  ) => void;
  onPackageSelect: (packageIndex: number) => void;
  onSubmit: () => void;
  onRecalculate?: () => void;
  onNNTXFeeChange: (fee: number) => void;
  onCustomRateChange?: (customRate: number | null, isModified: boolean) => void;
  submitButtonText?: string;
  /** Controlled custom rate value from parent (for create page) */
  customRate?: number | null;
  /** @deprecated Use customRate instead. Kept for edit page backward compatibility */
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
  customRate,
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

          {/* Extra Packages Section */}
          {isExtraPackagesEnabled() && (
            <div className="mt-6 pt-6 border-t border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4">Gói Bổ Sung (Tùy Chọn)</h3>
              <p className="text-sm text-gray-400 mb-3">
                Chọn các gói bảo hiểm bổ sung phù hợp với nhu cầu của bạn
              </p>
              <ExtraPackage
                selectedPackages={formData.extraPackages || []}
                onSelect={(packages) => onFormInputChange('extraPackages', packages)}
                disabled={false}
              />
            </div>
          )}

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

          {/* Ghi chú nội bộ */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <h3 className="text-lg font-semibold text-white mb-3">Ghi chú</h3>
            <textarea
              value={formData.ghiChu || ''}
              onChange={(e) => onFormInputChange('ghiChu', e.target.value)}
              placeholder="Ghi chú nội bộ (không hiển thị trên báo giá BHV)"
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 resize-none"
            />
          </div>
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
            customRate={customRate}
            initialCustomRate={initialCustomRate}
          />
        </div>
      </div>
    </div>
  );
}