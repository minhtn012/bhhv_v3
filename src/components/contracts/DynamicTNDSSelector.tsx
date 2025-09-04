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
  onTNDSChange: (includeTNDS: boolean, tndsCategory: string) => void;
  onNNTXChange: (includeNNTX: boolean) => void;
  onTinhTrangChange: (tinhTrang: string) => void;
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
  onTNDSChange,
  onNNTXChange,
  onTinhTrangChange,
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
        <div className="flex items-center justify-between p-3 bg-white/10 border border-white/20 rounded-lg">
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
            <span className="font-semibold text-white">
              {includeNNTX ? formatCurrency(nntxFee) : '0 ₫'}
            </span>
            {soChoNgoi > 0 && (
              <p className="text-xs text-gray-400">
                {soChoNgoi} chỗ × 10,000 ₫
              </p>
            )}
          </div>
        </div>

        {/* Mức khấu trừ Section */}
        <div className="flex items-center justify-between p-3 bg-white/10 border border-white/20 rounded-lg">
          <span className="text-gray-300">Mức khấu trừ:</span>
          <span className="font-semibold text-white">
            {formatCurrency(mucKhauTru)}/vụ
          </span>
        </div>

        {/* Tái tục / Cấp mới Section */}
        <div className="p-3 bg-white/10 border border-white/20 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-gray-300">Tái tục/ Cấp mới:</span>
            <select 
              value={tinhTrang}
              onChange={(e) => onTinhTrangChange(e.target.value)}
              className="p-1.5 border border-white/20 rounded-md bg-white/5 text-white text-sm focus:ring-blue-500 focus:border-blue-500 focus:bg-white/10"
            >
              <option value="cap_moi" className="bg-gray-800 text-white">Cấp Mới</option>
              <option value="tai_tuc" className="bg-gray-800 text-white">Tái Tục</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}