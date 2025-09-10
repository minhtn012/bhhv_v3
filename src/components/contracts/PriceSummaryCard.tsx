import { formatCurrency, tndsCategories, parseCurrency, isElectricOrHybridEngine, type CalculationResult, type EnhancedCalculationResult } from '@/utils/insurance-calculator';
import { useState, useEffect } from 'react';
import Spinner from '@/components/ui/Spinner';

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
  giaTriXe: string;
  soChoNgoi: number | '';
  loaiDongCo: string;
  giaTriPin: string;
  includeTNDS: boolean;
  tndsCategory: string;
  includeNNTX: boolean;
  selectedNNTXPackage: string;
  taiTucPercentage: number;
  mucKhauTru: number;
  customRates?: number[];
}

interface PriceSummaryCardProps {
  availablePackages: PackageOption[];
  calculationResult: CalculationResult;
  enhancedResult?: EnhancedCalculationResult;
  formData: FormData;
  totalAmount: number;
  loading: boolean;
  onSubmit: () => void;
  submitButtonText?: string;
  showSubmitButton?: boolean;
}

export default function PriceSummaryCard({ 
  availablePackages, 
  calculationResult, 
  enhancedResult,
  formData, 
  totalAmount, 
  loading, 
  onSubmit,
  submitButtonText = "Tạo Hợp đồng",
  showSubmitButton = true
}: PriceSummaryCardProps) {
  const [nntxFee, setNntxFee] = useState(0);
  const [actualTotalAmount, setActualTotalAmount] = useState(0);
  
  // Calculate NNTX fee based on selected package
  useEffect(() => {
    const calculateNNTXFee = async () => {
      if (formData.includeNNTX && formData.selectedNNTXPackage && formData.soChoNgoi) {
        try {
          const response = await fetch('/car_package.json');
          const packages = await response.json();
          const selectedPackage = packages.find((pkg: any) => pkg.value === formData.selectedNNTXPackage);
          if (selectedPackage) {
            setNntxFee(selectedPackage.price * Number(formData.soChoNgoi));
          } else {
            setNntxFee(0);
          }
        } catch (error) {
          console.error('Error calculating NNTX fee:', error);
          setNntxFee(0);
        }
      } else {
        setNntxFee(0);
      }
    };
    
    calculateNNTXFee();
  }, [formData.includeNNTX, formData.selectedNNTXPackage, formData.soChoNgoi]);

  // Calculate actual total amount based on displayed values
  useEffect(() => {
    let total = 0;

    // 1. Phí bảo hiểm Vật chất (base fee only)
    const baseFee = enhancedResult?.totalVatChatFee || 0;
    total += baseFee;

    // 1.5. Phí pin xe điện (separate battery fee)
    const batteryFee = enhancedResult?.totalBatteryFee || 0;
    total += batteryFee;

    // 2. Phí TNDS Bắt buộc
    if (formData.includeTNDS && formData.tndsCategory && tndsCategories[formData.tndsCategory as keyof typeof tndsCategories]) {
      total += tndsCategories[formData.tndsCategory as keyof typeof tndsCategories].fee;
    }

    // 3. Phí Người ngồi trên xe
    if (formData.includeNNTX) {
      total += nntxFee;
    }

    // 4. Tái tục/ Cấp mới
    const vehicleValue = parseCurrency(formData.giaTriXe);
    const adjustmentAmount = (vehicleValue * formData.taiTucPercentage) / 100;
    total += adjustmentAmount;

    setActualTotalAmount(total);
  }, [
    enhancedResult?.totalVatChatFee,
    enhancedResult?.totalBatteryFee,
    formData.includeTNDS, 
    formData.tndsCategory, 
    formData.includeNNTX, 
    nntxFee, 
    formData.giaTriXe, 
    formData.taiTucPercentage
  ]);
  return (
    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6 sticky top-4">
      <h3 className="text-xl font-bold text-center text-white mb-4">BẢNG TỔNG HỢP PHÍ</h3>
      
      <div className="space-y-2 text-sm mb-4">
        <div className="flex justify-between py-1 border-b border-dashed border-white/20">
          <span className="text-gray-300">1. Phí bảo hiểm Vật chất:</span>
          <span className="font-semibold text-white">
            {formatCurrency(enhancedResult?.totalVatChatFee || 0)}
          </span>
        </div>
        
        {/* Battery fee line - only show for HYBRID/EV vehicles */}
        {isElectricOrHybridEngine(formData.loaiDongCo) && formData.giaTriPin && parseCurrency(formData.giaTriPin) > 0 && (
          <div className="flex justify-between py-1 border-b border-dashed border-white/20">
            <span className="text-gray-300">1b. Phí pin xe điện:</span>
            <span className="font-semibold text-green-400">
              {formatCurrency(enhancedResult?.totalBatteryFee || 0)}
            </span>
          </div>
        )}
        
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
                // Calculate adjustment based on vehicle value
                const vehicleValue = parseCurrency(formData.giaTriXe);
                const adjustmentAmount = (vehicleValue * formData.taiTucPercentage) / 100;
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
          {formatCurrency(actualTotalAmount)}
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