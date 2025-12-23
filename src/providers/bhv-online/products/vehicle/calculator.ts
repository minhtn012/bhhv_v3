/**
 * BHV Vehicle Insurance Calculator
 * Re-exports from the original insurance-calculator for backward compatibility
 */

export {
  physicalDamageRates,
  additionalRateAU009,
  HYBRID_EV_SURCHARGE,
  tndsCategories,
  packageLabels,
  packageLabelsDetail,
  loaiHinhKinhDoanhOptions,
  isElectricOrHybridEngine,
  calculateTotalVehicleValue,
  applyElectricSurcharge,
  calculateBatterySurchargeFee,
  calculateInsuranceRates,
  formatCurrency,
  parseCurrency,
  formatNumberInput,
  calculateCarAgeFromRegistrationDate,
  calculateCustomFee,
  suggestTNDSCategory,
  loadNNTXPackages,
  calculateNNTXFee,
  calculateNNTXFeeSimple,
  calculateNNTXFeeByPackage,
  getAvailableTNDSCategories,
  getEffectiveRateFromContract,
  createVatChatPackageWithCustomRate,
  calculateWithCustomRates,
  type CalculationResult,
  type EnhancedCalculationResult,
} from '@/utils/insurance-calculator';
