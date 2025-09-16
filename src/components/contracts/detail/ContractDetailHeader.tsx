import { useRouter } from 'next/navigation';
import { getStatusText, getStatusColor } from '@/utils/contract-status';

interface Contract {
  _id: string;
  contractNumber: string;
  status: 'nhap' | 'cho_duyet' | 'khach_duyet' | 'ra_hop_dong' | 'huy';
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

interface User {
  id: string;
  role: string;
}

interface ContractDetailHeaderProps {
  contract: Contract;
  currentUser: User | null;
  onStatusChange: () => void;
  onGenerateQuote: () => void;
  onSubmitToBhv?: () => void;
  bhvSubmissionLoading?: boolean;
}

const canChangeStatus = (fromStatus: string, toStatus: string, currentUser: User | null): boolean => {
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

const getAvailableStatusTransitions = (contract: Contract, currentUser: User | null): Array<{status: string, label: string}> => {
  const transitions = [];
  if (canChangeStatus(contract.status, 'cho_duyet', currentUser)) {
    transitions.push({ status: 'cho_duyet', label: 'Gửi chờ duyệt' });
  }
  if (canChangeStatus(contract.status, 'khach_duyet', currentUser)) {
    transitions.push({ status: 'khach_duyet', label: 'Khách đã duyệt' });
  }
  if (canChangeStatus(contract.status, 'ra_hop_dong', currentUser)) {
    transitions.push({ status: 'ra_hop_dong', label: 'Ra hợp đồng chính thức' });
  }
  if (canChangeStatus(contract.status, 'huy', currentUser)) {
    transitions.push({ status: 'huy', label: 'Hủy hợp đồng' });
  }
  
  return transitions;
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

export default function ContractDetailHeader({
  contract,
  currentUser,
  onStatusChange,
  onGenerateQuote,
  onSubmitToBhv,
  bhvSubmissionLoading = false
}: ContractDetailHeaderProps) {
  const router = useRouter();
  
  return (
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
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(contract.status)} w-fit`}>
              {getStatusText(contract.status)}
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
              onClick={() => router.push(`/contracts/${contract._id}/edit`)}
              className="bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-xl transition-colors text-center"
            >
              Chỉnh sửa
            </button>
          )}
          
          {getAvailableStatusTransitions(contract, currentUser).length > 0 && (
            <button
              onClick={onStatusChange}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-xl transition-colors text-center"
            >
              Thay đổi trạng thái
            </button>
          )}
          
          <button
            onClick={onGenerateQuote}
            className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-xl transition-colors text-center"
          >
            Báo giá
          </button>

          {/* BHV Submission Button */}
          {(['khach_duyet', 'ra_hop_dong'].includes(contract.status)) && onSubmitToBhv && (
            <button
              onClick={onSubmitToBhv}
              disabled={bhvSubmissionLoading}
              className="bg-orange-600 hover:bg-orange-700 disabled:bg-orange-800 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-xl transition-colors text-center flex items-center gap-2"
            >
              {bhvSubmissionLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Đang tạo...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Tạo hợp đồng BHV
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export { getAvailableStatusTransitions };