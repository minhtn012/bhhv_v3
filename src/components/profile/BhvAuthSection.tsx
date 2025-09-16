'use client';

import { useState } from 'react';

interface BhvCredentials {
  username: string;
  password: string;
}

interface BhvAuthData {
  hasCredentials: boolean;
  isConnected: boolean;
  username?: string;
  lastConnectionTime?: Date;
}

interface BhvAuthSectionProps {
  authData: BhvAuthData;
  onSaveCredentials: (credentials: BhvCredentials) => Promise<void>;
  onTestConnection: () => Promise<void>;
  onRemoveCredentials?: () => Promise<void>;
  isLoading?: boolean;
}

export default function BhvAuthSection({
  authData,
  onSaveCredentials,
  onTestConnection,
  onRemoveCredentials,
  isLoading = false
}: BhvAuthSectionProps) {
  const [credentials, setCredentials] = useState<BhvCredentials>({
    username: authData.username || '',
    password: ''
  });
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);

  const handleTestAndSave = async () => {
    if (!credentials.username.trim() || !credentials.password.trim()) {
      setError('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    setTesting(true);
    setError('');

    try {
      await onTestConnection();
      await onSaveCredentials(credentials);
      setCredentials(prev => ({ ...prev, password: '' })); // Clear password after success
      setIsEditing(false); // Exit editing mode on success
    } catch (err) {
      setError('Kết nối thất bại. Vui lòng kiểm tra thông tin đăng nhập.');
    } finally {
      setTesting(false);
    }
  };

  const handleEdit = () => {
    setCredentials({
      username: authData.username || '',
      password: ''
    });
    setError('');
    setIsEditing(true);
  };

  const showForm = !authData.hasCredentials || !authData.isConnected || error || isEditing;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold text-white">Kết nối BHV</h2>
          {authData.hasCredentials && authData.isConnected && !showForm && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full text-sm bg-green-500/20 text-green-400">
              <div className="w-2 h-2 rounded-full bg-green-400"></div>
              Đã kết nối
            </div>
          )}
        </div>

        {authData.hasCredentials && authData.isConnected && !showForm && (
          <div className="flex gap-2">
            <button
              onClick={handleEdit}
              disabled={isLoading}
              className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors"
            >
              Sửa
            </button>
            {onRemoveCredentials && (
              <button
                onClick={onRemoveCredentials}
                disabled={isLoading}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-800 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors"
              >
                Xóa
              </button>
            )}
          </div>
        )}
      </div>

      {/* Success State */}
      {authData.hasCredentials && authData.isConnected && !showForm && (
        <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <div className="text-green-400 font-medium text-sm">Kết nối thành công</div>
              <div className="text-green-300 text-xs">Tài khoản: {authData.username}</div>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">Thông tin đăng nhập BHV</h3>

          {error && (
            <div className="mb-4 bg-red-500/20 border border-red-500/30 rounded-lg p-3">
              <div className="text-red-400 text-sm">{error}</div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Tên đăng nhập *</label>
              <input
                type="text"
                value={credentials.username}
                onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
                disabled={testing || isLoading}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                placeholder="Nhập tên đăng nhập BHV"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Mật khẩu *</label>
              <input
                type="password"
                value={credentials.password}
                onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                disabled={testing || isLoading}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                placeholder="Nhập mật khẩu BHV"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleTestAndSave}
                disabled={testing || isLoading || !credentials.username.trim() || !credentials.password.trim()}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {testing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Đang kiểm tra...
                  </>
                ) : (
                  'Kiểm tra kết nối'
                )}
              </button>

              {isEditing && (
                <button
                  onClick={() => setIsEditing(false)}
                  disabled={testing || isLoading}
                  className="px-6 py-3 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors"
                >
                  Hủy
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}