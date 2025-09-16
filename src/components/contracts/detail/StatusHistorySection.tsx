import { getStatusText, getStatusColor } from '@/utils/contract-status';

interface StatusHistoryItem {
  status: string;
  changedBy: string;
  changedAt: string;
  note?: string;
}

interface Contract {
  statusHistory: StatusHistoryItem[];
}

interface StatusHistorySectionProps {
  contract: Contract;
}


const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export default function StatusHistorySection({ contract }: StatusHistorySectionProps) {
  return (
    <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Lịch sử trạng thái</h3>
      <div className="space-y-3">
        {contract.statusHistory.map((history, index) => (
          <div key={index} className="border-b border-white/10 pb-3 last:border-b-0">
            <div className="flex items-center justify-between mb-1">
              <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(history.status)}`}>
                {getStatusText(history.status)}
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
  );
}