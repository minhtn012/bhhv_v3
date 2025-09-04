import { useState } from 'react';
import { 
  calculateInsuranceRates, 
  formatCurrency,
  parseCurrency,
  packageLabels,
  tndsCategories,
  type CalculationResult 
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

export default function useInsuranceCalculation() {
  const [calculationResult, setCalculationResult] = useState<CalculationResult | null>(null);
  const [availablePackages, setAvailablePackages] = useState<Array<{
    index: number;
    name: string;
    details: string;
    rate: number;
    fee: number;
    available: boolean;
  }>>([]);

  const calculateRates = (formData: FormData) => {
    const giaTriXe = parseCurrency(formData.giaTriXe);
    const namSanXuat = Number(formData.namSanXuat);
    const soChoNgoi = Number(formData.soChoNgoi);
    const trongTai = Number(formData.trongTai) || 0;

    const result = calculateInsuranceRates(
      giaTriXe,
      namSanXuat,
      soChoNgoi,
      formData.loaiHinhKinhDoanh,
      trongTai
    );

    setCalculationResult(result);

    const packages = packageLabels.map((pkg, index) => {
      const rate = result.finalRates[index];
      let fee = 0;
      let available = rate !== null;

      if (available) {
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
        fee,
        available
      };
    });

    setAvailablePackages(packages);
    
    return {
      result,
      packages,
      defaultTndsCategory: result.tndsKey
    };
  };

  const calculateTotal = (formData: FormData) => {
    if (!calculationResult || availablePackages.length === 0) return 0;

    let total = 0;

    const selectedPackage = availablePackages[formData.selectedPackageIndex];
    if (selectedPackage && selectedPackage.available) {
      total += selectedPackage.fee;
    }

    if (formData.includeTNDS && formData.tndsCategory && tndsCategories[formData.tndsCategory]) {
      total += tndsCategories[formData.tndsCategory].fee;
    }

    if (formData.includeNNTX && calculationResult.nntxFee) {
      total += calculationResult.nntxFee;
    }

    return total;
  };

  return {
    calculationResult,
    availablePackages,
    calculateRates,
    calculateTotal
  };
}