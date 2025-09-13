import { formatCurrency, tndsCategories, isElectricOrHybridEngine } from '@/utils/insurance-calculator';

interface Contract {
  _id: string;
  giaTriXe: number;
  soChoNgoi: number;
  loaiDongCo?: string;
  giaTriPin?: number;
  includeTNDS: boolean;
  tndsCategory: string;
  includeNNTX: boolean;
  mucKhauTru: number;
  vatChatPackage: {
    name: string;
    tyLePhi: number;        // Original rate
    customRate?: number;    // Custom rate if modified
    isCustomRate?: boolean; // Flag for custom rate
    phiVatChat: number;     // Final fee
  };
  phiPin?: number;
  phiTNDS: number;
  phiNNTX: number;
  tongPhi: number;
  taiTucPercentage?: number;
  phiTaiTuc?: number;
}

interface ContractPriceSummaryViewProps {
  contract: Contract;
}

export default function ContractPriceSummaryView({ contract }: ContractPriceSummaryViewProps) {
  // Get the actual percentage rate used (custom rate if available, otherwise original rate)
  const displayedRate = contract.vatChatPackage.isCustomRate && contract.vatChatPackage.customRate
    ? contract.vatChatPackage.customRate
    : contract.vatChatPackage.tyLePhi;

  // Calculate if this is an electric/hybrid vehicle for display
  const isElectricHybrid = isElectricOrHybridEngine(contract.loaiDongCo);
  const hasCustomRate = contract.vatChatPackage.isCustomRate && contract.vatChatPackage.customRate;

  return (
    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6 sticky top-4">
      <h3 className="text-xl font-bold text-center text-white mb-4">BẢNG TỔNG HỢP PHÍ</h3>

      <div className="space-y-2 text-sm mb-4">
        <div className="py-2 border-b border-dashed border-white/20">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center">
              <span className="text-gray-300">
                1. Phí bảo hiểm Vật chất{isElectricHybrid && contract.giaTriPin && contract.giaTriPin > 0 ? ' (bao gồm pin)' : ''}:
              </span>
            </div>

            <div className="text-right">
              {/* Display percentage as plain text */}
              <div className="flex items-center gap-1 mb-1 justify-end">
                <span className="text-white font-semibold">
                  {displayedRate.toFixed(2)}%
                </span>
                {hasCustomRate && (
                  <span className="text-blue-400 text-xs ml-1">(Đã chỉnh sửa)</span>
                )}
              </div>

              {/* Show calculated fee */}
              <div className="font-semibold text-white text-sm">
                {formatCurrency(contract.vatChatPackage.phiVatChat + (contract.phiPin || 0))}
              </div>

              {/* Show original vs custom rate difference if applicable */}
              {hasCustomRate && (
                <div className="text-xs text-blue-400 mt-1">
                  Gốc: {contract.vatChatPackage.tyLePhi.toFixed(2)}%
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-between py-1 border-b border-dashed border-white/20">
          <span className="text-gray-300">2. Phí TNDS Bắt buộc:</span>
          <span className="font-semibold text-white">
            {contract.includeTNDS && contract.tndsCategory && tndsCategories[contract.tndsCategory as keyof typeof tndsCategories]
              ? formatCurrency(contract.phiTNDS)
              : '0 ₫'
            }
          </span>
        </div>

        <div className="flex justify-between py-1 border-b border-dashed border-white/20">
          <span className="text-gray-300">3. Phí Người ngồi trên xe:</span>
          <span className="font-semibold text-white">
            {contract.includeNNTX ? formatCurrency(contract.phiNNTX) : '0 ₫'}
          </span>
        </div>

        {contract.taiTucPercentage !== undefined && contract.taiTucPercentage !== 0 && (
          <div className="flex justify-between py-1 border-b border-dashed border-white/20">
            <span className="text-gray-300">4. Tái tục/ Cấp mới:</span>
            <span className="font-semibold text-white">
              {formatCurrency(contract.phiTaiTuc || 0)}
            </span>
          </div>
        )}

        <div className="flex justify-between py-1">
          <span className="text-gray-300">Mức khấu trừ:</span>
          <span className="font-semibold text-white">
            {formatCurrency(contract.mucKhauTru)}/vụ
          </span>
        </div>
      </div>

      <hr className="border-white/20 my-4" />

      <div className="flex justify-between items-center text-base">
        <span className="font-bold text-white">TỔNG CỘNG:</span>
        <span className="font-extrabold text-xl text-blue-400">
          {formatCurrency(contract.tongPhi)}
        </span>
      </div>
    </div>
  );
}