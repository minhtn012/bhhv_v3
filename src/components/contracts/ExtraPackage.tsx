/**
 * ExtraPackage Component
 *
 * Displays optional/extra insurance packages (BS007, BS008, BS009) as checkboxes.
 * Packages are configured via NEXT_PUBLIC_EXTRA_PACKAGES environment variable.
 */

import { getEnabledExtraPackages, type ExtraPackageOption } from '@/config/extra-packages';

interface ExtraPackageProps {
  selectedPackages: Array<{
    code: string;
    name: string;
    value: string;
  }>;
  onSelect: (packages: Array<{code: string; name: string; value: string}>) => void;
  disabled?: boolean;
}

export default function ExtraPackage({
  selectedPackages,
  onSelect,
  disabled = false
}: ExtraPackageProps) {
  const availablePackages = getEnabledExtraPackages();

  // Handle checkbox toggle
  const handleToggle = (pkg: ExtraPackageOption) => {
    if (disabled) return;

    const isSelected = selectedPackages.some(p => p.code === pkg.code);

    if (isSelected) {
      // Remove package
      onSelect(selectedPackages.filter(p => p.code !== pkg.code));
    } else {
      // Add package
      onSelect([...selectedPackages, {
        code: pkg.code,
        name: pkg.name,
        value: pkg.value
      }]);
    }
  };

  // Don't render if no packages available
  if (availablePackages.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-3">
      {availablePackages.map(pkg => {
        const isSelected = selectedPackages.some(p => p.code === pkg.code);

        return (
          <label
            key={pkg.code}
            className={`inline-flex items-center px-4 py-2 border rounded-lg cursor-pointer transition-all ${
              isSelected
                ? 'border-blue-400 bg-blue-500/10 text-blue-400'
                : disabled
                  ? 'border-gray-600 opacity-50 cursor-not-allowed text-gray-500'
                  : 'border-white/20 hover:border-blue-400/50 hover:bg-blue-500/5 text-gray-300'
            }`}
          >
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => handleToggle(pkg)}
              disabled={disabled}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-900 rounded"
            />
            <span className="ml-2 font-medium">{pkg.code}</span>
          </label>
        );
      })}
    </div>
  );
}
