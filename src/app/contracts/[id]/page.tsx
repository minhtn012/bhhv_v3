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
import BhvCredentialsModal from '@/components/contracts/detail/BhvCredentialsModal';
import BhvContractDateModal from '@/components/contracts/detail/BhvContractDateModal';
import ContractTypeModal, { ContractType, BankInfo } from '@/components/contracts/detail/ContractTypeModal';

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

  // Thời hạn bảo hiểm
  ngayBatDauBaoHiem?: string;
  ngayKetThucBaoHiem?: string;

  // BHV contract number sau khi confirm thành công
  bhvContractNumber?: string;

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
  const [bhvCookies, setBhvCookies] = useState<string>('');
  const [wordExportLoading, setWordExportLoading] = useState(false);
  const [showBhvCredentialsModal, setShowBhvCredentialsModal] = useState(false);
  const [bhvCredentialsError, setBhvCredentialsError] = useState('');
  const [showBhvContractDateModal, setShowBhvContractDateModal] = useState(false);
  const [showContractTypeModal, setShowContractTypeModal] = useState(false);
  const [validationError, setValidationError] = useState<{
    message: string;
    missingFields?: string[];
  } | null>(null);
  
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
    setValidationError(null);
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
        setValidationError(null);
      } else {
        const errorData = await response.json();

        // Check if this is a validation error
        if (errorData.missingFields && errorData.missingFields.length > 0) {
          setValidationError({
            message: errorData.message || 'Thiếu thông tin bắt buộc',
            missingFields: errorData.missingFields
          });
          // Keep modal open to show validation error
        } else {
          setError(errorData.error || 'Lỗi khi thay đổi trạng thái');
          setShowStatusModal(false);
        }
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

  const handleShowContractTypeModal = () => {
    setShowContractTypeModal(true);
  };

  const handleExportWord = async (contractType: ContractType, bankInfo?: BankInfo) => {
    if (!contract) return;

    setWordExportLoading(true);
    setError('');

    try {
      // Build query parameters
      const params = new URLSearchParams({ contractType });
      if (contractType === '3-party' && bankInfo) {
        params.append('bankName', bankInfo.bankName);
        params.append('bankOldAddress', bankInfo.bankOldAddress);
        params.append('bankNewAddress', bankInfo.bankNewAddress);
      }

      const response = await fetch(`/api/contracts/${contractId}/word-export?${params}`);

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || 'Lỗi khi xuất file Word');
        return;
      }

      const blob = await response.blob();

      // Create download link with contract type in filename
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      const typePrefix = contractType === '3-party' ? '3ben' : '2ben';
      a.href = url;
      a.download = `hop-dong-${typePrefix}-${contract.contractNumber}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Close the modal after successful export
      setShowContractTypeModal(false);
    } catch (error) {
      console.error('Failed to export Word document:', error);
      setError('Lỗi khi xuất file Word');
    } finally {
      setWordExportLoading(false);
    }
  };

  const handleBhvCredentialsSuccess = async () => {
    // Close credentials modal and retry BHV submission
    setShowBhvCredentialsModal(false);
    setBhvCredentialsError('');

    // Show date modal to continue the process
    setShowBhvContractDateModal(true);
  };

  const handleShowBhvDateModal = () => {
    setShowBhvContractDateModal(true);
  };

  const handleBhvDateConfirm = async (startDate: string, endDate: string) => {
    // Close date modal and proceed with BHV submission
    setShowBhvContractDateModal(false);

    // Call the original BHV submission with dates
    await handleSubmitToBhvWithDates(startDate, endDate);
  };

  const handleSubmitToBhvWithDates = async (startDate?: string, endDate?: string) => {
    if (!contract) return;

    setBhvSubmissionLoading(true);
    setError('');

    try {
      // Step 1: Update dates to DB first (if provided)
      if (startDate && endDate) {
        console.log('💾 Updating insurance dates to database...');
        const updateResponse = await fetch(`/api/contracts/${contractId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ngayBatDauBaoHiem: startDate,
            ngayKetThucBaoHiem: endDate
          })
        });

        if (!updateResponse.ok) {
          const errorData = await updateResponse.json();
          setError(errorData.error || 'Lỗi khi cập nhật ngày bảo hiểm');
          return;
        }
        console.log('✅ Insurance dates updated successfully');
      }

      // Step 2: Get fresh BHV authentication cookies
      console.log('🔐 Getting fresh BHV authentication...');
      const authResponse = await fetch(`/api/users/bhv-test-auth?userId=${contract.createdBy}`, {
        method: 'GET',
        credentials: 'include'
      });

      const authData = await authResponse.json();

      if (!authResponse.ok || !authData.success) {
        // Handle auth failures - show credentials modal
        if (authResponse.status === 404 && !authData.hasCredentials) {
          setBhvCredentialsError('Chưa có thông tin đăng nhập BHV. Vui lòng nhập thông tin để tiếp tục.');
          setShowBhvCredentialsModal(true);
          return;
        } else if (authResponse.status === 401) {
          setBhvCredentialsError('Thông tin đăng nhập BHV không hợp lệ. Vui lòng nhập lại thông tin.');
          setShowBhvCredentialsModal(true);
          return;
        } else {
          setError(authData.error || 'Lỗi khi xác thực với BHV');
          return;
        }
      }

      if (!authData.cookies) {
        setError('Không thể lấy session BHV. Vui lòng thử lại.');
        return;
      }

      console.log('✅ BHV authentication successful, submitting contract...');

      // Step 3: Submit contract to BHV (contract will be fetched from DB with updated dates)
      const response = await fetch(`/api/contracts/${contractId}/submit-to-bhv`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cookies: authData.cookies
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Success - show PDF modal
        setBhvCookies(authData.cookies); // Save cookies for confirm step
        setBhvPdfData(data.pdfBase64);
        setShowBhvPdfModal(true);

        // Refresh contract data to show updated dates
        await fetchContract();
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
            onSubmitToBhv={handleShowBhvDateModal}
            bhvSubmissionLoading={bhvSubmissionLoading}
            onExportWord={handleShowContractTypeModal}
            wordExportLoading={wordExportLoading}
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
        onClose={() => {
          setShowStatusModal(false);
          setValidationError(null);
        }}
        onStatusChange={handleStatusChange}
        actionLoading={actionLoading}
        getAvailableStatusTransitions={getAvailableStatusTransitions}
        validationError={validationError}
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
          setBhvCookies(''); // Clear cookies when closing
        }}
        pdfBase64={bhvPdfData}
        contractNumber={contract?.contractNumber || ''}
        contractId={contractId}
        cookies={bhvCookies}
        contract={contract}
        onConfirmContract={() => fetchContract()} // Refresh contract data after confirm
      />

      <BhvCredentialsModal
        isVisible={showBhvCredentialsModal}
        onClose={() => {
          setShowBhvCredentialsModal(false);
          setBhvCredentialsError('');
        }}
        onSuccess={handleBhvCredentialsSuccess}
        error={bhvCredentialsError}
      />

      <BhvContractDateModal
        isVisible={showBhvContractDateModal}
        onClose={() => setShowBhvContractDateModal(false)}
        onConfirm={handleBhvDateConfirm}
        loading={bhvSubmissionLoading}
      />

      <ContractTypeModal
        isVisible={showContractTypeModal}
        onClose={() => setShowContractTypeModal(false)}
        onExport={handleExportWord}
        loading={wordExportLoading}
      />
    </DashboardLayout>
  );
}