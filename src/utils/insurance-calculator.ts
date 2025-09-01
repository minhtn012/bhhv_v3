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
  'kd_chuyen_dung': { age_under_3: [1.15, 1.15, 1.2, 1.2], age_3_to_6: [1.2, 1.25, 1.3, 1.35], age_6_to_10: [1.3, 1.4, 1.45, 1.55], age_over_10: [1.5, 1.65, 1.7, null] }
};

export const additionalRateAU009 = 0.10;

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
  { name: 'Gói Cơ bản', details: 'Bảo hiểm cơ bản' },
  { name: 'Gói + AU001', details: 'Thêm: Thay mới không khấu hao' },
  { name: 'Gói + AU001 + AU006', details: 'Thêm: Thủy kích' },
  { name: 'Gói + AU001 + AU002 + AU006', details: 'Thêm: Lựa chọn garage' },
  { name: 'Gói + AU001 + AU002 + AU006 + AU009', details: 'Thêm: Mất cắp bộ phận' }
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
  { value: 'kd_chuyen_dung', label: 'Xe chuyên dùng khác (xe cứu thương...)', group: 'Xe kinh doanh vận tải' }
];

// Interface cho dữ liệu tính toán
export interface CalculationResult {
  baseRates: (number | null)[];
  finalRates: (number | null)[];
  mucKhauTru: number;
  tndsKey: string | null;
  nntxFee: number;
}

// Tính toán phí bảo hiểm
export function calculateInsuranceRates(
  giaTriXe: number,
  namSanXuat: number,
  soChoNgoi: number,
  loaiHinhKinhDoanh: string,
  trongTai?: number
): CalculationResult {
  const currentYear = new Date().getFullYear();
  const carAge = currentYear - namSanXuat;
  
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
    
    baseRates = physicalDamageRates[loaiHinhKinhDoanh][valueCategory][ageGroup];
  } else {
    baseRates = physicalDamageRates[loaiHinhKinhDoanh]?.[ageGroup] || [null, null, null, null];
  }

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
  } else if (loaiHinhKinhDoanh.includes('cho_hang') || loaiHinhKinhDoanh.includes('dau_keo')) {
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

  // Tính NNTX fee
  const nntxFee = soChoNgoi * 10000;

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