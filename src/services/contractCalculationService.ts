/**
 * Contract Calculation Service
 *
 * Centralized fee calculation logic for insurance contracts.
 * Pure functions with no side effects for easy testing.
 */

import {
  parseCurrency,
  calculateTotalVehicleValue,
  tndsCategories,
  calculateCustomFee,
} from '@/utils/insurance-calculator';

/**
 * Fee breakdown structure
 */
export interface FeeBreakdown {
  phiVatChatGoc: number;      // Base vehicle insurance fee (original rate)
  phiVatChatCustom: number;   // Custom vehicle insurance fee (if rate modified)
  phiTNDS: number;            // Mandatory liability insurance fee
  phiNNTX: number;            // Passenger insurance fee
  phiPin: number;             // Battery insurance fee (EV/Hybrid)
  phiTaiTuc: number;          // Renewal adjustment fee
  phiTruocKhiGiam: number;    // Total before discount
  phiSauKhiGiam: number;      // Total after discount
  totalAmount: number;        // Grand total (same as phiSauKhiGiam)
}

/**
 * Input parameters for fee calculation
 */
export interface CalculationParams {
  giaTriXe: string | number;     // Vehicle value (can be formatted string)
  giaTriPin?: string | number;   // Battery value (optional, for EV/Hybrid)
  loaiDongCo?: string;           // Engine type
  loaiHinhKinhDoanh: string;     // Business usage type

  // Package selection
  packageRate: number;           // Base package rate (%)
  customRate?: number;           // Custom rate if modified (%)
  isCustomRate?: boolean;        // Flag indicating custom rate usage

  // Additional insurance
  includeTNDS: boolean;          // Include mandatory liability
  tndsCategory?: string;         // TNDS category key
  includeNNTX: boolean;          // Include passenger insurance
  nntxFee?: number;              // Pre-calculated NNTX fee

  // Renewal
  taiTucPercentage: number;      // Renewal percentage (-100 to 100)
}

/**
 * Calculate comprehensive fee breakdown for a contract
 *
 * @param params - Calculation parameters
 * @returns Complete fee breakdown
 */
export function calculateContractFees(params: CalculationParams): FeeBreakdown {
  // Parse and validate vehicle value
  const giaTriXe = typeof params.giaTriXe === 'string'
    ? parseCurrency(params.giaTriXe)
    : params.giaTriXe;

  if (giaTriXe <= 0) {
    throw new Error('Vehicle value must be greater than 0');
  }

  // Calculate total vehicle value (including battery for EV/Hybrid)
  const totalVehicleValue = calculateTotalVehicleValue(
    giaTriXe,
    params.giaTriPin,
    params.loaiDongCo
  );

  // 1. Calculate base vehicle insurance fee (BHVC - Bảo hiểm vật chất)
  const { fee: phiVatChatGoc, batteryFee: phiPin } = calculateCustomFee(
    giaTriXe,
    params.packageRate,
    params.loaiHinhKinhDoanh,
    params.loaiDongCo,
    params.giaTriPin
  );

  // 2. Calculate custom vehicle insurance fee if custom rate is used
  let phiVatChatCustom = phiVatChatGoc;
  if (params.isCustomRate && params.customRate !== undefined) {
    const { fee: customFee } = calculateCustomFee(
      giaTriXe,
      params.customRate,
      params.loaiHinhKinhDoanh,
      params.loaiDongCo,
      params.giaTriPin
    );
    phiVatChatCustom = customFee;
  }

  // 3. Calculate TNDS (mandatory liability) fee
  let phiTNDS = 0;
  if (params.includeTNDS && params.tndsCategory) {
    const tndsData = tndsCategories[params.tndsCategory as keyof typeof tndsCategories];
    if (tndsData) {
      phiTNDS = tndsData.fee;
    }
  }

  // 4. NNTX (passenger insurance) fee - pre-calculated by component
  const phiNNTX = params.includeNNTX && params.nntxFee ? params.nntxFee : 0;

  // 5. Calculate renewal/new policy adjustment
  let phiTaiTuc = 0;
  if (params.taiTucPercentage !== 0) {
    phiTaiTuc = (totalVehicleValue * params.taiTucPercentage) / 100;
  }

  // 6. Calculate totals
  const phiTruocKhiGiam = phiVatChatGoc + phiPin + phiTNDS + phiNNTX + phiTaiTuc;

  // If custom rate is used, replace base vehicle fee with custom fee
  const phiSauKhiGiam = params.isCustomRate && params.customRate !== undefined
    ? phiVatChatCustom + phiPin + phiTNDS + phiNNTX + phiTaiTuc
    : phiTruocKhiGiam;

  return {
    phiVatChatGoc,
    phiVatChatCustom,
    phiTNDS,
    phiNNTX,
    phiPin,
    phiTaiTuc,
    phiTruocKhiGiam,
    phiSauKhiGiam,
    totalAmount: phiSauKhiGiam,
  };
}

/**
 * Calculate fees for contract submission
 * Simplified version for API payload generation
 *
 * @param params - Calculation parameters
 * @returns Fee breakdown suitable for contract creation
 */
export function calculateSubmissionFees(params: CalculationParams): {
  phiVatChat: number;      // Final vehicle insurance fee (after custom rate)
  phiTNDS: number;
  phiNNTX: number;
  phiPin: number;
  phiTaiTuc: number;
  phiTruocKhiGiam: number;
  phiSauKhiGiam: number;
  tongPhi: number;
} {
  const breakdown = calculateContractFees(params);

  return {
    phiVatChat: params.isCustomRate ? breakdown.phiVatChatCustom : breakdown.phiVatChatGoc,
    phiTNDS: breakdown.phiTNDS,
    phiNNTX: breakdown.phiNNTX,
    phiPin: breakdown.phiPin,
    phiTaiTuc: breakdown.phiTaiTuc,
    phiTruocKhiGiam: breakdown.phiTruocKhiGiam,
    phiSauKhiGiam: breakdown.phiSauKhiGiam,
    tongPhi: breakdown.totalAmount,
  };
}

/**
 * Validate calculation parameters
 *
 * @param params - Parameters to validate
 * @returns Validation result with errors
 */
export function validateCalculationParams(params: CalculationParams): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Vehicle value validation
  const giaTriXe = typeof params.giaTriXe === 'string'
    ? parseCurrency(params.giaTriXe)
    : params.giaTriXe;

  if (giaTriXe <= 0) {
    errors.push('Giá trị xe phải lớn hơn 0');
  }

  // Package rate validation
  if (params.packageRate < 0 || params.packageRate > 10) {
    errors.push('Tỷ lệ gói bảo hiểm phải từ 0% đến 10%');
  }

  // Custom rate validation
  if (params.isCustomRate && params.customRate !== undefined) {
    if (params.customRate < 0.1 || params.customRate > 10) {
      errors.push('Tỷ lệ tùy chỉnh phải từ 0.1% đến 10%');
    }
  }

  // TNDS validation
  if (params.includeTNDS && !params.tndsCategory) {
    errors.push('Vui lòng chọn loại TNDS');
  }

  // Renewal percentage validation
  if (params.taiTucPercentage < -100 || params.taiTucPercentage > 100) {
    errors.push('Tỷ lệ tái tục phải từ -100% đến 100%');
  }

  // Battery value validation for EV/Hybrid
  if (params.loaiDongCo && (params.loaiDongCo.includes('hybrid') || params.loaiDongCo.includes('dien'))) {
    const giaTriPin = params.giaTriPin
      ? (typeof params.giaTriPin === 'string' ? parseCurrency(params.giaTriPin) : params.giaTriPin)
      : 0;

    if (giaTriPin <= 0) {
      errors.push('Xe hybrid/điện phải nhập giá trị pin');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}