'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import StatsCard from '@/components/dashboard/StatsCard';
import StatusChart from '@/components/dashboard/StatusChart';
import ActivityTimeline from '@/components/dashboard/ActivityTimeline';
import RevenueChart from '@/components/dashboard/RevenueChart';
import { SalesLeaderboard, ConversionFunnel, ExpiringContracts, SalesUser } from '@/components/dashboard/analytics';

interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'user';
  isLoggedIn: boolean;
}

interface DashboardStats {
  overview: {
    totalContracts: number;
    monthlyRevenue: number;
    pendingApproval: number;
    conversionRate: number;
    monthlyGrowth: number;
  };
  statusDistribution: Array<{
    status: string;
    statusText: string;
    count: number;
    percentage: number;
    color: string;
  }>;
  recentActivity: Array<{
    _id: string;
    contractNumber: string;
    action: string;
    timestamp: Date;
    user: string;
    status: string;
  }>;
  revenueChart: Array<{
    month: string;
    revenue: number;
    contracts: number;
  }>;
  performance: {
    avgProcessingTime: number;
    successRate: number;
    topPackages: Array<{
      package: string;
      count: number;
      revenue: number;
    }>;
  };
}

interface UserDashboardStats {
  overview: {
    totalContracts: number;
    monthlyContracts: number;
    activeContracts: number;
    completedContracts: number;
  };
  statusDistribution: Array<{
    status: string;
    statusText: string;
    count: number;
    percentage: number;
    color: string;
  }>;
  recentActivity: Array<{
    _id: string;
    contractNumber: string;
    action: string;
    timestamp: Date;
    user: string;
    status: string;
  }>;
  recentContracts: Array<{
    _id: string;
    contractNumber: string;
    status: string;
    tongPhi: number;
    createdAt: Date;
    customerName: string;
  }>;
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [userStats, setUserStats] = useState<UserDashboardStats | null>(null);
  const [salesUsers, setSalesUsers] = useState<SalesUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      if (parsedUser.isLoggedIn) {
        setUser(parsedUser);
      } else {
        router.push('/');
      }
    } else {
      router.push('/');
    }
  }, [router]);

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchDashboardStats();
      fetchSalesUsers();
    } else if (user && user.role === 'user') {
      fetchUserDashboardStats();
    }
  }, [user]);

  const fetchDashboardStats = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/admin/dashboard-stats', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard stats');
      }

      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      setError('Không thể tải dữ liệu dashboard. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserDashboardStats = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/users/dashboard-stats', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user dashboard stats');
      }

      const data = await response.json();
      setUserStats(data);
    } catch (error) {
      console.error('Error fetching user dashboard stats:', error);
      setError('Không thể tải dữ liệu dashboard. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSalesUsers = async () => {
    try {
      const response = await fetch('/api/users?role=user&limit=100', {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        setSalesUsers(data.users?.map((u: { _id: string; username: string }) => ({
          _id: u._id,
          username: u.username
        })) || []);
      }
    } catch (error) {
      console.error('Error fetching sales users:', error);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (user.role === 'user') {
    return (
      <DashboardLayout>
        <div className="p-4 lg:p-6 space-y-6">
          {error && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-red-300">{error}</span>
                <button
                  onClick={fetchUserDashboardStats}
                  className="ml-auto text-red-400 hover:text-red-300 text-sm font-medium"
                >
                  Thử lại
                </button>
              </div>
            </div>
          )}

          {/* User Overview Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            <StatsCard
              title="Tổng hợp đồng"
              value={userStats?.overview.totalContracts || 0}
              icon={
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              }
              iconColor="bg-gradient-to-r from-blue-500 to-blue-600"
              isLoading={isLoading}
              onClick={() => router.push('/contracts')}
            />

            <StatsCard
              title="Tháng này"
              value={userStats?.overview.monthlyContracts || 0}
              subtitle="Hợp đồng mới"
              icon={
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              }
              iconColor="bg-gradient-to-r from-green-500 to-green-600"
              isLoading={isLoading}
            />

            <StatsCard
              title="Đang xử lý"
              value={userStats?.overview.activeContracts || 0}
              subtitle="Cần theo dõi"
              icon={
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              iconColor="bg-gradient-to-r from-amber-500 to-amber-600"
              isLoading={isLoading}
              onClick={() => router.push('/contracts?status=cho_duyet,khach_duyet')}
            />

            <StatsCard
              title="Hoàn thành"
              value={userStats?.overview.completedContracts || 0}
              subtitle="Ra hợp đồng"
              icon={
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              iconColor="bg-gradient-to-r from-emerald-500 to-emerald-600"
              isLoading={isLoading}
              onClick={() => router.push('/contracts?status=ra_hop_dong')}
            />
          </div>

          {/* Charts and Data Section */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <StatusChart
              data={userStats?.statusDistribution || []}
              isLoading={isLoading}
            />

            <ActivityTimeline
              activities={userStats?.recentActivity || []}
              isLoading={isLoading}
            />
          </div>

          {/* Recent Contracts Table */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Hợp đồng gần đây</h3>
              <button
                onClick={() => router.push('/contracts')}
                className="text-blue-400 hover:text-blue-300 text-sm font-medium"
              >
                Xem tất cả
              </button>
            </div>

            {isLoading ? (
              <div className="animate-pulse space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white/5 rounded-lg p-4">
                    <div className="h-4 bg-gray-600 rounded w-24 mb-2"></div>
                    <div className="h-3 bg-gray-700 rounded w-32"></div>
                  </div>
                ))}
              </div>
            ) : userStats?.recentContracts && userStats.recentContracts.length > 0 ? (
              <div className="space-y-3">
                {userStats.recentContracts.map((contract) => (
                  <div key={contract._id} className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-white font-medium">{contract.contractNumber}</div>
                        <div className="text-gray-300 text-sm">{contract.customerName}</div>
                        <div className="text-gray-400 text-xs">
                          {new Date(contract.createdAt).toLocaleDateString('vi-VN')}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-green-400 font-semibold">
                          {contract.tongPhi ? `${(contract.tongPhi / 1000).toFixed(0)}k VNĐ` : 'N/A'}
                        </div>
                        <div className={`text-xs px-2 py-1 rounded-full ${
                          contract.status === 'ra_hop_dong' ? 'bg-green-500/20 text-green-400' :
                          contract.status === 'cho_duyet' ? 'bg-amber-500/20 text-amber-400' :
                          contract.status === 'khach_duyet' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {contract.status === 'ra_hop_dong' ? 'Hoàn thành' :
                           contract.status === 'cho_duyet' ? 'Chờ duyệt' :
                           contract.status === 'khach_duyet' ? 'Khách duyệt' :
                           contract.status}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <svg className="w-12 h-12 text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-gray-400 mb-4">Bạn chưa có hợp đồng nào</p>
                {user.role === 'user' && (
                  <button
                    onClick={() => router.push('/contracts/new')}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200"
                  >
                    Tạo hợp đồng đầu tiên
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
            {user.role === 'user' && (
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Tạo báo giá mới</h3>
                    <p className="text-gray-300 text-sm">Bắt đầu tạo hợp đồng bảo hiểm</p>
                  </div>
                </div>
                <button
                  onClick={() => router.push('/contracts/new')}
                  className="w-full mt-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium py-2.5 px-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02]">
                  Tạo ngay
                </button>
              </div>
            )}

            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-semibold">Quản lý hợp đồng</h3>
                  <p className="text-gray-300 text-sm">Xem và quản lý hợp đồng của bạn</p>
                </div>
              </div>
              <button
                onClick={() => router.push('/contracts')}
                className="w-full mt-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-medium py-2.5 px-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02]">
                Xem hợp đồng
              </button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Admin Dashboard
  return (
    <DashboardLayout>
      <div className="p-4 lg:p-6 space-y-6">
        {error && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-red-300">{error}</span>
              <button
                onClick={fetchDashboardStats}
                className="ml-auto text-red-400 hover:text-red-300 text-sm font-medium"
              >
                Thử lại
              </button>
            </div>
          </div>
        )}

        {/* Overview Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <StatsCard
            title="Tổng hợp đồng"
            value={stats?.overview.totalContracts || 0}
            icon={
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
            iconColor="bg-gradient-to-r from-blue-500 to-blue-600"
            isLoading={isLoading}
            onClick={() => router.push('/contracts')}
          />

          <StatsCard
            title="Doanh thu tháng"
            value={`${((stats?.overview.monthlyRevenue || 0) / 1000000).toFixed(1)}M VNĐ`}
            change={stats?.overview.monthlyGrowth}
            changeType={stats?.overview.monthlyGrowth && stats.overview.monthlyGrowth > 0 ? 'increase' : stats?.overview.monthlyGrowth && stats.overview.monthlyGrowth < 0 ? 'decrease' : 'neutral'}
            icon={
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            }
            iconColor="bg-gradient-to-r from-green-500 to-green-600"
            isLoading={isLoading}
          />

          <StatsCard
            title="Chờ duyệt"
            value={stats?.overview.pendingApproval || 0}
            subtitle="Cần xem xét"
            icon={
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            iconColor="bg-gradient-to-r from-amber-500 to-amber-600"
            isLoading={isLoading}
            onClick={() => router.push('/contracts?status=cho_duyet')}
          />

          <StatsCard
            title="Tỷ lệ chuyển đổi"
            value={`${stats?.overview.conversionRate || 0}%`}
            subtitle="Báo giá → Hợp đồng"
            icon={
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
            iconColor="bg-gradient-to-r from-purple-500 to-purple-600"
            isLoading={isLoading}
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <StatusChart
            data={stats?.statusDistribution || []}
            isLoading={isLoading}
          />

          <ActivityTimeline
            activities={stats?.recentActivity || []}
            isLoading={isLoading}
          />
        </div>

        {/* Revenue Chart */}
        <RevenueChart
          data={stats?.revenueChart || []}
          isLoading={isLoading}
        />

        {/* Performance Metrics */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Hiệu suất hệ thống</h3>

          {isLoading ? (
            <div className="animate-pulse grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white/5 rounded-xl p-4">
                  <div className="h-4 bg-gray-600 rounded w-24 mb-2"></div>
                  <div className="h-6 bg-gray-600 rounded w-16 mb-2"></div>
                  <div className="h-3 bg-gray-700 rounded w-32"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/5 rounded-xl p-4">
                <div className="text-2xl font-bold text-blue-400 mb-1">
                  {stats?.performance.avgProcessingTime?.toFixed(1) || 0} ngày
                </div>
                <div className="text-sm text-gray-300">Thời gian xử lý TB</div>
                <div className="text-xs text-gray-400 mt-1">Từ tạo đến hoàn thành</div>
              </div>

              <div className="bg-white/5 rounded-xl p-4">
                <div className="text-2xl font-bold text-green-400 mb-1">
                  {stats?.performance.successRate?.toFixed(1) || 0}%
                </div>
                <div className="text-sm text-gray-300">Tỷ lệ thành công</div>
                <div className="text-xs text-gray-400 mt-1">Hợp đồng hoàn thành</div>
              </div>

              <div className="bg-white/5 rounded-xl p-4">
                <div className="text-sm text-gray-300 mb-2">Gói phổ biến nhất</div>
                {stats?.performance.topPackages && stats.performance.topPackages.length > 0 ? (
                  <div className="space-y-1">
                    <div className="text-lg font-semibold text-white">
                      {stats.performance.topPackages[0].package}
                    </div>
                    <div className="text-xs text-gray-400">
                      {stats.performance.topPackages[0].count} hợp đồng
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-400 text-sm">Chưa có dữ liệu</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sales Analytics Section */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Phân tích Sales
          </h2>

          {/* Sales Leaderboard */}
          <SalesLeaderboard salesUsers={salesUsers} />

          {/* Conversion Funnel & Expiring Contracts */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <ConversionFunnel salesUsers={salesUsers} />
            <ExpiringContracts />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}