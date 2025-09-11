import { CarSelection } from '@/types/car';
import SearchableSelect from '@/components/SearchableSelect';
import FieldError from './FieldError';
import Spinner from '@/components/ui/Spinner';
import CarSuggestionCard from './CarSuggestionCard';

interface CarSelectionFormProps {
  carData: CarSelection;
  fieldErrors: Record<string, string>;
  onBrandChange: (brand: string) => void;
  onModelChange: (model: string) => void;
  onInputChange: (field: keyof CarSelection, value: any) => void;
  onAcceptSuggestion: () => void;
  onVehicleDataChange?: (vehicleData: { tenXe: string; nhanHieu: string; soLoai: string; kieuDang: string; namPhienBan: string }) => void;
}

export default function CarSelectionForm({ 
  carData, 
  fieldErrors, 
  onBrandChange, 
  onModelChange, 
  onInputChange, 
  onAcceptSuggestion,
  onVehicleDataChange
}: CarSelectionFormProps) {
  return (
    <div className="lg:col-span-3 bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-4">
      <h3 className="text-lg font-semibold text-white mb-4">Thông tin xe tự động</h3>
      
      {/* Suggested Car Display */}
      {carData.suggestedCar && (
        <CarSuggestionCard 
          suggestedCar={carData.suggestedCar}
          onAccept={onAcceptSuggestion}
        />
      )}
      
      {/* Manual Car Selection */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Brand Selection */}
        <div>
          <label className="block text-white font-medium mb-2">Nhãn hiệu xe *</label>
          <SearchableSelect
            options={carData.availableBrands.map(brand => ({ id: brand, name: brand }))}
            value={carData.selectedBrand}
            onChange={onBrandChange}
            placeholder="-- Chọn nhãn hiệu --"
            required
          />
          <FieldError fieldName="selectedBrand" errors={fieldErrors} />
        </div>

        {/* Model Selection */}
        <div>
          <label className="block text-white font-medium mb-2">Dòng xe *</label>
          <SearchableSelect
            options={carData.availableModels.map(model => ({ 
              id: model.model_id, 
              name: model.model_name 
            }))}
            value={carData.selectedModel}
            onChange={onModelChange}
            placeholder="-- Chọn dòng xe --"
            loading={carData.isLoadingModels}
            disabled={!carData.selectedBrand}
            required
          />
          <FieldError fieldName="selectedModel" errors={fieldErrors} />
        </div>

        {/* Body Style Selection */}
        <div>
          <label className="block text-white font-medium mb-2">Kiểu dáng *</label>
          <select
            value={carData.selectedBodyStyle}
            onChange={(e) => onInputChange('selectedBodyStyle', e.target.value)}
            className={`w-full bg-white/10 border rounded-xl px-4 py-2 text-white ${
              fieldErrors.selectedBodyStyle ? 'border-red-500' : 'border-white/20'
            }`}
            required
            disabled={!carData.selectedModel || carData.isLoadingDetails}
          >
            <option value="">
              {carData.isLoadingDetails ? 'Đang tải...' : '-- Chọn kiểu dáng --'}
            </option>
            {carData.availableBodyStyles.map(style => (
              <option key={style.id} value={style.name}>{style.name}</option>
            ))}
          </select>
          {carData.isLoadingDetails && (
            <div className="flex items-center gap-2 mt-2">
              <Spinner size="small" className="!m-0 !w-3 !h-3 !max-w-3" />
              <p className="text-xs text-blue-400">Đang tải danh sách kiểu dáng...</p>
            </div>
          )}
          <FieldError fieldName="selectedBodyStyle" errors={fieldErrors} />
        </div>

        {/* Year Selection */}
        <div>
          <label className="block text-white font-medium mb-2">Năm/Phiên bản *</label>
          <select
            value={carData.selectedYear}
            onChange={(e) => onInputChange('selectedYear', e.target.value)}
            className={`w-full bg-white/10 border rounded-xl px-4 py-2 text-white ${
              fieldErrors.selectedYear ? 'border-red-500' : 'border-white/20'
            }`}
            required
            disabled={!carData.selectedModel || carData.isLoadingDetails}
          >
            <option value="">
              {carData.isLoadingDetails ? 'Đang tải...' : '-- Chọn năm/phiên bản --'}
            </option>
            {carData.availableYears.map((year, index) => (
              <option key={`year-${index}-${year.id}`} value={year.name}>{year.name}</option>
            ))}
          </select>
          <FieldError fieldName="selectedYear" errors={fieldErrors} />
        </div>
      </div>
    </div>
  );
}