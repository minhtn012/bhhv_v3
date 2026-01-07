/**
 * OCR to Health Insurance Form Mapper
 * Transforms raw OCR JSON output to form-compatible data structure
 *
 * Usage:
 *   import { mapOCRToHealthForm } from '@/utils/ocr-health-mapper';
 *   const formData = mapOCRToHealthForm(ocrResult);
 *   setFormData(prev => ({ ...prev, ...formData }));
 */

import {
  HEALTH_PACKAGES,
  HEALTH_RELATIONSHIPS,
} from '@/providers/bhv-online/products/health/constants';

// ============================================================================
// Types
// ============================================================================

/** Raw OCR output structure (flat fields from ocr-config.json) */
export interface HealthOCROutput {
  // Section 1: Buyer (Người yêu cầu BH)
  hoTen: string | null;
  ngaySinh: string | null;
  gioiTinh: string | null;
  soCCCD: string | null;
  ngayCapCCCD: string | null;
  noiCapCCCD: string | null;
  diaChiThuongTru: string | null;
  soDienThoai: string | null;
  email: string | null;
  ngheNghiep: string | null;

  // Section 2: Insured (Người được BH)
  ngDuocBH_hoTen: string | null;
  ngDuocBH_ngaySinh: string | null;
  ngDuocBH_gioiTinh: string | null;
  ngDuocBH_soCCCD: string | null;
  ngDuocBH_soDienThoai: string | null;
  ngDuocBH_email: string | null;
  ngDuocBH_ngheNghiep: string | null;
  ngDuocBH_quanHe: string | null;
  ngDuocBH_diaChi: string | null;

  // Section 3: Package & Benefits
  goiBaoHiem: string | null;
  qlThaiSan: string | null;
  qlNgoaiTru: string | null;
  qlTuVongBenhTat: string | null;
  thoiHanTuNgay: string | null;
  thoiHanDenNgay: string | null;
  soPhiBH: string | number | null;
  phuongThucThanhToan: string | null;

  // Section 4: Health Questions
  q1TraLoi: string | null;
  q1ChiTiet: string | null;
  q2TraLoi: string | null;
  q2ChiTiet: string | null;
  q3TraLoi: string | null;
  q3ChiTiet: string | null;
  q4TraLoi: string | null;
  q4ChiTiet: string | null;
  q5TraLoi: string | null;
  q5ChiTiet: string | null;

  // Section 5: Beneficiary (Người thụ hưởng)
  ngThuHuong_hoTen: string | null;
  ngThuHuong_soCCCD: string | null;
  ngThuHuong_quanHe: string | null;
  ngThuHuong_soDienThoai: string | null;
  ngThuHuong_email: string | null;
  ngThuHuong_diaChi: string | null;

  // Old insurance info
  congTyBHCu: string | null;
  soHopDongBHCu: string | null;
  ngayHetHanBHCu: string | null;
}

/** Form-ready output structure (matches health/new/page.tsx FormDataType) */
export interface HealthFormData {
  // Buyer
  buyerFullname: string;
  buyerBirthday: string;
  buyerGender: string;
  buyerIdentityCard: string;
  buyerPhone: string;
  buyerEmail: string;
  buyerAddress: string;
  buyerJob: string;

  // Insured
  insuredSameAsBuyer: boolean;
  insuredRelationship: string;
  insuredFullname: string;
  insuredBirthday: string;
  insuredGender: string;
  insuredIdentityCard: string;
  insuredPhone: string;
  insuredEmail: string;
  insuredJob: string;

  // Package & Benefits
  packageType: string;
  benefitMaternity: boolean;
  benefitOutpatient: boolean;
  benefitDiseaseDeath: boolean;

  // Dates & Premium
  activeDate: string;
  inactiveDate: string;
  totalPremium: string;

  // Health Questions (form expects string "true"/"false")
  q1Answer: string;
  q1Details: string;
  q2Answer: string;
  q2Details: string;
  q3Answer: string;
  q3Details: string;
  q4Answer: string;
  q4Details: string;
  q5Answer: string;
  q5Details: string;

  // Beneficiary
  beneficiarySameAsInsured: boolean;
  beneficiaryRelationship: string;
  beneficiaryFullname: string;
  beneficiaryIdentityCard: string;
  beneficiaryPhone: string;
  beneficiaryEmail: string;
  beneficiaryAddress: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Convert Vietnamese date format to HTML date input format
 * @param vietnameseDate - Date in dd/mm/yyyy format
 * @returns Date in YYYY-MM-DD format or empty string
 */
export function convertDateFormat(vietnameseDate: string | null | undefined): string {
  if (!vietnameseDate) return '';
  const parts = vietnameseDate.split('/');
  if (parts.length !== 3) return '';
  const [day, month, year] = parts;
  // Validate parts are numeric
  if (!/^\d+$/.test(day) || !/^\d+$/.test(month) || !/^\d+$/.test(year)) {
    return '';
  }
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

/**
 * Convert Vietnamese gender to form value
 * @param gioiTinh - "Nam" or "Nữ"
 * @returns "male" or "female"
 */
export function convertGender(gioiTinh: string | null | undefined): string {
  if (!gioiTinh) return 'male';
  const normalized = gioiTinh.toLowerCase().trim();
  if (normalized === 'nu' || normalized === 'nữ' || normalized === 'female') {
    return 'female';
  }
  return 'male';
}

/**
 * Convert Vietnamese yes/no to string boolean (for form radio buttons)
 * @param answer - "Có" or "Không"
 * @returns "true" or "false" as string
 */
export function convertYesNoToString(answer: string | null | undefined): string {
  if (!answer) return 'false';
  const normalized = answer.toLowerCase().trim();
  if (normalized === 'co' || normalized === 'có' || normalized === 'yes') {
    return 'true';
  }
  return 'false';
}

/**
 * Convert Vietnamese yes/no to boolean
 * @param answer - "Có" or "Không"
 * @returns boolean
 */
export function convertYesNoToBool(answer: string | null | undefined): boolean {
  if (!answer) return false;
  const normalized = answer.toLowerCase().trim();
  return normalized === 'co' || normalized === 'có' || normalized === 'yes';
}

/**
 * Map package name to UUID
 * @param packageName - "Vàng", "Bạch Kim", or "Kim Cương"
 * @returns Package UUID
 */
export function mapPackageToUUID(packageName: string | null | undefined): string {
  if (!packageName) return HEALTH_PACKAGES.DIAMOND;
  const normalized = packageName.toLowerCase().trim();

  if (normalized.includes('vang') || normalized.includes('vàng')) {
    return HEALTH_PACKAGES.GOLD;
  }
  if (normalized.includes('bach kim') || normalized.includes('bạch kim') || normalized.includes('platinum')) {
    return HEALTH_PACKAGES.PLATINUM;
  }
  if (normalized.includes('kim cuong') || normalized.includes('kim cương') || normalized.includes('diamond')) {
    return HEALTH_PACKAGES.DIAMOND;
  }
  return HEALTH_PACKAGES.DIAMOND; // default
}

/**
 * Map relationship text to UUID
 * @param relationship - Vietnamese relationship text
 * @returns Relationship UUID
 */
export function mapRelationshipToUUID(relationship: string | null | undefined): string {
  if (!relationship) return HEALTH_RELATIONSHIPS.SELF;
  const normalized = relationship.toLowerCase().trim();

  // Self
  if (normalized === 'ban than' || normalized === 'bản thân' || normalized === 'self') {
    return HEALTH_RELATIONSHIPS.SELF;
  }
  // Spouse
  if (normalized.includes('vo') || normalized.includes('vợ') ||
      normalized.includes('chong') || normalized.includes('chồng') ||
      normalized === 'vo chong' || normalized === 'vợ chồng') {
    return HEALTH_RELATIONSHIPS.SPOUSE;
  }
  // Parent
  if (normalized.includes('cha') || normalized.includes('me') || normalized.includes('mẹ') ||
      normalized === 'cha me' || normalized === 'cha mẹ' ||
      normalized.includes('me ruot') || normalized.includes('mẹ ruột') ||
      normalized.includes('bo') || normalized.includes('bố')) {
    return HEALTH_RELATIONSHIPS.PARENT;
  }
  // Child
  if (normalized === 'con' || normalized.includes('con ') ||
      normalized.includes('con gai') || normalized.includes('con gái') ||
      normalized.includes('con trai')) {
    return HEALTH_RELATIONSHIPS.CHILD;
  }
  // Sibling
  if (normalized.includes('anh') || normalized.includes('chi') || normalized.includes('chị') ||
      normalized.includes('em') || normalized.includes('anh chi em')) {
    return HEALTH_RELATIONSHIPS.SIBLING;
  }
  return HEALTH_RELATIONSHIPS.OTHER;
}

/**
 * Clean phone number - remove spaces and special chars
 */
export function cleanPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return '';
  return phone.replace(/[\s\-\.]/g, '');
}

/**
 * Clean premium amount - extract digits only
 * Handles both string and number inputs (Gemini may return number)
 */
export function cleanPremiumAmount(amount: string | number | null | undefined): string {
  if (amount === null || amount === undefined) return '';
  // Convert to string first (handles number from Gemini)
  const str = String(amount);
  // Remove all non-digit characters
  return str.replace(/[^\d]/g, '');
}

// ============================================================================
// Main Mapper Function
// ============================================================================

/**
 * Transform OCR output to health insurance form data
 * @param ocr - Raw OCR output from Claude CLI
 * @returns Partial form data structure for merging with form state
 */
export function mapOCRToHealthForm(ocr: Partial<HealthOCROutput>): Partial<HealthFormData> {
  // Helper: check if relationship is "Bản thân" (self = buyer)
  const isSelfRelationship = (rel: string | null | undefined): boolean => {
    if (!rel) return false;
    const normalized = rel.toLowerCase().trim();
    return normalized === 'bản thân' || normalized === 'ban than';
  };

  // Determine if insured is same as buyer:
  // - No insured name, OR same name as buyer, OR relationship = "Bản thân"
  const insuredSameAsBuyer = !ocr.ngDuocBH_hoTen ||
    (ocr.ngDuocBH_hoTen?.toLowerCase().trim() === ocr.hoTen?.toLowerCase().trim()) ||
    isSelfRelationship(ocr.ngDuocBH_quanHe);

  // Determine if beneficiary is same as buyer:
  // - No beneficiary name, OR same name as buyer, OR relationship = "Bản thân"
  const beneficiarySameAsInsured = !ocr.ngThuHuong_hoTen ||
    (ocr.ngThuHuong_hoTen?.toLowerCase().trim() === ocr.hoTen?.toLowerCase().trim()) ||
    isSelfRelationship(ocr.ngThuHuong_quanHe);

  return {
    // Buyer
    buyerFullname: ocr.hoTen || '',
    buyerBirthday: convertDateFormat(ocr.ngaySinh),
    buyerGender: convertGender(ocr.gioiTinh),
    buyerIdentityCard: ocr.soCCCD || '',
    buyerPhone: cleanPhoneNumber(ocr.soDienThoai),
    buyerEmail: ocr.email || '',
    buyerAddress: ocr.diaChiThuongTru || '',
    buyerJob: ocr.ngheNghiep || '',

    // Insured
    insuredSameAsBuyer,
    insuredRelationship: mapRelationshipToUUID(ocr.ngDuocBH_quanHe),
    insuredFullname: ocr.ngDuocBH_hoTen || '',
    insuredBirthday: convertDateFormat(ocr.ngDuocBH_ngaySinh),
    insuredGender: convertGender(ocr.ngDuocBH_gioiTinh),
    insuredIdentityCard: ocr.ngDuocBH_soCCCD || '',
    insuredPhone: cleanPhoneNumber(ocr.ngDuocBH_soDienThoai),
    insuredEmail: ocr.ngDuocBH_email || '',
    insuredJob: ocr.ngDuocBH_ngheNghiep || '',

    // Package & Benefits
    packageType: mapPackageToUUID(ocr.goiBaoHiem),
    benefitMaternity: convertYesNoToBool(ocr.qlThaiSan),
    benefitOutpatient: convertYesNoToBool(ocr.qlNgoaiTru),
    benefitDiseaseDeath: convertYesNoToBool(ocr.qlTuVongBenhTat),

    // Dates & Premium
    activeDate: convertDateFormat(ocr.thoiHanTuNgay),
    inactiveDate: convertDateFormat(ocr.thoiHanDenNgay),
    totalPremium: cleanPremiumAmount(ocr.soPhiBH),

    // Health Questions (form expects string "true"/"false")
    q1Answer: convertYesNoToString(ocr.q1TraLoi),
    q1Details: ocr.q1ChiTiet || '',
    q2Answer: convertYesNoToString(ocr.q2TraLoi),
    q2Details: ocr.q2ChiTiet || '',
    q3Answer: convertYesNoToString(ocr.q3TraLoi),
    q3Details: ocr.q3ChiTiet || '',
    q4Answer: convertYesNoToString(ocr.q4TraLoi),
    q4Details: ocr.q4ChiTiet || '',
    q5Answer: convertYesNoToString(ocr.q5TraLoi),
    q5Details: ocr.q5ChiTiet || '',

    // Beneficiary
    beneficiarySameAsInsured,
    beneficiaryRelationship: mapRelationshipToUUID(ocr.ngThuHuong_quanHe),
    beneficiaryFullname: ocr.ngThuHuong_hoTen || '',
    beneficiaryIdentityCard: ocr.ngThuHuong_soCCCD || '',
    beneficiaryPhone: cleanPhoneNumber(ocr.ngThuHuong_soDienThoai),
    beneficiaryEmail: ocr.ngThuHuong_email || '',
    beneficiaryAddress: ocr.ngThuHuong_diaChi || '',
  };
}

/**
 * Merge multiple OCR results (for multi-page forms)
 * Later results override earlier ones for non-null values
 * @param results - Array of OCR outputs from multiple images
 * @returns Merged OCR output
 */
export function mergeOCRResults(results: Partial<HealthOCROutput>[]): Partial<HealthOCROutput> {
  const merged: Partial<HealthOCROutput> = {};

  for (const result of results) {
    for (const [key, value] of Object.entries(result)) {
      if (value !== null && value !== undefined && value !== '') {
        (merged as Record<string, unknown>)[key] = value;
      }
    }
  }

  return merged;
}
