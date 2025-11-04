'use client';

import { useState, useEffect } from 'react';
import { formatCurrency, tndsCategories, suggestTNDSCategory, getAvailableTNDSCategories, calculateNNTXFee, loadNNTXPackages } from '@/utils/insurance-calculator';
import StepperInput from '../ui/StepperInput';

interface NNTXPackage {
  name: string;
  price: number;
  price_kd?: number;
  value: string;
}

interface DynamicTNDSSelectorProps {
  loaiHinhKinhDoanh: string;
  soChoNgoi: number;
  trongTai?: number;
  includeTNDS: boolean;
  tndsCategory: string;
  includeNNTX: boolean;
  selectedNNTXPackage?: string;
  tinhTrang: string;
  mucKhauTru: number;
  taiTucPercentage: number;
  adjustmentAmount: number;
  phiTaiTucInfo?: {
    soVu: number;
    phanTramChiPhi: number;
  };
  onTNDSChange: (includeTNDS: boolean, tndsCategory: string) => void;
  onNNTXChange: (includeNNTX: boolean, packageValue?: string) => void;
  onNNTXFeeChange: (fee: number) => void;
  onTinhTrangChange: (tinhTrang: string) => void;
  onSoChoNgoiChange: (soChoNgoi: number) => void;
  onMucKhauTruChange: (mucKhauTru: number) => void;
  onTaiTucPercentageChange: (percentage: number) => void;
  onPhiTaiTucInfoChange: (info: { soVu: number; phanTramChiPhi: number }) => void;
  onRecalculate?: () => void;
}

export default function DynamicTNDSSelector({
  loaiHinhKinhDoanh,
  soChoNgoi,
  trongTai,
  includeTNDS,
  tndsCategory,
  includeNNTX,
  selectedNNTXPackage,
  tinhTrang,
  mucKhauTru,
  taiTucPercentage,
  adjustmentAmount,
  phiTaiTucInfo,
  onTNDSChange,
  onNNTXChange,
  onNNTXFeeChange,
  onTinhTrangChange,
  onSoChoNgoiChange,
  onMucKhauTruChange,
  onTaiTucPercentageChange,
  onPhiTaiTucInfoChange,
  onRecalculate
}: DynamicTNDSSelectorProps) {
  const [suggestedCategory, setSuggestedCategory] = useState<string | null>(null);
  const [nntxPackages, setNntxPackages] = useState<NNTXPackage[]>([]);
  const [nntxFee, setNntxFee] = useState(0);

  // Load NNTX packages on component mount
  useEffect(() => {
    const loadPackages = async () => {
      const packages = await loadNNTXPackages();
      setNntxPackages(packages);
    };
    loadPackages();
  }, []);

  // Auto-suggest TNDS category when vehicle info changes
  useEffect(() => {
    const suggested = suggestTNDSCategory(loaiHinhKinhDoanh, soChoNgoi, trongTai);
    setSuggestedCategory(suggested);

    // Auto-select suggested category if no category is currently selected
    if (suggested && !tndsCategory) {
      onTNDSChange(includeTNDS, suggested);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaiHinhKinhDoanh, soChoNgoi, trongTai]);

  // Update NNTX fee when package, số chỗ ngồi, or business type changes
  useEffect(() => {
    let fee = 0;
    if (includeNNTX && selectedNNTXPackage && nntxPackages.length > 0) {
      const selectedPackage = nntxPackages.find(pkg => pkg.value === selectedNNTXPackage);
      if (selectedPackage) {
        // Use business price for vehicles with 'kd_' prefix, otherwise use regular price
        const isBusinessVehicle = loaiHinhKinhDoanh?.startsWith('kd_') || false;
        const packagePrice = isBusinessVehicle ? (selectedPackage.price_kd || selectedPackage.price) : selectedPackage.price;
        fee = calculateNNTXFee(packagePrice, soChoNgoi, loaiHinhKinhDoanh);
      }
    }
    setNntxFee(fee);
    onNNTXFeeChange(fee); // Notify parent about fee change
  }, [selectedNNTXPackage, soChoNgoi, nntxPackages, loaiHinhKinhDoanh, includeNNTX]);

  // Force recalculation when business type changes (even if package was already selected)
  useEffect(() => {
    if (includeNNTX && selectedNNTXPackage && nntxPackages.length > 0) {
      const selectedPackage = nntxPackages.find(pkg => pkg.value === selectedNNTXPackage);
      if (selectedPackage) {
        const isBusinessVehicle = loaiHinhKinhDoanh?.startsWith('kd_') || false;
        const packagePrice = isBusinessVehicle ? (selectedPackage.price_kd || selectedPackage.price) : selectedPackage.price;
        const fee = calculateNNTXFee(packagePrice, soChoNgoi, loaiHinhKinhDoanh);
        console.log('NNTX Fee Debug:', { loaiHinhKinhDoanh, isBusinessVehicle, packagePrice, fee, selectedPackage });
        setNntxFee(fee);
        onNNTXFeeChange(fee);
      }
    }
  }, [loaiHinhKinhDoanh, includeNNTX, selectedNNTXPackage, nntxPackages, soChoNgoi]);

  // Get available categories for dropdown
  const availableCategories = getAvailableTNDSCategories();

  // Handle TNDS toggle
  const handleTNDSToggle = (checked: boolean) => {
    const categoryToUse = checked ? (tndsCategory || suggestedCategory || '') : tndsCategory;
    onTNDSChange(checked, categoryToUse);
    // Trigger recalculation after TNDS change
    setTimeout(() => onRecalculate?.(), 50);
  };

  // Handle TNDS category change
  const handleTNDSCategoryChange = (newCategory: string) => {
    onTNDSChange(includeTNDS, newCategory);
    // Trigger recalculation after category change
    setTimeout(() => onRecalculate?.(), 50);
  };

  // Handle NNTX toggle
  const handleNNTXToggle = (checked: boolean) => {
    onNNTXChange(checked, checked ? selectedNNTXPackage : undefined);
    // Trigger recalculation after NNTX change
    setTimeout(() => onRecalculate?.(), 50);
  };

  // Handle NNTX package change
  const handleNNTXPackageChange = (packageValue: string) => {
    onNNTXChange(includeNNTX, packageValue);
    // Trigger recalculation after package change
    setTimeout(() => onRecalculate?.(), 50);
  };

  // Get current TNDS fee
  const currentTNDSFee = tndsCategory && tndsCategories[tndsCategory as keyof typeof tndsCategories] 
    ? tndsCategories[tndsCategory as keyof typeof tndsCategories].fee 
    : 0;

  return (
    <div>
      <h3 className="text-lg font-semibold text-white mb-3">B. Các hạng mục khác</h3>
      <div className="space-y-3">
        {/* TNDS Section */}
        <div className="p-3 bg-white/10 border border-white/20 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input 
                type="checkbox" 
                id="include-tnds"
                checked={includeTNDS}
                onChange={(e) => handleTNDSToggle(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="include-tnds" className="ml-3 text-gray-300">
                Bảo hiểm TNDS Bắt buộc
              </label>
            </div>
            <span className="font-semibold text-white">
              {includeTNDS ? formatCurrency(currentTNDSFee) : '0 ₫'}
            </span>
          </div>
          
          {/* TNDS Category Selector */}
          <div className="mt-2">
            <select 
              value={tndsCategory || ''}
              onChange={(e) => handleTNDSCategoryChange(e.target.value)}
              className="w-full p-1.5 border border-white/20 rounded-md bg-white/5 text-white text-sm focus:ring-blue-500 focus:border-blue-500 focus:bg-white/10"
              disabled={!includeTNDS}
            >
              <option value="" className="bg-gray-800 text-white">Chọn loại TNDS</option>
              {availableCategories.map(category => (
                <option 
                  key={category.key} 
                  value={category.key}
                  className="bg-gray-800 text-white"
                >
                  {category.label} - {formatCurrency(category.fee)}
                  {category.key === suggestedCategory ? ' (Đề xuất)' : ''}
                </option>
              ))}
            </select>
            
            {/* Show suggestion hint */}
            {suggestedCategory && suggestedCategory !== tndsCategory && (
              <p className="text-xs text-blue-400 mt-1">
                💡 Đề xuất: {tndsCategories[suggestedCategory as keyof typeof tndsCategories]?.label} dựa trên thông tin xe
                <button
                  onClick={() => handleTNDSCategoryChange(suggestedCategory)}
                  className="ml-2 text-blue-400 underline hover:text-blue-300"
                >
                  Áp dụng
                </button>
              </p>
            )}
          </div>
        </div>

        {/* NNTX Section */}
        <div className="p-4 bg-white/10 border border-white/20 rounded-lg">
          {/* Row 1: Checkbox and Total Amount */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <input 
                type="checkbox" 
                id="include-nntx"
                checked={includeNNTX}
                onChange={(e) => handleNNTXToggle(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="include-nntx" className="ml-3 text-gray-300">
                Bảo hiểm Người ngồi trên xe
              </label>
            </div>
            <span className="font-semibold text-white">
              {includeNNTX ? formatCurrency(nntxFee) : '0 ₫'}
            </span>
          </div>
          
          {/* Row 2: Package Selector and Seat Count */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1">
              <select 
                value={selectedNNTXPackage || ''}
                onChange={(e) => handleNNTXPackageChange(e.target.value)}
                className="w-full p-1.5 border border-white/20 rounded-md bg-white/5 text-white text-sm focus:ring-blue-500 focus:border-blue-500 focus:bg-white/10"
                disabled={!includeNNTX}
              >
                <option value="" className="bg-gray-800 text-white">Chọn loại bảo hiểm</option>
                {nntxPackages.map(pkg => (
                  <option 
                    key={pkg.value} 
                    value={pkg.value}
                    className="bg-gray-800 text-white"
                  >
                    {pkg.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center gap-1">
              <StepperInput
                value={soChoNgoi || ''}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 0;
                  if (value >= 0 && value <= 999) {
                    onSoChoNgoiChange(value);
                    setTimeout(() => onRecalculate?.(), 50);
                  }
                }}
                onStep={(adjustment) => {
                  const currentValue = soChoNgoi || 0;
                  const newValue = Math.max(0, Math.min(999, currentValue + adjustment));
                  onSoChoNgoiChange(newValue);
                  setTimeout(() => onRecalculate?.(), 50);
                }}
                min={0}
                max={999}
                step={1}
                disabled={!includeNNTX}
              />
              <span className="text-gray-400 text-sm">chỗ</span>
            </div>
          </div>
        </div>

        {/* Mức khấu trừ Section */}
        <div className="p-4 bg-white/10 border border-white/20 rounded-lg">
          <div className="mb-3">
            <span className="text-gray-300">Mức khấu trừ:</span>
          </div>
          <div className="flex items-center space-x-6">
            <div className="flex items-center">
              <input 
                type="radio" 
                id="deductible-500k"
                name="mucKhauTru"
                value={500000}
                checked={mucKhauTru === 500000}
                onChange={(e) => onMucKhauTruChange(parseInt(e.target.value))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="deductible-500k" className="ml-2 text-gray-300">
                500,000 ₫/vụ
              </label>
            </div>
            <div className="flex items-center">
              <input 
                type="radio" 
                id="deductible-1m"
                name="mucKhauTru"
                value={1000000}
                checked={mucKhauTru === 1000000}
                onChange={(e) => onMucKhauTruChange(parseInt(e.target.value))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="deductible-1m" className="ml-2 text-gray-300">
                1,000,000 ₫/vụ
              </label>
            </div>
          </div>
        </div>

        {/* Tái tục / Cấp mới Section */}
        <div className="p-4 bg-white/10 border border-white/20 rounded-lg">
          <div className="mb-3">
            <span className="text-gray-300 font-semibold">Tái tục/ Cấp mới:</span>
          </div>

          <div className="space-y-3">
            {/* Số vụ input */}
            <div className="flex items-center justify-between gap-3">
              <label className="text-gray-300 text-sm">Số vụ bảo hiểm:</label>
              <div className="flex items-center gap-1">
                <StepperInput
                  value={phiTaiTucInfo?.soVu?.toString() || '0'}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0;
                    onPhiTaiTucInfoChange({
                      soVu: value,
                      phanTramChiPhi: phiTaiTucInfo?.phanTramChiPhi || 0
                    });
                  }}
                  onStep={(adjustment) => {
                    const currentValue = phiTaiTucInfo?.soVu || 0;
                    const newValue = Math.max(0, currentValue + adjustment);
                    onPhiTaiTucInfoChange({
                      soVu: newValue,
                      phanTramChiPhi: phiTaiTucInfo?.phanTramChiPhi || 0
                    });
                  }}
                  min={0}
                  step={1}
                  inputClassName="w-20 text-right p-1 bg-transparent text-white font-semibold focus:outline-none"
                />
                <span className="text-gray-400 text-sm">vụ</span>
              </div>
            </div>

            {/* Phần trăm chi phí input */}
            <div className="flex items-center justify-between gap-3">
              <label className="text-gray-300 text-sm">% chi phí năm ngoái:</label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="0"
                  value={phiTaiTucInfo?.phanTramChiPhi || 0}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    if (value >= 0) {
                      onPhiTaiTucInfoChange({
                        soVu: phiTaiTucInfo?.soVu || 0,
                        phanTramChiPhi: value
                      });
                    }
                  }}
                  className="w-20 text-right p-1 bg-transparent text-white font-semibold focus:outline-none border-b border-white/20"
                />
                <span className="text-gray-400 text-sm">%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}