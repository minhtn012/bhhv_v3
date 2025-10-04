/**
 * BHV HTML Parser - Parse premium information from BHV API HTML response
 */

export interface BhvPremiumData {
  bhvc: {
    beforeTax: number;    // Phí trước thuế
    afterTax: number;     // Phí sau thuế (gộp)
  };
  tnds: {
    beforeTax: number;    // Phí trước thuế
    afterTax: number;     // Phí sau thuế (gộp)
  };
  nntx: {
    beforeTax: number;    // Phí trước thuế
    afterTax: number;     // Phí sau thuế (gộp)
  };
  totalPremium: {
    beforeTax: number;    // Tổng phí trước thuế
    afterTax: number;     // Tổng phí sau thuế
  };
}

export interface InsurancePackage {
  name: string;
  premium: number;
  tax: number;
  total: number;
}

/**
 * Decode HTML entities to actual characters
 */
function decodeHtmlEntities(text: string): string {
  const entities: { [key: string]: string } = {
    '&#x1EA3;': 'ả', '&#x1EC3;': 'ể', '&#x1EE3;': 'ợ', '&#x1ED3;': 'ồ',
    '&#x1B0;': 'ư', '&#x1EDD;': 'ờ', '&#x111;': 'đ', '&#x1ED1;': 'ố',
    '&#x1EDB;': 'ớ', '&#xE1;': 'á', '&#xE0;': 'à', '&#x1EA1;': 'ạ',
    '&#x1EE7;': 'ủ', '&#x1EE5;': 'ụ', '&#xF4;': 'ô', '&#xE2;': 'â',
    '&#x1EA7;': 'ầ', '&#x1EA5;': 'ấ', '&#x1EAD;': 'ậ', '&#xE9;': 'é',
    '&#xE8;': 'è', '&#x1EB9;': 'ẹ', '&#x1EBF;': 'ế', '&#x1EC1;': 'ề',
    '&#x1EC7;': 'ệ', '&#xED;': 'í', '&#xEC;': 'ì', '&#x1ECB;': 'ị',
    '&#xF3;': 'ó', '&#xF2;': 'ò', '&#x1ECD;': 'ọ', '&#x1ED9;': 'ộ',
    '&#xFA;': 'ú', '&#xF9;': 'ù', '&#x1EE9;': 'ứ', '&#x1EEB;': 'ừ',
    '&#x1EF1;': 'ự', '&#xFD;': 'ý', '&#x1EF3;': 'ỳ', '&#x1EF5;': 'ỵ',
    '&#xEA;': 'ê', '&#x1EAF;': 'ắ', '&#x1EE1;': 'ở', '&#x1EED;': 'ử',
    '&#x1EEF;': 'ữ'
  };

  let decoded = text;
  for (const [entity, char] of Object.entries(entities)) {
    decoded = decoded.replace(new RegExp(entity, 'gi'), char);
  }
  return decoded;
}

/**
 * Parse premium amounts from HTML text
 */
function parsePremiumAmount(text: string): number {
  // Remove all non-digit characters except dots for thousands separator
  const cleanText = text.replace(/[^\d.]/g, '');
  // Remove dots (thousands separator) and convert to number
  const amount = parseInt(cleanText.replace(/\./g, ''), 10);
  return isNaN(amount) ? 0 : amount;
}

/**
 * Parse total premium before tax (Tổng phí bảo hiểm) from HTML
 */
function parseTotalPremiumBeforeTax(htmlContent: string): number {
  // Look for "Tổng phí bảo hiểm" or "T&#x1ED5;ng ph&#xED; b&#x1EA3;o hi&#x1EC3;m" pattern
  const beforeTaxMatch = htmlContent.match(/<h6>T[^<]*ng\s+ph[^<]*\s+b[^<]*o\s+hi[^<]*m<\/h6>\s*<h6>([^<]+)<\/h6>/) ||
                        htmlContent.match(/Tổng phí bảo hiểm<\/h6>\s*<h6>([^<]+)<\/h6>/i);

  if (beforeTaxMatch) {
    return parsePremiumAmount(beforeTaxMatch[1]);
  }

  return 0;
}

/**
 * Parse total premium after tax (Tổng phí thanh toán) from HTML
 */
function parseTotalPremiumAfterTax(htmlContent: string): number {
  // Look for "Tổng phí thanh toán" pattern or existing total_payment_row
  const afterTaxMatch = htmlContent.match(/<h5>T[^<]*ng\s+ph[^<]*\s+thanh\s+to[^<]*n<\/h5>\s*<h5>[^>]*>\s*([^<]+)/) ||
                       htmlContent.match(/Tổng phí thanh toán<\/h5>\s*<h5>[^>]*>\s*([^<]+)/i) ||
                       htmlContent.match(/id="total_payment_row"[^>]*>\s*([^<]*)/);

  if (afterTaxMatch) {
    return parsePremiumAmount(afterTaxMatch[1]);
  }

  return 0;
}

/**
 * Parse individual insurance package from HTML
 */
function parseInsurancePackage(htmlSection: string, packageNumber: number): InsurancePackage | null {
  try {
    // Extract package name (after the number)
    const nameMatch = htmlSection.match(/<h6>(\d+\.?\s*)([^<]+)<\/h6>/);
    const rawName = nameMatch ? nameMatch[2].trim() : `Package ${packageNumber}`;
    // Decode HTML entities to get actual Vietnamese characters
    const name = decodeHtmlEntities(rawName);

    // Extract premium amount
    const premiumMatch = htmlSection.match(/Phí bảo hiểm:[^>]*>\s*<h6>([^<]+)<\/h6>/);
    const premium = premiumMatch ? parsePremiumAmount(premiumMatch[1]) : 0;

    // Extract tax amount
    const taxMatch = htmlSection.match(/Thuế:[^>]*>\s*<h6>([^<]+)<\/h6>/);
    const tax = taxMatch ? parsePremiumAmount(taxMatch[1]) : 0;

    return {
      name,
      premium,
      tax,
      total: premium + tax
    };
  } catch (error) {
    console.error(`Error parsing insurance package ${packageNumber}:`, error);
    return null;
  }
}

/**
 * Parse BHV HTML response to extract premium data
 */
export function parseBhvHtmlResponse(htmlContent: string): BhvPremiumData {
  try {
    // Initialize result with new structure
    const result: BhvPremiumData = {
      bhvc: { beforeTax: 0, afterTax: 0 },
      tnds: { beforeTax: 0, afterTax: 0 },
      nntx: { beforeTax: 0, afterTax: 0 },
      totalPremium: { beforeTax: 0, afterTax: 0 }
    };

    // Parse total premiums directly from HTML
    result.totalPremium.beforeTax = parseTotalPremiumBeforeTax(htmlContent);
    result.totalPremium.afterTax = parseTotalPremiumAfterTax(htmlContent);

    // Split HTML into sections by <hr class="my-4">
    const sections = htmlContent.split(/<hr\s+class="my-4">/);
    const packages: InsurancePackage[] = [];

    // Parse each insurance package section
    sections.forEach((section, index) => {
      // Look for insurance package sections (contain "Phí bảo hiểm:")
      if (section.includes('Phí bảo hiểm:') && section.includes('Thuế:')) {
        const packageData = parseInsurancePackage(section, index);
        if (packageData) {
          packages.push(packageData);
        }
      }
    });

    console.log('Parsed insurance packages:', packages);

    // Identify specific packages by name patterns and extract both tax values
    packages.forEach(pkg => {
      const lowerName = pkg.name.toLowerCase();

      if (lowerName.includes('vật chất') || lowerName.includes('bhvc')) {
        result.bhvc.beforeTax = pkg.premium;
        result.bhvc.afterTax = pkg.total;
      } else if (lowerName.includes('tnds') || lowerName.includes('trách nhiệm dân sự')) {
        result.tnds.beforeTax = pkg.premium;
        result.tnds.afterTax = pkg.total;
      } else if (lowerName.includes('nntx') || lowerName.includes('người ngồi')) {
        result.nntx.beforeTax = pkg.premium;
        result.nntx.afterTax = pkg.total;
      }
    });

    // Total premiums are already parsed from HTML
    // If not found, fallback to calculating from individual packages
    if (result.totalPremium.beforeTax === 0) {
      result.totalPremium.beforeTax = Math.round(result.bhvc.beforeTax + result.tnds.beforeTax + result.nntx.beforeTax);
    }
    if (result.totalPremium.afterTax === 0) {
      result.totalPremium.afterTax = Math.round(result.bhvc.afterTax + result.tnds.afterTax + result.nntx.afterTax);
    }

    // Ensure no negative values
    result.bhvc.beforeTax = Math.max(0, result.bhvc.beforeTax);
    result.bhvc.afterTax = Math.max(0, result.bhvc.afterTax);
    result.tnds.beforeTax = Math.max(0, result.tnds.beforeTax);
    result.tnds.afterTax = Math.max(0, result.tnds.afterTax);
    result.nntx.beforeTax = Math.max(0, result.nntx.beforeTax);
    result.nntx.afterTax = Math.max(0, result.nntx.afterTax);

    console.log('Final parsed premium data:', result);

    return result;

  } catch (error) {
    console.error('Error parsing BHV HTML response:', error);
    return {
      bhvc: { beforeTax: 0, afterTax: 0 },
      tnds: { beforeTax: 0, afterTax: 0 },
      nntx: { beforeTax: 0, afterTax: 0 },
      totalPremium: { beforeTax: 0, afterTax: 0 }
    };
  }
}

/**
 * Validate premium data consistency
 */
export function validatePremiumData(data: BhvPremiumData): boolean {
  // Check if total roughly equals sum of components (allowing for rounding)
  const calculatedTotalAfterTax = data.bhvc.afterTax + data.tnds.afterTax + data.nntx.afterTax;
  const calculatedTotalBeforeTax = data.bhvc.beforeTax + data.tnds.beforeTax + data.nntx.beforeTax;

  const differenceAfterTax = Math.abs(calculatedTotalAfterTax - data.totalPremium.afterTax);
  const differenceBeforeTax = Math.abs(calculatedTotalBeforeTax - data.totalPremium.beforeTax);

  const toleranceAfterTax = data.totalPremium.afterTax * 0.01; // 1% tolerance
  const toleranceBeforeTax = data.totalPremium.beforeTax * 0.01; // 1% tolerance

  return differenceAfterTax <= toleranceAfterTax && differenceBeforeTax <= toleranceBeforeTax;
}