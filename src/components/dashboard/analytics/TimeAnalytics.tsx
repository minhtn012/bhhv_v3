'use client';

import { useState, useEffect, useCallback } from 'react';
import TimeRangeSelector, { TimeRange } from './TimeRangeSelector';
import UserFilterDropdown, { SalesUser } from './UserFilterDropdown';

interface StatusTransitionTime {
  from: string;
  to: string;
  fromText: string;
  toText: string;
  avgHours: number;
  avgDays: number;
  minHours: number;
  maxHours: number;
  sampleCount: number;
}

interface TimeAnalyticsData {
  transitions: StatusTransitionTime[];
  timeRange: TimeRange;
  dateRange: { start: string; end: string };
  summary: {
    avgTotalPipelineHours: number;
    avgTotalPipelineDays: number;
    fastestCompletionHours: number;
    slowestCompletionHours: number;
    completedContractsAnalyzed: number;
  };
}

interface TimeAnalyticsProps {
  salesUsers: SalesUser[];
}

function formatDuration(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)}p`;
  if (hours < 24) return `${hours.toFixed(1)}h`;
  return `${(hours / 24).toFixed(1)}d`;
}

function formatDurationLong(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)} phút`;
  if (hours < 24) return `${hours.toFixed(1)} giờ`;
  return `${(hours / 24).toFixed(1)} ngày`;
}

// Transition color mapping
const transitionColors = [
  { bg: 'from-blue-600/80 to-blue-500/80', ring: 'ring-blue-500' },
  { bg: 'from-violet-600/80 to-violet-500/80', ring: 'ring-violet-500' },
  { bg: 'from-cyan-600/80 to-cyan-500/80', ring: 'ring-cyan-500' },
];

export default function TimeAnalytics({ salesUsers }: TimeAnalyticsProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [data, setData] = useState<TimeAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ timeRange });
      if (selectedUserId) params.append('userId', selectedUserId);

      const res = await fetch(`/api/admin/time-analytics?${params}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const result = await res.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching time analytics:', error);
    } finally {
      setIsLoading(false);
    }
  }, [timeRange, selectedUserId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Calculate max duration for bar scaling
  const maxDuration = data?.transitions.reduce((max, t) => Math.max(max, t.avgHours), 0) || 1;

  return (
    <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-cyan-500 to-teal-600 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <svg className="w-4.5 h-4.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm">Thời gian xử lý</h3>
              <p className="text-gray-500 text-xs">Trung bình qua từng giai đoạn</p>
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
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-white/5 rounded w-32 mb-2" />
                <div className="h-12 bg-white/5 rounded-xl" />
              </div>
            ))}
          </div>
        ) : data?.summary.completedContractsAnalyzed === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-gray-400 text-sm">Không có dữ liệu trong khoảng thời gian này</p>
          </div>
        ) : (
          <>
            {/* Timeline Transitions */}
            <div className="space-y-3">
              {data?.transitions.map((transition, index) => {
                const barWidth = maxDuration > 0 ? (transition.avgHours / maxDuration) * 100 : 0;
                const colors = transitionColors[index % transitionColors.length];

                return (
                  <div key={`${transition.from}_${transition.to}`} className="group">
                    {/* Transition header */}
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-gray-400 text-xs font-medium">{transition.fromText}</span>
                        <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        <span className="text-gray-300 text-xs font-medium">{transition.toText}</span>
                      </div>
                      <div className="flex-1 h-px bg-white/5" />
                      <span className="text-[10px] text-gray-600">
                        {transition.sampleCount} mẫu
                      </span>
                    </div>

                    {/* Progress bar with time info */}
                    <div className="relative h-11 bg-white/[0.03] rounded-xl overflow-hidden group-hover:bg-white/[0.05] transition-colors">
                      <div
                        className={`absolute inset-y-0 left-0 bg-gradient-to-r ${colors.bg} transition-all duration-500`}
                        style={{ width: `${Math.max(barWidth, 8)}%` }}
                      />
                      <div className="absolute inset-0 flex items-center justify-between px-4">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-bold text-base">{formatDurationLong(transition.avgHours)}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5 text-[10px]">
                            <span className="text-gray-500">Min</span>
                            <span className="text-emerald-400 font-medium">{formatDuration(transition.minHours)}</span>
                          </div>
                          <div className="w-px h-3 bg-white/10" />
                          <div className="flex items-center gap-1.5 text-[10px]">
                            <span className="text-gray-500">Max</span>
                            <span className="text-amber-400 font-medium">{formatDuration(transition.maxHours)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Connection dot */}
                    {index < (data?.transitions.length || 0) - 1 && (
                      <div className="flex justify-center py-1">
                        <div className="w-1 h-1 rounded-full bg-white/20" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Summary Stats */}
            {data?.summary && (
              <div className="mt-5 pt-4 border-t border-white/5">
                <div className="grid grid-cols-4 gap-3">
                  <div className="text-center p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                    <div className="text-lg font-bold text-cyan-400">{formatDurationLong(data.summary.avgTotalPipelineHours)}</div>
                    <div className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider">TB Pipeline</div>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                    <div className="text-lg font-bold text-emerald-400">{formatDurationLong(data.summary.fastestCompletionHours)}</div>
                    <div className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider">Nhanh nhất</div>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                    <div className="text-lg font-bold text-amber-400">{formatDurationLong(data.summary.slowestCompletionHours)}</div>
                    <div className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider">Chậm nhất</div>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                    <div className="text-lg font-bold text-white">{data.summary.completedContractsAnalyzed}</div>
                    <div className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider">HĐ phân tích</div>
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
