import { useState } from 'react';
import { useRouter } from 'next/navigation';

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

interface StatusTransition {
  status: string;
  label: string;
}

interface StatusChangeModalProps {
  contract: Contract;
  currentUser: User | null;
  isVisible: boolean;
  onClose: () => void;
  onStatusChange: (status: string, note: string) => void;
  actionLoading: boolean;
  getAvailableStatusTransitions: (contract: Contract, currentUser: User | null) => StatusTransition[];
  validationError?: {
    message: string;
    missingFields?: string[];
  } | null;
}

export default function StatusChangeModal({
  contract,
  currentUser,
  isVisible,
  onClose,
  onStatusChange,
  actionLoading,
  getAvailableStatusTransitions,
  validationError
}: StatusChangeModalProps) {
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const router = useRouter();

  const handleClose = () => {
    setNewStatus('');
    setStatusNote('');
    onClose();
  };

  const handleSubmit = () => {
    if (newStatus) {
      onStatusChange(newStatus, statusNote);
      setNewStatus('');
      setStatusNote('');
    }
  };

  const handleGoToEdit = () => {
    router.push(`/contracts/${contract._id}/edit?change_status=khach_duyet`);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-white mb-4">Thay đổi trạng thái</h2>

        {/* Validation Error Display */}
        {validationError && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <p className="text-red-400 font-medium mb-2">{validationError.message}</p>
                {validationError.missingFields && validationError.missingFields.length > 0 && (
                  <ul className="text-sm text-red-300 space-y-1 mb-3">
                    {validationError.missingFields.map((field, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-red-400 rounded-full"></span>
                        {field}
                      </li>
                    ))}
                  </ul>
                )}
                <button
                  onClick={handleGoToEdit}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Đi tới trang chỉnh sửa
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-white text-sm font-medium mb-2">Trạng thái mới</label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full bg-slate-700/50 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-blue-500/50"
              disabled={!!validationError}
            >
              <option value="">Chọn trạng thái</option>
              {getAvailableStatusTransitions(contract, currentUser).map(transition => (
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
              disabled={!!validationError}
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={handleClose}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-xl transition-colors"
          >
            {validationError ? 'Đóng' : 'Hủy'}
          </button>
          {!validationError && (
            <button
              onClick={handleSubmit}
              disabled={!newStatus || actionLoading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white py-2 px-4 rounded-xl transition-colors"
            >
              {actionLoading ? 'Đang xử lý...' : 'Xác nhận'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}