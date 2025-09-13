'use client';

import { useMemo } from 'react';

interface RevenueData {
  month: string;
  revenue: number;
  contracts: number;
}

interface RevenueChartProps {
  data: RevenueData[];
  isLoading?: boolean;
}

export default function RevenueChart({ data, isLoading = false }: RevenueChartProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return { processedData: [], maxRevenue: 0, totalRevenue: 0 };

    const maxRevenue = Math.max(...data.map(d => d.revenue));
    const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);

    const processedData = data.map(item => ({
      ...item,
      heightPercentage: maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0
    }));

    return { processedData, maxRevenue, totalRevenue };
  }, [data]);

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000000) {
      return `${(amount / 1000000000).toFixed(1)}B VNĐ`;
    }
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M VNĐ`;
    }
    if (amount >= 1000) {
      return `${(amount / 1000).toFixed(1)}K VNĐ`;
    }
    return `${amount.toLocaleString()} VNĐ`;
  };

  const getBarColor = (index: number, total: number) => {
    const intensity = 0.3 + (index / total) * 0.7; // Gradient from light to dark
    return `rgba(59, 130, 246, ${intensity})`; // Blue gradient
  };

  if (isLoading) {
    return (
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-6">
            <div className="h-6 bg-gray-600 rounded w-32"></div>
            <div className="h-4 bg-gray-700 rounded w-24"></div>
          </div>
          <div className="flex items-end justify-between h-64 mb-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div
                key={i}
                className="bg-gray-600 rounded-t w-12"
                style={{ height: `${Math.random() * 80 + 20}%` }}
              ></div>
            ))}
          </div>
          <div className="flex justify-between">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-3 bg-gray-700 rounded w-8"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-6">Biểu đồ doanh thu</h3>
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
          <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-sm">Chưa có dữ liệu doanh thu</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Biểu đồ doanh thu</h3>
        <div className="text-sm text-gray-300">
          Tổng: <span className="font-semibold text-green-400">{formatCurrency(chartData.totalRevenue)}</span>
        </div>
      </div>

      {/* Chart Area */}
      <div className="relative">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-64 flex flex-col justify-between text-xs text-gray-400 -ml-2">
          <span>{formatCurrency(chartData.maxRevenue)}</span>
          <span>{formatCurrency(chartData.maxRevenue * 0.75)}</span>
          <span>{formatCurrency(chartData.maxRevenue * 0.5)}</span>
          <span>{formatCurrency(chartData.maxRevenue * 0.25)}</span>
          <span>0</span>
        </div>

        {/* Chart bars */}
        <div className="ml-16 pl-4">
          <div className="flex items-end justify-between h-64 mb-4 relative">
            {/* Grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="border-t border-white/10"></div>
              ))}
            </div>

            {/* Bars */}
            {chartData.processedData.map((item, index) => (
              <div
                key={item.month}
                className="flex flex-col items-center group relative flex-1 mx-1"
              >
                {/* Tooltip */}
                <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-black/80 backdrop-blur-sm border border-white/20 rounded-lg p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 whitespace-nowrap">
                  <div className="text-white font-semibold text-sm">{item.month}</div>
                  <div className="text-green-400 text-sm">{formatCurrency(item.revenue)}</div>
                  <div className="text-gray-300 text-xs">{item.contracts} hợp đồng</div>
                  {/* Arrow */}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-black/80"></div>
                </div>

                {/* Bar */}
                <div
                  className="w-full max-w-12 rounded-t-lg transition-all duration-300 hover:opacity-80 relative overflow-hidden"
                  style={{
                    height: `${item.heightPercentage}%`,
                    backgroundColor: getBarColor(index, chartData.processedData.length),
                    minHeight: item.revenue > 0 ? '4px' : '0px'
                  }}
                >
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 animate-shimmer"></div>
                </div>
              </div>
            ))}
          </div>

          {/* X-axis labels */}
          <div className="flex justify-between text-xs text-gray-400">
            {chartData.processedData.map((item) => (
              <div key={item.month} className="flex-1 text-center mx-1">
                {item.month}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Summary stats */}
      <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/5 rounded-xl p-3">
          <div className="text-white font-semibold text-lg">
            {chartData.processedData.reduce((sum, d) => sum + d.contracts, 0)}
          </div>
          <div className="text-gray-400 text-xs">Tổng hợp đồng</div>
        </div>
        <div className="bg-white/5 rounded-xl p-3">
          <div className="text-green-400 font-semibold text-lg">
            {formatCurrency(chartData.totalRevenue / (chartData.processedData.length || 1))}
          </div>
          <div className="text-gray-400 text-xs">TB/tháng</div>
        </div>
        <div className="bg-white/5 rounded-xl p-3">
          <div className="text-blue-400 font-semibold text-lg">
            {formatCurrency(Math.max(...chartData.processedData.map(d => d.revenue)))}
          </div>
          <div className="text-gray-400 text-xs">Cao nhất</div>
        </div>
        <div className="bg-white/5 rounded-xl p-3">
          <div className="text-purple-400 font-semibold text-lg">
            {Math.round(chartData.totalRevenue / Math.max(chartData.processedData.reduce((sum, d) => sum + d.contracts, 0), 1)).toLocaleString()} VNĐ
          </div>
          <div className="text-gray-400 text-xs">TB/hợp đồng</div>
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%) skewX(-12deg);
          }
          100% {
            transform: translateX(300%) skewX(-12deg);
          }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
}