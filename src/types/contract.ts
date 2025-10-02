/**
 * Contract Form Data Types
 * 
 * Centralized type definitions for insurance contract forms.
 * This consolidates multiple FormData interfaces across the application.
 */

/**
 * Complete contract form data interface with all 34 fields
 * This is the single source of truth for contract form structure
 */
export interface BaseContractFormData {
  // Customer/Owner Information (12 fields - consolidated)
  chuXe: string;               // Owner name
  email: string;               // Email
  soDienThoai: string;         // Phone
  cccd: string;                // Citizen ID
  gioiTinh: 'nam' | 'nu' | 'khac'; // Gender (from buyer)
  userType: 'ca_nhan' | 'cong_ty';
  
  // Address Structure (actual form fields)
  diaChi: string;               // Main address (from vehicle registration)
  selectedProvince: string;      // Province code
  selectedProvinceText: string;  // Province name  
  selectedDistrictWard: string;  // District/Ward code
  selectedDistrictWardText: string; // District/Ward name
  specificAddress: string;       // Specific address

  // Vehicle Information (16 fields)
  bienSo: string;
  soKhung: string;
  soMay: string;
  namSanXuat: number | '';
  soChoNgoi: number | '';
  trongTai: number | '';
  giaTriXe: string;
  loaiHinhKinhDoanh: string;
  loaiDongCo: string;
  giaTriPin: string;
  ngayDKLD: string;
  loaiXe: string;
  
  // Vehicle Details from Car Selection
  tenXe: string;                // Complete vehicle name (brand + model + body style + year)
  nhanHieu: string;             // Brand name
  soLoai: string;               // Model name
  kieuDang: string;             // Body style
  namPhienBan: string;          // Year/Version
  
  // Package Selection & Insurance (6 fields)  
  selectedPackageIndex: number;
  includeTNDS: boolean;
  tndsCategory: string;
  includeNNTX: boolean;
  taiTucPercentage: number;
  mucKhauTru: number;
}

// Specialized type definitions using Pick utility
export type VehicleFormData = Pick<BaseContractFormData,
  'bienSo' | 'soKhung' | 'soMay' | 'namSanXuat' | 'soChoNgoi' |
  'trongTai' | 'giaTriXe' | 'loaiHinhKinhDoanh' | 'loaiDongCo' | 'giaTriPin' |
  'ngayDKLD' | 'loaiXe' | 'chuXe' | 'tenXe' | 'nhanHieu' | 'soLoai' | 'kieuDang' | 'namPhienBan'
>;

export type BuyerFormData = Pick<BaseContractFormData,
  'chuXe' | 'email' | 'soDienThoai' | 'cccd' | 'gioiTinh' | 'userType' |
  'selectedProvince' | 'selectedProvinceText' | 'selectedDistrictWard' |
  'selectedDistrictWardText' | 'specificAddress'
>;

export type InsuranceCalculationFormData = Pick<BaseContractFormData,
  'giaTriXe' | 'namSanXuat' | 'soChoNgoi' | 'trongTai' | 'loaiHinhKinhDoanh' |
  'loaiDongCo' | 'giaTriPin' | 'ngayDKLD' | 'selectedPackageIndex' | 'includeTNDS' |
  'tndsCategory' | 'includeNNTX' | 'taiTucPercentage' | 'mucKhauTru'
>;

export type PackageSelectionFormData = Pick<BaseContractFormData,
  'giaTriXe' | 'namSanXuat' | 'soChoNgoi' | 'trongTai' | 'loaiHinhKinhDoanh' |
  'selectedPackageIndex' | 'includeTNDS' | 'tndsCategory' | 'includeNNTX' |
  'taiTucPercentage' | 'mucKhauTru' | 'loaiDongCo' | 'giaTriPin' | 'ngayDKLD'
>;

export type PriceSummaryFormData = Pick<BaseContractFormData,
  'giaTriXe' | 'selectedPackageIndex' | 'includeTNDS' | 'tndsCategory' |
  'includeNNTX' | 'taiTucPercentage' | 'soChoNgoi' | 'loaiHinhKinhDoanh' |
  'namSanXuat' | 'trongTai' | 'loaiDongCo' | 'giaTriPin'
> & {
  customRates?: number[]; // Optional custom rates for enhanced calculations
};

// Type utility functions
export type FormDataKey = keyof BaseContractFormData;
export type FormDataValue = BaseContractFormData[FormDataKey];

// Default values for new contract form
export const defaultContractFormData: BaseContractFormData = {
  // Customer/Owner Information
  chuXe: '',
  email: '',
  soDienThoai: '',
  cccd: '',
  gioiTinh: 'nam',
  userType: 'ca_nhan',
  
  // Address Structure
  diaChi: '',
  selectedProvince: '',
  selectedProvinceText: '',
  selectedDistrictWard: '',
  selectedDistrictWardText: '',
  specificAddress: '',

  // Vehicle Information
  bienSo: '',
  soKhung: '',
  soMay: '',
  namSanXuat: '',
  soChoNgoi: '',
  trongTai: '',
  giaTriXe: '',
  loaiHinhKinhDoanh: 'kinh-doanh-van-tai',
  loaiDongCo: 'xang',
  giaTriPin: '',
  ngayDKLD: '',
  loaiXe: '',
  
  // Vehicle Details from Car Selection
  tenXe: '',
  nhanHieu: '',
  soLoai: '',
  kieuDang: '',
  namPhienBan: '',
  
  // Package Selection & Insurance
  selectedPackageIndex: 0,
  includeTNDS: false,
  tndsCategory: '',
  includeNNTX: false,
  taiTucPercentage: 0,
  mucKhauTru: 0,
};

// Type guards for validation
export const isValidUserType = (value: string): value is BaseContractFormData['userType'] => {
  return value === 'ca_nhan' || value === 'cong_ty';
};

export const isValidGender = (value: string): value is BaseContractFormData['gioiTinh'] => {
  return value === 'nam' || value === 'nu' || value === 'khac';
};

// Type compatibility checks
export type VehicleFormDataKeys = keyof VehicleFormData;
export type BuyerFormDataKeys = keyof BuyerFormData;
export type InsuranceCalculationFormDataKeys = keyof InsuranceCalculationFormData;

// Validation helper to ensure all required fields are present
export const validateFormData = (data: Partial<BaseContractFormData>): data is BaseContractFormData => {
  const requiredFields: FormDataKey[] = [
    'chuXe', 'email', 'soDienThoai', 'cccd', 'userType', 'bienSo', 'soKhung', 'soMay',
    'namSanXuat', 'soChoNgoi', 'giaTriXe', 'loaiHinhKinhDoanh', 'loaiDongCo'
  ];
  
  return requiredFields.every(field => {
    const value = data[field];
    // Handle special cases for numeric fields
    if (field === 'namSanXuat' || field === 'soChoNgoi') {
      return value !== undefined && value !== '' && Number(value) > 0;
    }
    return value !== undefined && value !== '';
  });
};