'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface ExpiringContract {
  _id: string;
  contractNumber: string;
  customerName: string;
  licensePlate: string;
  carInfo: string;
  expirationDate: string;
  daysLeft: number;
  premium: number;
  salesUser: string;
}

interface ExpiringContractsData {
  contracts: ExpiringContract[];
  summary: {
    total: number;
    expiringSoon: number;
    expiringThisMonth: number;
    totalPremiumAtRisk: number;
  };
}

function getDaysLeftColor(days: number): string {
  if (days <= 3) return 'text-red-400 bg-red-500/10';
  if (days <= 7) return 'text-amber-400 bg-amber-500/10';
  if (days <= 14) return 'text-yellow-400 bg-yellow-500/10';
  return 'text-emerald-400 bg-emerald-500/10';
}

function getDaysLeftBadge(days: number): string {
  if (days === 0) return 'Hôm nay';
  if (days === 1) return '1 ngày';
  return `${days} ngày`;
}

export default function ExpiringContracts() {
  const router = useRouter();
  const [data, setData] = useState<ExpiringContractsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/expiring-contracts?days=60&limit=8');
      if (!res.ok) throw new Error('Failed to fetch');
      const result = await res.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching expiring contracts:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center shadow-lg shadow-orange-500/20">
              <svg className="w-4.5 h-4.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm">Hợp đồng sắp hết hạn</h3>
              <p className="text-gray-500 text-xs">Trong 60 ngày tới</p>
            </div>
          </div>

          {data && data.summary.total > 0 && (
            <div className="flex items-center gap-2">
              {data.summary.expiringSoon > 0 && (
                <span className="px-2 py-1 rounded-md bg-red-500/20 text-red-400 text-[10px] font-medium">
                  {data.summary.expiringSoon} cần gia hạn ngay
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="animate-pulse flex items-center gap-3">
                <div className="w-10 h-10 bg-white/5 rounded-lg" />
                <div className="flex-1">
                  <div className="h-4 bg-white/5 rounded w-32 mb-1" />
                  <div className="h-3 bg-white/5 rounded w-24" />
                </div>
                <div className="w-16 h-6 bg-white/5 rounded" />
              </div>
            ))}
          </div>
        ) : !data || data.contracts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-gray-400 text-sm">Không có hợp đồng sắp hết hạn</p>
          </div>
        ) : (
          <>
            {/* Contract list */}
            <div className="space-y-2">
              {data.contracts.map((contract) => {
                const colorClass = getDaysLeftColor(contract.daysLeft);
                return (
                  <div
                    key={contract._id}
                    onClick={() => router.push(`/contracts/${contract._id}`)}
                    className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05]
                      transition-all cursor-pointer group"
                  >
                    {/* Days left badge */}
                    <div className={`w-12 h-12 rounded-lg ${colorClass} flex flex-col items-center justify-center`}>
                      <span className="text-lg font-bold leading-none">{contract.daysLeft}</span>
                      <span className="text-[8px] opacity-70">ngày</span>
                    </div>

                    {/* Contract info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium text-sm truncate">{contract.licensePlate}</span>
                        <span className="text-gray-600 text-[10px]">•</span>
                        <span className="text-gray-400 text-xs truncate">{contract.carInfo}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-gray-500 text-xs truncate">{contract.customerName}</span>
                        <span className="text-gray-700 text-[10px]">•</span>
                        <span className="text-gray-600 text-[10px]">HH: {contract.expirationDate}</span>
                      </div>
                    </div>

                    {/* Arrow */}
                    <svg className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors"
                      fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                );
              })}
            </div>

            {/* Summary Stats */}
            {data.summary && (
              <div className="mt-5 pt-4 border-t border-white/5">
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                    <div className="text-xl font-bold text-white">{data.summary.total}</div>
                    <div className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider">Tổng cộng</div>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                    <div className="text-xl font-bold text-red-400">{data.summary.expiringSoon}</div>
                    <div className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider">{"<"} 7 ngày</div>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                    <div className="text-xl font-bold text-amber-400">
                      {(data.summary.totalPremiumAtRisk / 1000000).toFixed(1)}M
                    </div>
                    <div className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider">Phí cần TT</div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
