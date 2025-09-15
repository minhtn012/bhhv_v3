'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import ContractDetailHeader, { getAvailableStatusTransitions } from '@/components/contracts/detail/ContractDetailHeader';
import CustomerInfoSection from '@/components/contracts/detail/CustomerInfoSection';
import VehicleInfoSection from '@/components/contracts/detail/VehicleInfoSection';
import InsurancePackageSection from '@/components/contracts/detail/InsurancePackageSection';
import ContractPriceSummaryView from '@/components/contracts/detail/ContractPriceSummaryView';
import StatusHistorySection from '@/components/contracts/detail/StatusHistorySection';
import StatusChangeModal from '@/components/contracts/detail/StatusChangeModal';
import QuoteModal from '@/components/contracts/detail/QuoteModal';
import BhvPdfModal from '@/components/contracts/detail/BhvPdfModal';

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
  giaTriPin?: number;
  
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
  
  phiPin?: number;
  
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


export default function ContractDetailPage() {
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [bhvSubmissionLoading, setBhvSubmissionLoading] = useState(false);
  const [showBhvPdfModal, setShowBhvPdfModal] = useState(false);
  const [bhvPdfData, setBhvPdfData] = useState<string>('');
  
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


  const handleStatusChange = async (status: string, note: string) => {
    if (!contract) return;

    setActionLoading(true);
    try {
      const response = await fetch(`/api/contracts/${contractId}/change-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: status,
          note: note 
        })
      });

      if (response.ok) {
        await fetchContract(); // Refresh contract data
        setShowStatusModal(false);
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


  const generateAndShowQuote = () => {
    setShowQuoteModal(true);
  };

  const handleSubmitToBhv = async () => {
    if (!contract) return;

    setBhvSubmissionLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/contracts/${contractId}/submit-to-bhv`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Success - show PDF modal
        setBhvPdfData(data.pdfBase64);
        setShowBhvPdfModal(true);

        // Optionally refresh contract data to show updated status
        // await fetchContract();
      } else {
        setError(data.error || 'Lỗi khi tạo hợp đồng BHV');
      }
    } catch (error) {
      console.error('BHV submission error:', error);
      setError('Đã có lỗi xảy ra khi tạo hợp đồng BHV');
    } finally {
      setBhvSubmissionLoading(false);
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
          <ContractDetailHeader
            contract={contract}
            currentUser={currentUser}
            onStatusChange={() => setShowStatusModal(true)}
            onGenerateQuote={generateAndShowQuote}
            onSubmitToBhv={handleSubmitToBhv}
            bhvSubmissionLoading={bhvSubmissionLoading}
          />

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm mb-6">
              {error}
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              <CustomerInfoSection contract={contract} />
              <VehicleInfoSection contract={contract} />
              <InsurancePackageSection contract={contract} />
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <ContractPriceSummaryView contract={contract} />
              <StatusHistorySection contract={contract} />
            </div>
          </div>
        </div>
      </div>

      <StatusChangeModal
        contract={contract}
        currentUser={currentUser}
        isVisible={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        onStatusChange={handleStatusChange}
        actionLoading={actionLoading}
        getAvailableStatusTransitions={getAvailableStatusTransitions}
      />

      <QuoteModal
        contract={contract}
        isVisible={showQuoteModal}
        onClose={() => setShowQuoteModal(false)}
      />

      <BhvPdfModal
        isVisible={showBhvPdfModal}
        onClose={() => {
          setShowBhvPdfModal(false);
          setBhvPdfData('');
        }}
        pdfBase64={bhvPdfData}
        contractNumber={contract?.contractNumber || ''}
      />
    </DashboardLayout>
  );
}