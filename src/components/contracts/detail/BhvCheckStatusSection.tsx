/**
 * BHV Check Status Section
 *
 * Displays BHV premium check status and results
 */

'use client';

import { useState } from 'react';

interface BhvPremiums {
  bhvc: {
    beforeTax: number;
    afterTax: number;
  };
  tnds: {
    beforeTax: number;
    afterTax: number;
  };
  nntx: {
    beforeTax: number;
    afterTax: number;
  };
  total: {
    beforeTax: number;
    afterTax: number;
  };
  checkedAt: string;
  success: boolean;
  error?: string;
}

interface BhvCheckStatusSectionProps {
  contractId: string;
  bhvPremiums?: BhvPremiums;
  tongPhi: number; // Internal system price for comparison
  onRetryCheck?: () => void;
}

export default function BhvCheckStatusSection({
  contractId,
  bhvPremiums,
  tongPhi,
  onRetryCheck,
}: BhvCheckStatusSectionProps) {
  const [retrying, setRetrying] = useState(false);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  // Calculate price difference
  const priceDifference = bhvPremiums && bhvPremiums.success
    ? tongPhi - bhvPremiums.total.afterTax
    : 0;

  const handleRetry = async () => {
    setRetrying(true);
    try {
      const response = await fetch('/api/contracts/check-bhv-contract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractId }),
      });

      if (response.ok) {
        if (onRetryCheck) {
          onRetryCheck();
        }
      } else {
        const errorData = await response.json();
        console.error('BHV check retry failed:', errorData);
      }
    } catch (error) {
      console.error('BHV check retry error:', error);
    } finally {
      setRetrying(false);
    }
  };

  // Status badge component
  const StatusBadge = () => {
    if (!bhvPremiums) {
      return (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium text-yellow-400">Đang kiểm tra...</span>
        </div>
      );
    }

    if (bhvPremiums.success) {
      return (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-lg">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-sm font-medium text-green-400">Đã kiểm tra</span>
        </div>
      );
    }

    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-lg">
        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
        <span className="text-sm font-medium text-red-400">Lỗi kiểm tra</span>
      </div>
    );
  };

  return (
    <div className="bg-[#1e1e1e]/50 border border-white/10 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-white">Kiểm tra phí BHV Online</h3>
          <StatusBadge />
        </div>

        {bhvPremiums && !bhvPremiums.success && (
          <button
            onClick={handleRetry}
            disabled={retrying}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors"
          >
            {retrying ? 'Đang thử lại...' : 'Thử lại'}
          </button>
        )}
      </div>

      {!bhvPremiums && (
        <div className="text-center py-8">
          <div className="w-12 h-12 border-4 border-yellow-500/20 border-t-yellow-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/60 text-sm">Đang kiểm tra phí bảo hiểm từ BHV...</p>
        </div>
      )}

      {bhvPremiums && !bhvPremiums.success && (
        <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-4">
          <p className="text-red-400 text-sm mb-2 font-medium">Không thể kiểm tra phí BHV</p>
          <p className="text-white/60 text-sm">{bhvPremiums.error || 'Lỗi không xác định'}</p>
        </div>
      )}

      {bhvPremiums && bhvPremiums.success && (
        <div className="space-y-6">
          {/* Price comparison */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/5 rounded-lg p-4">
              <p className="text-white/60 text-sm mb-1">Phí BHV Online</p>
              <p className="text-white text-lg font-semibold">
                {formatCurrency(bhvPremiums.total.afterTax)}
              </p>
            </div>

            <div className="bg-white/5 rounded-lg p-4">
              <p className="text-white/60 text-sm mb-1">Phí hệ thống</p>
              <p className="text-white text-lg font-semibold">
                {formatCurrency(tongPhi)}
              </p>
            </div>

            <div className="bg-white/5 rounded-lg p-4">
              <p className="text-white/60 text-sm mb-1">Chênh lệch</p>
              <p className={`text-lg font-semibold ${priceDifference < 0 ? 'text-red-400' : 'text-green-400'}`}>
                {priceDifference >= 0 ? '+' : ''}{formatCurrency(priceDifference)}
              </p>
            </div>
          </div>

          {/* Detailed breakdown */}
          <div className="space-y-3">
            <h4 className="text-white font-medium text-sm mb-3">Chi tiết phí BHV Online</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                <p className="text-white/60 text-xs mb-2">BHVC (Vật chất)</p>
                <div className="flex justify-between items-center">
                  <span className="text-white/40 text-xs">Trước thuế:</span>
                  <span className="text-white text-sm font-medium">
                    {formatCurrency(bhvPremiums.bhvc.beforeTax)}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-white/40 text-xs">Sau thuế:</span>
                  <span className="text-white text-sm font-medium">
                    {formatCurrency(bhvPremiums.bhvc.afterTax)}
                  </span>
                </div>
              </div>

              <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                <p className="text-white/60 text-xs mb-2">TNDS (Trách nhiệm dân sự)</p>
                <div className="flex justify-between items-center">
                  <span className="text-white/40 text-xs">Trước thuế:</span>
                  <span className="text-white text-sm font-medium">
                    {formatCurrency(bhvPremiums.tnds.beforeTax)}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-white/40 text-xs">Sau thuế:</span>
                  <span className="text-white text-sm font-medium">
                    {formatCurrency(bhvPremiums.tnds.afterTax)}
                  </span>
                </div>
              </div>

              <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                <p className="text-white/60 text-xs mb-2">NNTX (Người ngồi trên xe)</p>
                <div className="flex justify-between items-center">
                  <span className="text-white/40 text-xs">Trước thuế:</span>
                  <span className="text-white text-sm font-medium">
                    {formatCurrency(bhvPremiums.nntx.beforeTax)}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-white/40 text-xs">Sau thuế:</span>
                  <span className="text-white text-sm font-medium">
                    {formatCurrency(bhvPremiums.nntx.afterTax)}
                  </span>
                </div>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                <p className="text-blue-400 text-xs mb-2 font-medium">Tổng cộng</p>
                <div className="flex justify-between items-center">
                  <span className="text-white/40 text-xs">Trước thuế:</span>
                  <span className="text-white text-sm font-medium">
                    {formatCurrency(bhvPremiums.total.beforeTax)}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-white/40 text-xs">Sau thuế:</span>
                  <span className="text-blue-400 text-sm font-semibold">
                    {formatCurrency(bhvPremiums.total.afterTax)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Check timestamp */}
          <div className="text-right">
            <p className="text-white/40 text-xs">
              Kiểm tra lúc: {new Date(bhvPremiums.checkedAt).toLocaleString('vi-VN')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}