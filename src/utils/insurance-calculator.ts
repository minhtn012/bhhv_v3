import { ENGINE_TYPE_VALUES } from './car-engine-mapping';

// Data phí bảo hiểm từ index_2.html
export const physicalDamageRates = {
  'khong_kd_cho_nguoi': {
    duoi_500tr: { age_under_3: [1.25, 1.25, 1.3, 1.3], age_3_to_6: [1.35, 1.4, 1.45, 1.5], age_6_to_10: [1.45, 1.55, 1.6, 1.7], age_over_10: [1.54, 1.69, 1.74, null] },
    tu_500_den_700tr: { age_under_3: [1.1, 1.1, 1.15, 1.15], age_3_to_6: [1.2, 1.25, 1.3, 1.35], age_6_to_10: [1.3, 1.4, 1.45, 1.55], age_over_10: [1.4, 1.55, 1.6, null] },
    tu_700_den_1ty: { age_under_3: [1.0, 1.0, 1.05, 1.05], age_3_to_6: [1.1, 1.15, 1.2, 1.25], age_6_to_10: [1.25, 1.35, 1.4, 1.5], age_over_10: [1.35, 1.5, 1.55, null] },
    tren_1ty: { age_under_3: [1.0, 1.0, 1.0, 1.0], age_3_to_6: [1.1, 1.15, 1.2, 1.2], age_6_to_10: [1.21, 1.31, 1.36, 1.46], age_over_10: [1.32, 1.47, 1.52, null] }
  },
  'khong_kd_cho_hang': { age_under_3: [1.15, 1.15, 1.2, 1.2], age_3_to_6: [1.2, 1.25, 1.3, 1.35], age_6_to_10: [1.3, 1.4, 1.45, 1.55], age_over_10: [1.5, 1.65, 1.7, null] },
  'khong_kd_pickup_van': { age_under_3: [1.3, 1.3, 1.35, 1.35], age_3_to_6: [1.35, 1.4, 1.45, 1.5], age_6_to_10: [1.45, 1.55, 1.6, 1.7], age_over_10: [1.55, 1.7, 1.75, null] },
  'kd_cho_hang': { age_under_3: [1.21, 1.21, 1.26, 1.26], age_3_to_6: [1.32, 1.37, 1.42, 1.47], age_6_to_10: [1.43, 1.53, 1.58, 1.68], age_over_10: [1.55, 1.7, 1.75, null] },
  'kd_dau_keo': { age_under_3: [1.65, 1.65, 1.65, 1.65], age_3_to_6: [1.76, 1.81, 1.81, 1.86], age_6_to_10: [1.95, 2.05, 2.05, 2.15], age_over_10: [2.2, 2.35, 2.4, null] },
  'kd_cho_khach_lien_tinh': { age_under_3: [1.5, 1.5, 1.55, 1.55], age_3_to_6: [1.6, 1.65, 1.7, 1.75], age_6_to_10: [1.8, 1.9, 1.95, 2.05], age_over_10: [1.9, 2.05, 2.1, null] },
  'kd_grab_be': { age_under_3: [1.8, 1.8, 1.85, 1.85], age_3_to_6: [1.9, 1.95, 2.0, 2.05], age_6_to_10: [2.2, 2.3, 2.35, 2.45], age_over_10: [2.4, 2.55, 2.6, null] },
  'kd_taxi_tu_lai': { age_under_3: [2.4, 2.4, 2.45, 2.45], age_3_to_6: [2.5, 2.55, 2.6, 2.65], age_6_to_10: [2.7, 2.8, 2.85, 2.95], age_over_10: [3.2, 3.35, 3.4, null] },
  'kd_hop_dong_tren_9c': { age_under_3: [1.15, 1.15, 1.2, 1.2], age_3_to_6: [1.25, 1.3, 1.35, 1.4], age_6_to_10: [1.4, 1.5, 1.55, 1.65], age_over_10: [1.5, 1.65, 1.7, null] },
  'kd_bus': { age_under_3: [1.25, 1.25, 1.3, 1.3], age_3_to_6: [1.35, 1.4, 1.45, 1.5], age_6_to_10: [1.45, 1.55, 1.6, 1.7], age_over_10: [1.54, 1.69, 1.74, null] },
  'kd_pickup_van': { age_under_3: [1.3, 1.3, 1.35, 1.35], age_3_to_6: [1.35, 1.4, 1.45, 1.5], age_6_to_10: [1.45, 1.55, 1.6, 1.7], age_over_10: [1.55, 1.7, 1.75, null] },
  'kd_chuyen_dung': { age_under_3: [1.15, 1.15, 1.2, 1.2], age_3_to_6: [1.2, 1.25, 1.3, 1.35], age_6_to_10: [1.3, 1.4, 1.45, 1.55], age_over_10: [1.5, 1.65, 1.7, null] },
  'kd_romooc_ben': { age_under_3: [1.25, 1.25, 1.30, 1.30], age_3_to_6: [1.35, 1.40, 1.45, 1.50], age_6_to_10: [1.40, 1.50, 1.55, 1.65], age_over_10: [1.50, 1.65, 1.70, null] }
};

export const additionalRateAU009 = 0.10;
export const HYBRID_EV_SURCHARGE = 0.10; // 0.1% surcharge for hybrid/electric vehicles

export const tndsCategories = {
  'duoi_6_cho_khong_kd': { label: 'Xe < 6 chỗ (Không KD)', fee: 480700 },
  '6_den_11_cho_khong_kd': { label: 'Xe 6-11 chỗ (Không KD)', fee: 873400 },
  '12_den_24_cho_khong_kd': { label: 'Xe 12-24 chỗ (Không KD)', fee: 1397000 },
  'tren_24_cho_khong_kd': { label: 'Xe > 24 chỗ (Không KD)', fee: 2007500 },
  'pickup_khong_kd': { label: 'Bán tải, Van (Không KD)', fee: 480700 },
  'duoi_6_cho_kd': { label: 'Xe < 6 chỗ (Kinh doanh)', fee: 831600 },
  '6_cho_kd': { label: 'Xe 6 chỗ (Kinh doanh)', fee: 1021900 },
  '7_cho_kd': { label: 'Xe 7 chỗ (Kinh doanh)', fee: 1188000 },
  '8_cho_kd': { label: 'Xe 8 chỗ (Kinh doanh)', fee: 1378300 },
  '9_cho_kd': { label: 'Xe 9 chỗ (Kinh doanh)', fee: 1544400 },
  '10_cho_kd': { label: 'Xe 10 chỗ (Kinh doanh)', fee: 1663200 },
  '11_cho_kd': { label: 'Xe 11 chỗ (Kinh doanh)', fee: 1821600 },
  '12_cho_kd': { label: 'Xe 12 chỗ (Kinh doanh)', fee: 2004200 },
  '13_cho_kd': { label: 'Xe 13 chỗ (Kinh doanh)', fee: 2253900 },
  '14_cho_kd': { label: 'Xe 14 chỗ (Kinh doanh)', fee: 2443100 },
  '15_cho_kd': { label: 'Xe 15 chỗ (Kinh doanh)', fee: 2633400 },
  '16_cho_kd': { label: 'Xe 16 chỗ (Kinh doanh)', fee: 3359400 },
  'tren_16_den_24_kd': { label: 'Xe 17-24 chỗ (Kinh doanh)', fee: 5095200 },
  'tren_24_kd': { label: 'Xe > 24 chỗ (Kinh doanh)', fee: 5294300 },
  'pickup_kd': { label: 'Bán tải, Van (Kinh doanh)', fee: 1026300 },
  'tai_duoi_3_tan': { label: 'Xe tải < 3 tấn', fee: 938300 },
  'tai_3_den_8_tan': { label: 'Xe tải 3-8 tấn', fee: 1826000 },
  'tai_8_den_15_tan': { label: 'Xe tải 8-15 tấn', fee: 3020600 },
  'tai_tren_15_tan': { label: 'Xe tải > 15 tấn', fee: 3520000 },
};

export const packageLabels = [
  { name: 'Gói Cơ bản', details: 'Bảo hiểm cơ bản' , code: "pk01"},
  { name: 'Gói AU001', details: 'Thêm: Thay mới không khấu hao', code: "pk02" },
  { name: 'Gói AU001 + AU006', details: 'Thêm: Thủy kích' , code: "pk03"},
  { name: 'Gói AU001 + AU002 + AU006', details: 'Thêm: Lựa chọn garage', code : "pk04" },
  { name: 'Gói AU001 + AU002 + AU006 + AU009', details: 'Thêm: Mất cắp bộ phận' , code : "pk05"}
];

export const loaiHinhKinhDoanhOptions = [
  { value: 'khong_kd_cho_nguoi', label: 'Xe chở người (xe gia đình)', group: 'Xe không kinh doanh' },
  { value: 'khong_kd_cho_hang', label: 'Xe chở hàng (không kinh doanh vận tải)', group: 'Xe không kinh doanh' },
  { value: 'khong_kd_pickup_van', label: 'Xe bán tải / Van (không kinh doanh)', group: 'Xe không kinh doanh' },
  { value: 'kd_cho_hang', label: 'Xe tải kinh doanh', group: 'Xe kinh doanh vận tải' },
  { value: 'kd_dau_keo', label: 'Xe đầu kéo', group: 'Xe kinh doanh vận tải' },
  { value: 'kd_cho_khach_lien_tinh', label: 'Xe khách liên tỉnh, nội tỉnh', group: 'Xe kinh doanh vận tải' },
  { value: 'kd_grab_be', label: 'Grab, Be, taxi công nghệ (< 9 chỗ)', group: 'Xe kinh doanh vận tải' },
  { value: 'kd_taxi_tu_lai', label: 'Taxi, xe cho thuê tự lái', group: 'Xe kinh doanh vận tải' },
  { value: 'kd_hop_dong_tren_9c', label: 'Xe khách hợp đồng (> 9 chỗ)', group: 'Xe kinh doanh vận tải' },
  { value: 'kd_bus', label: 'Xe bus', group: 'Xe kinh doanh vận tải' },
  { value: 'kd_pickup_van', label: 'Xe bán tải / Van (kinh doanh)', group: 'Xe kinh doanh vận tải' },
  { value: 'kd_chuyen_dung', label: 'Xe chuyên dùng khác (xe cứu thương...)', group: 'Xe kinh doanh vận tải' },
  { value: 'kd_romooc_ben', label: 'Rơ moóc ben; Rơ mooc gắn thiết bị chuyên dùng', group: 'Xe kinh doanh vận tải' }
];

// Interface cho dữ liệu tính toán
export interface CalculationResult {
  baseRates: (number | null)[];
  finalRates: (number | null)[];
  mucKhauTru: number;
  tndsKey: string | null;
  nntxFee: number;
}

// Helper functions for hybrid/electric vehicles
export function isElectricOrHybridEngine(loaiDongCo?: string): boolean {
  if (!loaiDongCo) return false;
  return loaiDongCo === ENGINE_TYPE_VALUES.HYBRID || loaiDongCo === ENGINE_TYPE_VALUES.EV;
}

export function calculateTotalVehicleValue(giaTriXe: number, giaTriPin?: string | number, loaiDongCo?: string): number {
  if (!isElectricOrHybridEngine(loaiDongCo)) {
    return giaTriXe;
  }
  
  const batteryValue = typeof giaTriPin === 'string' ? parseCurrency(giaTriPin) : (giaTriPin || 0);
  return giaTriXe + batteryValue;
}

export function applyElectricSurcharge(rate: number | null, loaiDongCo?: string): number | null {
  if (rate === null) return null;
  if (!isElectricOrHybridEngine(loaiDongCo)) return rate;
  return rate + HYBRID_EV_SURCHARGE;
}

export function calculateBatterySurchargeFee(
  giaTriXe: number,
  giaTriPin: string | number,
  rate: number,
  loaiHinhKinhDoanh: string,
  loaiDongCo?: string
): number {
  if (!isElectricOrHybridEngine(loaiDongCo)) {
    return 0;
  }
  
  const batteryValue = typeof giaTriPin === 'string' ? parseCurrency(giaTriPin) : (giaTriPin || 0);
  if (batteryValue <= 0) {
    return 0;
  }
  
  // Calculate surcharge: battery value * 0.1% + battery value * rate%
  const surchargeFee = (batteryValue * HYBRID_EV_SURCHARGE) / 100;
  const batteryBaseFee = (batteryValue * rate) / 100;
  
  return surchargeFee + batteryBaseFee;
}

// Tính toán phí bảo hiểm
export function calculateInsuranceRates(
  giaTriXe: number,
  namSanXuat: number,
  soChoNgoi: number,
  loaiHinhKinhDoanh: string,
  trongTai?: number,
  loaiDongCo?: string,
  giaTriPin?: string | number,
  ngayDKLD?: string
): CalculationResult {
  // Calculate car age from registration date, fallback to manufacturing year if not provided
  const carAge = ngayDKLD 
    ? calculateCarAgeFromRegistrationDate(ngayDKLD)
    : new Date().getFullYear() - namSanXuat;
  
  let ageGroup: string;
  if (carAge < 3) ageGroup = 'age_under_3';
  else if (carAge < 6) ageGroup = 'age_3_to_6';
  else if (carAge < 10) ageGroup = 'age_6_to_10';
  else ageGroup = 'age_over_10';
  
  let baseRates: (number | null)[];
  
  if (loaiHinhKinhDoanh === 'khong_kd_cho_nguoi') {
    let valueCategory: string;
    if (giaTriXe < 500000000) valueCategory = 'duoi_500tr';
    else if (giaTriXe < 700000000) valueCategory = 'tu_500_den_700tr';
    else if (giaTriXe < 1000000000) valueCategory = 'tu_700_den_1ty';
    else valueCategory = 'tren_1ty';
    
    const categoryData = physicalDamageRates[loaiHinhKinhDoanh as keyof typeof physicalDamageRates];
    if (typeof categoryData === 'object' && categoryData !== null && valueCategory in categoryData) {
      const valueData = (categoryData as any)[valueCategory];
      baseRates = valueData?.[ageGroup] || [null, null, null, null];
    } else {
      baseRates = [null, null, null, null];
    }
  } else {
    const categoryData = physicalDamageRates[loaiHinhKinhDoanh as keyof typeof physicalDamageRates];
    baseRates = typeof categoryData === 'object' && categoryData !== null && ageGroup in categoryData
      ? (categoryData as any)[ageGroup] || [null, null, null, null]
      : [null, null, null, null];
  }

  // Keep original base rates for separate display
  // Tạo finalRates với AU009 addition
  const finalRates = [...baseRates];
  if (baseRates[3] !== null) {
    finalRates.push(baseRates[3] + additionalRateAU009);
  } else {
    finalRates.push(null);
  }

  // Tính mức khấu trừ
  const isKinhDoanh = loaiHinhKinhDoanh.startsWith('kd_');
  const mucKhauTru = isKinhDoanh ? 1000000 : 500000;

  // Tính TNDS key
  let tndsKey: string | null = null;
  if (loaiHinhKinhDoanh.includes('pickup_van')) {
    tndsKey = isKinhDoanh ? 'pickup_kd' : 'pickup_khong_kd';
  } else if (loaiHinhKinhDoanh.includes('cho_hang') || loaiHinhKinhDoanh.includes('dau_keo') || loaiHinhKinhDoanh.includes('romooc_ben')) {
    const tan = (trongTai || 0) / 1000;
    if (tan < 3) tndsKey = 'tai_duoi_3_tan';
    else if (tan <= 8) tndsKey = 'tai_3_den_8_tan';
    else if (tan <= 15) tndsKey = 'tai_8_den_15_tan';
    else tndsKey = 'tai_tren_15_tan';
  } else {
    // Passenger cars
    if (isKinhDoanh) {
      if (soChoNgoi < 6) tndsKey = 'duoi_6_cho_kd';
      else if (soChoNgoi <= 16) tndsKey = `${soChoNgoi}_cho_kd`;
      else if (soChoNgoi <= 24) tndsKey = 'tren_16_den_24_kd';
      else tndsKey = 'tren_24_kd';
    } else {
      if (soChoNgoi < 6) tndsKey = 'duoi_6_cho_khong_kd';
      else if (soChoNgoi <= 11) tndsKey = '6_den_11_cho_khong_kd';
      else if (soChoNgoi <= 24) tndsKey = '12_den_24_cho_khong_kd';
      else tndsKey = 'tren_24_cho_khong_kd';
    }
  }

  // Tính NNTX fee - now just placeholder, actual calculation done separately
  const nntxFee = 0;

  return {
    baseRates,
    finalRates,
    mucKhauTru,
    tndsKey,
    nntxFee
  };
}

// Format currency
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount);
}

// Parse currency input
export function parseCurrency(value: string): number {
  return parseInt(value.replace(/[,.₫\s]/g, ''), 10) || 0;
}

// Format number input with commas
export function formatNumberInput(value: string): string {
  const cleanValue = value.replace(/[,.]/g, '');
  if (!isNaN(parseFloat(cleanValue)) && cleanValue.length > 0) {
    return parseInt(cleanValue, 10).toLocaleString('vi-VN');
  }
  return '';
}

// Calculate car age from registration date (ngayDKLD)
export function calculateCarAgeFromRegistrationDate(ngayDKLD: string): number {
  if (!ngayDKLD || !ngayDKLD.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
    console.warn('Invalid ngayDKLD format:', ngayDKLD, 'Expected: dd/mm/yyyy');
    return 0;
  }
  
  const [day, month, year] = ngayDKLD.split('/').map(Number);
  const registrationDate = new Date(year, month - 1, day); // month is 0-indexed
  const currentDate = new Date();
  
  let age = currentDate.getFullYear() - registrationDate.getFullYear();
  
  // Adjust for month/day if current date hasn't reached the anniversary yet
  const monthDiff = currentDate.getMonth() - registrationDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && currentDate.getDate() < registrationDate.getDate())) {
    age--;
  }
  
  return Math.max(0, age); // Ensure age is not negative
}

// Calculate base fee only (vehicle value, excluding battery surcharge)
export function calculateCustomFee(
  giaTriXe: number,
  rate: number,
  loaiHinhKinhDoanh: string,
  loaiDongCo?: string,
  giaTriPin?: string | number
): { fee: number; hasMinFee: boolean; batteryFee: number } {
  // Calculate total vehicle value (xe + pin)
  const totalVehicleValue = calculateTotalVehicleValue(giaTriXe, giaTriPin, loaiDongCo);
  
  // Apply surcharge for electric/hybrid vehicles
  const effectiveRate = isElectricOrHybridEngine(loaiDongCo) && giaTriPin && parseCurrency(String(giaTriPin)) > 0
    ? rate + HYBRID_EV_SURCHARGE
    : rate;
  
  // Calculate fee: (xe + pin) * (rate + 0.1%) or xe * rate
  let fee = (totalVehicleValue * effectiveRate) / 100;
  let hasMinFee = false;

  // Apply minimum fee logic for xe gia đình < 500M (from index_2.html)
  const isMinFeeApplicable = loaiHinhKinhDoanh === 'khong_kd_cho_nguoi' && giaTriXe < 500000000;
  if (isMinFeeApplicable && fee < 5500000) {
    fee = 5500000;
    hasMinFee = true;
  }

  return { fee, hasMinFee, batteryFee: 0 };
}

// Auto-suggest TNDS category based on vehicle info
export function suggestTNDSCategory(
  loaiHinhKinhDoanh: string,
  soChoNgoi: number,
  trongTai?: number
): string | null {
  const isKinhDoanh = loaiHinhKinhDoanh.startsWith('kd_');
  
  if (loaiHinhKinhDoanh.includes('pickup_van')) {
    return isKinhDoanh ? 'pickup_kd' : 'pickup_khong_kd';
  } else if (loaiHinhKinhDoanh.includes('cho_hang') || loaiHinhKinhDoanh.includes('dau_keo') || loaiHinhKinhDoanh.includes('romooc_ben')) {
    const tan = (trongTai || 0) / 1000;
    if (tan < 3) return 'tai_duoi_3_tan';
    else if (tan <= 8) return 'tai_3_den_8_tan';
    else if (tan <= 15) return 'tai_8_den_15_tan';
    else return 'tai_tren_15_tan';
  } else {
    // Passenger cars
    if (isKinhDoanh) {
      if (soChoNgoi < 6) return 'duoi_6_cho_kd';
      else if (soChoNgoi <= 16) return `${soChoNgoi}_cho_kd`;
      else if (soChoNgoi <= 24) return 'tren_16_den_24_kd';
      else return 'tren_24_kd';
    } else {
      if (soChoNgoi < 6) return 'duoi_6_cho_khong_kd';
      else if (soChoNgoi <= 11) return '6_den_11_cho_khong_kd';
      else if (soChoNgoi <= 24) return '12_den_24_cho_khong_kd';
      else return 'tren_24_cho_khong_kd';
    }
  }
}

// Calculate NNTX fee based on số chỗ ngồi
// Load NNTX package data
export async function loadNNTXPackages() {
  try {
    const response = await fetch('/car_package.json');
    const packages = await response.json();
    return packages;
  } catch (error) {
    console.error('Failed to load NNTX packages:', error);
    return [];
  }
}

export function calculateNNTXFee(packagePrice: number, soChoNgoi: number): number {
  return packagePrice * soChoNgoi;
}

// Legacy function for backward compatibility
export function calculateNNTXFeeSimple(soChoNgoi: number): number {
  return soChoNgoi * 10000;
}

// Calculate NNTX fee based on selected package
export async function calculateNNTXFeeByPackage(selectedPackageValue: string, soChoNgoi: number): Promise<number> {
  if (!selectedPackageValue || !soChoNgoi) return 0;
  
  try {
    const packages = await loadNNTXPackages();
    const selectedPackage = packages.find((pkg: any) => pkg.value === selectedPackageValue);
    if (selectedPackage) {
      return calculateNNTXFee(selectedPackage.price, soChoNgoi);
    }
    return 0;
  } catch (error) {
    console.error('Error calculating NNTX fee:', error);
    return 0;
  }
}

// Get available TNDS categories for dropdown
export function getAvailableTNDSCategories(): Array<{ key: string; label: string; fee: number }> {
  return Object.entries(tndsCategories).map(([key, data]) => ({
    key,
    label: data.label,
    fee: data.fee
  }));
}

// Helper function to get effective rate from contract or calculation
export function getEffectiveRateFromContract(contract: {
  vatChatPackage: {
    tyLePhi: number;
    customRate?: number;
    isCustomRate?: boolean;
  };
  loaiDongCo?: string;
  giaTriPin?: number;
}): number {
  const { vatChatPackage, loaiDongCo, giaTriPin } = contract;
  
  // Use custom rate if available and marked as custom
  const baseRate = vatChatPackage.isCustomRate && vatChatPackage.customRate
    ? vatChatPackage.customRate
    : vatChatPackage.tyLePhi;
    
  // Apply hybrid/EV surcharge if applicable
  const hasValidBattery = giaTriPin && giaTriPin > 0;
  return isElectricOrHybridEngine(loaiDongCo) && hasValidBattery
    ? baseRate + HYBRID_EV_SURCHARGE
    : baseRate;
}

// Helper to create vatChatPackage with custom rate
export function createVatChatPackageWithCustomRate(
  originalPackage: { name: string; tyLePhi: number; phiVatChat: number; dkbs: string[] },
  customRate?: number | null,
  isModified?: boolean
): {
  name: string;
  tyLePhi: number;
  customRate?: number;
  isCustomRate?: boolean;
  phiVatChat: number;
  dkbs: string[];
} {
  const result: any = { ...originalPackage };
  
  if (isModified && customRate !== null && customRate !== undefined) {
    result.customRate = customRate;
    result.isCustomRate = true;
  } else {
    // Clean up custom fields if not custom
    delete result.customRate;
    delete result.isCustomRate;
  }
  
  return result;
}

// Enhanced calculation result interface for real-time updates
export interface EnhancedCalculationResult extends CalculationResult {
  customRates?: number[];
  customFees?: number[];
  batteryFees?: number[];
  totalVatChatFee: number;
  totalBatteryFee: number;
  totalTNDSFee: number;
  totalNNTXFee: number;
  grandTotal: number;
}

// Real-time calculation with custom rates
export function calculateWithCustomRates(
  giaTriXe: number,
  namSanXuat: number,
  soChoNgoi: number,
  loaiHinhKinhDoanh: string,
  selectedPackageIndex: number,
  customRates: number[],
  includeTNDS: boolean,
  tndsCategory: string,
  includeNNTX: boolean,
  trongTai?: number,
  loaiDongCo?: string,
  giaTriPin?: string | number,
  ngayDKLD?: string,
  taiTucPercentage: number = 0
): EnhancedCalculationResult {
  // Get base calculation
  const baseResult = calculateInsuranceRates(
    giaTriXe,
    namSanXuat, 
    soChoNgoi,
    loaiHinhKinhDoanh,
    trongTai,
    loaiDongCo,
    giaTriPin,
    ngayDKLD // Now pass the registration date for accurate car age calculation
  );

  // Calculate custom fees and battery fees
  const customFeeResults = customRates.map(rate => 
    rate !== null ? calculateCustomFee(giaTriXe, rate, loaiHinhKinhDoanh, loaiDongCo, giaTriPin) : { fee: 0, hasMinFee: false, batteryFee: 0 }
  );
  
  const customFees = customFeeResults.map(result => result.fee);
  const batteryFees = customFeeResults.map(result => result.batteryFee);

  // Calculate totals
  const totalVatChatFee = customFees[selectedPackageIndex] || 0;
  const totalBatteryFee = batteryFees[selectedPackageIndex] || 0;
  const totalTNDSFee = includeTNDS && tndsCategory ? tndsCategories[tndsCategory as keyof typeof tndsCategories]?.fee || 0 : 0;
  const totalNNTXFee = includeNNTX ? baseResult.nntxFee : 0;
  const totalVehicleValue = calculateTotalVehicleValue(giaTriXe, giaTriPin, loaiDongCo);
  const taiTucAdjustment = (totalVehicleValue * taiTucPercentage) / 100;
  const grandTotal = totalVatChatFee + totalTNDSFee + totalNNTXFee + taiTucAdjustment;

  return {
    ...baseResult,
    customRates,
    customFees,
    batteryFees,
    totalVatChatFee,
    totalBatteryFee,
    totalTNDSFee,
    totalNNTXFee,
    grandTotal
  };
}