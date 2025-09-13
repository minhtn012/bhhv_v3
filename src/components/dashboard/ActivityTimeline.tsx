'use client';

import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

interface ActivityItem {
  _id: string;
  contractNumber: string;
  action: string;
  timestamp: Date;
  user: string;
  status: string;
}

interface ActivityTimelineProps {
  activities: ActivityItem[];
  isLoading?: boolean;
}

export default function ActivityTimeline({ activities, isLoading = false }: ActivityTimelineProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'nhap':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        );
      case 'cho_duyet':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'khach_duyet':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
      case 'ra_hop_dong':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'huy':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'nhap':
        return 'text-gray-400 bg-gray-500/20';
      case 'cho_duyet':
        return 'text-amber-400 bg-amber-500/20';
      case 'khach_duyet':
        return 'text-blue-400 bg-blue-500/20';
      case 'ra_hop_dong':
        return 'text-green-400 bg-green-500/20';
      case 'huy':
        return 'text-red-400 bg-red-500/20';
      default:
        return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'nhap': 'Nháp',
      'cho_duyet': 'Chờ duyệt',
      'khach_duyet': 'Khách duyệt',
      'ra_hop_dong': 'Ra hợp đồng',
      'huy': 'Đã hủy'
    };
    return statusMap[status] || status;
  };

  const formatRelativeTime = (date: Date) => {
    try {
      return formatDistanceToNow(new Date(date), {
        addSuffix: true,
        locale: vi
      });
    } catch {
      return 'Vừa xong';
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-600 rounded w-40 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex gap-4">
                <div className="w-8 h-8 bg-gray-600 rounded-full flex-shrink-0"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-600 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Hoạt động gần đây</h3>
        <button className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors duration-200">
          Xem tất cả
        </button>
      </div>

      <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar">
        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-400">
            <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm">Chưa có hoạt động nào</p>
          </div>
        ) : (
          activities.map((activity, index) => (
            <div key={activity._id} className="flex gap-4 group">
              {/* Timeline line */}
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${getStatusColor(activity.status)}`}>
                  {getStatusIcon(activity.status)}
                </div>
                {index < activities.length - 1 && (
                  <div className="w-px h-6 bg-white/10 mt-2"></div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white font-medium text-sm">
                        {activity.contractNumber}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                        {getStatusText(activity.status)}
                      </span>
                    </div>
                    <p className="text-gray-300 text-sm leading-relaxed">
                      {activity.action}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      <span>Bởi: {activity.user}</span>
                      <span>•</span>
                      <span>{formatRelativeTime(activity.timestamp)}</span>
                    </div>
                  </div>

                  <button className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {activities.length > 0 && (
        <div className="mt-6 pt-4 border-t border-white/10">
          <button className="w-full bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 hover:text-blue-300 font-medium py-2 px-4 rounded-xl transition-all duration-200 border border-blue-500/30">
            Xem thêm hoạt động
          </button>
        </div>
      )}

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.5);
        }
      `}</style>
    </div>
  );
}