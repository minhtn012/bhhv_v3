import { formatCurrency, tndsCategories } from '@/utils/insurance-calculator';

interface Contract {
  vatChatPackage: {
    name: string;
    tyLePhi: number;
    phiVatChat: number;
    dkbs: string[];
  };
  phiPin?: number;
  includeTNDS: boolean;
  tndsCategory: string;
  phiTNDS: number;
  includeNNTX: boolean;
  phiNNTX: number;
  soChoNgoi: number;
}

interface InsurancePackageSectionProps {
  contract: Contract;
}

const getTNDSText = (tndsCategory: string): string => {
  return tndsCategories[tndsCategory]?.label || tndsCategory;
};

export default function InsurancePackageSection({ contract }: InsurancePackageSectionProps) {
  return (
    <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
      <h2 className="text-xl font-semibold text-white mb-4">Gói bảo hiểm</h2>
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium text-white mb-2">Vật chất thân vỏ</h3>
          <div className="bg-white/5 rounded-xl p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-white font-medium">{contract.vatChatPackage.name}</p>
                <p className="text-sm text-gray-300">Tỷ lệ: {contract.vatChatPackage.tyLePhi}%</p>
              </div>
              <p className="text-blue-400 font-bold">{formatCurrency(contract.vatChatPackage.phiVatChat)}</p>
            </div>
            {contract.vatChatPackage.dkbs.length > 0 && (
              <div className="text-sm text-gray-300">
                <p className="font-medium mb-1">Điều khoản bổ sung:</p>
                {contract.vatChatPackage.dkbs.map((dkb, index) => (
                  <p key={index}>{dkb}</p>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Battery fee - only show for HYBRID/EV vehicles with battery fee */}
        {!!(contract.phiPin && contract.phiPin > 0) && (
          <div>
            <h3 className="text-lg font-medium text-white mb-2">Phí pin xe điện</h3>
            <div className="bg-white/5 rounded-xl p-4">
              <div className="flex justify-between items-center">
                <p className="text-white">Phí surcharge cho xe hybrid/điện</p>
                <p className="text-green-400 font-bold">{formatCurrency(contract.phiPin)}</p>
              </div>
            </div>
          </div>
        )}
        {contract.includeTNDS && (
          <div>
            <h3 className="text-lg font-medium text-white mb-2">TNDS Bắt buộc</h3>
            <div className="bg-white/5 rounded-xl p-4">
              <div className="flex justify-between items-center">
                <p className="text-white">{getTNDSText(contract.tndsCategory)}</p>
                <p className="text-blue-400 font-bold">{formatCurrency(contract.phiTNDS)}</p>
              </div>
            </div>
          </div>
        )}
        
        {contract.includeNNTX && (
          <div>
            <h3 className="text-lg font-medium text-white mb-2">Người ngồi trên xe</h3>
            <div className="bg-white/5 rounded-xl p-4">
              <div className="flex justify-between items-center">
                <p className="text-white">{contract.soChoNgoi} chỗ × 10.000 ₫</p>
                <p className="text-blue-400 font-bold">{formatCurrency(contract.phiNNTX)}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}