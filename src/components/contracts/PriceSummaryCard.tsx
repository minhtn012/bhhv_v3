import { useState, useEffect } from 'react';
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
  availablePackages?: PackageOption[];
  onCustomRateChange?: (customRate: number | null, isModified: boolean) => void;
  initialCustomRate?: number | null;
}

export default function PriceSummaryCard({
  enhancedResult,
  formData,
  totalAmount,
  nntxFee,
  loading,
  onSubmit,
  submitButtonText = "Tạo Hợp đồng",
  showSubmitButton = true,
  availablePackages,
  onCustomRateChange,
  initialCustomRate = null
}: PriceSummaryCardProps) {
  // Track user-modified percentage (initialize with contract's custom rate if available)
  const [userModifiedPercentage, setUserModifiedPercentage] = useState<number | null>(initialCustomRate);

  // Calculate original and effective rates with fallback to availablePackages
  const originalRate = enhancedResult?.customRates?.[formData.selectedPackageIndex] ?? 
    availablePackages?.find(pkg => pkg.index === formData.selectedPackageIndex)?.rate;
  const originalEffectiveRate = originalRate ? (
    isElectricOrHybridEngine(formData.loaiDongCo) && formData.giaTriPin && parseCurrency(formData.giaTriPin) > 0 
      ? originalRate + 0.10
      : originalRate
  ) : 0;

  // Reset user modifications when package changes
  useEffect(() => {
    setUserModifiedPercentage(null);
    // Notify parent that custom rate has been reset
    onCustomRateChange?.(null, false);
  }, [formData.selectedPackageIndex]);

  // Calculate fees based on custom percentage
  const calculateCustomFee = (percentage: number): number => {
    const totalVehicleValue = calculateTotalVehicleValue(
      parseCurrency(formData.giaTriXe),
      formData.giaTriPin,
      formData.loaiDongCo
    );
    return (totalVehicleValue * percentage) / 100;
  };

  const currentPercentage = userModifiedPercentage ?? originalEffectiveRate;
  const originalFee = (enhancedResult?.totalVatChatFee || 0) + (enhancedResult?.totalBatteryFee || 0) ||
    (originalEffectiveRate > 0 ? calculateCustomFee(originalEffectiveRate) : 0);
  const customFee = currentPercentage > 0 ? calculateCustomFee(currentPercentage) : originalFee;
  const hasCustomRate = userModifiedPercentage !== null && Math.abs(currentPercentage - originalEffectiveRate) > 0.001;

  return (
    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6 sticky top-4">
      <h3 className="text-xl font-bold text-center text-white mb-4">BẢNG TỔNG HỢP PHÍ</h3>
      
      <div className="space-y-2 text-sm mb-4">
        <div className="py-2 border-b border-dashed border-white/20">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center">
              <span className="text-gray-300">1. Phí bảo hiểm Vật chất{isElectricOrHybridEngine(formData.loaiDongCo) && formData.giaTriPin && parseCurrency(formData.giaTriPin) > 0 ? ' (bao gồm pin)' : ''}:</span>
            </div>
            
            <div className="text-right">
              {/* Percentage input */}
              <div className="flex items-center gap-1 mb-1">
                <input 
                  type="number"
                  step="0.01"
                  min="0.1"
                  max="10"
                  value={currentPercentage > 0 ? currentPercentage.toFixed(2) : ''}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    if (!isNaN(value) && value >= 0.1 && value <= 10) {
                      setUserModifiedPercentage(value);
                      // Notify parent about custom rate change
                      const isModified = Math.abs(value - originalEffectiveRate) > 0.001;
                      onCustomRateChange?.(value, isModified);
                    }
                  }}
                  className="w-20 text-right p-1 border border-white/20 rounded-md bg-gray-800 text-white font-semibold focus:border-blue-400 focus:outline-none"
                  placeholder="1.20"
                />
                <span className="text-gray-400 text-sm">%</span>
              </div>
              
              {/* Show calculated fee */}
              <div className="font-semibold text-white text-sm">
                {formatCurrency(customFee)}
              </div>
              
              {/* Show difference if modified */}
              {hasCustomRate && (
                <div className="text-xs text-blue-400 mt-1">
                  {customFee > originalFee ? '+' : ''}{formatCurrency(customFee - originalFee)}
                </div>
              )}
            </div>
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
            
            // 1. Vật chất fee (use custom fee if modified)
            finalTotal += customFee;
            
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