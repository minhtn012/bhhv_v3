'use client';

import { useState, useEffect } from 'react';
import { formatCurrency } from '@/utils/insurance-calculator';

interface PackageOption {
  index: number;
  name: string;
  details: string;
  originalRate: number;
  currentRate: number;
  fee: number;
  available: boolean;
}

interface EditablePackageCardProps {
  package: PackageOption;
  isSelected: boolean;
  giaTriXe: number;
  loaiHinhKinhDoanh: string;
  onSelect: () => void;
  onRateChange: (index: number, newRate: number, newFee: number) => void;
}

export default function EditablePackageCard({ 
  package: pkg, 
  isSelected, 
  giaTriXe,
  loaiHinhKinhDoanh,
  onSelect, 
  onRateChange 
}: EditablePackageCardProps) {
  const [customRate, setCustomRate] = useState(pkg.currentRate);
  const [calculatedFee, setCalculatedFee] = useState(pkg.fee);
  const [showDifference, setShowDifference] = useState(false);

  // Calculate fee with minimum fee logic from index_2.html
  const calculateFee = (rate: number): { fee: number; hasMinFee: boolean } => {
    let fee = (giaTriXe * rate) / 100;
    let hasMinFee = false;

    // Apply minimum fee logic for xe gia đình < 500M (from index_2.html lines 706-710)
    const isMinFeeApplicable = loaiHinhKinhDoanh === 'khong_kd_cho_nguoi' && giaTriXe < 500000000;
    if (isMinFeeApplicable && fee < 5500000) {
      fee = 5500000;
      hasMinFee = true;
    }

    return { fee, hasMinFee };
  };

  // Update fee when rate changes
  useEffect(() => {
    const { fee } = calculateFee(customRate);
    setCalculatedFee(fee);
    onRateChange(pkg.index, customRate, fee);
  }, [customRate, giaTriXe, loaiHinhKinhDoanh]);


  // Calculate difference for display
  const originalFee = calculateFee(pkg.originalRate).fee;
  const difference = calculatedFee - originalFee;
  const { hasMinFee } = calculateFee(customRate);

  if (!pkg.available) {
    return (
      <div className="p-4 border border-gray-600 rounded-xl opacity-50 bg-gray-900/20">
        <div className="flex items-start justify-between">
          <div className="flex items-center">
            <input 
              type="radio" 
              name="package"
              disabled
              className="h-4 w-4 text-blue-600"
            />
            <div className="ml-3">
              <label className="font-semibold text-gray-500">{pkg.name}</label>
              <p className="text-xs text-gray-600">{pkg.details}</p>
              <p className="text-xs text-red-400">Không áp dụng cho xe này</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`p-4 border rounded-xl transition-colors ${
        isSelected 
          ? 'border-blue-400 bg-blue-500/10' 
          : 'border-white/20 hover:border-blue-400/50'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center">
          <input 
            type="radio" 
            name="package"
            checked={isSelected}
            onChange={onSelect}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
          />
          <div className="ml-3">
            <label className="font-semibold text-white cursor-pointer" onClick={onSelect}>
              {pkg.name}
            </label>
            <p className="text-xs text-gray-400">{pkg.details}</p>
          </div>
        </div>
        
        <div className="text-right">
          {/* Disabled rate input */}
          <div className="flex items-center gap-1 mb-1">
            <input 
              type="number" 
              step="0.01"
              min="0"
              value={customRate.toFixed(2)}
              disabled
              className="w-20 text-right p-1 border border-gray-600 rounded-md bg-gray-700 text-gray-400 font-semibold cursor-not-allowed"
            />
            <span className="text-gray-400 text-sm">%</span>
          </div>
          
          {/* Calculated fee */}
          <div className="font-bold text-blue-400 text-sm">
            {formatCurrency(calculatedFee)}
          </div>
        </div>
      </div>

      {/* Show difference and minimum fee notice */}
      <div className="mt-2 text-right text-sm min-h-[20px]">
        {hasMinFee && (
          <p className="text-red-400 text-xs">
            Đã áp dụng phí tối thiểu
          </p>
        )}
        {showDifference && Math.abs(difference) > 1 && (
          <p className="text-gray-300 text-xs">
            Chênh lệch: 
            <span className={`font-semibold ml-1 ${
              difference > 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {difference > 0 ? '+' : ''}{formatCurrency(difference)}
            </span>
          </p>
        )}
      </div>
    </div>
  );
}