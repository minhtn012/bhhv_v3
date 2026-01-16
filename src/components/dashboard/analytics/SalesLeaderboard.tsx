'use client';

import { useState, useEffect, useCallback } from 'react';
import TimeRangeSelector, { TimeRange } from './TimeRangeSelector';
import UserFilterDropdown, { SalesUser } from './UserFilterDropdown';

interface SalesLeaderboardEntry {
  userId: string;
  username: string;
  totalContracts: number;
  completedContracts: number;
  cancelledContracts: number;
  totalRevenue: number;
  conversionRate: number;
  rank: number;
}

interface LeaderboardData {
  leaderboard: SalesLeaderboardEntry[];
  timeRange: TimeRange;
  dateRange: { start: string; end: string };
  totals: {
    totalContracts: number;
    totalRevenue: number;
    avgConversionRate: number;
  };
}

interface SalesLeaderboardProps {
  salesUsers: SalesUser[];
}

function formatCurrency(value: number): string {
  if (value >= 1000000000) return `${(value / 1000000000).toFixed(1)}B`;
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
  return value.toLocaleString('vi-VN');
}

function getRankBadge(rank: number): string {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return `#${rank}`;
}

export default function SalesLeaderboard({ salesUsers }: SalesLeaderboardProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ timeRange });
      if (selectedUserId) params.append('userId', selectedUserId);

      const res = await fetch(`/api/admin/sales-leaderboard?${params}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const result = await res.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setIsLoading(false);
    }
  }, [timeRange, selectedUserId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams({ timeRange });
      if (selectedUserId) params.append('userId', selectedUserId);

      const res = await fetch(`/api/admin/export-sales?${params}`);
      if (!res.ok) throw new Error('Export failed');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bao-cao-sales-${timeRange}-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
          <div>
            <h3 className="text-white font-semibold">Bảng xếp hạng Sales</h3>
            <p className="text-gray-400 text-sm">Doanh số và tỷ lệ chốt đơn</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <TimeRangeSelector value={timeRange} onChange={setTimeRange} disabled={isLoading} />
          <UserFilterDropdown
            users={salesUsers}
            selectedUserId={selectedUserId}
            onChange={setSelectedUserId}
            isLoading={isLoading}
          />
          <button
            onClick={handleExport}
            disabled={isExporting || isLoading}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg
              bg-green-600/20 border border-green-500/30 text-green-400
              hover:bg-green-600/30 hover:border-green-500/50 transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            )}
            Excel
          </button>
        </div>
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="animate-pulse space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-14 bg-white/5 rounded-lg" />
          ))}
        </div>
      ) : data?.leaderboard.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          Không có dữ liệu trong khoảng thời gian này
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-400 text-sm border-b border-white/10">
                  <th className="pb-3 font-medium">Hạng</th>
                  <th className="pb-3 font-medium">Sales</th>
                  <th className="pb-3 font-medium text-right">Số HĐ</th>
                  <th className="pb-3 font-medium text-right">Hoàn thành</th>
                  <th className="pb-3 font-medium text-right">Tỷ lệ chốt</th>
                  <th className="pb-3 font-medium text-right">Doanh số</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data?.leaderboard.map((entry) => (
                  <tr key={entry.userId} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 text-lg font-medium">
                      <span className={entry.rank <= 3 ? 'text-2xl' : 'text-gray-400'}>
                        {getRankBadge(entry.rank)}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className="text-white font-medium">{entry.username}</span>
                    </td>
                    <td className="py-3 text-right text-gray-300">{entry.totalContracts}</td>
                    <td className="py-3 text-right">
                      <span className="text-green-400">{entry.completedContracts}</span>
                      {entry.cancelledContracts > 0 && (
                        <span className="text-red-400 text-xs ml-1">(-{entry.cancelledContracts})</span>
                      )}
                    </td>
                    <td className="py-3 text-right">
                      <span className={`font-medium ${
                        entry.conversionRate >= 50 ? 'text-green-400' :
                        entry.conversionRate >= 30 ? 'text-yellow-400' : 'text-gray-400'
                      }`}>
                        {entry.conversionRate}%
                      </span>
                    </td>
                    <td className="py-3 text-right text-white font-medium">
                      {formatCurrency(entry.totalRevenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          {data?.totals && (
            <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-white">{data.totals.totalContracts}</div>
                <div className="text-sm text-gray-400">Tổng HĐ</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-400">{formatCurrency(data.totals.totalRevenue)}</div>
                <div className="text-sm text-gray-400">Tổng doanh số</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-400">{data.totals.avgConversionRate}%</div>
                <div className="text-sm text-gray-400">TB tỷ lệ chốt</div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
