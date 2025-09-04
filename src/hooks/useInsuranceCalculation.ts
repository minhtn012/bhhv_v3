import { useState, useCallback } from 'react';
import { 
  calculateInsuranceRates, 
  calculateWithCustomRates,
  suggestTNDSCategory,
  calculateNNTXFee,
  formatCurrency,
  parseCurrency,
  packageLabels,
  tndsCategories,
  type CalculationResult,
  type EnhancedCalculationResult
} from '@/utils/insurance-calculator';

interface FormData {
  giaTriXe: string;
  namSanXuat: number | '';
  soChoNgoi: number | '';
  trongTai: number | '';
  loaiHinhKinhDoanh: string;
  selectedPackageIndex: number;
  includeTNDS: boolean;
  tndsCategory: string;
  includeNNTX: boolean;
}

interface PackageOption {
  index: number;
  name: string;
  details: string;
  rate: number;
  customRate?: number;
  fee: number;
  available: boolean;
}

export default function useInsuranceCalculation() {
  const [calculationResult, setCalculationResult] = useState<CalculationResult | null>(null);
  const [enhancedResult, setEnhancedResult] = useState<EnhancedCalculationResult | null>(null);
  const [availablePackages, setAvailablePackages] = useState<PackageOption[]>([]);
  const [customRates, setCustomRates] = useState<number[]>([]);

  const calculateRates = useCallback((formData: FormData) => {
    const giaTriXe = parseCurrency(formData.giaTriXe);
    const namSanXuat = Number(formData.namSanXuat);
    const soChoNgoi = Number(formData.soChoNgoi);
    const trongTai = Number(formData.trongTai) || 0;

    if (giaTriXe <= 0 || namSanXuat <= 1980 || soChoNgoi <= 0) {
      setCalculationResult(null);
      setEnhancedResult(null);
      setAvailablePackages([]);
      setCustomRates([]);
      return { result: null, packages: [], defaultTndsCategory: null };
    }

    const result = calculateInsuranceRates(
      giaTriXe,
      namSanXuat,
      soChoNgoi,
      formData.loaiHinhKinhDoanh,
      trongTai
    );

    setCalculationResult(result);

    const packages: PackageOption[] = packageLabels.map((pkg, index) => {
      const rate = result.finalRates[index];
      let fee = 0;
      let available = rate !== null;

      if (available && rate !== null) {
        fee = (giaTriXe * rate) / 100;
        
        const isMinFeeApplicable = formData.loaiHinhKinhDoanh === 'khong_kd_cho_nguoi' && giaTriXe < 500000000;
        if (isMinFeeApplicable && fee < 5500000) {
          fee = 5500000;
        }
      }

      return {
        index,
        name: pkg.name,
        details: pkg.details,
        rate: rate || 0,
        customRate: rate || 0,
        fee,
        available
      };
    });

    setAvailablePackages(packages);
    
    // Initialize custom rates
    const initialCustomRates = result.finalRates.map(rate => rate || 0);
    setCustomRates(initialCustomRates);
    
    return {
      result,
      packages,
      defaultTndsCategory: result.tndsKey
    };
  }, []);

  // Enhanced calculation with custom rates
  const calculateEnhanced = useCallback((formData: FormData) => {
    if (!calculationResult || customRates.length === 0) {
      setEnhancedResult(null);
      return null;
    }

    const giaTriXe = parseCurrency(formData.giaTriXe);
    const namSanXuat = Number(formData.namSanXuat);
    const soChoNgoi = Number(formData.soChoNgoi);
    const trongTai = Number(formData.trongTai) || 0;

    const enhanced = calculateWithCustomRates(
      giaTriXe,
      namSanXuat,
      soChoNgoi,
      formData.loaiHinhKinhDoanh,
      formData.selectedPackageIndex,
      customRates,
      formData.includeTNDS,
      formData.tndsCategory,
      formData.includeNNTX,
      trongTai
    );

    setEnhancedResult(enhanced);
    return enhanced;
  }, [calculationResult, customRates]);

  const calculateTotal = (formData: FormData) => {
    if (enhancedResult) {
      return enhancedResult.grandTotal;
    }

    if (!calculationResult || availablePackages.length === 0) return 0;

    let total = 0;

    // Use the selected package with custom rate if available
    const selectedPackage = availablePackages[formData.selectedPackageIndex];
    if (selectedPackage && selectedPackage.available) {
      // Always use the fee from availablePackages as it's updated with custom rates
      total += selectedPackage.fee;
    }

    if (formData.includeTNDS && formData.tndsCategory && tndsCategories[formData.tndsCategory as keyof typeof tndsCategories]) {
      total += tndsCategories[formData.tndsCategory as keyof typeof tndsCategories].fee;
    }

    if (formData.includeNNTX && calculationResult.nntxFee) {
      total += calculationResult.nntxFee;
    }

    return total;
  };

  // Update package rate and sync with availablePackages
  const updatePackageRate = useCallback((packageIndex: number, newRate: number, newFee: number) => {
    setCustomRates(prev => {
      const updated = [...prev];
      updated[packageIndex] = newRate;
      return updated;
    });

    setAvailablePackages(prev => 
      prev.map(pkg => 
        pkg.index === packageIndex 
          ? { ...pkg, customRate: newRate, fee: newFee }
          : pkg
      )
    );
  }, []);

  // Ensure selected package fee is accurate
  const syncPackageFee = useCallback((packageIndex: number, giaTriXe: number, loaiHinhKinhDoanh: string) => {
    setAvailablePackages(prev => 
      prev.map(pkg => {
        if (pkg.index !== packageIndex) return pkg;
        
        const rate = pkg.customRate !== undefined ? pkg.customRate : pkg.rate;
        let fee = (giaTriXe * rate) / 100;
        
        // Apply minimum fee logic
        const isMinFeeApplicable = loaiHinhKinhDoanh === 'khong_kd_cho_nguoi' && giaTriXe < 500000000;
        if (isMinFeeApplicable && fee < 5500000) {
          fee = 5500000;
        }
        
        return { ...pkg, fee };
      })
    );
  }, []);

  // Auto-suggest TNDS category
  const autoSuggestTNDS = useCallback((formData: FormData) => {
    const soChoNgoi = Number(formData.soChoNgoi);
    const trongTai = Number(formData.trongTai) || 0;
    
    return suggestTNDSCategory(
      formData.loaiHinhKinhDoanh,
      soChoNgoi,
      trongTai
    );
  }, []);

  return {
    calculationResult,
    enhancedResult,
    availablePackages,
    customRates,
    calculateRates,
    calculateEnhanced,
    calculateTotal,
    updatePackageRate,
    syncPackageFee,
    autoSuggestTNDS
  };
}