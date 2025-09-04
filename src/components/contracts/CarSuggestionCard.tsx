import { CarRecord } from '@/types/car';

interface CarSuggestionCardProps {
  suggestedCar: CarRecord;
  onAccept: () => void;
}

export default function CarSuggestionCard({ suggestedCar, onAccept }: CarSuggestionCardProps) {
  return (
    <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-semibold text-green-400 mb-2">🎯 Xe được đề xuất từ giấy tờ:</h4>
          <p className="text-white">
            <span className="font-medium">{suggestedCar.brand_name} {suggestedCar.model_name}</span>
          </p>
          {suggestedCar.body_styles?.length > 0 && (
            <p className="text-gray-300 text-sm">
              Kiểu dáng: {suggestedCar.body_styles.map(s => s.name).join(', ')}
            </p>
          )}
        </div>
        <button
          onClick={onAccept}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
        >
          Chấp nhận
        </button>
      </div>
    </div>
  );
}