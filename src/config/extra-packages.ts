/**
 * Extra Insurance Packages Configuration
 *
 * Manages environment-based configuration for optional/extra insurance packages.
 * Packages are configured via NEXT_PUBLIC_EXTRA_PACKAGES environment variable.
 */

import { packageLabelsDetail } from '@/utils/insurance-calculator';

/**
 * Package structure for extra insurance options
 */
export interface ExtraPackageOption {
  code: string;
  name: string;
  value: string;
}

/**
 * Get enabled extra packages from environment configuration
 *
 * Reads NEXT_PUBLIC_EXTRA_PACKAGES environment variable (comma-separated BS codes)
 * and returns matching package details from packageLabelsDetail.
 *
 * @returns Array of extra package options that are enabled via environment
 *
 * @example
 * // With NEXT_PUBLIC_EXTRA_PACKAGES=BS007,BS009
 * getEnabledExtraPackages() // Returns [{code: "BS007", ...}, {code: "BS009", ...}]
 *
 * // With NEXT_PUBLIC_EXTRA_PACKAGES="" or undefined
 * getEnabledExtraPackages() // Returns []
 */
export function getEnabledExtraPackages(): ExtraPackageOption[] {
  const envPackages = process.env.NEXT_PUBLIC_EXTRA_PACKAGES || '';

  // Feature disabled if env variable is empty
  if (!envPackages.trim()) {
    return [];
  }

  // Parse comma-separated codes and trim whitespace
  const enabledCodes = envPackages
    .split(',')
    .map(code => code.trim())
    .filter(code => code.length > 0);

  // Filter packageLabelsDetail for enabled codes
  return packageLabelsDetail
    .filter(pkg => enabledCodes.includes(pkg.code))
    .map(pkg => ({
      code: pkg.code,
      name: pkg.name,
      value: pkg.value
    }));
}

/**
 * Check if extra packages feature is enabled
 *
 * @returns true if at least one extra package is configured, false otherwise
 *
 * @example
 * if (isExtraPackagesEnabled()) {
 *   // Show extra packages UI
 * }
 */
export function isExtraPackagesEnabled(): boolean {
  return getEnabledExtraPackages().length > 0;
}

/**
 * Validate if a package code is an enabled extra package
 *
 * @param code - Package code to validate (e.g., "BS007")
 * @returns true if the code is in enabled extra packages list
 */
export function isValidExtraPackage(code: string): boolean {
  const enabledPackages = getEnabledExtraPackages();
  return enabledPackages.some(pkg => pkg.code === code);
}
