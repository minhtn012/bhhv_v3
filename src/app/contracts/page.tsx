'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { getStatusText, getStatusColor } from '@/utils/contract-status';
import DateRangeFilter from '@/components/ui/DateRangeFilter';
import PaymentPendingBadge from '@/components/contracts/PaymentPendingBadge';

interface Contract {
  _id: string;
  contractNumber: string;
  chuXe: string;
  bienSo: string;
  status: 'nhap' | 'cho_duyet' | 'khach_duyet' | 'ra_hop_dong' | 'huy';
  tongPhi: number;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    username: string;
  } | string;
  buyerPaymentDate?: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, pages: 0 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [createdByFilter, setCreatedByFilter] = useState<string[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [users, setUsers] = useState<{ _id: string; username: string; role: string }[]>([]);
  const [selectedContracts, setSelectedContracts] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
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
  }, [router, pagination.page, search, statusFilter, createdByFilter, startDate, endDate]);

  // Fetch users list when currentUser is set (for admin filter)
  useEffect(() => {
    if (currentUser?.role === 'admin') {
      fetchUsers();
    }
  }, [currentUser]);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users?limit=1000&role=user');
      const data = await response.json();

      if (response.ok) {
        // Filter out admin users on client side as well for extra safety
        const nonAdminUsers = data.users.filter((u: any) => u.role !== 'admin');
        setUsers(nonAdminUsers);
      }
    } catch (error) {
      console.error('Fetch users error:', error);
    }
  };

  const fetchContracts = async () => {
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(search && { search }),
        ...(statusFilter.length > 0 && { status: statusFilter.join(',') }),
        ...(createdByFilter.length > 0 && { createdBy: createdByFilter.join(',') }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate })
      });

      console.log('🔍 Frontend Filter Debug:', {
        statusFilter,
        createdByFilter,
        search,
        queryString: params.toString()
      });

      const response = await fetch(`/api/contracts?${params}`);
      const data = await response.json();

      if (response.ok) {
        console.log('✅ Contracts Response:', {
          contractsCount: data.contracts.length,
          pagination: data.pagination,
          firstContract: data.contracts[0]?.contractNumber,
          firstContractCreatedBy: data.contracts[0]?.createdBy
        });
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

  // Filter handlers
  const toggleStatusFilter = (status: string) => {
    setStatusFilter(prev => {
      const newFilter = prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status];
      setPagination(p => ({ ...p, page: 1 }));
      return newFilter;
    });
  };

  const toggleUserFilter = (userId: string) => {
    setCreatedByFilter(prev => {
      const newFilter = prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId];
      setPagination(p => ({ ...p, page: 1 }));
      return newFilter;
    });
  };

  const removeStatusFilter = (status: string) => {
    setStatusFilter(prev => prev.filter(s => s !== status));
    setPagination(p => ({ ...p, page: 1 }));
  };

  const removeUserFilter = (userId: string) => {
    setCreatedByFilter(prev => prev.filter(id => id !== userId));
    setPagination(p => ({ ...p, page: 1 }));
  };

  const clearAllFilters = () => {
    setStatusFilter([]);
    setCreatedByFilter([]);
    setStartDate('');
    setEndDate('');
    setPagination(p => ({ ...p, page: 1 }));
  };

  // Checkbox selection handlers
  const handleSelectContract = (contractId: string, checked: boolean) => {
    if (checked) {
      setSelectedContracts(prev => [...prev, contractId]);
    } else {
      setSelectedContracts(prev => prev.filter(id => id !== contractId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      // Select all contracts regardless of status
      const allIds = contracts.map(contract => contract._id);
      setSelectedContracts(allIds);
    } else {
      setSelectedContracts([]);
    }
  };

  const isAllSelected = () => {
    return contracts.length > 0 &&
           contracts.every(contract => selectedContracts.includes(contract._id));
  };

  const getSelectedCount = () => selectedContracts.length;

  const handleBulkDelete = async () => {
    if (selectedContracts.length === 0) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch('/api/contracts/bulk-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ contractIds: selectedContracts }),
      });

      const data = await response.json();
      
      if (response.ok) {
        // Show success message
        if (data.summary.errors > 0) {
          setError(`Đã xóa ${data.summary.success}/${data.summary.total} hợp đồng. Có ${data.summary.errors} lỗi xảy ra.`);
        } else {
          setError('');
        }
        
        // Clear selection and refresh list
        setSelectedContracts([]);
        setShowDeleteConfirm(false);
        fetchContracts();
      } else {
        setError(data.error || 'Lỗi khi xóa hợp đồng');
      }
    } catch (error) {
      setError('Lỗi kết nối khi xóa hợp đồng');
      console.error('Bulk delete error:', error);
    } finally {
      setIsDeleting(false);
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

  return (
    <DashboardLayout>
      <div className="p-4 lg:p-6">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
              <h1 className="text-2xl font-bold text-white">Quản lý Hợp đồng</h1>
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                {getSelectedCount() > 0 && (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={isDeleting}
                    className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg hover:shadow-xl"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    {isDeleting ? 'Đang xóa...' : `Xóa ${getSelectedCount()} HĐ`}
                  </button>
                )}
                {currentUser?.role === 'user' && (
                  <button
                    onClick={() => router.push('/contracts/new')}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 w-full sm:w-auto"
                  >
                    Tạo báo giá mới
                  </button>
                )}
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm mb-6">
                {error}
              </div>
            )}

            {/* Search Bar */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Tìm kiếm theo mã HĐ, biển số, tên chủ xe..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500/50 transition-colors"
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap gap-4 mb-4">
              {/* Status Multi-Select */}
              <div className="relative group">
                <button className="bg-gray-800/50 border border-white/10 rounded-xl px-4 py-2 text-white hover:border-blue-500/50 transition-colors flex items-center gap-2 min-w-[140px]">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  <span>Trạng thái</span>
                  {statusFilter.length > 0 && (
                    <span className="ml-auto bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full">{statusFilter.length}</span>
                  )}
                </button>
                <div className="absolute top-full left-0 mt-2 bg-gray-800 border border-white/10 rounded-xl shadow-xl z-50 min-w-[200px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  <div className="p-2 space-y-1">
                    <label className="flex items-center gap-2 px-3 py-2 hover:bg-white/5 rounded-lg cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={statusFilter.includes('nhap')}
                        onChange={() => toggleStatusFilter('nhap')}
                        className="w-4 h-4 text-blue-500 bg-white/5 border-white/30 rounded focus:ring-blue-500"
                      />
                      <span className={`text-sm ${getStatusColor('nhap')}`}>{getStatusText('nhap')}</span>
                    </label>
                    <label className="flex items-center gap-2 px-3 py-2 hover:bg-white/5 rounded-lg cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={statusFilter.includes('cho_duyet')}
                        onChange={() => toggleStatusFilter('cho_duyet')}
                        className="w-4 h-4 text-blue-500 bg-white/5 border-white/30 rounded focus:ring-blue-500"
                      />
                      <span className={`text-sm ${getStatusColor('cho_duyet')}`}>{getStatusText('cho_duyet')}</span>
                    </label>
                    <label className="flex items-center gap-2 px-3 py-2 hover:bg-white/5 rounded-lg cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={statusFilter.includes('khach_duyet')}
                        onChange={() => toggleStatusFilter('khach_duyet')}
                        className="w-4 h-4 text-blue-500 bg-white/5 border-white/30 rounded focus:ring-blue-500"
                      />
                      <span className={`text-sm ${getStatusColor('khach_duyet')}`}>{getStatusText('khach_duyet')}</span>
                    </label>
                    <label className="flex items-center gap-2 px-3 py-2 hover:bg-white/5 rounded-lg cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={statusFilter.includes('ra_hop_dong')}
                        onChange={() => toggleStatusFilter('ra_hop_dong')}
                        className="w-4 h-4 text-blue-500 bg-white/5 border-white/30 rounded focus:ring-blue-500"
                      />
                      <span className={`text-sm ${getStatusColor('ra_hop_dong')}`}>{getStatusText('ra_hop_dong')}</span>
                    </label>
                    <label className="flex items-center gap-2 px-3 py-2 hover:bg-white/5 rounded-lg cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={statusFilter.includes('huy')}
                        onChange={() => toggleStatusFilter('huy')}
                        className="w-4 h-4 text-blue-500 bg-white/5 border-white/30 rounded focus:ring-blue-500"
                      />
                      <span className={`text-sm ${getStatusColor('huy')}`}>{getStatusText('huy')}</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* User Multi-Select */}
              {currentUser?.role === 'admin' && (
                <div className="relative group">
                  <button className="bg-gray-800/50 border border-white/10 rounded-xl px-4 py-2 text-white hover:border-purple-500/50 transition-colors flex items-center gap-2 min-w-[140px]">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>Người tạo</span>
                    {createdByFilter.length > 0 && (
                      <span className="ml-auto bg-purple-500 text-white text-xs px-1.5 py-0.5 rounded-full">{createdByFilter.length}</span>
                    )}
                  </button>
                  <div className="absolute top-full left-0 mt-2 bg-gray-800 border border-white/10 rounded-xl shadow-xl z-50 min-w-[200px] max-h-[300px] overflow-y-auto opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                    <div className="p-2 space-y-1">
                      {users.map(user => (
                        <label key={user._id} className="flex items-center gap-2 px-3 py-2 hover:bg-white/5 rounded-lg cursor-pointer transition-colors">
                          <input
                            type="checkbox"
                            checked={createdByFilter.includes(user._id)}
                            onChange={() => toggleUserFilter(user._id)}
                            className="w-4 h-4 text-purple-500 bg-white/5 border-white/30 rounded focus:ring-purple-500"
                          />
                          <span className="text-sm text-gray-300">{user.username}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Date Range Filter */}
              <DateRangeFilter
                startDate={startDate}
                endDate={endDate}
                onFilterChange={({ startDate: start, endDate: end }) => {
                  setStartDate(start);
                  setEndDate(end);
                  setPagination(p => ({ ...p, page: 1 }));
                }}
              />
            </div>

            {/* Active Filter Pills */}
            {(statusFilter.length > 0 || createdByFilter.length > 0 || startDate || endDate) && (
              <div className="mb-6 flex flex-wrap items-center gap-2">
                <span className="text-sm text-gray-400">Đang lọc:</span>

                {/* Status Pills */}
                {statusFilter.map(status => (
                  <button
                    key={status}
                    onClick={() => removeStatusFilter(status)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all hover:opacity-80 ${getStatusColor(status)}`}
                  >
                    <span>{getStatusText(status)}</span>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                ))}

                {/* User Pills */}
                {createdByFilter.map(userId => {
                  const user = users.find(u => u._id === userId);
                  return user ? (
                    <button
                      key={userId}
                      onClick={() => removeUserFilter(userId)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-purple-500/20 text-purple-300 transition-all hover:opacity-80"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>{user.username}</span>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  ) : null;
                })}

                {/* Date Range Pill */}
                {(startDate || endDate) && (
                  <button
                    onClick={() => {
                      setStartDate('');
                      setEndDate('');
                      setPagination(p => ({ ...p, page: 1 }));
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-500/20 text-blue-300 transition-all hover:opacity-80"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>
                      {startDate && endDate
                        ? `${startDate.split('-').reverse().join('/')} - ${endDate.split('-').reverse().join('/')}`
                        : startDate
                        ? `Từ ${startDate.split('-').reverse().join('/')}`
                        : `Đến ${endDate.split('-').reverse().join('/')}`}
                    </span>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}

                {/* Clear All Button */}
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

            {/* Contracts Table */}
            {contracts.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-lg font-medium">Chưa có hợp đồng nào</p>
                {currentUser?.role === 'user' && (
                  <>
                    <p className="mt-2 text-sm">Bắt đầu bằng cách tạo báo giá mới cho khách hàng</p>
                    <button
                      onClick={() => router.push('/contracts/new')}
                      className="mt-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-2 px-4 rounded-xl transition-all duration-200"
                    >
                      Tạo báo giá đầu tiên
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
                        <th className="text-left py-3 px-4 text-white font-medium w-12">
                          <input
                            type="checkbox"
                            checked={isAllSelected()}
                            onChange={(e) => handleSelectAll(e.target.checked)}
                            className="w-4 h-4 text-blue-500 bg-white/5 border border-white/30 rounded focus:ring-blue-500 focus:ring-2 focus:ring-offset-0 transition-colors"
                          />
                        </th>
                        <th className="text-left py-3 px-4 text-white font-medium">Mã HĐ</th>
                        <th className="text-left py-3 px-4 text-white font-medium">Người tạo</th>
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
                          <td className="py-3 px-4">
                            <input
                              type="checkbox"
                              checked={selectedContracts.includes(contract._id)}
                              onChange={(e) => handleSelectContract(contract._id, e.target.checked)}
                              className="w-4 h-4 text-blue-500 bg-white/5 border border-white/30 rounded focus:ring-blue-500 focus:ring-2 focus:ring-offset-0 transition-colors"
                            />
                          </td>
                          <td className="py-3 px-4 text-white font-mono text-sm">{contract.contractNumber}</td>
                          <td className="py-3 px-4 text-gray-300">
                            {typeof contract.createdBy === 'object' ? contract.createdBy.username : 'N/A'}
                          </td>
                          <td className="py-3 px-4 text-white">{contract.chuXe}</td>
                          <td className="py-3 px-4 text-gray-300 font-mono">{contract.bienSo}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(contract.status)}`}>
                                {getStatusText(contract.status)}
                              </span>
                              <PaymentPendingBadge contract={contract} />
                            </div>
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
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <input
                            type="checkbox"
                            checked={selectedContracts.includes(contract._id)}
                            onChange={(e) => handleSelectContract(contract._id, e.target.checked)}
                            className="w-4 h-4 text-blue-500 bg-white/5 border border-white/30 rounded focus:ring-blue-500 focus:ring-2 focus:ring-offset-0 transition-colors mt-0.5"
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className="text-white font-medium text-sm font-mono truncate">{contract.contractNumber}</h3>
                            <p className="text-gray-300 text-sm mt-1">{contract.chuXe}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1 ml-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(contract.status)} whitespace-nowrap`}>
                            {getStatusText(contract.status)}
                          </span>
                          <PaymentPendingBadge contract={contract} />
                        </div>
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
                        <div>
                          <span className="text-gray-400 block">Người tạo</span>
                          <span className="text-white">{typeof contract.createdBy === 'object' ? contract.createdBy.username : 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 block">Ngày tạo</span>
                          <span className="text-gray-300">{formatDate(contract.createdAt)}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-white/10">
                        <span className="text-gray-400 text-xs"></span>
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
                {pagination.total > 0 && (
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 pt-4 border-t border-white/10">
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-gray-300">Hiển thị:</span>
                      <select
                        value={pagination.limit}
                        onChange={(e) => setPagination(prev => ({ ...prev, limit: parseInt(e.target.value), page: 1 }))}
                        className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-blue-500 transition-colors"
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
                        
                        {/* Page Numbers */}
                        <div className="flex items-center gap-1">
                          {(() => {
                            const pages = [];
                            const current = pagination.page;
                            const total = pagination.pages;
                            
                            // Always show first page
                            if (current > 3) {
                              pages.push(1);
                              if (current > 4) pages.push('...');
                            }
                            
                            // Show pages around current
                            for (let i = Math.max(1, current - 2); i <= Math.min(total, current + 2); i++) {
                              pages.push(i);
                            }
                            
                            // Always show last page
                            if (current < total - 2) {
                              if (current < total - 3) pages.push('...');
                              pages.push(total);
                            }
                            
                            return pages.map((page, index) => (
                              <button
                                key={index}
                                onClick={() => typeof page === 'number' ? setPagination(prev => ({ ...prev, page })) : null}
                                disabled={typeof page !== 'number'}
                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                  page === current 
                                    ? 'bg-blue-600 text-white border border-blue-500'
                                    : typeof page === 'number'
                                    ? 'bg-gray-800 border border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white'
                                    : 'bg-transparent text-gray-500 cursor-default'
                                }`}
                              >
                                {page}
                              </button>
                            ));
                          })()}
                        </div>
                        
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

            {/* Delete Confirmation Dialog */}
            {showDeleteConfirm && (
              <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-md w-full shadow-2xl">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                      <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">Xác nhận xóa hợp đồng</h3>
                      <p className="text-sm text-gray-400">Thao tác không thể hoàn tác</p>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <p className="text-gray-300 leading-relaxed mb-4">
                      Bạn có chắc chắn muốn xóa <span className="font-bold text-red-400 bg-red-900/30 px-2 py-1 rounded-md">{getSelectedCount()}</span> hợp đồng đã chọn?
                    </p>
                    <div className="p-4 bg-red-900/20 border border-red-800/50 rounded-lg">
                      <p className="text-red-300 text-sm flex items-start gap-3">
                        <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>
                          <strong>Cảnh báo:</strong> Tất cả dữ liệu liên quan đến các hợp đồng này sẽ bị xóa vĩnh viễn và không thể khôi phục.
                        </span>
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 px-4 rounded-xl transition-colors duration-200"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      onClick={handleBulkDelete}
                      disabled={isDeleting}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-xl transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isDeleting ? (
                        <span className="flex items-center gap-2 justify-center">
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Đang xóa...
                        </span>
                      ) : (
                        'Xác nhận xóa'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
      </div>
    </DashboardLayout>
  );
}