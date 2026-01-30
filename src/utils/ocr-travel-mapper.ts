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

/** Raw OCR output structure for international travel documents */
export interface TravelOCROutput {
  // Document info
  documentType: 'PASSPORT' | 'VISA' | 'RESIDENT_CARD' | 'ID_CARD' | null;
  issuingCountry: string | null;

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
  noiSinh: string | null;

  // Address (for CCCD/ID cards)
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
 * Handles international passport nationalities
 * @param nationality - Nationality text from passport
 * @returns Country code (default: VIETNAM)
 */
export function mapCountryCode(nationality: string | null | undefined): string {
  if (!nationality) return 'VIETNAM';
  const normalized = nationality.toUpperCase().trim();

  // Direct match for already-formatted country codes
  const directCountries = [
    'VIETNAM', 'USA', 'JAPAN', 'KOREA', 'CHINA', 'THAILAND', 'SINGAPORE',
    'MALAYSIA', 'INDONESIA', 'PHILIPPINES', 'AUSTRALIA', 'FRANCE',
    'GERMANY', 'UK', 'NEW ZEALAND', 'CANADA', 'INDIA', 'TAIWAN',
  ];
  if (directCountries.includes(normalized)) {
    return normalized;
  }

  // Extended mapping for variations
  const countryMap: Record<string, string> = {
    // Vietnam
    'vietnamese': 'VIETNAM', 'viet nam': 'VIETNAM', 'vnm': 'VIETNAM', 'vn': 'VIETNAM',
    // USA
    'american': 'USA', 'united states': 'USA', 'america': 'USA',
    // Japan
    'japanese': 'JAPAN', 'nhật bản': 'JAPAN', 'jpn': 'JAPAN',
    // Korea
    'korean': 'KOREA', 'south korea': 'KOREA', 'hàn quốc': 'KOREA', 'kor': 'KOREA',
    // China
    'chinese': 'CHINA', 'trung quốc': 'CHINA', 'chn': 'CHINA',
    // Thailand
    'thai': 'THAILAND', 'thái lan': 'THAILAND', 'tha': 'THAILAND',
    // Singapore
    'singaporean': 'SINGAPORE', 'sgp': 'SINGAPORE',
    // Malaysia
    'malaysian': 'MALAYSIA', 'mys': 'MALAYSIA',
    // Indonesia
    'indonesian': 'INDONESIA', 'idn': 'INDONESIA',
    // Philippines
    'filipino': 'PHILIPPINES', 'pilipino': 'PHILIPPINES', 'phl': 'PHILIPPINES',
    // Australia
    'australian': 'AUSTRALIA', 'aus': 'AUSTRALIA',
    // New Zealand
    'new zealander': 'NEW ZEALAND', 'kiwi': 'NEW ZEALAND', 'nzl': 'NEW ZEALAND',
    // France
    'french': 'FRANCE', 'pháp': 'FRANCE', 'fra': 'FRANCE',
    // Germany
    'german': 'GERMANY', 'đức': 'GERMANY', 'deu': 'GERMANY',
    // UK
    'british': 'UK', 'england': 'UK', 'gbr': 'UK', 'anh': 'UK',
    // Canada
    'canadian': 'CANADA', 'can': 'CANADA',
    // India
    'indian': 'INDIA', 'ind': 'INDIA',
    // Taiwan
    'taiwanese': 'TAIWAN', 'twn': 'TAIWAN',
  };

  const normalizedLower = normalized.toLowerCase();
  for (const [key, code] of Object.entries(countryMap)) {
    if (normalizedLower.includes(key)) {
      return code;
    }
  }

  // Return as-is if already uppercase and reasonable
  if (/^[A-Z\s]+$/.test(normalized) && normalized.length <= 20) {
    return normalized;
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
 * Optimized for international passports and travel documents
 * @param ocr - Raw OCR output from Gemini
 * @returns Partial form data structure for merging with form state
 */
export function mapOCRToTravelForm(ocr: Partial<TravelOCROutput>): TravelFormData {
  // For international passports, prefer passport number over CCCD
  const personalId = ocr.soHoChieu || ocr.soCCCD || '';

  // Determine nationality based on document type:
  // - Passport: use quocTich, fallback to issuingCountry (passport holder = citizen)
  // - Resident Card: use quocTich only (resident ≠ citizen), do NOT use issuingCountry
  // - Visa: use quocTich from MRZ nationality field
  let nationality = ocr.quocTich;
  if (!nationality && ocr.documentType === 'PASSPORT' && ocr.issuingCountry) {
    nationality = ocr.issuingCountry;
  }
  const country = mapCountryCode(nationality);

  return {
    insuredPerson: {
      name: ocr.hoTenKhongDau || ocr.hoTen || '',
      dob: convertDateFormat(ocr.ngaySinh),
      gender: convertGender(ocr.gioiTinh),
      country,
      personalId,
      address: ocr.diaChi || ocr.noiSinh || '',
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
