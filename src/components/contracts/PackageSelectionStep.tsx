import { tndsCategories, type CalculationResult } from '@/utils/insurance-calculator';
import PackageCard from './PackageCard';
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
  selectedPackageIndex: number;
  includeTNDS: boolean;
  tndsCategory: string;
  includeNNTX: boolean;
}

interface PackageSelectionStepProps {
  availablePackages: PackageOption[];
  calculationResult: CalculationResult;
  formData: FormData;
  totalAmount: number;
  loading: boolean;
  onFormInputChange: (field: keyof FormData, value: any) => void;
  onSubmit: () => void;
}

export default function PackageSelectionStep({
  availablePackages,
  calculationResult,
  formData,
  totalAmount,
  loading,
  onFormInputChange,
  onSubmit
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
                  onSelect={() => pkg.available && onFormInputChange('selectedPackageIndex', pkg.index)}
                />
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-4">B. Các hạng mục khác</h3>
            <div className="space-y-3">
              {/* TNDS */}
              <div className="p-4 bg-white/5 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <input 
                      type="checkbox" 
                      checked={formData.includeTNDS}
                      onChange={(e) => onFormInputChange('includeTNDS', e.target.checked)}
                      className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <label className="ml-3 text-white">Bảo hiểm TNDS Bắt buộc</label>
                  </div>
                  <span className="font-semibold text-white">
                    {formData.includeTNDS && formData.tndsCategory && tndsCategories[formData.tndsCategory] 
                      ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(tndsCategories[formData.tndsCategory].fee)
                      : '0 ₫'
                    }
                  </span>
                </div>
                {formData.includeTNDS && (
                  <select 
                    value={formData.tndsCategory}
                    onChange={(e) => onFormInputChange('tndsCategory', e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white text-sm"
                  >
                    {Object.entries(tndsCategories).map(([key, category]) => (
                      <option key={key} value={key}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* NNTX */}
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                <div className="flex items-center">
                  <input 
                    type="checkbox" 
                    checked={formData.includeNNTX}
                    onChange={(e) => onFormInputChange('includeNNTX', e.target.checked)}
                    className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <label className="ml-3 text-white">Bảo hiểm Người ngồi trên xe</label>
                </div>
                <span className="font-semibold text-white">
                  {formData.includeNNTX ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(calculationResult.nntxFee) : '0 ₫'}
                </span>
              </div>
            </div>
          </div>
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