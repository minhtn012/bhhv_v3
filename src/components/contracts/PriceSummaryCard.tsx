import { formatCurrency, tndsCategories, parseCurrency, isElectricOrHybridEngine, calculateTotalVehicleValue, type EnhancedCalculationResult } from '@/utils/insurance-calculator';
import Spinner from '@/components/ui/Spinner';
import { PriceSummaryFormData } from '@/types/contract';

interface PackageOption {
  index: number;
  name: string;
  details: string;
  rate: number;
  fee: number;
  available: boolean;
}

// Extended form data for component-specific fields
interface ExtendedPriceSummaryFormData extends PriceSummaryFormData {
  selectedNNTXPackage: string;
  mucKhauTru: number;
}

interface PriceSummaryCardProps {
  enhancedResult?: EnhancedCalculationResult;
  formData: ExtendedPriceSummaryFormData;
  totalAmount: number;
  nntxFee: number;
  loading: boolean;
  onSubmit: () => void;
  submitButtonText?: string;
  showSubmitButton?: boolean;
}

export default function PriceSummaryCard({ 
  enhancedResult,
  formData, 
  totalAmount,
  nntxFee,
  loading, 
  onSubmit,
  submitButtonText = "Tạo Hợp đồng",
  showSubmitButton = true
}: PriceSummaryCardProps) {

  return (
    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6 sticky top-4">
      <h3 className="text-xl font-bold text-center text-white mb-4">BẢNG TỔNG HỢP PHÍ</h3>
      
      <div className="space-y-2 text-sm mb-4">
        <div className="py-1 border-b border-dashed border-white/20">
          <div className="text-gray-300 mb-1">
            1. Phí bảo hiểm Vật chất{isElectricOrHybridEngine(formData.loaiDongCo) && formData.giaTriPin && parseCurrency(formData.giaTriPin) > 0 ? ' (bao gồm pin)' : ''}:
          </div>
          <div className="text-right text-xs text-gray-400 mb-1">
            {(() => {
              if (enhancedResult?.customRates && formData.selectedPackageIndex !== undefined) {
                const baseRate = enhancedResult.customRates[formData.selectedPackageIndex];
                if (baseRate) {
                  const effectiveRate = isElectricOrHybridEngine(formData.loaiDongCo) && formData.giaTriPin && parseCurrency(formData.giaTriPin) > 0 
                    ? baseRate + 0.10
                    : baseRate;
                  return `${effectiveRate.toFixed(2)}%`;
                }
              }
              return '';
            })()}
          </div>
          <div className="text-right font-semibold text-white">
            {formatCurrency((enhancedResult?.totalVatChatFee || 0) + (enhancedResult?.totalBatteryFee || 0))}
          </div>
        </div>
        
        <div className="flex justify-between py-1 border-b border-dashed border-white/20">
          <span className="text-gray-300">2. Phí TNDS Bắt buộc:</span>
          <span className="font-semibold text-white">
            {formData.includeTNDS && formData.tndsCategory && tndsCategories[formData.tndsCategory as keyof typeof tndsCategories]
              ? formatCurrency(tndsCategories[formData.tndsCategory as keyof typeof tndsCategories].fee)
              : '0 ₫'
            }
          </span>
        </div>
        
        <div className="flex justify-between py-1 border-b border-dashed border-white/20">
          <span className="text-gray-300">3. Phí Người ngồi trên xe:</span>
          <span className="font-semibold text-white">
            {formData.includeNNTX ? formatCurrency(nntxFee) : '0 ₫'}
          </span>
        </div>
        
        {formData.taiTucPercentage !== 0 && (
          <div className="flex justify-between py-1 border-b border-dashed border-white/20">
            <span className="text-gray-300">4. Tái tục/ Cấp mới:</span>
            <span className="font-semibold text-white">
              {(() => {
                // Calculate adjustment based on total vehicle value (including battery for electric/hybrid)
                const totalVehicleValue = calculateTotalVehicleValue(
                  parseCurrency(formData.giaTriXe),
                  formData.giaTriPin,
                  formData.loaiDongCo
                );
                const adjustmentAmount = (totalVehicleValue * formData.taiTucPercentage) / 100;
                return (adjustmentAmount > 0 ? '+' : '') + formatCurrency(Math.abs(adjustmentAmount));
              })()}
            </span>
          </div>
        )}
        
        <div className="flex justify-between py-1">
          <span className="text-gray-300">Mức khấu trừ:</span>
          <span className="font-semibold text-white">
            {formatCurrency(formData.mucKhauTru)}/vụ
          </span>
        </div>
      </div>

      <hr className="border-white/20 my-4" />
      
      <div className="flex justify-between items-center text-base">
        <span className="font-bold text-white">TỔNG CỘNG:</span>
        <span className="font-extrabold text-xl text-blue-400">
          {(() => {
            // Calculate real-time total by summing all displayed fees
            let finalTotal = 0;
            
            // 1. Vật chất fee
            finalTotal += enhancedResult?.totalVatChatFee || 0;
            
            // 1b. Battery fee (if applicable)
            if (isElectricOrHybridEngine(formData.loaiDongCo) && formData.giaTriPin && parseCurrency(formData.giaTriPin) > 0) {
              finalTotal += enhancedResult?.totalBatteryFee || 0;
            }
            
            // 2. TNDS fee (real-time based on checkbox)
            if (formData.includeTNDS && formData.tndsCategory && tndsCategories[formData.tndsCategory as keyof typeof tndsCategories]) {
              finalTotal += tndsCategories[formData.tndsCategory as keyof typeof tndsCategories].fee;
            }
            
            // 3. NNTX fee (real-time from DynamicTNDSSelector)
            if (formData.includeNNTX) {
              finalTotal += nntxFee;
            }
            
            // 4. Tái tục adjustment
            if (formData.taiTucPercentage !== 0) {
              const totalVehicleValue = calculateTotalVehicleValue(
                parseCurrency(formData.giaTriXe),
                formData.giaTriPin,
                formData.loaiDongCo
              );
              const adjustmentAmount = (totalVehicleValue * formData.taiTucPercentage) / 100;
              finalTotal += adjustmentAmount;
            }
            
            return formatCurrency(finalTotal);
          })()}
        </span>
      </div>

      {showSubmitButton && (
        <button
          onClick={onSubmit}
          disabled={loading}
          className="w-full mt-6 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-3"
        >
          {loading && (
            <Spinner size="small" className="!m-0 !w-4 !h-4 !max-w-4" />
          )}
          <span>{loading ? 'Đang xử lý...' : submitButtonText}</span>
        </button>
      )}
    </div>
  );
}