import { formatCurrency, tndsCategories, type CalculationResult } from '@/utils/insurance-calculator';

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

interface PriceSummaryCardProps {
  availablePackages: PackageOption[];
  calculationResult: CalculationResult;
  formData: FormData;
  totalAmount: number;
  loading: boolean;
  onSubmit: () => void;
}

export default function PriceSummaryCard({ 
  availablePackages, 
  calculationResult, 
  formData, 
  totalAmount, 
  loading, 
  onSubmit 
}: PriceSummaryCardProps) {
  return (
    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6 sticky top-4">
      <h3 className="text-xl font-bold text-center text-white mb-4">BẢNG TỔNG HỢP PHÍ</h3>
      
      <div className="space-y-2 text-sm mb-4">
        <div className="flex justify-between py-1 border-b border-dashed border-white/20">
          <span className="text-gray-300">1. Phí bảo hiểm Vật chất:</span>
          <span className="font-semibold text-white">
            {availablePackages[formData.selectedPackageIndex]?.available 
              ? formatCurrency(availablePackages[formData.selectedPackageIndex].fee)
              : '0 ₫'
            }
          </span>
        </div>
        
        <div className="flex justify-between py-1 border-b border-dashed border-white/20">
          <span className="text-gray-300">2. Phí TNDS Bắt buộc:</span>
          <span className="font-semibold text-white">
            {formData.includeTNDS && formData.tndsCategory && tndsCategories[formData.tndsCategory]
              ? formatCurrency(tndsCategories[formData.tndsCategory].fee)
              : '0 ₫'
            }
          </span>
        </div>
        
        <div className="flex justify-between py-1 border-b border-dashed border-white/20">
          <span className="text-gray-300">3. Phí Người ngồi trên xe:</span>
          <span className="font-semibold text-white">
            {formData.includeNNTX ? formatCurrency(calculationResult.nntxFee) : '0 ₫'}
          </span>
        </div>
        
        <div className="flex justify-between py-1">
          <span className="text-gray-300">Mức khấu trừ:</span>
          <span className="font-semibold text-white">
            {formatCurrency(calculationResult.mucKhauTru)}/vụ
          </span>
        </div>
      </div>

      <hr className="border-white/20 my-4" />
      
      <div className="flex justify-between items-center text-base">
        <span className="font-bold text-white">TỔNG CỘNG:</span>
        <span className="font-extrabold text-xl text-blue-400">
          {formatCurrency(totalAmount)}
        </span>
      </div>

      <button
        onClick={onSubmit}
        disabled={loading}
        className="w-full mt-6 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-bold py-3 px-4 rounded-xl transition-colors"
      >
        {loading ? 'Đang tạo...' : 'Tạo Hợp đồng'}
      </button>
    </div>
  );
}