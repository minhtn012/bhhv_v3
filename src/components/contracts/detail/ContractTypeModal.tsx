import { useState } from 'react';

export type ContractType = '3-party' | '2-party';

export interface BankInfo {
  bankName: string;
  bankOldAddress: string;
  bankNewAddress: string;
}

interface ContractTypeModalProps {
  isVisible: boolean;
  onClose: () => void;
  onExport: (contractType: ContractType, bankInfo?: BankInfo) => void;
  loading: boolean;
}

export default function ContractTypeModal({
  isVisible,
  onClose,
  onExport,
  loading
}: ContractTypeModalProps) {
  const [selectedType, setSelectedType] = useState<ContractType>('2-party');
  const [bankInfo, setBankInfo] = useState<BankInfo>({
    bankName: '',
    bankOldAddress: '',
    bankNewAddress: ''
  });

  const handleClose = () => {
    setSelectedType('2-party');
    setBankInfo({ bankName: '', bankOldAddress: '', bankNewAddress: '' });
    onClose();
  };

  const handleExport = () => {
    if (selectedType === '3-party') {
      onExport(selectedType, bankInfo);
    } else {
      onExport(selectedType);
    }
  };

  const isFormValid = () => {
    if (selectedType === '3-party') {
      return bankInfo.bankName.trim() && bankInfo.bankOldAddress.trim() && bankInfo.bankNewAddress.trim();
    }
    return true;
  };

  if (!isVisible) return null;

  const contractTypes = [
    {
      id: '2-party' as ContractType,
      title: 'Hợp đồng 2 bên',
      subtitle: 'Khách hàng trực tiếp',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
    {
      id: '3-party' as ContractType,
      title: 'Hợp đồng 3 bên',
      subtitle: 'Có ngân hàng',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      )
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Chọn loại hợp đồng</h2>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-3 mb-6">
          {contractTypes.map((type) => (
            <label
              key={type.id}
              className={`block p-3 rounded-xl border-2 cursor-pointer transition-all ${
                selectedType === type.id
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-gray-600 bg-gray-800/50 hover:border-gray-500'
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <input
                type="radio"
                name="contractType"
                value={type.id}
                checked={selectedType === type.id}
                onChange={(e) => setSelectedType(e.target.value as ContractType)}
                disabled={loading}
                className="sr-only"
              />
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  selectedType === type.id ? 'bg-blue-500 text-white' : 'bg-gray-600 text-gray-300'
                }`}>
                  {type.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white">{type.title}</h3>
                  <span className="text-sm text-gray-400">{type.subtitle}</span>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selectedType === type.id
                    ? 'border-blue-500 bg-blue-500'
                    : 'border-gray-500'
                }`}>
                  {selectedType === type.id && (
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  )}
                </div>
              </div>
            </label>
          ))}
        </div>

        {/* Bank Information for 3-party contracts */}
        {selectedType === '3-party' && (
          <div className="space-y-4 mb-6 p-4 bg-gray-800 rounded-xl border border-gray-600">
            <h4 className="text-white font-medium">Thông tin ngân hàng</h4>

            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Tên ngân hàng
              </label>
              <input
                type="text"
                value={bankInfo.bankName}
                onChange={(e) => setBankInfo({ ...bankInfo, bankName: e.target.value })}
                placeholder="Nhập tên ngân hàng"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500/50"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Địa chỉ ngân hàng cũ
              </label>
              <input
                type="text"
                value={bankInfo.bankOldAddress}
                onChange={(e) => setBankInfo({ ...bankInfo, bankOldAddress: e.target.value })}
                placeholder="Nhập địa chỉ ngân hàng cũ"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500/50"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Địa chỉ ngân hàng mới
              </label>
              <input
                type="text"
                value={bankInfo.bankNewAddress}
                onChange={(e) => setBankInfo({ ...bankInfo, bankNewAddress: e.target.value })}
                placeholder="Nhập địa chỉ ngân hàng mới"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500/50"
                disabled={loading}
              />
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="flex-1 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white py-2 px-4 rounded-xl transition-colors"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={loading || !isFormValid()}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white py-2 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {loading && (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            )}
            {loading ? 'Đang xuất...' : 'Xuất hợp đồng'}
          </button>
        </div>
      </div>
    </div>
  );
}