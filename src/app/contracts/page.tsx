'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';

interface Contract {
  _id: string;
  contractNumber: string;
  chuXe: string;
  bienSo: string;
  status: 'nhap' | 'cho_duyet' | 'khach_duyet' | 'ra_hop_dong' | 'huy';
  tongPhi: number;
  createdAt: string;
  updatedAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

const statusMap = {
  'nhap': 'Nháp',
  'cho_duyet': 'Chờ duyệt',
  'khach_duyet': 'Khách duyệt',
  'ra_hop_dong': 'Ra hợp đồng',
  'huy': 'Đã hủy'
};

const statusColors = {
  'nhap': 'bg-gray-500/20 text-gray-300',
  'cho_duyet': 'bg-yellow-500/20 text-yellow-300',
  'khach_duyet': 'bg-green-500/20 text-green-300',
  'ra_hop_dong': 'bg-blue-500/20 text-blue-300',
  'huy': 'bg-red-500/20 text-red-300'
};

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, pages: 0 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const router = useRouter();

  useEffect(() => {
    // Check authentication
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      if (user.isLoggedIn) {
        setCurrentUser(user);
      } else {
        router.push('/');
        return;
      }
    } else {
      router.push('/');
      return;
    }

    fetchContracts();
  }, [router, pagination.page, search, statusFilter]);

  const fetchContracts = async () => {
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter })
      });

      const response = await fetch(`/api/contracts?${params}`);
      const data = await response.json();

      if (response.ok) {
        setContracts(data.contracts);
        setPagination(data.pagination);
        setError('');
      } else {
        setError(data.error || 'Lỗi khi tải danh sách hợp đồng');
      }
    } catch (error) {
      setError('Lỗi kết nối');
      console.error('Fetch contracts error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  return (
    <DashboardLayout>
      <div className="p-4 lg:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
              <h1 className="text-2xl font-bold text-white">Quản lý Hợp đồng</h1>
              <button
                onClick={() => router.push('/contracts/new')}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 w-full sm:w-auto"
              >
                Tạo báo giá mới
              </button>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm mb-6">
                {error}
              </div>
            )}

            {/* Search and Filter */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Tìm kiếm theo mã HĐ, biển số, tên chủ xe..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPagination(prev => ({ ...prev, page: 1 }));
                  }}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500/50"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-blue-500/50"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="nhap">Nháp</option>
                <option value="cho_duyet">Chờ duyệt</option>
                <option value="khach_duyet">Khách duyệt</option>
                <option value="ra_hop_dong">Ra hợp đồng</option>
                <option value="huy">Đã hủy</option>
              </select>
            </div>

            {/* Contracts Table */}
            {contracts.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-lg font-medium">Chưa có hợp đồng nào</p>
                <p className="mt-2 text-sm">Bắt đầu bằng cách tạo báo giá mới cho khách hàng</p>
                <button
                  onClick={() => router.push('/contracts/new')}
                  className="mt-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-2 px-4 rounded-xl transition-all duration-200"
                >
                  Tạo báo giá đầu tiên
                </button>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left py-3 px-4 text-white font-medium">Mã HĐ</th>
                        <th className="text-left py-3 px-4 text-white font-medium">Chủ xe</th>
                        <th className="text-left py-3 px-4 text-white font-medium">Biển số</th>
                        <th className="text-left py-3 px-4 text-white font-medium">Trạng thái</th>
                        <th className="text-left py-3 px-4 text-white font-medium">Tổng phí</th>
                        <th className="text-left py-3 px-4 text-white font-medium">Ngày tạo</th>
                        <th className="text-left py-3 px-4 text-white font-medium">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contracts.map((contract) => (
                        <tr key={contract._id} className="border-b border-white/5 hover:bg-white/5">
                          <td className="py-3 px-4 text-white font-mono text-sm">{contract.contractNumber}</td>
                          <td className="py-3 px-4 text-white">{contract.chuXe}</td>
                          <td className="py-3 px-4 text-gray-300 font-mono">{contract.bienSo}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[contract.status]}`}>
                              {statusMap[contract.status]}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-green-300 font-medium">
                            {formatCurrency(contract.tongPhi)}
                          </td>
                          <td className="py-3 px-4 text-gray-300 text-sm">
                            {formatDate(contract.createdAt)}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => router.push(`/contracts/${contract._id}`)}
                                className="text-blue-400 hover:text-blue-300 p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                                title="Xem chi tiết"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </button>
                              {contract.status === 'nhap' && (
                                <button
                                  onClick={() => router.push(`/contracts/${contract._id}/edit`)}
                                  className="text-green-400 hover:text-green-300 p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                                  title="Chỉnh sửa"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-4">
                  {contracts.map((contract) => (
                    <div key={contract._id} className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-medium text-sm font-mono truncate">{contract.contractNumber}</h3>
                          <p className="text-gray-300 text-sm mt-1">{contract.chuXe}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[contract.status]} whitespace-nowrap ml-2`}>
                          {statusMap[contract.status]}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                        <div>
                          <span className="text-gray-400 block">Biển số</span>
                          <span className="text-white font-mono">{contract.bienSo}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 block">Tổng phí</span>
                          <span className="text-green-300 font-medium">{formatCurrency(contract.tongPhi)}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-3 border-t border-white/10">
                        <span className="text-gray-400 text-xs">{formatDate(contract.createdAt)}</span>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => router.push(`/contracts/${contract._id}`)}
                            className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                          >
                            Chi tiết
                          </button>
                          {contract.status === 'nhap' && (
                            <button
                              onClick={() => router.push(`/contracts/${contract._id}/edit`)}
                              className="text-green-400 hover:text-green-300 text-sm font-medium"
                            >
                              Sửa
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-6">
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                      disabled={pagination.page === 1}
                      className="px-3 py-1 rounded-lg bg-white/10 text-white disabled:opacity-50 hover:bg-white/20 transition-colors"
                    >
                      Trước
                    </button>
                    <span className="text-white">
                      Trang {pagination.page} / {pagination.pages} (Tổng: {pagination.total})
                    </span>
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
                      disabled={pagination.page === pagination.pages}
                      className="px-3 py-1 rounded-lg bg-white/10 text-white disabled:opacity-50 hover:bg-white/20 transition-colors"
                    >
                      Sau
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}