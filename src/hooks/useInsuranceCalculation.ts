import { useState, useCallback } from 'react';
import { 
  calculateInsuranceRates, 
  calculateWithCustomRates,
  calculateCustomFee,
  suggestTNDSCategory,
  parseCurrency,
  packageLabels,
  tndsCategories,
  type CalculationResult,
  type EnhancedCalculationResult
} from '@/utils/insurance-calculator';
import { type InsuranceCalculationFormData } from '@/types/contract';

interface PackageOption {
  index: number;
  name: string;
  details: string;
  rate: number;
  fee: number;
  available: boolean;
}

export default function useInsuranceCalculation() {
  const [calculationResult, setCalculationResult] = useState<CalculationResult | null>(null);
  const [enhancedResult, setEnhancedResult] = useState<EnhancedCalculationResult | null>(null);
  const [availablePackages, setAvailablePackages] = useState<PackageOption[]>([]);
  const [customRates, setCustomRates] = useState<number[]>([]);

  const calculateRates = useCallback((formData: InsuranceCalculationFormData) => {
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
      trongTai,
      formData.loaiDongCo,
      formData.giaTriPin,
      formData.ngayDKLD
    );

    setCalculationResult(result);

    const packages: PackageOption[] = packageLabels.map((pkg, index) => {
      const rate = result.finalRates[index];
      let fee = 0;
      let available = rate !== null;

      if (available && rate !== null) {
        const { fee: calculatedFee, batteryFee } = calculateCustomFee(giaTriXe, rate, formData.loaiHinhKinhDoanh, formData.loaiDongCo, formData.giaTriPin);
        fee = calculatedFee + batteryFee; // Total fee for display in package list
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
  const calculateEnhanced = useCallback((formData: InsuranceCalculationFormData) => {
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
      trongTai,
      formData.loaiDongCo,
      formData.giaTriPin,
      formData.ngayDKLD,
      formData.taiTucPercentage
    );

    setEnhancedResult(enhanced);
    return enhanced;
  }, [calculationResult, customRates]);

  const calculateTotal = (formData: InsuranceCalculationFormData) => {
    // Always use direct calculation for consistency with displayed values
    if (!calculationResult || availablePackages.length === 0) return 0;

    let total = 0;

    // 1. Phí bảo hiểm Vật chất
    const selectedPackage = availablePackages[formData.selectedPackageIndex];
    if (selectedPackage && selectedPackage.available) {
      // Always use the fee from availablePackages as it's updated with custom rates
      total += selectedPackage.fee;
    }

    // 2. Phí TNDS Bắt buộc
    if (formData.includeTNDS && formData.tndsCategory && tndsCategories[formData.tndsCategory as keyof typeof tndsCategories]) {
      total += tndsCategories[formData.tndsCategory as keyof typeof tndsCategories].fee;
    }

    // 3. Phí Người ngồi trên xe - skip for now, will be handled by PriceSummaryCard's async calculation
    // We'll let the parent component handle the NNTX fee calculation to avoid double calculation
    // The PriceSummaryCard component has its own async NNTX calculation that should be authoritative

    // 4. Tái tục/ Cấp mới - based on vehicle value
    const vehicleValue = parseCurrency(formData.giaTriXe);
    const adjustment = (vehicleValue * formData.taiTucPercentage) / 100;
    total += adjustment;

    return total;
  };


  // Ensure selected package fee is accurate
  const syncPackageFee = useCallback((packageIndex: number, giaTriXe: number, loaiHinhKinhDoanh: string, loaiDongCo?: string, giaTriPin?: string) => {
    setAvailablePackages(prev => 
      prev.map(pkg => {
        if (pkg.index !== packageIndex) return pkg;
        
        const rate = pkg.customRate !== undefined ? pkg.customRate : pkg.rate;
        const { fee: baseFee, batteryFee } = calculateCustomFee(giaTriXe, rate, loaiHinhKinhDoanh, loaiDongCo, giaTriPin);
        const totalFee = baseFee + batteryFee;
        
        return { ...pkg, fee: totalFee };
      })
    );
  }, []);

  // Auto-suggest TNDS category
  const autoSuggestTNDS = useCallback((formData: InsuranceCalculationFormData) => {
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
    syncPackageFee,
    autoSuggestTNDS
  };
}