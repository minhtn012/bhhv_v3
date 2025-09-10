import { useState } from 'react';

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
}

export default function StatusChangeModal({
  contract,
  currentUser,
  isVisible,
  onClose,
  onStatusChange,
  actionLoading,
  getAvailableStatusTransitions
}: StatusChangeModalProps) {
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');

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

  if (!isVisible) return null;

  return (
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
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={handleClose}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-xl transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={!newStatus || actionLoading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white py-2 px-4 rounded-xl transition-colors"
          >
            {actionLoading ? 'Đang xử lý...' : 'Xác nhận'}
          </button>
        </div>
      </div>
    </div>
  );
}