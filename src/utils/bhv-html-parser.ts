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
 * Parse total premium from hidden input
 */
function parseTotalPremium(htmlContent: string): number {
  const totalMatch = htmlContent.match(/id="hdf_total_premium"[^>]*value="([^"]*)"/) ||
                    htmlContent.match(/name="total_premium"[^>]*value="([^"]*)"/) ||
                    htmlContent.match(/id="total_payment_row"[^>]*>\s*([^<]*)/);

  if (totalMatch) {
    return parsePremiumAmount(totalMatch[1]);
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
    const name = nameMatch ? nameMatch[2].trim() : `Package ${packageNumber}`;

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

    // Parse total premium first
    const totalAfterTax = parseTotalPremium(htmlContent);
    result.totalPremium.afterTax = totalAfterTax;

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

      if (lowerName.includes('tnds') || lowerName.includes('trách nhiệm dân sự')) {
        result.tnds.beforeTax = pkg.premium;
        result.tnds.afterTax = pkg.total;
      } else if (lowerName.includes('nntx') || lowerName.includes('người ngồi')) {
        result.nntx.beforeTax = pkg.premium;
        result.nntx.afterTax = pkg.total;
      }
    });

    // Calculate total before tax (round to avoid floating-point errors)
    result.totalPremium.beforeTax = Math.round(result.tnds.beforeTax + result.nntx.beforeTax);

    // Calculate BHVC (Physical damage insurance) = Total - TNDS - NNTX (round to avoid floating-point errors)
    result.bhvc.afterTax = Math.round(result.totalPremium.afterTax - result.tnds.afterTax - result.nntx.afterTax);
    result.bhvc.beforeTax = Math.round(result.totalPremium.beforeTax - result.tnds.beforeTax - result.nntx.beforeTax);

    // If we don't have detailed breakdown, estimate BHVC before tax
    if (result.bhvc.beforeTax <= 0 && result.bhvc.afterTax > 0) {
      // Estimate before tax as ~90% of after tax (assuming 10% VAT) - round to avoid floating-point errors
      result.bhvc.beforeTax = Math.round(result.bhvc.afterTax / 1.1);
      result.totalPremium.beforeTax = Math.round(result.bhvc.beforeTax + result.tnds.beforeTax + result.nntx.beforeTax);
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