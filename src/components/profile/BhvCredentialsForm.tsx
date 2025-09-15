'use client';

import { useState } from 'react';

interface BhvCredentials {
  username: string;
  password: string;
}

interface BhvCredentialsFormProps {
  initialCredentials?: BhvCredentials;
  onSave: (credentials: BhvCredentials) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  showForm: boolean;
}

export default function BhvCredentialsForm({
  initialCredentials,
  onSave,
  onCancel,
  isLoading = false,
  showForm
}: BhvCredentialsFormProps) {
  const [credentials, setCredentials] = useState<BhvCredentials>({
    username: initialCredentials?.username || '',
    password: initialCredentials?.password || ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Partial<BhvCredentials>>({});
  const [saving, setSaving] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Partial<BhvCredentials> = {};

    if (!credentials.username.trim()) {
      newErrors.username = 'Tên đăng nhập BHV là bắt buộc';
    } else if (credentials.username.length < 3) {
      newErrors.username = 'Tên đăng nhập phải có ít nhất 3 ký tự';
    }

    if (!credentials.password.trim()) {
      newErrors.password = 'Mật khẩu BHV là bắt buộc';
    } else if (credentials.password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      await onSave(credentials);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof BhvCredentials, value: string) => {
    setCredentials(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  if (!showForm) {
    return null;
  }

  return (
    <div className="bg-white/5 rounded-xl p-6 border border-white/10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">Thông tin đăng nhập BHV</h3>
          <p className="text-gray-300 text-sm mt-1">
            Nhập thông tin đăng nhập tài khoản BHV để tự động đồng bộ dữ liệu
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Username Field */}
        <div>
          <label htmlFor="bhv-username" className="block text-sm font-medium text-gray-300 mb-2">
            Tên đăng nhập BHV *
          </label>
          <div className="relative">
            <input
              id="bhv-username"
              type="text"
              value={credentials.username}
              onChange={(e) => handleChange('username', e.target.value)}
              disabled={isLoading || saving}
              className={`w-full px-4 py-3 bg-white/10 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                errors.username
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-white/20 hover:border-white/30'
              }`}
              placeholder="Nhập tên đăng nhập BHV của bạn"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
          {errors.username && (
            <p className="mt-2 text-sm text-red-400">{errors.username}</p>
          )}
        </div>

        {/* Password Field */}
        <div>
          <label htmlFor="bhv-password" className="block text-sm font-medium text-gray-300 mb-2">
            Mật khẩu BHV *
          </label>
          <div className="relative">
            <input
              id="bhv-password"
              type={showPassword ? 'text' : 'password'}
              value={credentials.password}
              onChange={(e) => handleChange('password', e.target.value)}
              disabled={isLoading || saving}
              className={`w-full px-4 py-3 bg-white/10 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors pr-12 ${
                errors.password
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-white/20 hover:border-white/30'
              }`}
              placeholder="Nhập mật khẩu BHV của bạn"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading || saving}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-white transition-colors disabled:cursor-not-allowed"
            >
              {showPassword ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L8.464 8.464m1.414 1.414L8.464 8.464m5.656 5.656L15.536 15.536m-1.414-1.414L15.536 15.536m-5.656-5.656l6.364-6.364" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
          {errors.password && (
            <p className="mt-2 text-sm text-red-400">{errors.password}</p>
          )}
        </div>

        {/* Security Notice */}
        <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <div>
              <div className="text-blue-300 font-medium text-sm">Bảo mật thông tin</div>
              <div className="text-blue-200 text-xs mt-1">
                Thông tin đăng nhập được mã hóa và chỉ được sử dụng để kết nối với hệ thống BHV.
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={isLoading || saving}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-xl transition-colors duration-200 flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Đang kiểm tra kết nối BHV...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Kiểm tra và lưu
              </>
            )}
          </button>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading || saving}
              className="px-6 py-3 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors duration-200"
            >
              Hủy
            </button>
          )}
        </div>
      </form>
    </div>
  );
}