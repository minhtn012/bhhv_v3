'use client';

import { useMemo } from 'react';

interface StatusData {
  status: string;
  statusText: string;
  count: number;
  percentage: number;
  color: string;
}

interface StatusChartProps {
  data: StatusData[];
  isLoading?: boolean;
}

export default function StatusChart({ data, isLoading = false }: StatusChartProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    let cumulativePercentage = 0;
    return data.map((item) => {
      const startAngle = cumulativePercentage * 3.6; // Convert percentage to degrees
      const endAngle = (cumulativePercentage + item.percentage) * 3.6;
      cumulativePercentage += item.percentage;

      return {
        ...item,
        startAngle,
        endAngle,
        arcLength: item.percentage * 3.6
      };
    });
  }, [data]);

  const createArcPath = (centerX: number, centerY: number, radius: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(centerX, centerY, radius, endAngle);
    const end = polarToCartesian(centerX, centerY, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

    return [
      "M", centerX, centerY,
      "L", start.x, start.y,
      "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y,
      "Z"
    ].join(" ");
  };

  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    };
  };

  if (isLoading) {
    return (
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-600 rounded w-40 mb-6"></div>
          <div className="flex items-center justify-center">
            <div className="w-48 h-48 bg-gray-600 rounded-full"></div>
          </div>
          <div className="mt-6 space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-4 h-4 bg-gray-600 rounded"></div>
                <div className="h-4 bg-gray-600 rounded flex-1"></div>
                <div className="h-4 bg-gray-600 rounded w-12"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const total = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Phân bố trạng thái</h3>
        <div className="text-sm text-gray-300">
          Tổng: <span className="font-semibold text-white">{total}</span> hợp đồng
        </div>
      </div>

      <div className="flex flex-col lg:flex-row items-center gap-8">
        {/* Donut Chart */}
        <div className="relative flex-shrink-0">
          <svg width="200" height="200" className="transform -rotate-90">
            {chartData.map((item) => (
              <path
                key={item.status}
                d={createArcPath(100, 100, 80, item.startAngle, item.endAngle)}
                fill={item.color}
                className="transition-all duration-300 hover:opacity-80"
                stroke="rgba(0,0,0,0.1)"
                strokeWidth="1"
              />
            ))}
            {/* Inner circle for donut effect */}
            <circle
              cx="100"
              cy="100"
              r="50"
              fill="rgba(15, 23, 42, 0.8)"
            />
          </svg>

          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-2xl font-bold text-white">{total}</div>
            <div className="text-xs text-gray-300">Hợp đồng</div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 w-full">
          <div className="space-y-3">
            {data.map((item) => (
              <div
                key={item.status}
                className="flex items-center justify-between p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors duration-200"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span className="text-white font-medium">{item.statusText}</span>
                </div>
                <div className="text-right">
                  <div className="text-white font-semibold">{item.count}</div>
                  <div className="text-xs text-gray-300">
                    {item.percentage.toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div className="mt-6 flex gap-3">
            <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded-xl transition-colors duration-200">
              Xem chi tiết
            </button>
            <button className="px-4 py-2 text-gray-300 hover:text-white border border-white/20 hover:border-white/40 rounded-xl transition-colors duration-200">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}