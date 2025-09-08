'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { formatCurrency, tndsCategories } from '@/utils/insurance-calculator';
import carEngineTypes from '@db/car_type_engine.json';

// Type declaration for html2canvas
declare global {
  interface Window {
    html2canvas: any;
  }
}

interface Contract {
  _id: string;
  contractNumber: string;
  chuXe: string;
  diaChi: string;
  
  // Buyer information
  buyerEmail?: string;
  buyerPhone?: string;
  buyerGender?: 'nam' | 'nu' | 'khac';
  buyerCitizenId?: string;
  selectedProvince?: string;
  selectedProvinceText?: string;
  selectedDistrictWard?: string;
  selectedDistrictWardText?: string;
  specificAddress?: string;
  
  bienSo: string;
  nhanHieu: string;
  soLoai: string;
  soKhung: string;
  soMay: string;
  ngayDKLD: string;
  namSanXuat: number;
  soChoNgoi: number;
  trongTai?: number;
  giaTriXe: number;
  loaiHinhKinhDoanh: string;
  loaiDongCo?: string;
  
  // Car selection data
  carBrand?: string;
  carModel?: string;
  carBodyStyle?: string;
  carYear?: number;
  
  vatChatPackage: {
    name: string;
    tyLePhi: number;
    phiVatChat: number;
    dkbs: string[];
  };
  
  includeTNDS: boolean;
  tndsCategory: string;
  phiTNDS: number;
  
  includeNNTX: boolean;
  phiNNTX: number;
  
  tongPhi: number;
  mucKhauTru: number;
  
  status: 'nhap' | 'cho_duyet' | 'khach_duyet' | 'ra_hop_dong' | 'huy';
  
  cavetImage?: string;
  dangkiemImage?: string;
  
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  
  statusHistory: Array<{
    status: string;
    changedBy: string;
    changedAt: string;
    note?: string;
  }>;
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

const getLoaiHinhText = (loaiHinh: string): string => {
  const mapping: { [key: string]: string } = {
    'khong_kd_cho_nguoi': 'Xe chở người (xe gia đình)',
    'khong_kd_cho_hang': 'Xe chở hàng (không kinh doanh vận tải)',
    'khong_kd_pickup_van': 'Xe bán tải / Van (không kinh doanh)',
    'kd_cho_hang': 'Xe tải kinh doanh',
    'kd_dau_keo': 'Xe đầu kéo',
    'kd_cho_khach_lien_tinh': 'Xe khách liên tỉnh, nội tỉnh',
    'kd_grab_be': 'Grab, Be, taxi công nghệ (< 9 chỗ)',
    'kd_taxi_tu_lai': 'Taxi, xe cho thuê tự lái',
    'kd_hop_dong_tren_9c': 'Xe khách hợp đồng (> 9 chỗ)',
    'kd_bus': 'Xe bus',
    'kd_pickup_van': 'Xe bán tải / Van (kinh doanh)',
    'kd_chuyen_dung': 'Xe chuyên dùng khác (xe cứu thương...)'
  };
  return mapping[loaiHinh] || loaiHinh;
};

const getTNDSText = (tndsCategory: string): string => {
  return tndsCategories[tndsCategory]?.label || tndsCategory;
};

const getEngineTypeText = (engineTypeId: string): string => {
  const engineType = carEngineTypes.find(engine => engine.value === engineTypeId);
  return engineType?.name || engineTypeId;
};

export default function ContractDetailPage() {
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  
  const router = useRouter();
  const params = useParams();
  const contractId = params.id as string;

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

    if (contractId) {
      fetchContract();
    }
  }, [router, contractId]);

  const fetchContract = async () => {
    try {
      const response = await fetch(`/api/contracts/${contractId}`);
      const data = await response.json();

      if (response.ok) {
        setContract(data.contract);
        setError('');
      } else {
        setError(data.error || 'Lỗi khi tải thông tin hợp đồng');
        if (response.status === 404) {
          router.push('/contracts');
        }
      }
    } catch (error) {
      setError('Lỗi kết nối');
      console.error('Fetch contract error:', error);
    } finally {
      setLoading(false);
    }
  };

  const canChangeStatus = (fromStatus: string, toStatus: string): boolean => {
    switch (fromStatus) {
      case 'nhap':
        return ['cho_duyet', 'huy'].includes(toStatus);
      case 'cho_duyet':
        return ['khach_duyet', 'huy'].includes(toStatus);
      case 'khach_duyet':
        return currentUser?.role === 'admin' && toStatus === 'ra_hop_dong';
      case 'ra_hop_dong':
      case 'huy':
        return false;
      default:
        return false;
    }
  };

  const getAvailableStatusTransitions = (): Array<{status: string, label: string}> => {
    if (!contract) return [];
    
    const transitions = [];
    if (canChangeStatus(contract.status, 'cho_duyet')) {
      transitions.push({ status: 'cho_duyet', label: 'Gửi chờ duyệt' });
    }
    if (canChangeStatus(contract.status, 'khach_duyet')) {
      transitions.push({ status: 'khach_duyet', label: 'Khách đã duyệt' });
    }
    if (canChangeStatus(contract.status, 'ra_hop_dong')) {
      transitions.push({ status: 'ra_hop_dong', label: 'Ra hợp đồng chính thức' });
    }
    if (canChangeStatus(contract.status, 'huy')) {
      transitions.push({ status: 'huy', label: 'Hủy hợp đồng' });
    }
    
    return transitions;
  };

  const handleStatusChange = async () => {
    if (!contract || !newStatus) return;

    setActionLoading(true);
    try {
      const response = await fetch(`/api/contracts/${contractId}/change-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: newStatus,
          note: statusNote 
        })
      });

      if (response.ok) {
        await fetchContract(); // Refresh contract data
        setShowStatusModal(false);
        setNewStatus('');
        setStatusNote('');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Lỗi khi thay đổi trạng thái');
      }
    } catch (error) {
      console.error('Status change error:', error);
      setError('Đã có lỗi xảy ra khi thay đổi trạng thái');
    } finally {
      setActionLoading(false);
    }
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

  const generateAndShowQuote = () => {
    if (!contract) return;

    setShowQuoteModal(true);
    
    // Wait for modal to render, then populate data
    setTimeout(() => {
      const qElements = {
        'q-chuXe': contract.chuXe,
        'q-diaChi': contract.diaChi,
        'q-bienSo': contract.bienSo,
        'q-namSanXuat': contract.namSanXuat.toString(),
        'q-dkld': contract.ngayDKLD,
        'q-soChoNgoi': contract.soChoNgoi.toString(),
        'q-hieuXe': contract.nhanHieu,
        'q-loaiXe': contract.soLoai,
        'q-soKhung': contract.soKhung,
        'q-soMay': contract.soMay,
        'q-giaTriXe': formatCurrency(contract.giaTriXe),
        'q-mucDich': getLoaiHinhText(contract.loaiHinhKinhDoanh),
        'q-soTienBH': formatCurrency(contract.giaTriXe),
        'q-mucKhauTru': formatCurrency(contract.mucKhauTru) + '/vụ',
        'q-tyLePhi': contract.vatChatPackage.tyLePhi.toFixed(2) + '%',
        'q-dkbs': contract.vatChatPackage.dkbs.join('<br>'),
        'q-phiVatChat': formatCurrency(contract.vatChatPackage.phiVatChat),
        'q-phiTNDS': formatCurrency(contract.phiTNDS),
        'q-phiNNTX': formatCurrency(contract.phiNNTX),
        'q-tongPhi': formatCurrency(contract.tongPhi)
      };

      // Update DOM elements
      Object.entries(qElements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
          if (id === 'q-dkbs') {
            element.innerHTML = value;
          } else {
            element.textContent = value;
          }
        }
      });
    }, 100);
  };

  const downloadQuote = async () => {
    if (!contract) return;
    
    const quoteElement = document.getElementById('quote-content-to-download');
    if (!quoteElement) {
      console.error('Quote element not found');
      return;
    }

    try {
      // Load html2canvas from CDN if not available
      if (typeof window.html2canvas === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
        script.onload = () => {
          performDownload();
        };
        script.onerror = () => {
          console.error('Failed to load html2canvas');
        };
        document.head.appendChild(script);
      } else {
        performDownload();
      }
    } catch (error) {
      console.error('Error in download setup:', error);
    }

    function performDownload() {
      try {
        window.html2canvas(quoteElement, { 
          scale: 2,
          useCORS: true,
          allowTaint: false,
          backgroundColor: '#ffffff'
        }).then((canvas) => {
          const link = document.createElement('a');
          link.download = `BaoGia_${contract.contractNumber.replace(/\s/g, '')}.png`;
          link.href = canvas.toDataURL('image/png');
          link.click();
        }).catch((error) => {
          console.error('html2canvas error:', error);
        });
      } catch (error) {
        console.error('Error in performDownload:', error);
      }
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
            <p>Không tìm thấy hợp đồng</p>
            <button
              onClick={() => router.push('/contracts')}
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
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={() => router.push('/contracts')}
              className="text-blue-400 hover:text-blue-300 mb-4"
            >
              ← Quay lại danh sách
            </button>
            
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex-1">
                <h1 className="text-xl lg:text-2xl font-bold text-white mb-3">
                  Chi tiết hợp đồng {contract.contractNumber}
                </h1>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[contract.status]} w-fit`}>
                    {statusMap[contract.status]}
                  </span>
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-sm">
                    <span className="text-gray-300">
                      Tạo lúc: {formatDate(contract.createdAt)}
                    </span>
                    {contract.updatedAt !== contract.createdAt && (
                      <span className="text-gray-300">
                        Cập nhật: {formatDate(contract.updatedAt)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                {contract.status === 'nhap' && (currentUser?.role === 'admin' || contract.createdBy === currentUser?.id) && (
                  <button
                    onClick={() => router.push(`/contracts/${contractId}/edit`)}
                    className="bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-xl transition-colors text-center"
                  >
                    Chỉnh sửa
                  </button>
                )}
                
                {getAvailableStatusTransitions().length > 0 && (
                  <button
                    onClick={() => setShowStatusModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-xl transition-colors text-center"
                  >
                    Thay đổi trạng thái
                  </button>
                )}
                
                <button
                  onClick={() => generateAndShowQuote()}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-xl transition-colors text-center"
                >
                  Báo giá
                </button>
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
              {/* Customer Info */}
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Thông tin khách hàng</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-gray-300 text-sm mb-1">Chủ xe</label>
                    <p className="text-white font-medium">{contract.chuXe}</p>
                  </div>
                  {contract.buyerEmail && (
                    <div>
                      <label className="block text-gray-300 text-sm mb-1">Email</label>
                      <p className="text-white">{contract.buyerEmail}</p>
                    </div>
                  )}
                  {contract.buyerPhone && (
                    <div>
                      <label className="block text-gray-300 text-sm mb-1">Số điện thoại</label>
                      <p className="text-white">{contract.buyerPhone}</p>
                    </div>
                  )}
                  {contract.buyerGender && (
                    <div>
                      <label className="block text-gray-300 text-sm mb-1">Giới tính</label>
                      <p className="text-white">{contract.buyerGender === 'nam' ? 'Nam' : contract.buyerGender === 'nu' ? 'Nữ' : 'Khác'}</p>
                    </div>
                  )}
                  {contract.buyerCitizenId && (
                    <div>
                      <label className="block text-gray-300 text-sm mb-1">Số CCCD</label>
                      <p className="text-white font-mono">{contract.buyerCitizenId}</p>
                    </div>
                  )}
                  {contract.selectedProvinceText && (
                    <div>
                      <label className="block text-gray-300 text-sm mb-1">Tỉnh/Thành phố</label>
                      <p className="text-white">{contract.selectedProvinceText}</p>
                    </div>
                  )}
                  {contract.selectedDistrictWardText && (
                    <div>
                      <label className="block text-gray-300 text-sm mb-1">Quận/Huyện</label>
                      <p className="text-white">{contract.selectedDistrictWardText}</p>
                    </div>
                  )}
                  {contract.specificAddress && (
                    <div className="md:col-span-2 lg:col-span-3">
                      <label className="block text-gray-300 text-sm mb-1">Địa chỉ cụ thể</label>
                      <p className="text-white">{contract.specificAddress}</p>
                    </div>
                  )}
                  <div className="md:col-span-2 lg:col-span-3">
                    <label className="block text-gray-300 text-sm mb-1">Địa chỉ gốc</label>
                    <p className="text-white">{contract.diaChi}</p>
                  </div>
                </div>
              </div>

              {/* Vehicle Info */}
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Thông tin xe</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-gray-300 text-sm mb-1">Biển số</label>
                    <p className="text-white font-mono font-medium">{contract.bienSo}</p>
                  </div>
                  {contract.carBrand && (
                    <div>
                      <label className="block text-gray-300 text-sm mb-1">Thương hiệu xe</label>
                      <p className="text-white">{contract.carBrand}</p>
                    </div>
                  )}
                  {contract.carModel && (
                    <div>
                      <label className="block text-gray-300 text-sm mb-1">Dòng xe</label>
                      <p className="text-white">{contract.carModel}</p>
                    </div>
                  )}
                  {contract.carBodyStyle && (
                    <div>
                      <label className="block text-gray-300 text-sm mb-1">Kiểu dáng</label>
                      <p className="text-white">{contract.carBodyStyle}</p>
                    </div>
                  )}
                  <div>
                    <label className="block text-gray-300 text-sm mb-1">Số khung</label>
                    <p className="text-white font-mono text-sm">{contract.soKhung}</p>
                  </div>
                  <div>
                    <label className="block text-gray-300 text-sm mb-1">Số máy</label>
                    <p className="text-white font-mono text-sm">{contract.soMay}</p>
                  </div>
                  <div>
                    <label className="block text-gray-300 text-sm mb-1">ĐKLĐ</label>
                    <p className="text-white">{contract.ngayDKLD}</p>
                  </div>
                  <div>
                    <label className="block text-gray-300 text-sm mb-1">Năm SX</label>
                    <p className="text-white">{contract.namSanXuat}</p>
                  </div>
                  {contract.carYear && contract.carYear !== contract.namSanXuat && (
                    <div>
                      <label className="block text-gray-300 text-sm mb-1">Năm xe (hệ thống)</label>
                      <p className="text-white">{contract.carYear}</p>
                    </div>
                  )}
                  <div>
                    <label className="block text-gray-300 text-sm mb-1">Số chỗ ngồi</label>
                    <p className="text-white">{contract.soChoNgoi}</p>
                  </div>
                  {contract.trongTai && (
                    <div>
                      <label className="block text-gray-300 text-sm mb-1">Trọng tải (kg)</label>
                      <p className="text-white">{contract.trongTai.toLocaleString()}</p>
                    </div>
                  )}
                  <div className="md:col-span-2">
                    <label className="block text-gray-300 text-sm mb-1">Giá trị xe</label>
                    <p className="text-white font-medium">{formatCurrency(contract.giaTriXe)}</p>
                  </div>
                  {contract.loaiDongCo && (
                    <div>
                      <label className="block text-gray-300 text-sm mb-1">Loại động cơ</label>
                      <p className="text-white">{getEngineTypeText(contract.loaiDongCo)}</p>
                    </div>
                  )}
                  <div className="md:col-span-3">
                    <label className="block text-gray-300 text-sm mb-1">Mục đích sử dụng</label>
                    <p className="text-white">{getLoaiHinhText(contract.loaiHinhKinhDoanh)}</p>
                  </div>
                </div>
              </div>

              {/* Insurance Package */}
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Gói bảo hiểm</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium text-white mb-2">Vật chất thân vỏ</h3>
                    <div className="bg-white/5 rounded-xl p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-white font-medium">{contract.vatChatPackage.name}</p>
                          <p className="text-sm text-gray-300">Tỷ lệ: {contract.vatChatPackage.tyLePhi}%</p>
                        </div>
                        <p className="text-blue-400 font-bold">{formatCurrency(contract.vatChatPackage.phiVatChat)}</p>
                      </div>
                      {contract.vatChatPackage.dkbs.length > 0 && (
                        <div className="text-sm text-gray-300">
                          <p className="font-medium mb-1">Điều khoản bổ sung:</p>
                          {contract.vatChatPackage.dkbs.map((dkb, index) => (
                            <p key={index}>{dkb}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {contract.includeTNDS && (
                    <div>
                      <h3 className="text-lg font-medium text-white mb-2">TNDS Bắt buộc</h3>
                      <div className="bg-white/5 rounded-xl p-4">
                        <div className="flex justify-between items-center">
                          <p className="text-white">{getTNDSText(contract.tndsCategory)}</p>
                          <p className="text-blue-400 font-bold">{formatCurrency(contract.phiTNDS)}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {contract.includeNNTX && (
                    <div>
                      <h3 className="text-lg font-medium text-white mb-2">Người ngồi trên xe</h3>
                      <div className="bg-white/5 rounded-xl p-4">
                        <div className="flex justify-between items-center">
                          <p className="text-white">{contract.soChoNgoi} chỗ × 10.000 ₫</p>
                          <p className="text-blue-400 font-bold">{formatCurrency(contract.phiNNTX)}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Summary */}
              <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-2xl p-6">
                <h3 className="text-xl font-bold text-center text-white mb-4">TỔNG HỢP PHÍ</h3>
                
                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between py-1 border-b border-dashed border-white/20">
                    <span className="text-gray-300">Vật chất:</span>
                    <span className="font-semibold text-white">{formatCurrency(contract.vatChatPackage.phiVatChat)}</span>
                  </div>
                  
                  <div className="flex justify-between py-1 border-b border-dashed border-white/20">
                    <span className="text-gray-300">TNDS:</span>
                    <span className="font-semibold text-white">{formatCurrency(contract.phiTNDS)}</span>
                  </div>
                  
                  <div className="flex justify-between py-1 border-b border-dashed border-white/20">
                    <span className="text-gray-300">NNTX:</span>
                    <span className="font-semibold text-white">{formatCurrency(contract.phiNNTX)}</span>
                  </div>
                  
                  <div className="flex justify-between py-1">
                    <span className="text-gray-300">Khấu trừ:</span>
                    <span className="font-semibold text-white">{formatCurrency(contract.mucKhauTru)}/vụ</span>
                  </div>
                </div>

                <hr className="border-white/20 my-4" />
                
                <div className="flex justify-between items-center text-base">
                  <span className="font-bold text-white">TỔNG CỘNG:</span>
                  <span className="font-extrabold text-xl text-blue-400">{formatCurrency(contract.tongPhi)}</span>
                </div>
              </div>

              {/* Status History */}
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Lịch sử trạng thái</h3>
                <div className="space-y-3">
                  {contract.statusHistory.map((history, index) => (
                    <div key={index} className="border-b border-white/10 pb-3 last:border-b-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[history.status as keyof typeof statusColors]}`}>
                          {statusMap[history.status as keyof typeof statusMap]}
                        </span>
                        <span className="text-gray-400 text-xs">
                          {formatDate(history.changedAt)}
                        </span>
                      </div>
                      {history.note && (
                        <p className="text-gray-300 text-sm">{history.note}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status Change Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">Thay đổi trạng thái</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-white text-sm font-medium mb-2">Trạng thái mới</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-blue-500/50"
                >
                  <option value="">Chọn trạng thái</option>
                  {getAvailableStatusTransitions().map(transition => (
                    <option key={transition.status} value={transition.status}>
                      {transition.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-white text-sm font-medium mb-2">Ghi chú (tùy chọn)</label>
                <textarea
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="Nhập ghi chú về thay đổi này..."
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500/50"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowStatusModal(false);
                  setNewStatus('');
                  setStatusNote('');
                }}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-xl transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleStatusChange}
                disabled={!newStatus || actionLoading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white py-2 px-4 rounded-xl transition-colors"
              >
                {actionLoading ? 'Đang xử lý...' : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quote Preview Modal */}
      {showQuoteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div id="quote-content-to-download" className="p-4 bg-white">
              <header className="text-center mb-4">
                <div className="flex items-center justify-center gap-4 mb-2">
                  <img 
                    src="/logo.png" 
                    alt="BHV Logo" 
                    className="w-16 h-16 object-contain"
                    style={{ width: '64px', height: '64px' }}
                  />
                  <div>
                    <h2 className="text-xl font-bold" style={{ color: '#dc2626' }}>CÔNG TY BẢO HIỂM HÙNG VƯƠNG THÀNH PHỐ HỒ CHÍ MINH</h2>
                    <p className="font-semibold" style={{ color: '#000' }}>BHV TP HCM</p>
                  </div>
                </div>
                <h3 className="text-lg font-bold mt-4" style={{ color: '#000' }}>BẢN CHÀO PHÍ BẢO HIỂM XE CƠ GIỚI</h3>
              </header>
              <table style={{ width: '100%', fontSize: '14px', borderCollapse: 'collapse', border: '1px solid black' }}>
                <tbody>
                  <tr>
                    <td style={{ width: '25%', fontWeight: 'bold', border: '1px solid black', padding: '8px' }}>Chủ xe:</td>
                    <td colSpan={3} id="q-chuXe" style={{ fontWeight: 'bold', border: '1px solid black', padding: '8px' }}></td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 'bold', border: '1px solid black', padding: '8px' }}>Địa chỉ:</td>
                    <td colSpan={3} id="q-diaChi" style={{ border: '1px solid black', padding: '8px' }}></td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 'bold', border: '1px solid black', padding: '8px' }}>Biển kiểm soát:</td>
                    <td id="q-bienSo" style={{ border: '1px solid black', padding: '8px' }}></td>
                    <td style={{ fontWeight: 'bold', border: '1px solid black', padding: '8px' }}>Năm sản xuất:</td>
                    <td id="q-namSanXuat" style={{ border: '1px solid black', padding: '8px' }}></td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 'bold', border: '1px solid black', padding: '8px' }}>ĐKLĐ:</td>
                    <td id="q-dkld" style={{ border: '1px solid black', padding: '8px' }}></td>
                    <td style={{ fontWeight: 'bold', border: '1px solid black', padding: '8px' }}>Số chỗ ngồi:</td>
                    <td id="q-soChoNgoi" style={{ border: '1px solid black', padding: '8px' }}></td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 'bold', border: '1px solid black', padding: '8px' }}>Hiệu xe:</td>
                    <td id="q-hieuXe" style={{ border: '1px solid black', padding: '8px' }}></td>
                    <td style={{ fontWeight: 'bold', border: '1px solid black', padding: '8px' }}>Loại xe:</td>
                    <td id="q-loaiXe" style={{ border: '1px solid black', padding: '8px' }}></td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 'bold', border: '1px solid black', padding: '8px' }}>Số khung:</td>
                    <td id="q-soKhung" style={{ border: '1px solid black', padding: '8px' }}></td>
                    <td style={{ fontWeight: 'bold', border: '1px solid black', padding: '8px' }}>Số máy:</td>
                    <td id="q-soMay" style={{ border: '1px solid black', padding: '8px' }}></td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 'bold', border: '1px solid black', padding: '8px' }}>Giá trị xe:</td>
                    <td id="q-giaTriXe" style={{ border: '1px solid black', padding: '8px' }}></td>
                    <td style={{ fontWeight: 'bold', border: '1px solid black', padding: '8px' }}>Mục đích sử dụng:</td>
                    <td id="q-mucDich" style={{ border: '1px solid black', padding: '8px' }}></td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 'bold', border: '1px solid black', padding: '8px' }}>Số tiền bảo hiểm:</td>
                    <td id="q-soTienBH" style={{ border: '1px solid black', padding: '8px' }}></td>
                    <td style={{ fontWeight: 'bold', border: '1px solid black', padding: '8px' }}>Mức khấu trừ:</td>
                    <td id="q-mucKhauTru" style={{ border: '1px solid black', padding: '8px' }}></td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 'bold', border: '1px solid black', padding: '8px' }}>Tỷ lệ phí:</td>
                    <td id="q-tyLePhi" style={{ border: '1px solid black', padding: '8px' }}></td>
                    <td style={{ fontWeight: 'bold', border: '1px solid black', padding: '8px' }} rowSpan={4}>ĐIỀU KHOẢN BỔ SUNG ÁP DỤNG:</td>
                    <td id="q-dkbs" rowSpan={4} style={{ verticalAlign: 'top', border: '1px solid black', padding: '8px' }}></td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 'bold', border: '1px solid black', padding: '8px' }}>Vật chất thân xe:</td>
                    <td id="q-phiVatChat" style={{ border: '1px solid black', padding: '8px' }}></td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 'bold', border: '1px solid black', padding: '8px' }}>TNDS:</td>
                    <td id="q-phiTNDS" style={{ border: '1px solid black', padding: '8px' }}></td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 'bold', border: '1px solid black', padding: '8px' }}>NNTX:</td>
                    <td id="q-phiNNTX" style={{ border: '1px solid black', padding: '8px' }}></td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 'bold', backgroundColor: '#fed7aa', border: '1px solid black', padding: '8px' }}>Tổng phí (đã VAT):</td>
                    <td colSpan={3} id="q-tongPhi" style={{ fontWeight: 'bold', backgroundColor: '#fed7aa', border: '1px solid black', padding: '8px' }}></td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 'bold', backgroundColor: '#fef3c7', border: '1px solid black', padding: '8px' }}>Tái Tục/ Cấp Mới</td>
                    <td colSpan={3} id="q-tinhTrang" style={{ backgroundColor: '#fef3c7', border: '1px solid black', padding: '8px' }}>Cấp Mới</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => setShowQuoteModal(false)}
                className="bg-gray-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-gray-600"
              >
                Đóng
              </button>
              <button
                onClick={downloadQuote}
                className="bg-green-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-green-700"
              >
                Tải xuống (PNG)
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}