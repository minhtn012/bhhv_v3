/**
 * Pacific Cross Travel Insurance Data Mapper
 * Transforms form data to Pacific Cross API format
 */

import type { TravelContractFormData } from './types';
import { TRAVEL_PRODUCT_LABELS } from './constants';
import { calculateInsuranceDays } from '@/utils/dateFormatter';

/**
 * Format date to DD/MM/YYYY for Pacific Cross
 */
export function formatDateForPC(dateStr: string): string {
  // Already in DD/MM/YYYY format
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
    return dateStr;
  }

  // Parse ISO date (YYYY-MM-DD)
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;

  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Format date range string
 */
export function formatDateRange(dateFrom: string, dateTo: string): string {
  return `${formatDateForPC(dateFrom)} - ${formatDateForPC(dateTo)}`;
}

/**
 * Calculate number of days between two dates (inclusive)
 */
export function calculateDays(dateFrom: string, dateTo: string): number {
  return calculateInsuranceDays(dateFrom, dateTo);
}

/**
 * Calculate age from date of birth
 */
export function calculateAge(dob: string): number {
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

/**
 * Map insured person to indexed form fields
 */
export function mapInsuredPerson(
  person: TravelContractFormData['insuredPersons'][0],
  index: number
): Record<string, string> {
  const suffix = `_${index + 1}`;
  return {
    [`name${suffix}`]: person.name,
    [`dob${suffix}`]: formatDateForPC(person.dob),
    [`age${suffix}`]: person.age.toString(),
    [`gender${suffix}`]: person.gender,
    [`country${suffix}`]: person.country,
    [`personal_id${suffix}`]: person.personalId,
    [`tel_no${suffix}`]: person.telNo || '',
    [`email${suffix}`]: person.email || '',
    [`beneficiary${suffix}`]: person.beneficiary || '',
    [`relationship${suffix}`]: person.relationship,
    [`pct${suffix}`]: person.pct.toString(),
    [`car_rental${suffix}`]: person.carRental ? '1' : '',
    [`car_rental_date${suffix}`]: person.carRentalDate || '',
    [`car_rental_days${suffix}`]: person.carRentalDays?.toString() || '',
  };
}

/**
 * Transform travel contract form data to Pacific Cross payload
 * Field order matters - must match the exact order expected by Pacific Cross API
 */
export function mapTravelToPacificCrossFormat(
  data: TravelContractFormData,
  csrfToken: string,
  isQuote: boolean = true
): Record<string, string | undefined> {
  // Use array of key-value pairs to maintain field order
  const orderedFields: Array<[string, string]> = [
    // CSRF & Quote flag
    ['_token', csrfToken],
    ['is_quote', isQuote ? '1' : '0'],
    ['last_update', ''],
    ['pnr_no', data.pnrNo || ''],
    ['poho_title', ''],
    ['ref_no', data.refNo || ''],

    // Owner info
    ['policyholder', data.owner.policyholder],
    ['pocy_type', data.owner.pocyType],
    ['poho_type', data.owner.pohoType],
    ['email', data.owner.email || ''],
    ['tel_no', data.owner.telNo],
    ['inv_tax', data.owner.invTax || ''],
    ['address', data.owner.address],
    ['inv_company', data.owner.invCompany || ''],
    ['inv_address', data.owner.invAddress || ''],
    ['country_address', data.owner.countryAddress],
    ['start_country', data.owner.startCountry],

    // Period - calculate days if not provided
    ['date_from_date_range', data.period.dateFrom],
    ['date_to_date_range', data.period.dateTo],
    ['days_date_range', (data.period.days || calculateDays(data.period.dateFrom, data.period.dateTo)).toString()],
    ['date_range', formatDateRange(data.period.dateFrom, data.period.dateTo)],

    // Product
    ['product', data.product.toString()],
    ['plan', data.plan.toString()],

    // Message file fields (file upload comes after these in multipart)
    ['agent', ''],
    ['old_message_file', '[]'],
    ['input_message_file', ''],
    // Note: 'message_file' (actual file) is added by buildMultipartBody

    // Additional fields
    ['itinerary', data.itinerary || ''],
    ['note', data.note || ''],
    ['inv_amount', data.invAmount?.toString() || ''],

    // Import members fields
    ['old_import_members', '[]'],
    ['input_import_members', ''],
    // Note: 'import_members' (actual file) is added by buildMultipartBody

    // Member count
    ['member_count', data.insuredPersons.length.toString()],
    ['member_row_deleted', ''],
  ];

  // Add insured persons (indexed by _1, _2, etc.)
  data.insuredPersons.forEach((person, index) => {
    const personFields = mapInsuredPerson(person, index);
    for (const [key, value] of Object.entries(personFields)) {
      orderedFields.push([key, value]);
    }
  });

  // Add template fields (for new row in UI)
  const templateSuffix = '_xxx';
  orderedFields.push(
    [`name${templateSuffix}`, ''],
    [`dob${templateSuffix}`, ''],
    [`age${templateSuffix}`, ''],
    [`gender${templateSuffix}`, ''],
    [`country${templateSuffix}`, ''],
    [`personal_id${templateSuffix}`, ''],
    [`tel_no${templateSuffix}`, ''],
    [`email${templateSuffix}`, ''],
    [`beneficiary${templateSuffix}`, ''],
    [`relationship${templateSuffix}`, ''],
    [`pct${templateSuffix}`, '100'],
    [`car_rental${templateSuffix}`, ''],
    [`car_rental_date${templateSuffix}`, ''],
    [`car_rental_days${templateSuffix}`, ''],
  );

  // Button field (must be last)
  orderedFields.push(['button', '']);

  // Convert to object - JavaScript objects preserve insertion order for string keys
  const payload: Record<string, string | undefined> = {};
  for (const [key, value] of orderedFields) {
    payload[key] = value;
  }

  return payload;
}

/**
 * Extract cert ID from redirect URL
 */
export function parseCertIdFromRedirect(redirectUrl: string): {
  certId: string;
  certNo: number;
} | null {
  const match = redirectUrl.match(/\/cert\/(\d+)::([^/]+)/);
  if (match) {
    return {
      certId: `${match[1]}::${match[2]}`,
      certNo: parseInt(match[1], 10),
    };
  }
  return null;
}

/**
 * Get product name from product ID
 */
export function getProductName(productId: number): string {
  return TRAVEL_PRODUCT_LABELS[productId] || `Product ${productId}`;
}
