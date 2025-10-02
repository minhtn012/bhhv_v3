import { useState, useEffect } from 'react';

interface BhvContractDateModalProps {
  isVisible: boolean;
  onClose: () => void;
  onConfirm: (startDate: string, endDate: string) => void;
  loading?: boolean;
}

export default function BhvContractDateModal({
  isVisible,
  onClose,
  onConfirm,
  loading = false
}: BhvContractDateModalProps) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('08:00');
  const [error, setError] = useState('');

  // Initialize dates when modal opens
  useEffect(() => {
    if (isVisible) {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      setStartDate(todayStr);

      // Calculate end date (1 year later)
      const endDateObj = new Date(today);
      endDateObj.setFullYear(endDateObj.getFullYear() + 1);
      const endDateStr = endDateObj.toISOString().split('T')[0];
      setEndDate(endDateStr);

      // Reset times to default
      setStartTime('08:00');
      setEndTime('08:00');

      setError('');
    }
  }, [isVisible]);

  // Update end date when start date changes
  useEffect(() => {
    if (startDate) {
      try {
        const startDateObj = new Date(startDate);
        const endDateObj = new Date(startDateObj);
        endDateObj.setFullYear(endDateObj.getFullYear() + 1);
        const endDateStr = endDateObj.toISOString().split('T')[0];
        setEndDate(endDateStr);
        setError('');
      } catch (err) {
        setError('Ngày bắt đầu không hợp lệ');
      }
    }
  }, [startDate]);

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = e.target.value;
    const today = new Date().toISOString().split('T')[0];

    if (selectedDate < today) {
      setError('Ngày bắt đầu phải từ hôm nay trở đi');
      return;
    }

    setStartDate(selectedDate);
    setError('');
  };

  const handleInputClick = (e: React.MouseEvent<HTMLInputElement>) => {
    const input = e.target as HTMLInputElement;
    input.focus();
    // Trigger the native date picker
    if (input.showPicker) {
      try {
        input.showPicker();
      } catch (error) {
        // Fallback: simulate click on the input to trigger native behavior
        console.debug('showPicker failed, using fallback');
      }
    }
  };


  const formatDateToDDMMYYYY = (dateStr: string, timeStr: string = '08:00') => {
    const date = new Date(dateStr);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const [hours, minutes] = timeStr.split(':');
    return `${day}/${month}/${year} ${hours}:${minutes}:00`;
  };

  const handleConfirm = () => {
    if (!startDate || !endDate) {
      setError('Vui lòng chọn ngày hợp lệ');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    if (startDate < today) {
      setError('Ngày bắt đầu phải từ hôm nay trở đi');
      return;
    }

    // Convert to dd/MM/YYYY HH:mm:ss format before sending
    const formattedStartDate = formatDateToDDMMYYYY(startDate, startTime);
    const formattedEndDate = formatDateToDDMMYYYY(endDate, endTime);

    onConfirm(formattedStartDate, formattedEndDate);
  };

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return dateStr;
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl w-full max-w-md">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">
            Chọn thời hạn hợp đồng
          </h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6">
          {/* Start Date and Time Input */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Ngày bắt đầu bảo hiểm
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                value={startDate}
                onChange={handleStartDateChange}
                onClick={handleInputClick}
                disabled={loading}
                min={new Date().toISOString().split('T')[0]}
                className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 cursor-pointer"
              />
              <input
                type="time"
                value={startTime}
                onChange={(e) => {
                  setStartTime(e.target.value);
                  setEndTime(e.target.value);
                }}
                disabled={loading}
                className="w-32 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              />
            </div>
          </div>

          {/* End Date Display */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Ngày kết thúc bảo hiểm
            </label>
            <div className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-400">
              {formatDisplayDate(endDate)} {startTime}:00 (tự động tính 1 năm)
            </div>
          </div>

          {/* Preview */}
          {startDate && endDate && (
            <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4">
              <h3 className="text-blue-300 font-medium mb-2">Thời hạn hợp đồng</h3>
              <div className="text-sm text-gray-300 space-y-1">
                <div>Từ: {formatDisplayDate(startDate)} {startTime}:00</div>
                <div>Đến: {formatDisplayDate(endDate)} {endTime}:00</div>
                <div className="text-blue-400 font-medium">Thời hạn: 12 tháng</div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-gray-700 flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || !!error || !startDate}
            className="flex-1 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-800 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Đang xử lý...
              </>
            ) : (
              'Tạo hợp đồng BHV'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}