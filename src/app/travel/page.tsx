'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { TRAVEL_STATUS_LABELS, TRAVEL_PRODUCT_LABELS } from '@/providers/pacific-cross/products/travel/constants';

interface TravelContract {
  _id: string;
  contractNumber: string;
  owner: { policyholder: string };
  product: number;
  period: { dateFrom: string; dateTo: string; days: number };
  insuredPersons: Array<{ name: string }>;
  totalPremium: number;
  status: string;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export default function TravelContractsPage() {
  const router = useRouter();
  const [contracts, setContracts] = useState<TravelContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState<{ isLoggedIn: boolean; role: string } | null>(null);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, pages: 0 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);

  useEffect(() => {
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
        ...(statusFilter.length > 0 && { status: statusFilter.join(',') }),
      });

      const response = await fetch(`/api/travel?${params}`);
      const data = await response.json();

      if (response.ok) {
        setContracts(data.contracts || []);
        setPagination(data.pagination);
      } else {
        setError(data.error || 'Không thể tải danh sách hợp đồng');
      }
    } catch {
      setError('Lỗi kết nối server');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(value);
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

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      nhap: 'bg-gray-500/20 text-gray-300',
      cho_duyet: 'bg-yellow-500/20 text-yellow-300',
      khach_duyet: 'bg-blue-500/20 text-blue-300',
      ra_hop_dong: 'bg-green-500/20 text-green-300',
      huy: 'bg-red-500/20 text-red-300',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-500/20 text-gray-300'}`}>
        {TRAVEL_STATUS_LABELS[status] || status}
      </span>
    );
  };

  const toggleStatusFilter = (status: string) => {
    setStatusFilter(prev => {
      const newFilter = prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status];
      setPagination(p => ({ ...p, page: 1 }));
      return newFilter;
    });
  };

  const removeStatusFilter = (status: string) => {
    setStatusFilter(prev => prev.filter(s => s !== status));
    setPagination(p => ({ ...p, page: 1 }));
  };

  const clearAllFilters = () => {
    setStatusFilter([]);
    setPagination(p => ({ ...p, page: 1 }));
  };

  const statuses = ['nhap', 'cho_duyet', 'khach_duyet', 'ra_hop_dong', 'huy'];

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
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
            <h1 className="text-2xl font-bold text-white">Quản lý Hợp đồng Du lịch</h1>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              {currentUser?.role === 'user' && (
                <button
                  onClick={() => router.push('/travel/new')}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 w-full sm:w-auto flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Tạo mới
                </button>
              )}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm mb-6">
              {error}
            </div>
          )}

          {/* Search Bar */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Tìm kiếm theo mã HĐ, chủ hợp đồng..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-400 focus:outline-none focus:border-green-500/50 transition-colors"
            />
          </div>

          {/* Filter Dropdown */}
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="relative group">
              <button className="bg-gray-800/50 border border-white/10 rounded-xl px-4 py-2 text-white hover:border-green-500/50 transition-colors flex items-center gap-2 min-w-[140px]">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                <span>Trạng thái</span>
                {statusFilter.length > 0 && (
                  <span className="ml-auto bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full">{statusFilter.length}</span>
                )}
              </button>
              <div className="absolute top-full left-0 mt-2 bg-gray-800 border border-white/10 rounded-xl shadow-xl z-50 min-w-[200px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                <div className="p-2 space-y-1">
                  {statuses.map(status => (
                    <label key={status} className="flex items-center gap-2 px-3 py-2 hover:bg-white/5 rounded-lg cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={statusFilter.includes(status)}
                        onChange={() => toggleStatusFilter(status)}
                        className="w-4 h-4 text-green-500 bg-white/5 border-white/30 rounded focus:ring-green-500"
                      />
                      <span className="text-sm text-gray-300">{TRAVEL_STATUS_LABELS[status]}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Active Filter Pills */}
          {statusFilter.length > 0 && (
            <div className="mb-6 flex flex-wrap items-center gap-2">
              <span className="text-sm text-gray-400">Đang lọc:</span>
              {statusFilter.map(status => (
                <button
                  key={status}
                  onClick={() => removeStatusFilter(status)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-green-500/20 text-green-300 transition-all hover:opacity-80"
                >
                  <span>{TRAVEL_STATUS_LABELS[status]}</span>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              ))}
              <button
                onClick={clearAllFilters}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>Xóa tất cả</span>
              </button>
            </div>
          )}

          {/* Contracts Table/Cards */}
          {contracts.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-lg font-medium">Chưa có hợp đồng du lịch nào</p>
              {currentUser?.role === 'user' && (
                <>
                  <p className="mt-2 text-sm">Bắt đầu bằng cách tạo hợp đồng bảo hiểm du lịch mới</p>
                  <button
                    onClick={() => router.push('/travel/new')}
                    className="mt-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium py-2 px-4 rounded-xl transition-all duration-200"
                  >
                    Tạo hợp đồng đầu tiên
                  </button>
                </>
              )}
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 px-4 text-white font-medium">Mã HĐ</th>
                      <th className="text-left py-3 px-4 text-white font-medium">Chủ HĐ</th>
                      <th className="text-left py-3 px-4 text-white font-medium">Sản phẩm</th>
                      <th className="text-left py-3 px-4 text-white font-medium">Thời hạn</th>
                      <th className="text-left py-3 px-4 text-white font-medium">Số người</th>
                      <th className="text-left py-3 px-4 text-white font-medium">Phí BH</th>
                      <th className="text-left py-3 px-4 text-white font-medium">Trạng thái</th>
                      <th className="text-left py-3 px-4 text-white font-medium">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contracts.map((contract) => (
                      <tr
                        key={contract._id}
                        className="border-b border-white/5 hover:bg-white/5 cursor-pointer"
                        onClick={() => router.push(`/travel/${contract._id}`)}
                      >
                        <td className="py-3 px-4 text-white font-mono text-sm">{contract.contractNumber}</td>
                        <td className="py-3 px-4 text-gray-300">{contract.owner.policyholder}</td>
                        <td className="py-3 px-4 text-gray-300">{TRAVEL_PRODUCT_LABELS[contract.product]}</td>
                        <td className="py-3 px-4 text-gray-300">{contract.period.days} ngày</td>
                        <td className="py-3 px-4 text-gray-300">{contract.insuredPersons.length}</td>
                        <td className="py-3 px-4 text-green-300 font-medium">
                          {formatCurrency(contract.totalPremium)}
                        </td>
                        <td className="py-3 px-4">{getStatusBadge(contract.status)}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/travel/${contract._id}`);
                              }}
                              className="text-blue-400 hover:text-blue-300 p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                              title="Xem chi tiết"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                            {(contract.status === 'nhap' || currentUser?.role === 'admin') && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/travel/${contract._id}/edit`);
                                }}
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
                  <div
                    key={contract._id}
                    className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-4 cursor-pointer hover:bg-white/10 transition-colors"
                    onClick={() => router.push(`/travel/${contract._id}`)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-medium text-sm font-mono truncate">{contract.contractNumber}</h3>
                        <p className="text-gray-300 text-sm mt-1">{contract.owner.policyholder}</p>
                      </div>
                      {getStatusBadge(contract.status)}
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                      <div>
                        <span className="text-gray-400 block">Sản phẩm</span>
                        <span className="text-white">{TRAVEL_PRODUCT_LABELS[contract.product]}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block">Phí BH</span>
                        <span className="text-green-300 font-medium">{formatCurrency(contract.totalPremium)}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block">Thời hạn</span>
                        <span className="text-white">{contract.period.days} ngày</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block">Số người</span>
                        <span className="text-white">{contract.insuredPersons.length}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-white/10">
                      <span className="text-gray-400 text-xs">{formatDate(contract.createdAt)}</span>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/travel/${contract._id}`);
                          }}
                          className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                        >
                          Chi tiết
                        </button>
                        {(contract.status === 'nhap' || currentUser?.role === 'admin') && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/travel/${contract._id}/edit`);
                            }}
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
              {pagination.total > 0 && (
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 pt-4 border-t border-white/10">
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-gray-300">Hiển thị:</span>
                    <select
                      value={pagination.limit}
                      onChange={(e) => setPagination(prev => ({ ...prev, limit: parseInt(e.target.value), page: 1 }))}
                      className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-green-500 transition-colors"
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                    <span className="text-gray-300">
                      / trang (Tổng: <span className="font-medium text-white">{pagination.total}</span> hợp đồng)
                    </span>
                  </div>

                  {pagination.pages > 1 && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                        disabled={pagination.page === 1}
                        className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>

                      <span className="px-4 py-2 text-gray-300 text-sm">
                        Trang {pagination.page} / {pagination.pages}
                      </span>

                      <button
                        onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
                        disabled={pagination.page === pagination.pages}
                        className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
