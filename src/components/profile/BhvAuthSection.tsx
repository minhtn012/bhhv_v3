'use client';

import { useState } from 'react';
import BhvConnectionStatus from './BhvConnectionStatus';
import BhvCredentialsForm from './BhvCredentialsForm';

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
  const [showCredentialsForm, setShowCredentialsForm] = useState(!authData.hasCredentials);
  const [isEditing, setIsEditing] = useState(false);

  const handleSaveCredentials = async (credentials: BhvCredentials) => {
    await onSaveCredentials(credentials);
    setShowCredentialsForm(false);
    setIsEditing(false);
  };

  const handleEditCredentials = () => {
    setIsEditing(true);
    setShowCredentialsForm(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    if (authData.hasCredentials) {
      setShowCredentialsForm(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Kết nối BHV</h2>
          <p className="text-gray-300 text-sm mt-1">
            Quản lý thông tin đăng nhập và kết nối với hệ thống BHV
          </p>
        </div>

        {authData.hasCredentials && !showCredentialsForm && (
          <div className="flex gap-2">
            <button
              onClick={handleEditCredentials}
              disabled={isLoading}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors duration-200 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Chỉnh sửa
            </button>

            {onRemoveCredentials && (
              <button
                onClick={onRemoveCredentials}
                disabled={isLoading}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-800 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors duration-200 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Xóa
              </button>
            )}
          </div>
        )}
      </div>

      {/* Connection Status (always show if has credentials) */}
      {authData.hasCredentials && (
        <BhvConnectionStatus
          isConnected={authData.isConnected}
          lastConnectionTime={authData.lastConnectionTime}
          username={authData.username}
          onTestConnection={onTestConnection}
          isLoading={isLoading}
        />
      )}

      {/* Credentials Form */}
      <BhvCredentialsForm
        initialCredentials={authData.hasCredentials ? { username: authData.username || '', password: '' } : undefined}
        onSave={handleSaveCredentials}
        onCancel={authData.hasCredentials ? handleCancelEdit : undefined}
        isLoading={isLoading}
        showForm={showCredentialsForm}
      />

      {/* Quick Setup Guide (only show when no credentials) */}
      {!authData.hasCredentials && !showCredentialsForm && (
        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Kết nối với BHV</h3>
            <p className="text-gray-300 text-sm mb-6 max-w-md mx-auto">
              Thiết lập kết nối với hệ thống BHV để tự động đồng bộ dữ liệu và tạo hợp đồng.
            </p>
            <button
              onClick={() => setShowCredentialsForm(true)}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-xl transition-colors duration-200 flex items-center gap-2 mx-auto"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Thiết lập ngay
            </button>
          </div>
        </div>
      )}

    </div>
  );
}