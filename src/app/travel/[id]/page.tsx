'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import {
  TRAVEL_STATUS_LABELS,
  TRAVEL_PRODUCT_LABELS,
  TRAVEL_POLICY_TYPE_LABELS,
  TRAVEL_RELATIONSHIP_LABELS,
} from '@/providers/pacific-cross/products/travel/constants';

interface TravelContract {
  _id: string;
  contractNumber: string;
  product: number;
  plan: number;
  owner: {
    policyholder: string;
    pocyType: string;
    email?: string;
    telNo: string;
    address: string;
    countryAddress: string;
    startCountry: string;
  };
  period: {
    dateFrom: string;
    dateTo: string;
    days: number;
  };
  insuredPersons: Array<{
    name: string;
    dob: string;
    age: number;
    gender: string;
    country: string;
    personalId: string;
    telNo?: string;
    email?: string;
    relationship: string;
  }>;
  totalPremium: number;
  refNo?: string;
  pnrNo?: string;
  itinerary?: string;
  note?: string;
  status: string;
  statusHistory: Array<{
    status: string;
    changedBy: string;
    changedAt: string;
    note?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export default function TravelContractDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [contract, setContract] = useState<TravelContract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState<{ role: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/');
      return;
    }
    const user = JSON.parse(userData);
    if (!user.isLoggedIn) {
      router.push('/');
      return;
    }
    setCurrentUser(user);
    fetchContract();
  }, [router, params.id]);

  const fetchContract = async () => {
    try {
      const response = await fetch(`/api/travel/${params.id}`);
      const data = await response.json();

      if (response.ok) {
        setContract(data.contract);
      } else {
        setError(data.error || 'Không thể tải hợp đồng');
      }
    } catch {
      setError('Lỗi kết nối server');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string, note: string = '') => {
    setActionLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/travel/${params.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, note }),
      });

      const data = await response.json();

      if (response.ok) {
        fetchContract();
      } else {
        setError(data.error || 'Không thể thay đổi trạng thái');
      }
    } catch {
      setError('Lỗi kết nối server');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmit = async () => {
    await handleStatusChange('cho_duyet', 'Gửi báo giá');
  };

  const handleConfirm = async () => {
    await handleStatusChange('khach_duyet', 'Khách xác nhận');
  };

  const handleIssue = async () => {
    setActionLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/travel/${params.id}/confirm`, {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        fetchContract();
      } else {
        setError(data.error || 'Không thể ra hợp đồng');
      }
    } catch {
      setError('Lỗi kết nối server');
    } finally {
      setActionLoading(false);
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
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      nhap: 'bg-gray-500/20 text-gray-300',
      cho_duyet: 'bg-yellow-500/20 text-yellow-300',
      khach_duyet: 'bg-blue-500/20 text-blue-300',
      ra_hop_dong: 'bg-green-500/20 text-green-300',
      huy: 'bg-red-500/20 text-red-300',
    };
    return colors[status] || 'bg-gray-500/20 text-gray-300';
  };

  const canEdit = contract && (contract.status === 'nhap' || currentUser?.role === 'admin');

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!contract) {
    return (
      <DashboardLayout>
        <div className="p-4 lg:p-6">
          <div className="text-center text-gray-400">
            <p>{error || 'Không tìm thấy hợp đồng'}</p>
            <button
              onClick={() => router.push('/travel')}
              className="mt-4 text-blue-400 hover:text-blue-300"
            >
              ← Quay lại danh sách
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-4 lg:p-6">
        <div className="w-full">
          {/* Header */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 mb-6">
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <button
                    onClick={() => router.push('/travel')}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <h1 className="text-2xl font-bold text-white font-mono">{contract.contractNumber}</h1>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(contract.status)}`}>
                    {TRAVEL_STATUS_LABELS[contract.status]}
                  </span>
                </div>
                <p className="text-gray-400 text-sm">
                  Hợp đồng bảo hiểm du lịch • Tạo ngày {formatDate(contract.createdAt)}
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                {canEdit && (
                  <button
                    onClick={() => router.push(`/travel/${contract._id}/edit`)}
                    disabled={actionLoading}
                    className="bg-white/10 hover:bg-white/20 text-white font-medium py-2 px-4 rounded-xl transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Sửa
                  </button>
                )}
                {contract.status === 'nhap' && (
                  <button
                    onClick={handleSubmit}
                    disabled={actionLoading}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium py-2 px-4 rounded-xl transition-all duration-200 disabled:opacity-50"
                  >
                    Gửi báo giá
                  </button>
                )}
                {contract.status === 'cho_duyet' && (
                  <button
                    onClick={handleConfirm}
                    disabled={actionLoading}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium py-2 px-4 rounded-xl transition-all duration-200 disabled:opacity-50"
                  >
                    Khách duyệt
                  </button>
                )}
                {contract.status === 'khach_duyet' && currentUser?.role === 'admin' && (
                  <button
                    onClick={handleIssue}
                    disabled={actionLoading}
                    className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-medium py-2 px-4 rounded-xl transition-all duration-200 disabled:opacity-50"
                  >
                    Ra hợp đồng
                  </button>
                )}
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm mb-6">
              {error}
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Product Info */}
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Sản phẩm</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-gray-400 text-sm">Sản phẩm</p>
                    <p className="text-white font-medium">{TRAVEL_PRODUCT_LABELS[contract.product]}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Gói BH</p>
                    <p className="text-white">Plan {contract.plan}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Phí bảo hiểm</p>
                    <p className="text-green-400 font-medium text-lg">{formatCurrency(contract.totalPremium)}</p>
                  </div>
                </div>
              </div>

              {/* Period */}
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Thời hạn bảo hiểm</h2>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-gray-400 text-sm">Từ ngày</p>
                    <p className="text-white">{contract.period.dateFrom}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Đến ngày</p>
                    <p className="text-white">{contract.period.dateTo}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Số ngày</p>
                    <p className="text-white">{contract.period.days} ngày</p>
                  </div>
                </div>
              </div>

              {/* Owner */}
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Chủ hợp đồng</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-400 text-sm">Họ tên</p>
                    <p className="text-white">{contract.owner.policyholder}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Loại hình</p>
                    <p className="text-white">{TRAVEL_POLICY_TYPE_LABELS[contract.owner.pocyType]}</p>
                  </div>
                  {contract.owner.email && (
                    <div>
                      <p className="text-gray-400 text-sm">Email</p>
                      <p className="text-white">{contract.owner.email}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-gray-400 text-sm">Điện thoại</p>
                    <p className="text-white">{contract.owner.telNo}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-gray-400 text-sm">Địa chỉ</p>
                    <p className="text-white">{contract.owner.address}</p>
                  </div>
                </div>
              </div>

              {/* Insured Persons */}
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Người được bảo hiểm ({contract.insuredPersons.length})</h2>
                <div className="space-y-4">
                  {contract.insuredPersons.map((person, index) => (
                    <div key={index} className="p-4 bg-white/5 rounded-xl">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-white font-medium">#{index + 1} {person.name}</h3>
                        <span className="text-gray-400 text-sm">{person.age} tuổi</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-400">CCCD:</span>
                          <span className="text-white ml-2">{person.personalId}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Giới tính:</span>
                          <span className="text-white ml-2">{person.gender === 'M' ? 'Nam' : 'Nữ'}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Quốc tịch:</span>
                          <span className="text-white ml-2">{person.country}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Quan hệ:</span>
                          <span className="text-white ml-2">{TRAVEL_RELATIONSHIP_LABELS[person.relationship]}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Price Summary */}
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Tổng phí bảo hiểm</h2>
                <div className="text-center py-4">
                  <p className="text-3xl font-bold text-green-400">{formatCurrency(contract.totalPremium)}</p>
                  <p className="text-gray-400 text-sm mt-2">/ {contract.period.days} ngày</p>
                </div>
              </div>

              {/* Status History */}
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Lịch sử trạng thái</h2>
                <div className="space-y-4">
                  {contract.statusHistory.map((item, index) => (
                    <div key={index} className="relative pl-6 pb-4 last:pb-0">
                      {index < contract.statusHistory.length - 1 && (
                        <div className="absolute left-[9px] top-4 bottom-0 w-0.5 bg-white/10"></div>
                      )}
                      <div className={`absolute left-0 top-1 w-4 h-4 rounded-full ${getStatusColor(item.status).replace('text-', 'bg-').replace('20', '50')}`}></div>
                      <div>
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(item.status)}`}>
                          {TRAVEL_STATUS_LABELS[item.status]}
                        </span>
                        <p className="text-gray-500 text-xs mt-1">{formatDateTime(item.changedAt)}</p>
                        {item.note && <p className="text-gray-400 text-sm mt-1">{item.note}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
