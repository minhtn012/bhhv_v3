/**
 * BHV HTML Parser - Parse premium information from BHV API HTML response
 */

export interface BhvPremiumData {
  bhvc: number;    // Bảo hiểm vật chất (total - TNDS - NNTX)
  tnds: number;    // TNDS (phí + thuế gộp)
  nntx: number;    // NNTX (phí + thuế gộp)
  totalPremium: number;
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
    // Initialize result
    const result: BhvPremiumData = {
      bhvc: 0,
      tnds: 0,
      nntx: 0,
      totalPremium: 0
    };

    // Parse total premium first
    result.totalPremium = parseTotalPremium(htmlContent);

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

    // Identify specific packages by name patterns
    packages.forEach(pkg => {
      const lowerName = pkg.name.toLowerCase();

      if (lowerName.includes('tnds') || lowerName.includes('trách nhiệm dân sự')) {
        result.tnds = pkg.total;
      } else if (lowerName.includes('nntx') || lowerName.includes('người ngồi')) {
        result.nntx = pkg.total;
      }
    });

    // Calculate BHVC (Physical damage insurance) = Total - TNDS - NNTX
    result.bhvc = result.totalPremium - result.tnds - result.nntx;

    // Ensure no negative values
    result.bhvc = Math.max(0, result.bhvc);
    result.tnds = Math.max(0, result.tnds);
    result.nntx = Math.max(0, result.nntx);

    console.log('Final parsed premium data:', result);

    return result;

  } catch (error) {
    console.error('Error parsing BHV HTML response:', error);
    return {
      bhvc: 0,
      tnds: 0,
      nntx: 0,
      totalPremium: 0
    };
  }
}

/**
 * Validate premium data consistency
 */
export function validatePremiumData(data: BhvPremiumData): boolean {
  // Check if total roughly equals sum of components (allowing for rounding)
  const calculatedTotal = data.bhvc + data.tnds + data.nntx;
  const difference = Math.abs(calculatedTotal - data.totalPremium);
  const tolerance = data.totalPremium * 0.01; // 1% tolerance

  return difference <= tolerance;
}