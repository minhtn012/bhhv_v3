'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { getHealthStatusText, getHealthStatusColor } from '@/utils/health-contract-status';
import { HEALTH_PACKAGE_LABELS, HEALTH_RELATIONSHIP_LABELS } from '@/providers/bhv-online/products/health/constants';
import { HEALTH_QUESTION_DEFINITIONS } from '@/providers/bhv-online/products/health/health-questions';

interface HealthContract {
  _id: string;
  contractNumber: string;
  productType: string;
  kindAction: string;
  packageType: string;
  packageName: string;
  purchaseYears: number;
  benefitAddons: {
    maternity: boolean;
    outpatient: boolean;
    diseaseDeath: boolean;
  };
  healthQuestions: Array<{
    questionId: string;
    answer: boolean;
    details?: string;
  }>;
  buyer: {
    fullname: string;
    email: string;
    identityCard: string;
    phone: string;
    birthday: string;
    gender: string;
    job?: string;
    address?: string;
  };
  insuredPerson: {
    fullname: string;
    email?: string;
    identityCard: string;
    phone?: string;
    birthday: string;
    gender: string;
    relationship: string;
  };
  beneficiary: {
    fullname: string;
    identityCard: string;
    relationship: string;
  };
  customerKind: string;
  activeDate: string;
  inactiveDate: string;
  totalPremium: number;
  bhvSaleCode?: string;
  bhvContractNumber?: string;
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

// Status Change Modal Component (matching vehicle pattern)
function StatusChangeModal({
  isVisible,
  onClose,
  onConfirm,
  currentStatus,
  targetStatus,
  loading,
}: {
  isVisible: boolean;
  onClose: () => void;
  onConfirm: (note: string) => void;
  currentStatus: string;
  targetStatus: string;
  loading: boolean;
}) {
  const [note, setNote] = useState('');

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-md w-full shadow-2xl">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-bold text-white mb-1">Chuyển trạng thái</h3>
            <p className="text-sm text-gray-400">
              {getHealthStatusText(currentStatus)} → {getHealthStatusText(targetStatus)}
            </p>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm text-gray-400 mb-2">Ghi chú (tùy chọn)</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Nhập ghi chú cho thay đổi trạng thái..."
            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-green-500/50"
            rows={3}
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 px-4 rounded-xl transition-colors duration-200"
          >
            Hủy bỏ
          </button>
          <button
            onClick={() => onConfirm(note)}
            disabled={loading}
            className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center gap-2 justify-center">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Đang xử lý...
              </span>
            ) : (
              'Xác nhận'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Delete Confirmation Modal
function DeleteConfirmModal({
  isVisible,
  onClose,
  onConfirm,
  loading,
}: {
  isVisible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  if (!isVisible) return null;

  return (
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
          <div className="p-4 bg-red-900/20 border border-red-800/50 rounded-lg">
            <p className="text-red-300 text-sm flex items-start gap-3">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>
                <strong>Cảnh báo:</strong> Tất cả dữ liệu liên quan đến hợp đồng này sẽ bị xóa vĩnh viễn và không thể khôi phục.
              </span>
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 px-4 rounded-xl transition-colors duration-200"
          >
            Hủy bỏ
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-xl transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Đang xóa...' : 'Xác nhận xóa'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function HealthContractDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [contract, setContract] = useState<HealthContract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState<{ role: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [targetStatus, setTargetStatus] = useState('');

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
      const response = await fetch(`/api/contracts/health/${params.id}`);
      const data = await response.json();

      if (response.ok) {
        setContract(data.contract);
      } else {
        setError(data.error || 'Không thể tải hợp đồng');
      }
    } catch (err) {
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

  const handleStatusChange = async (note: string) => {
    if (!contract) return;

    setActionLoading(true);
    try {
      const response = await fetch(`/api/contracts/health/${params.id}/change-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newStatus: targetStatus, note }),
      });

      const data = await response.json();

      if (response.ok) {
        setShowStatusModal(false);
        fetchContract();
      } else {
        setError(data.error || 'Không thể thay đổi trạng thái');
      }
    } catch (err) {
      setError('Lỗi kết nối server');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmBHV = async () => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/contracts/health/${params.id}/confirm`, {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        fetchContract();
      } else {
        setError(data.error || 'Không thể xác nhận với BHV');
      }
    } catch (err) {
      setError('Lỗi kết nối server');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/contracts/health/${params.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        router.push('/health');
      } else {
        setError(data.error || 'Không thể xóa hợp đồng');
      }
    } catch (err) {
      setError('Lỗi kết nối server');
    } finally {
      setActionLoading(false);
    }
  };

  const openStatusModal = (status: string) => {
    setTargetStatus(status);
    setShowStatusModal(true);
  };

  const getNextStatus = () => {
    if (!contract) return null;
    switch (contract.status) {
      case 'nhap': return 'cho_duyet';
      case 'cho_duyet': return 'khach_duyet';
      default: return null;
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

  if (!contract) {
    return (
      <DashboardLayout>
        <div className="p-4 lg:p-6">
          <div className="text-center text-gray-400">
            <p>{error || 'Không tìm thấy hợp đồng'}</p>
            <button
              onClick={() => router.push('/health')}
              className="mt-4 text-blue-400 hover:text-blue-300"
            >
              ← Quay lại danh sách
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const nextStatus = getNextStatus();

  return (
    <DashboardLayout>
      <div className="p-4 lg:p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 mb-6">
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <button
                    onClick={() => router.push('/health')}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <h1 className="text-2xl font-bold text-white font-mono">{contract.contractNumber}</h1>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getHealthStatusColor(contract.status)}`}>
                    {getHealthStatusText(contract.status)}
                  </span>
                </div>
                <p className="text-gray-400 text-sm">
                  Hợp đồng bảo hiểm sức khỏe • Tạo ngày {formatDate(contract.createdAt)}
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                {contract.status === 'nhap' && (
                  <>
                    <button
                      onClick={() => router.push(`/health/${contract._id}/edit`)}
                      disabled={actionLoading}
                      className="bg-white/10 hover:bg-white/20 text-white font-medium py-2 px-4 rounded-xl transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Sửa
                    </button>
                    <button
                      onClick={() => setShowDeleteModal(true)}
                      disabled={actionLoading}
                      className="bg-red-500/20 hover:bg-red-500/30 text-red-300 font-medium py-2 px-4 rounded-xl transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Xóa
                    </button>
                  </>
                )}
                {nextStatus && (
                  <button
                    onClick={() => openStatusModal(nextStatus)}
                    disabled={actionLoading}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium py-2 px-4 rounded-xl transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    {getHealthStatusText(nextStatus)}
                  </button>
                )}
                {contract.status === 'khach_duyet' && currentUser?.role === 'admin' && (
                  <button
                    onClick={handleConfirmBHV}
                    disabled={actionLoading}
                    className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-medium py-2 px-4 rounded-xl transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Xác nhận BHV
                  </button>
                )}
                {contract.status !== 'ra_hop_dong' && contract.status !== 'huy' && (
                  <button
                    onClick={() => openStatusModal('huy')}
                    disabled={actionLoading}
                    className="bg-white/10 hover:bg-white/20 text-gray-300 font-medium py-2 px-4 rounded-xl transition-all duration-200 disabled:opacity-50"
                  >
                    Hủy HĐ
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

          {/* BHV Info */}
          {contract.bhvContractNumber && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-emerald-300">
                  <strong>Số hợp đồng BHV:</strong> {contract.bhvContractNumber}
                </span>
              </div>
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Package Info */}
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Gói bảo hiểm
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-gray-400 text-sm">Gói</p>
                    <p className="text-white font-medium">{contract.packageName}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Thời hạn</p>
                    <p className="text-white">{contract.purchaseYears} năm</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Phí bảo hiểm</p>
                    <p className="text-green-400 font-medium text-lg">{formatCurrency(contract.totalPremium)}</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="text-gray-400 text-sm mb-2">Quyền lợi bổ sung</p>
                  <div className="flex flex-wrap gap-2">
                    {contract.benefitAddons.maternity && (
                      <span className="px-3 py-1 bg-green-500/20 text-green-300 rounded-lg text-sm">Thai sản</span>
                    )}
                    {contract.benefitAddons.outpatient && (
                      <span className="px-3 py-1 bg-green-500/20 text-green-300 rounded-lg text-sm">Ngoại trú</span>
                    )}
                    {contract.benefitAddons.diseaseDeath && (
                      <span className="px-3 py-1 bg-green-500/20 text-green-300 rounded-lg text-sm">Tử vong do bệnh</span>
                    )}
                    {!contract.benefitAddons.maternity && !contract.benefitAddons.outpatient && !contract.benefitAddons.diseaseDeath && (
                      <span className="text-gray-500">Không có</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Insurance Period */}
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Thời hạn bảo hiểm
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-400 text-sm">Từ ngày</p>
                    <p className="text-white">{contract.activeDate}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Đến ngày</p>
                    <p className="text-white">{contract.inactiveDate}</p>
                  </div>
                </div>
              </div>

              {/* Buyer Info */}
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Người mua bảo hiểm
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-400 text-sm">Họ và tên</p>
                    <p className="text-white">{contract.buyer.fullname}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">CCCD</p>
                    <p className="text-white font-mono">{contract.buyer.identityCard}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Email</p>
                    <p className="text-white">{contract.buyer.email}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Điện thoại</p>
                    <p className="text-white">{contract.buyer.phone}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Ngày sinh</p>
                    <p className="text-white">{contract.buyer.birthday}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Giới tính</p>
                    <p className="text-white">{contract.buyer.gender === 'male' ? 'Nam' : 'Nữ'}</p>
                  </div>
                </div>
              </div>

              {/* Insured Person */}
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Người được bảo hiểm
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-400 text-sm">Họ và tên</p>
                    <p className="text-white">{contract.insuredPerson.fullname}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Quan hệ với người mua</p>
                    <p className="text-white">{HEALTH_RELATIONSHIP_LABELS[contract.insuredPerson.relationship] || contract.insuredPerson.relationship}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">CCCD</p>
                    <p className="text-white font-mono">{contract.insuredPerson.identityCard}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Ngày sinh</p>
                    <p className="text-white">{contract.insuredPerson.birthday}</p>
                  </div>
                </div>
              </div>

              {/* Beneficiary */}
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Người thụ hưởng
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-400 text-sm">Họ và tên</p>
                    <p className="text-white">{contract.beneficiary.fullname}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Quan hệ với người được BH</p>
                    <p className="text-white">{HEALTH_RELATIONSHIP_LABELS[contract.beneficiary.relationship] || contract.beneficiary.relationship}</p>
                  </div>
                </div>
              </div>

              {/* Health Questions */}
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  Khai báo sức khỏe
                </h2>
                <div className="space-y-4">
                  {contract.healthQuestions.map((qa, index) => {
                    const question = HEALTH_QUESTION_DEFINITIONS[index];
                    return (
                      <div key={qa.questionId} className="p-4 bg-white/5 rounded-xl">
                        <p className="text-gray-300 text-sm mb-2">{question?.description || `Câu hỏi ${index + 1}`}</p>
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${qa.answer ? 'bg-yellow-500/20 text-yellow-300' : 'bg-green-500/20 text-green-300'}`}>
                          {qa.answer ? 'Có' : 'Không'}
                        </span>
                        {qa.answer && qa.details && (
                          <p className="text-gray-400 text-sm mt-2">Chi tiết: {qa.details}</p>
                        )}
                      </div>
                    );
                  })}
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
                  <p className="text-gray-400 text-sm mt-2">/ {contract.purchaseYears} năm</p>
                </div>
              </div>

              {/* Status History */}
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Lịch sử trạng thái</h2>
                <div className="space-y-4">
                  {contract.statusHistory.map((item, index) => (
                    <div key={index} className="relative pl-6 pb-4 last:pb-0">
                      {/* Timeline line */}
                      {index < contract.statusHistory.length - 1 && (
                        <div className="absolute left-[9px] top-4 bottom-0 w-0.5 bg-white/10"></div>
                      )}
                      {/* Timeline dot */}
                      <div className={`absolute left-0 top-1 w-4 h-4 rounded-full ${getHealthStatusColor(item.status).replace('text-', 'bg-').replace('-300', '-500/50')}`}></div>
                      <div>
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getHealthStatusColor(item.status)}`}>
                          {getHealthStatusText(item.status)}
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

      {/* Modals */}
      <StatusChangeModal
        isVisible={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        onConfirm={handleStatusChange}
        currentStatus={contract.status}
        targetStatus={targetStatus}
        loading={actionLoading}
      />

      <DeleteConfirmModal
        isVisible={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        loading={actionLoading}
      />
    </DashboardLayout>
  );
}
