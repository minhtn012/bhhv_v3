'use client';

import { useState } from 'react';

interface ChangePasswordSectionProps {
  onChangePassword: (e: React.FormEvent) => Promise<void>;
  passwordForm: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  };
  setPasswordForm: React.Dispatch<React.SetStateAction<{
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }>>;
  passwordLoading: boolean;
  passwordError: string;
}

export default function ChangePasswordSection({
  onChangePassword,
  passwordForm,
  setPasswordForm,
  passwordLoading,
  passwordError
}: ChangePasswordSectionProps) {
  return (
    <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
      <h2 className="text-xl font-bold text-white mb-6">Change Password</h2>

      {passwordError && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm mb-6">
          {passwordError}
        </div>
      )}

      <form onSubmit={onChangePassword} className="space-y-4 max-w-md">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Current Password</label>
          <input
            type="password"
            required
            value={passwordForm.currentPassword}
            onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            placeholder="Enter current password"
            disabled={passwordLoading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">New Password</label>
          <input
            type="password"
            required
            value={passwordForm.newPassword}
            onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            placeholder="Enter new password"
            disabled={passwordLoading}
            minLength={6}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Confirm New Password</label>
          <input
            type="password"
            required
            value={passwordForm.confirmPassword}
            onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            placeholder="Confirm new password"
            disabled={passwordLoading}
            minLength={6}
          />
        </div>

        <button
          type="submit"
          disabled={passwordLoading}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-[1.02] disabled:hover:scale-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-transparent shadow-lg"
        >
          {passwordLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Changing Password...
            </div>
          ) : (
            'Change Password'
          )}
        </button>
      </form>
    </div>
  );
}