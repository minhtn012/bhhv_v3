'use client';

import { useState, useEffect, useCallback } from 'react';
import TimeRangeSelector, { TimeRange } from './TimeRangeSelector';
import UserFilterDropdown, { SalesUser } from './UserFilterDropdown';

interface FunnelStage {
  status: string;
  statusText: string;
  count: number;
  percentage: number;
  dropoffRate: number;
  color: string;
}

interface FunnelData {
  funnel: FunnelStage[];
  timeRange: TimeRange;
  dateRange: { start: string; end: string };
  summary: {
    totalCreated: number;
    totalCompleted: number;
    totalCancelled: number;
    overallConversionRate: number;
  };
}

interface ConversionFunnelProps {
  salesUsers: SalesUser[];
}

// Stage color mapping
const stageColors: Record<string, { bg: string; text: string; gradient: string }> = {
  nhap: { bg: 'bg-slate-500', text: 'text-slate-300', gradient: 'from-slate-600 to-slate-500' },
  cho_duyet: { bg: 'bg-amber-500', text: 'text-amber-300', gradient: 'from-amber-600 to-amber-500' },
  khach_duyet: { bg: 'bg-emerald-500', text: 'text-emerald-300', gradient: 'from-emerald-600 to-emerald-500' },
  ra_hop_dong: { bg: 'bg-blue-500', text: 'text-blue-300', gradient: 'from-blue-600 to-blue-500' },
  huy: { bg: 'bg-red-500', text: 'text-red-300', gradient: 'from-red-600 to-red-500' }
};

export default function ConversionFunnel({ salesUsers }: ConversionFunnelProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [data, setData] = useState<FunnelData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ timeRange });
      if (selectedUserId) params.append('userId', selectedUserId);

      const res = await fetch(`/api/admin/conversion-funnel?${params}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const result = await res.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching funnel:', error);
    } finally {
      setIsLoading(false);
    }
  }, [timeRange, selectedUserId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter out 'huy' for main funnel visualization
  const mainFunnel = data?.funnel.filter(s => s.status !== 'huy') || [];
  const cancelledStage = data?.funnel.find(s => s.status === 'huy');

  return (
    <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/20">
              <svg className="w-4.5 h-4.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
              </svg>
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm">Conversion Funnel</h3>
              <p className="text-gray-500 text-xs">Tỷ lệ chuyển đổi qua từng bước</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <TimeRangeSelector value={timeRange} onChange={setTimeRange} disabled={isLoading} />
            <UserFilterDropdown
              users={salesUsers}
              selectedUserId={selectedUserId}
              onChange={setSelectedUserId}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {isLoading ? (
          <div className="space-y-3">
            {[100, 75, 50, 35].map((width, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-14 bg-white/5 rounded-xl" style={{ width: `${width}%` }} />
              </div>
            ))}
          </div>
        ) : data?.summary.totalCreated === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-gray-400 text-sm">Không có dữ liệu trong khoảng thời gian này</p>
          </div>
        ) : (
          <>
            {/* Modern Funnel Visualization */}
            <div className="space-y-2.5">
              {mainFunnel.map((stage, index) => {
                const colors = stageColors[stage.status] || stageColors.nhap;
                const prevStage = index > 0 ? mainFunnel[index - 1] : null;
                const dropoff = prevStage && prevStage.count > 0
                  ? Math.round(((prevStage.count - stage.count) / prevStage.count) * 100)
                  : 0;

                return (
                  <div key={stage.status} className="group">
                    {/* Stage bar */}
                    <div className={`relative overflow-hidden rounded-xl bg-gradient-to-r ${colors.gradient}
                      transition-all duration-300 group-hover:scale-[1.01] group-hover:shadow-lg`}>
                      <div className="relative z-10 px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                            <span className="text-white font-bold text-sm">{index + 1}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-white font-medium text-sm">{stage.statusText}</span>
                            {/* Inline dropoff indicator */}
                            {index > 0 && dropoff > 0 && (
                              <span className="text-white/50 text-[10px]">↓{dropoff}%</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-white font-bold text-lg leading-none">{stage.count}</div>
                            <div className="text-white/60 text-[10px] mt-0.5">hợp đồng</div>
                          </div>
                          <div className="w-14 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                            <span className="text-white font-semibold text-sm">{stage.percentage}%</span>
                          </div>
                        </div>
                      </div>
                      {/* Subtle pattern overlay */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Cancelled contracts badge */}
            {cancelledStage && cancelledStage.count > 0 && (
              <div className="mt-4 flex items-center justify-between px-4 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-red-400 text-sm font-medium">{cancelledStage.statusText}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-red-300 font-bold">{cancelledStage.count}</span>
                  <span className="text-red-400/60 text-xs">({cancelledStage.percentage}%)</span>
                </div>
              </div>
            )}

            {/* Summary Stats */}
            {data?.summary && (
              <div className="mt-5 pt-4 border-t border-white/5">
                <div className="grid grid-cols-4 gap-3">
                  <div className="text-center p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                    <div className="text-2xl font-bold text-white">{data.summary.totalCreated}</div>
                    <div className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider">Tạo mới</div>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                    <div className="text-2xl font-bold text-emerald-400">{data.summary.totalCompleted}</div>
                    <div className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider">Hoàn thành</div>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                    <div className="text-2xl font-bold text-red-400">{data.summary.totalCancelled}</div>
                    <div className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider">Đã hủy</div>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                    <div className="text-2xl font-bold text-violet-400">{data.summary.overallConversionRate}%</div>
                    <div className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider">Tỷ lệ chốt</div>
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
