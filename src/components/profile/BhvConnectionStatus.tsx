'use client';

import { useState } from 'react';

interface BhvConnectionStatusProps {
  isConnected: boolean;
  lastConnectionTime?: Date;
  username?: string;
  onTestConnection: () => Promise<void>;
  isLoading?: boolean;
}

export default function BhvConnectionStatus({
  isConnected,
  lastConnectionTime,
  username,
  onTestConnection,
  isLoading = false
}: BhvConnectionStatusProps) {
  const [testing, setTesting] = useState(false);

  const handleTestConnection = async () => {
    setTesting(true);
    try {
      await onTestConnection();
    } finally {
      setTesting(false);
    }
  };

  const formatLastConnection = (date: Date) => {
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="bg-white/5 rounded-xl p-6 border border-white/10">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Trạng thái kết nối BHV</h3>
        <button
          onClick={handleTestConnection}
          disabled={testing || isLoading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors duration-200 flex items-center gap-2"
        >
          {testing ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Đang kiểm tra...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Kiểm tra kết nối
            </>
          )}
        </button>
      </div>

      <div className="space-y-4">
        {/* Connection Status */}
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium ${
            isConnected
              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
              : 'bg-red-500/20 text-red-400 border border-red-500/30'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-400' : 'bg-red-400'
            }`}></div>
            {isConnected ? 'Đã kết nối' : 'Chưa kết nối'}
          </div>
        </div>

        {/* Username */}
        {username && (
          <div className="flex items-center justify-between">
            <span className="text-gray-300">Tài khoản BHV:</span>
            <span className="text-white font-medium">{username}</span>
          </div>
        )}

        {/* Last Connection Time */}
        {lastConnectionTime && (
          <div className="flex items-center justify-between">
            <span className="text-gray-300">Lần kết nối cuối:</span>
            <span className="text-white text-sm">
              {formatLastConnection(lastConnectionTime)}
            </span>
          </div>
        )}

        {/* Connection Details */}
        <div className="border-t border-white/10 pt-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="text-center">
              <div className="text-gray-400">Độ trễ</div>
              <div className="text-white font-medium">
                {isConnected ? '~150ms' : 'N/A'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-gray-400">Trạng thái API</div>
              <div className={`font-medium ${
                isConnected ? 'text-green-400' : 'text-red-400'
              }`}>
                {isConnected ? 'Hoạt động' : 'Offline'}
              </div>
            </div>
          </div>
        </div>

        {/* Warning or Info Messages */}
        {!isConnected && (
          <div className="bg-amber-500/20 border border-amber-500/30 rounded-lg p-3">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <div className="text-amber-300 font-medium text-sm">Cần cấu hình kết nối BHV</div>
                <div className="text-amber-200 text-xs mt-1">
                  Vui lòng nhập thông tin đăng nhập BHV để sử dụng các tính năng tự động.
                </div>
              </div>
            </div>
          </div>
        )}

        {isConnected && (
          <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-3">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <div className="text-green-300 font-medium text-sm">Kết nối thành công</div>
                <div className="text-green-200 text-xs mt-1">
                  Hệ thống có thể tự động đồng bộ dữ liệu với BHV.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}