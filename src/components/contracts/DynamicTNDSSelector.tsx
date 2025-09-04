'use client';

import { useState, useEffect } from 'react';
import { formatCurrency, tndsCategories, suggestTNDSCategory, getAvailableTNDSCategories, calculateNNTXFee } from '@/utils/insurance-calculator';

interface DynamicTNDSSelectorProps {
  loaiHinhKinhDoanh: string;
  soChoNgoi: number;
  trongTai?: number;
  includeTNDS: boolean;
  tndsCategory: string;
  includeNNTX: boolean;
  tinhTrang: string;
  mucKhauTru: number;
  taiTucPercentage: number;
  adjustmentAmount: number;
  onTNDSChange: (includeTNDS: boolean, tndsCategory: string) => void;
  onNNTXChange: (includeNNTX: boolean) => void;
  onTinhTrangChange: (tinhTrang: string) => void;
  onSoChoNgoiChange: (soChoNgoi: number) => void;
  onMucKhauTruChange: (mucKhauTru: number) => void;
  onTaiTucPercentageChange: (percentage: number) => void;
  onRecalculate?: () => void;
}

export default function DynamicTNDSSelector({
  loaiHinhKinhDoanh,
  soChoNgoi,
  trongTai,
  includeTNDS,
  tndsCategory,
  includeNNTX,
  tinhTrang,
  mucKhauTru,
  taiTucPercentage,
  adjustmentAmount,
  onTNDSChange,
  onNNTXChange,
  onTinhTrangChange,
  onSoChoNgoiChange,
  onMucKhauTruChange,
  onTaiTucPercentageChange,
  onRecalculate
}: DynamicTNDSSelectorProps) {
  const [suggestedCategory, setSuggestedCategory] = useState<string | null>(null);
  const [nntxFee, setNntxFee] = useState(0);

  // Auto-suggest TNDS category when vehicle info changes
  useEffect(() => {
    const suggested = suggestTNDSCategory(loaiHinhKinhDoanh, soChoNgoi, trongTai);
    setSuggestedCategory(suggested);
    
    // Auto-select suggested category if no category is currently selected
    if (suggested && !tndsCategory) {
      onTNDSChange(includeTNDS, suggested);
    }
  }, [loaiHinhKinhDoanh, soChoNgoi, trongTai]);

  // Update NNTX fee when số chỗ ngồi changes
  useEffect(() => {
    setNntxFee(calculateNNTXFee(soChoNgoi));
  }, [soChoNgoi]);

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
    onNNTXChange(checked);
    // Trigger recalculation after NNTX change
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
          <div className="flex items-start justify-between gap-3">
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
            
            <div className="text-right">
              {/* Seat number input */}
              <div className="flex items-center gap-1 mb-1">
                <input 
                  type="number"
                  value={soChoNgoi || ''}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0;
                    if (value >= 0 && value <= 999) {
                      onSoChoNgoiChange(value);
                      setTimeout(() => onRecalculate?.(), 50);
                    }
                  }}
                  min="0"
                  max="999"
                  className="w-16 text-right p-1 border border-white/20 rounded-md bg-gray-800 text-white font-semibold focus:border-blue-400 focus:outline-none"
                  disabled={!includeNNTX}
                />
                <span className="text-gray-400 text-sm">chỗ</span>
              </div>
              
              {/* Calculated fee */}
              <div className="font-bold text-blue-400 text-sm">
                {includeNNTX ? formatCurrency(nntxFee) : '0 ₫'}
              </div>
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
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center">
              <span className="text-gray-300">Tái tục/ Cấp mới:</span>
            </div>
            
            <div className="text-right">
              {/* Percentage input */}
              <div className="flex items-center gap-1 mb-1">
                <input 
                  type="number"
                  step="0.01"
                  value={taiTucPercentage.toFixed(2)}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    onTaiTucPercentageChange(value);
                    setTimeout(() => onRecalculate?.(), 50);
                  }}
                  className="w-20 text-right p-1 border border-white/20 rounded-md bg-gray-800 text-white font-semibold focus:border-blue-400 focus:outline-none"
                />
                <span className="text-gray-400 text-sm">%</span>
              </div>
              
              {/* Show calculated adjustment amount */}
              <div className="font-bold text-blue-400 text-sm">
                {adjustmentAmount === 0 ? '0 ₫' : (
                  (adjustmentAmount > 0 ? '+' : '') + formatCurrency(Math.abs(adjustmentAmount))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}