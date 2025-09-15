'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import BhvAuthSection from '@/components/profile/BhvAuthSection';

interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'user';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  // Change password form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // BHV Auth state (mock data for now)
  const [bhvAuthData, setBhvAuthData] = useState({
    hasCredentials: false,
    isConnected: false,
    username: '',
    lastConnectionTime: undefined as Date | undefined
  });
  const [bhvLoading, setBhvLoading] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/');
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    setLoading(false);

    // Also fetch fresh user data from API
    fetchUserProfile();

    // Fetch BHV credentials status if user role is 'user'
    if (parsedUser.role === 'user') {
      fetchBhvCredentials();
    }
  }, [router]);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch('/api/auth/me');
      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
        // Update localStorage with fresh data
        localStorage.setItem('user', JSON.stringify({
          ...data.user,
          isLoggedIn: true
        }));
      } else {
        if (response.status === 401) {
          localStorage.removeItem('user');
          router.push('/');
        }
      }
    } catch (error) {
      console.error('Fetch profile error:', error);
    }
  };

  const fetchBhvCredentials = async () => {
    try {
      const response = await fetch('/api/users/bhv-credentials', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setBhvAuthData({
          hasCredentials: data.hasCredentials,
          isConnected: data.isConnected,
          username: '', // Don't store actual username in client state
          lastConnectionTime: data.lastConnectionTime ? new Date(data.lastConnectionTime) : undefined
        });
      } else if (response.status === 403) {
        // User doesn't have permission to access BHV credentials (probably admin)
        console.log('User does not have BHV credentials access');
      } else {
        console.error('Failed to fetch BHV credentials status');
      }
    } catch (error) {
      console.error('BHV credentials fetch error:', error);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordError('');
    setSuccess('');

    // Validation
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match');
      setPasswordLoading(false);
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long');
      setPasswordLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/users/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Password changed successfully');
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        setPasswordError(data.error || 'Failed to change password');
      }
    } catch (error) {
      setPasswordError('Network error. Please try again.');
      console.error('Change password error:', error);
    } finally {
      setPasswordLoading(false);
    }
  };

  // BHV Auth handlers (real implementations)
  const handleSaveBhvCredentials = async (credentials: { username: string; password: string }) => {
    setBhvLoading(true);
    setError('');
    setPasswordError('');

    try {
      // First, test authentication with BHV
      const response = await fetch('/api/users/bhv-test-auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          username: credentials.username,
          password: credentials.password
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Authentication successful - update state
        setBhvAuthData(prev => ({
          ...prev,
          hasCredentials: true,
          isConnected: true,
          username: '', // Don't store actual username in client state for security
          lastConnectionTime: new Date(data.connectionTime)
        }));

        setSuccess('Kết nối BHV thành công! Thông tin đăng nhập đã được lưu.');
      } else {
        // Authentication failed - show error and reset form
        setError(data.error || 'Không thể xác thực với BHV. Vui lòng kiểm tra lại thông tin.');

        // Reset BHV auth data to allow user to re-enter credentials
        setBhvAuthData(prev => ({
          ...prev,
          hasCredentials: false,
          isConnected: false,
          username: '',
          lastConnectionTime: undefined
        }));
      }
    } catch (error) {
      setError('Lỗi kết nối. Vui lòng kiểm tra kết nối internet và thử lại.');

      // Reset form on network error as well
      setBhvAuthData(prev => ({
        ...prev,
        hasCredentials: false,
        isConnected: false,
        username: '',
        lastConnectionTime: undefined
      }));
    } finally {
      setBhvLoading(false);
    }
  };

  const handleTestBhvConnection = async () => {
    if (!bhvAuthData.hasCredentials) {
      setError('Chưa có thông tin đăng nhập BHV để kiểm tra. Vui lòng nhập thông tin đăng nhập trước.');
      return;
    }

    setBhvLoading(true);
    setError('');
    setPasswordError('');

    try {
      // Since we now store credentials, we need user to re-enter password for security
      // This is a limitation of the test connection feature
      setError('Để kiểm tra kết nối, vui lòng nhập lại thông tin đăng nhập trong form bên dưới.');
    } catch (error) {
      setError('Lỗi hệ thống. Vui lòng thử lại sau.');
      console.error('BHV connection test error:', error);
    } finally {
      setBhvLoading(false);
    }
  };

  const handleRemoveBhvCredentials = async () => {
    setBhvLoading(true);
    setError('');
    setPasswordError('');

    try {
      const response = await fetch('/api/users/bhv-credentials', {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        setBhvAuthData({
          hasCredentials: false,
          isConnected: false,
          username: '',
          lastConnectionTime: undefined
        });
        setSuccess('Đã xóa thông tin đăng nhập BHV.');
      } else {
        const data = await response.json();
        setError(data.error || 'Không thể xóa thông tin đăng nhập BHV.');
      }
    } catch (error) {
      setError('Lỗi kết nối. Vui lòng thử lại sau.');
      console.error('BHV credentials removal error:', error);
    } finally {
      setBhvLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!user) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-white">User not found</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-4 lg:p-6">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* Global Success/Error Messages */}
          {success && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 text-green-400 text-sm">
              {success}
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm">
              {error}
            </div>
          )}

        {/* BHV Authentication Section - Only for regular users */}
        {user.role === 'user' && (
          <BhvAuthSection
            authData={bhvAuthData}
            onSaveCredentials={handleSaveBhvCredentials}
            onTestConnection={handleTestBhvConnection}
            onRemoveCredentials={handleRemoveBhvCredentials}
            isLoading={bhvLoading}
          />
        )}

        {/* Profile Information */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
          <h1 className="text-2xl font-bold text-white mb-6">Profile Information</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
                <div className="px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white">
                  {user.username}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                <div className="px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white">
                  {user.email}
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Role</label>
                <div className="px-4 py-3 bg-white/5 border border-white/20 rounded-xl">
                  <span className={`px-3 py-1 rounded-lg text-sm font-medium ${
                    user.role === 'admin' 
                      ? 'bg-purple-500/20 text-purple-400' 
                      : 'bg-blue-500/20 text-blue-400'
                  }`}>
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                <div className="px-4 py-3 bg-white/5 border border-white/20 rounded-xl">
                  <span className={`px-3 py-1 rounded-lg text-sm font-medium ${
                    user.isActive 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Member Since</label>
              <div className="px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white">
                {new Date(user.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Last Updated</label>
              <div className="px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white">
                {new Date(user.updatedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-6">Change Password</h2>

          {passwordError && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm mb-6">
              {passwordError}
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
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

        {/* Account Statistics */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-6">Account Statistics</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-white/5 rounded-xl">
              <div className="text-2xl font-bold text-blue-400">
                {Math.floor((new Date().getTime() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24))}
              </div>
              <div className="text-xs text-gray-400">Days as Member</div>
            </div>
            
            <div className="text-center p-4 bg-white/5 rounded-xl">
              <div className="text-2xl font-bold text-purple-400">
                {user.role === 'admin' ? '∞' : '0'}
              </div>
              <div className="text-xs text-gray-400">Admin Privileges</div>
            </div>
            
            <div className="text-center p-4 bg-white/5 rounded-xl">
              <div className="text-2xl font-bold text-green-400">
                {user.isActive ? '✓' : '✗'}
              </div>
              <div className="text-xs text-gray-400">Account Status</div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </DashboardLayout>
  );
}