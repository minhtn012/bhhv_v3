/**
 * Contract Data Mapper
 *
 * Transforms form data into API payload for contract creation.
 * Type-safe, pure function with no side effects.
 */

import { parseCurrency } from '@/utils/insurance-calculator';
import { packageLabelsDetail } from '@/utils/insurance-calculator';
import { type CarSelection } from '@/types/car';

/**
 * Extended form data interface for contract creation
 * Matches the FormData interface in page.tsx
 */
export interface ContractFormData {
  // Customer information
  chuXe: string;
  email: string;
  soDienThoai: string;
  cccd: string;
  gioiTinh: 'nam' | 'nu' | 'khac';
  userType: 'ca_nhan' | 'cong_ty';

  // Address
  diaChi: string;
  selectedProvince: string;
  selectedProvinceText: string;
  selectedDistrictWard: string;
  selectedDistrictWardText: string;
  specificAddress: string;

  // Vehicle information
  bienSo: string;
  soKhung: string;
  soMay: string;
  namSanXuat: string | number;
  soChoNgoi: string | number;
  trongTai?: string | number;
  giaTriXe: string | number;
  loaiHinhKinhDoanh: string;
  loaiDongCo: string;
  giaTriPin?: string;
  ngayDKLD: string;
  loaiXe?: string;

  // Vehicle details from car selection
  nhanHieu: string;
  soLoai: string;

  // Package selection
  selectedPackageIndex: number;
  includeTNDS: boolean;
  tndsCategory: string;
  includeNNTX: boolean;
  selectedNNTXPackage?: string;
  taiTucPercentage: number;
  mucKhauTru: number;
}

/**
 * Package information for contract
 */
export interface PackageInfo {
  name: string;
  rate: number;
  tyLePhi: number; // Original package rate (required by Contract model)
  customRate?: number;
  isCustomRate: boolean;
  phiVatChatGoc: number;
  phiVatChat: number;
  taiTucPercentage: number;
  dkbs: string[];
}

/**
 * Fee information for contract
 */
export interface FeeInfo {
  phiVatChatGoc: number;
  phiVatChat: number;
  phiTNDS: number;
  phiNNTX: number;
  phiPin: number;
  phiTaiTuc: number;
  phiTruocKhiGiam: number;
  phiSauKhiGiam: number;
  tongPhi: number;
}

/**
 * Complete contract payload for API
 */
export interface ContractPayload {
  // Customer information
  chuXe: string;
  diaChi: string;
  loaiKhachHang: 'ca_nhan' | 'cong_ty';

  // Buyer information
  buyerEmail: string;
  buyerPhone: string;
  buyerGender: 'nam' | 'nu' | 'khac';
  buyerCitizenId: string;
  selectedProvince: string;
  selectedProvinceText: string;
  selectedDistrictWard: string;
  selectedDistrictWardText: string;
  specificAddress: string;

  // Vehicle information
  bienSo: string;
  nhanHieu: string;
  soLoai: string;
  soKhung: string;
  soMay: string;
  ngayDKLD: string;
  namSanXuat: number;
  soChoNgoi: number;
  trongTai?: number;
  giaTriXe: number;
  loaiHinhKinhDoanh: string;
  loaiDongCo: string;
  giaTriPin?: number;
  loaiXe?: string;

  // Car selection details
  carBrand?: string;
  carModel?: string;
  carBodyStyle?: string;
  carYear?: string;

  // Package and fees
  vatChatPackage: PackageInfo;
  includeTNDS: boolean;
  tndsCategory: string;
  phiTNDS: number;
  includeNNTX: boolean;
  selectedNNTXPackage?: string;
  phiNNTX: number;
  phiPin: number;
  mucKhauTru: number;
  taiTucPercentage: number;
  phiTaiTuc: number;
  phiTruocKhiGiam: number;
  phiSauKhiGiam: number;
  tongPhi: number;
}

/**
 * Get DKBS (coverage details) for selected package
 *
 * @param packageIndex - Index of selected package
 * @returns Array of coverage details
 */
function getDKBS(packageIndex: number): string[] {
  const packageLabels = [
    { name: 'Gói BS001 + BS003' },
    { name: 'Gói BS001 + BS002 + BS003' },
    { name: 'Gói BS001 + BS002 + BS003 + BS004' },
    { name: 'Gói BS001 + BS002 + BS003 + BS005' },
    { name: 'Gói BS001 + BS002 + BS003 + BS004 + BS005' },
    { name: 'Gói BS001 + BS002 + BS003 + BS005 + BS006' },
  ];

  if (packageIndex >= 0 && packageIndex < packageLabels.length) {
    const pkg = packageLabels[packageIndex];
    // Extract BS codes from name: "Gói BS001 + BS003" → ["BS001", "BS003"]
    const bsCodes = pkg.name.match(/BS\d+/g) || [];
    return bsCodes.map(code => {
      const detail = packageLabelsDetail.find(item => item.code === code);
      return detail ? `- ${code}: ${detail.name}` : `- ${code}`;
    });
  }
  return [];
}

/**
 * Transform form data to contract API payload
 *
 * @param formData - Form data from UI
 * @param carData - Car selection data
 * @param packageData - Selected package data
 * @param feeInfo - Calculated fee information
 * @returns Contract payload ready for API submission
 */
export function transformFormToContract(
  formData: ContractFormData,
  carData: CarSelection,
  packageData: {
    name: string;
    rate: number;
    customRate?: number;
    isCustomRate: boolean;
  },
  feeInfo: FeeInfo
): ContractPayload {
  // Parse numeric values
  const giaTriXe = typeof formData.giaTriXe === 'string'
    ? parseCurrency(formData.giaTriXe)
    : formData.giaTriXe;

  const giaTriPin = formData.giaTriPin
    ? parseCurrency(formData.giaTriPin)
    : undefined;

  const namSanXuat = typeof formData.namSanXuat === 'string'
    ? Number(formData.namSanXuat)
    : formData.namSanXuat;

  const soChoNgoi = typeof formData.soChoNgoi === 'string'
    ? Number(formData.soChoNgoi)
    : formData.soChoNgoi;

  const trongTai = formData.trongTai
    ? (typeof formData.trongTai === 'string' ? Number(formData.trongTai) : formData.trongTai)
    : undefined;

  // Build package info
  const vatChatPackage: PackageInfo = {
    name: packageData.name,
    rate: packageData.rate,
    tyLePhi: packageData.rate, // Add tyLePhi (same as rate for original package rate)
    customRate: packageData.isCustomRate ? packageData.customRate : undefined,
    isCustomRate: packageData.isCustomRate,
    phiVatChatGoc: feeInfo.phiVatChatGoc,
    phiVatChat: feeInfo.phiVatChat,
    taiTucPercentage: formData.taiTucPercentage,
    dkbs: getDKBS(formData.selectedPackageIndex),
  };

  // Construct diaChi from components if not from image extraction
  // Priority: extracted diaChi (from image) > constructed from user input components
  const diaChi = formData.diaChi || [
    formData.specificAddress,
    formData.selectedDistrictWardText,
    formData.selectedProvinceText
  ]
    .filter(Boolean)  // Remove empty values
    .join(', ');      // Combine with comma separator

  // Build complete payload
  const payload: ContractPayload = {
    // Customer information
    chuXe: formData.chuXe,
    diaChi: diaChi,
    loaiKhachHang: formData.userType,

    // Buyer information
    buyerEmail: formData.email,
    buyerPhone: formData.soDienThoai,
    buyerGender: formData.gioiTinh,
    buyerCitizenId: formData.cccd,
    selectedProvince: formData.selectedProvince,
    selectedProvinceText: formData.selectedProvinceText,
    selectedDistrictWard: formData.selectedDistrictWard,
    selectedDistrictWardText: formData.selectedDistrictWardText,
    specificAddress: formData.specificAddress,

    // Vehicle information
    bienSo: formData.bienSo,
    nhanHieu: formData.nhanHieu,
    soLoai: formData.soLoai,
    soKhung: formData.soKhung,
    soMay: formData.soMay,
    ngayDKLD: formData.ngayDKLD,
    namSanXuat,
    soChoNgoi,
    trongTai,
    giaTriXe,
    loaiHinhKinhDoanh: formData.loaiHinhKinhDoanh,
    loaiDongCo: formData.loaiDongCo,
    giaTriPin,
    loaiXe: formData.loaiXe,

    // Car selection details
    carBrand: carData.selectedBrand,
    carModel: carData.selectedModel,
    carBodyStyle: carData.selectedBodyStyle,
    carYear: carData.selectedYear,

    // Package and fees
    vatChatPackage,
    includeTNDS: formData.includeTNDS,
    tndsCategory: formData.tndsCategory,
    phiTNDS: feeInfo.phiTNDS,
    includeNNTX: formData.includeNNTX,
    selectedNNTXPackage: formData.selectedNNTXPackage,
    phiNNTX: feeInfo.phiNNTX,
    phiPin: feeInfo.phiPin,
    mucKhauTru: formData.mucKhauTru,
    taiTucPercentage: formData.taiTucPercentage,
    phiTaiTuc: feeInfo.phiTaiTuc,
    phiTruocKhiGiam: feeInfo.phiTruocKhiGiam,
    phiSauKhiGiam: feeInfo.phiSauKhiGiam,
    tongPhi: feeInfo.tongPhi,
  };

  return payload;
}

/**
 * Validate contract payload before submission
 *
 * @param payload - Contract payload to validate
 * @returns Validation result
 */
export function validateContractPayload(payload: ContractPayload): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Required fields validation
  if (!payload.chuXe) errors.push('Tên chủ xe là bắt buộc');
  if (!payload.bienSo) errors.push('Biển số xe là bắt buộc');
  if (!payload.soKhung) errors.push('Số khung là bắt buộc');
  if (!payload.soMay) errors.push('Số máy là bắt buộc');
  if (!payload.nhanHieu) errors.push('Nhãn hiệu xe là bắt buộc');
  if (!payload.soLoai) errors.push('Số loại xe là bắt buộc');

  // Numeric validations
  if (payload.giaTriXe <= 0) errors.push('Giá trị xe phải lớn hơn 0');
  if (payload.namSanXuat < 1980) errors.push('Năm sản xuất không hợp lệ');
  if (payload.soChoNgoi <= 0) errors.push('Số chỗ ngồi phải lớn hơn 0');

  // Fee validations
  if (payload.tongPhi < 0) errors.push('Tổng phí không được âm');
  if (payload.phiSauKhiGiam > payload.phiTruocKhiGiam) {
    errors.push('Phí sau giảm không được lớn hơn phí trước giảm');
  }

  // TNDS validation
  if (payload.includeTNDS && !payload.tndsCategory) {
    errors.push('Vui lòng chọn loại TNDS');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}