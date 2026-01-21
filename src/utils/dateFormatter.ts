/**
 * Date Formatting Utilities
 *
 * Provides auto-formatting for date inputs to ensure strict dd/mm/yyyy format
 * matching backend validation requirements.
 */

/**
 * Format date input as user types to dd/mm/yyyy format
 * Auto-adds slashes and prevents invalid input
 *
 * @param value - Raw input value from user
 * @returns Formatted date string in dd/mm/yyyy format
 *
 * @example
 * formatDateInput('02')      // '02'
 * formatDateInput('022')     // '02/2'
 * formatDateInput('0222')    // '02/22'
 * formatDateInput('02222025') // '02/22/2025'
 */
export function formatDateInput(value: string): string {
  // Remove all non-numeric characters except slashes
  let cleaned = value.replace(/[^\d/]/g, '');

  // Remove any existing slashes for re-formatting
  const digitsOnly = cleaned.replace(/\//g, '');

  // Build formatted string based on length
  let formatted = '';

  for (let i = 0; i < digitsOnly.length && i < 8; i++) {
    // Add slash after day (position 2)
    if (i === 2) {
      formatted += '/';
    }
    // Add slash after month (position 4, accounting for first slash)
    if (i === 4) {
      formatted += '/';
    }
    formatted += digitsOnly[i];
  }

  return formatted;
}

/**
 * Normalize date string to strict dd/mm/yyyy format
 * Adds leading zeros to day and month if needed
 *
 * @param value - Date string in various formats (d/m/yyyy, dd/m/yyyy, etc.)
 * @returns Normalized date string in dd/mm/yyyy format or original if invalid
 *
 * @example
 * normalizeDateFormat('2/2/2025')    // '02/02/2025'
 * normalizeDateFormat('02/2/2025')   // '02/02/2025'
 * normalizeDateFormat('2/12/2025')   // '02/12/2025'
 * normalizeDateFormat('15/3/2025')   // '15/03/2025'
 */
export function normalizeDateFormat(value: string): string {
  if (!value) return value;

  // Check if already in correct format
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
    return value;
  }

  // Try to parse flexible format: d/m/yyyy or dd/m/yyyy or d/mm/yyyy
  const match = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);

  if (!match) {
    return value; // Return original if doesn't match expected pattern
  }

  const [, day, month, year] = match;

  // Pad day and month with leading zeros
  const paddedDay = day.padStart(2, '0');
  const paddedMonth = month.padStart(2, '0');

  return `${paddedDay}/${paddedMonth}/${year}`;
}

/**
 * Validate if date string is in strict dd/mm/yyyy format
 *
 * @param value - Date string to validate
 * @returns true if format is valid, false otherwise
 */
export function isValidDateFormat(value: string): boolean {
  return /^\d{2}\/\d{2}\/\d{4}$/.test(value);
}

/**
 * Parse date string (dd/mm/yyyy) to Date object
 *
 * @param dateStr - Date string in dd/mm/yyyy format
 * @returns Date object or null if invalid
 */
export function parseDateString(dateStr: string): Date | null {
  if (!dateStr) return null;

  const parts = dateStr.split('/');
  if (parts.length !== 3) return null;

  const day = parseInt(parts[0]);
  const month = parseInt(parts[1]);
  const year = parseInt(parts[2]);

  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
  if (day < 1 || day > 31 || month < 1 || month > 12) return null;

  const date = new Date(year, month - 1, day);

  // Validate the date is real (e.g., not Feb 30)
  if (date.getDate() !== day || date.getMonth() !== month - 1 || date.getFullYear() !== year) {
    return null;
  }

  return date;
}

/**
 * Calculate insurance days between two dates (inclusive of both start and end dates)
 *
 * @param dateFrom - Start date (ISO string YYYY-MM-DD or Date object)
 * @param dateTo - End date (ISO string YYYY-MM-DD or Date object)
 * @returns Number of days including both start and end dates
 *
 * @example
 * calculateInsuranceDays('2025-01-01', '2025-01-02') // 2 (includes both days)
 * calculateInsuranceDays('2025-01-01', '2025-01-01') // 1 (same day)
 */
export function calculateInsuranceDays(
  dateFrom: string | Date,
  dateTo: string | Date
): number {
  const from = typeof dateFrom === 'string' ? new Date(dateFrom) : dateFrom;
  const to = typeof dateTo === 'string' ? new Date(dateTo) : dateTo;

  if (isNaN(from.getTime()) || isNaN(to.getTime())) return 0;

  const diffTime = Math.abs(to.getTime() - from.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays + 1; // Include both start and end dates
}
