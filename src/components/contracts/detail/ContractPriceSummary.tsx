import PriceSummaryCard from '@/components/contracts/PriceSummaryCard';
import { type CalculationResult, type EnhancedCalculationResult } from '@/utils/insurance-calculator';

interface Contract {
  _id: string;
  giaTriXe: number;
  soChoNgoi: number;
  loaiDongCo?: string;
  giaTriPin?: number;
  includeTNDS: boolean;
  tndsCategory: string;
  includeNNTX: boolean;
  selectedNNTXPackage?: string;
  mucKhauTru: number;
  vatChatPackage: {
    phiVatChat: number;
  };
  phiPin?: number;
  phiTNDS: number;
  phiNNTX: number;
  tongPhi: number;
}

interface ContractPriceSummaryProps {
  contract: Contract;
}

export default function ContractPriceSummary({ contract }: ContractPriceSummaryProps) {
  // Transform contract data to PriceSummaryCard format
  const formData = {
    selectedPackageIndex: 0,
    giaTriXe: contract.giaTriXe.toString(),
    soChoNgoi: contract.soChoNgoi,
    loaiDongCo: contract.loaiDongCo || '',
    giaTriPin: contract.giaTriPin?.toString() || '',
    includeTNDS: contract.includeTNDS,
    tndsCategory: contract.tndsCategory,
    includeNNTX: contract.includeNNTX,
    selectedNNTXPackage: contract.selectedNNTXPackage || '',
    taiTucPercentage: 0,
    mucKhauTru: contract.mucKhauTru,
  };

  // Create calculation results from contract data
  const calculationResult: CalculationResult = {
    finalRates: [0], // Not used for display
    tndsKey: contract.tndsCategory,
    vehicleValue: contract.giaTriXe,
    adjustmentFactor: 1,
  };

  const enhancedResult: EnhancedCalculationResult = {
    totalVatChatFee: contract.vatChatPackage.phiVatChat,
    totalBatteryFee: contract.phiPin || 0,
    grandTotal: contract.tongPhi,
    packageResults: [],
    selectedPackage: null,
    tndsResult: {
      fee: contract.phiTNDS,
      category: contract.tndsCategory,
    },
    nntxResult: {
      fee: contract.phiNNTX,
    }
  };

  return (
    <PriceSummaryCard
      availablePackages={[]}
      enhancedResult={enhancedResult}
      formData={formData}
      totalAmount={contract.tongPhi}
      nntxFee={contract.phiNNTX}
      loading={false}
      onSubmit={() => {}} // No-op for display mode
      showSubmitButton={false}
      submitButtonText=""
    />
  );
}