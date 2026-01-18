/**
 * OCR to Travel Insurance Form Mapper
 * Transforms raw OCR JSON output to form-compatible data structure
 *
 * Usage:
 *   import { mapOCRToTravelForm } from '@/utils/ocr-travel-mapper';
 *   const formData = mapOCRToTravelForm(ocrResult);
 *   setFormData(prev => ({ ...prev, ...formData }));
 */

// ============================================================================
// Types
// ============================================================================

/** Raw OCR output structure (flat fields from ocr-config.json bao-hiem-du-lich) */
export interface TravelOCROutput {
  // Personal info
  hoTen: string | null;
  hoTenKhongDau: string | null;
  ngaySinh: string | null;
  gioiTinh: string | null;
  quocTich: string | null;

  // ID/Passport
  soCCCD: string | null;
  soHoChieu: string | null;
  ngayCapHC: string | null;
  ngayHetHanHC: string | null;
  noiCapHC: string | null;

  // Address
  diaChi: string | null;
}

/** Form-ready output structure for insured person */
export interface TravelInsuredPersonFormData {
  name: string;
  dob: string;
  gender: 'M' | 'F';
  country: string;
  personalId: string;
  address: string;
}

/** Combined form data from OCR */
export interface TravelFormData {
  insuredPerson: Partial<TravelInsuredPersonFormData>;
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
 * @param gioiTinh - "Nam" or "Nữ" or "M" or "F"
 * @returns "M" or "F"
 */
export function convertGender(gioiTinh: string | null | undefined): 'M' | 'F' {
  if (!gioiTinh) return 'M';
  const normalized = gioiTinh.toLowerCase().trim();
  if (normalized === 'nu' || normalized === 'nữ' || normalized === 'female' || normalized === 'f') {
    return 'F';
  }
  return 'M';
}

/**
 * Clean phone number - remove spaces and special chars
 */
export function cleanPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return '';
  return phone.replace(/[\s\-\.]/g, '');
}

/**
 * Map nationality/country to country code
 * @param nationality - Vietnamese nationality text
 * @returns Country code (default: VIETNAM)
 */
export function mapCountryCode(nationality: string | null | undefined): string {
  if (!nationality) return 'VIETNAM';
  const normalized = nationality.toLowerCase().trim();

  // Common countries mapping
  const countryMap: Record<string, string> = {
    'vietnam': 'VIETNAM',
    'việt nam': 'VIETNAM',
    'vn': 'VIETNAM',
    'usa': 'USA',
    'united states': 'USA',
    'america': 'USA',
    'japan': 'JAPAN',
    'nhật bản': 'JAPAN',
    'korea': 'KOREA',
    'hàn quốc': 'KOREA',
    'china': 'CHINA',
    'trung quốc': 'CHINA',
    'thailand': 'THAILAND',
    'thái lan': 'THAILAND',
    'singapore': 'SINGAPORE',
    'malaysia': 'MALAYSIA',
    'indonesia': 'INDONESIA',
    'philippines': 'PHILIPPINES',
    'australia': 'AUSTRALIA',
    'france': 'FRANCE',
    'pháp': 'FRANCE',
    'germany': 'GERMANY',
    'đức': 'GERMANY',
    'uk': 'UK',
    'england': 'UK',
    'anh': 'UK',
  };

  for (const [key, code] of Object.entries(countryMap)) {
    if (normalized.includes(key)) {
      return code;
    }
  }

  return 'VIETNAM';
}

/**
 * Get preferred personal ID (CCCD or Passport)
 * Prefer CCCD for domestic, passport for international
 */
export function getPreferredPersonalId(
  soCCCD: string | null | undefined,
  soHoChieu: string | null | undefined
): string {
  // Prefer CCCD if available (domestic ID)
  if (soCCCD) return soCCCD;
  if (soHoChieu) return soHoChieu;
  return '';
}

// ============================================================================
// Main Mapper Function
// ============================================================================

/**
 * Transform OCR output to travel insurance form data
 * @param ocr - Raw OCR output from Gemini
 * @returns Partial form data structure for merging with form state
 */
export function mapOCRToTravelForm(ocr: Partial<TravelOCROutput>): TravelFormData {
  return {
    insuredPerson: {
      name: ocr.hoTenKhongDau || ocr.hoTen || '',
      dob: convertDateFormat(ocr.ngaySinh),
      gender: convertGender(ocr.gioiTinh),
      country: mapCountryCode(ocr.quocTich),
      personalId: getPreferredPersonalId(ocr.soCCCD, ocr.soHoChieu),
      address: ocr.diaChi || '',
    },
  };
}

/**
 * Merge multiple OCR results (for multi-page documents like passport + ticket)
 * Later results override earlier ones for non-null values
 * @param results - Array of OCR outputs from multiple images
 * @returns Merged OCR output
 */
export function mergeOCRResults(results: Partial<TravelOCROutput>[]): Partial<TravelOCROutput> {
  const merged: Partial<TravelOCROutput> = {};

  for (const result of results) {
    for (const [key, value] of Object.entries(result)) {
      if (value !== null && value !== undefined && value !== '') {
        (merged as Record<string, unknown>)[key] = value;
      }
    }
  }

  return merged;
}
