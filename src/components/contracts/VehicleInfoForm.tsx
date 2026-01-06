import { formatNumberInput, loaiHinhKinhDoanhOptions } from '@/utils/insurance-calculator';
import { CarSelection } from '@/types/car';
import FieldError from './FieldError';
import CarSelectionForm from './CarSelectionForm';
import carEngineTypes from '@db/car_type_engine.json';
import { VehicleFormData } from '@/types/contract';
import StepperInput from '../ui/StepperInput';

interface EngineType {
  name: string;
  value: string;
  code: string;
}
import { getEngineTypeFromCarType } from '@/utils/car-engine-mapping';
import { useEffect } from 'react';

// Các loại xe cần nhập trọng tải
const VEHICLE_TYPES_REQUIRE_PAYLOAD = [
  'cho_hang',   // xe chở hàng (kinh doanh & không kinh doanh)
  'dau_keo',    // xe đầu kéo
  'pickup',     // xe bán tải/van
  'kd_grab_be', // Grab/Be/taxi công nghệ
];

const requiresPayload = (loaiHinhKinhDoanh: string): boolean => {
  return VEHICLE_TYPES_REQUIRE_PAYLOAD.some(type => loaiHinhKinhDoanh.includes(type));
};

interface VehicleInfoFormProps {
  formData: VehicleFormData;
  carData: CarSelection;
  fieldErrors: Record<string, string>;
  onFormInputChange: (field: keyof VehicleFormData, value: string | number) => void;
  onBrandChange: (brand: string) => void;
  onModelChange: (model: string) => void;
  onCarInputChange: (field: keyof CarSelection, value: string) => void;
  onAcceptSuggestion: () => void;
  onCalculateRates: () => void;
  onVehicleDataChange?: (vehicleData: { tenXe: string; nhanHieu: string; soLoai: string; kieuDang: string; namPhienBan: string }) => void;
  hideCalculateButton?: boolean;
}

export default function VehicleInfoForm({
  formData,
  carData,
  fieldErrors,
  onFormInputChange,
  onBrandChange,
  onModelChange,
  onCarInputChange,
  onAcceptSuggestion,
  onCalculateRates,
  onVehicleDataChange,
  hideCalculateButton = false
}: VehicleInfoFormProps) {
  const selectedEngine: EngineType | undefined = carEngineTypes.find(engine => engine.value === formData.loaiDongCo);
  const isElectricOrHybrid = selectedEngine && (selectedEngine.code === 'HYBRID' || selectedEngine.code === 'EV');

  // Helper: Convert DD/MM/YYYY → YYYY-MM-DD for native date input
  const convertToNativeDate = (ddmmyyyy: string): string => {
    if (!ddmmyyyy) return '';
    const match = ddmmyyyy.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!match) return '';
    const [, day, month, year] = match;
    return `${year}-${month}-${day}`;
  };

  // Helper: Convert YYYY-MM-DD → DD/MM/YYYY for backend
  const convertToBackendDate = (yyyymmdd: string): string => {
    if (!yyyymmdd) return '';
    const match = yyyymmdd.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return '';
    const [, year, month, day] = match;
    return `${day}/${month}/${year}`;
  };

  // Auto-set engine type based on selected car
  useEffect(() => {
    if (carData.selectedBrand && carData.selectedModel && carData.availableModels.length > 0) {
      // Find the selected car model in available models
      const selectedCar = carData.availableModels.find(model => 
        model.model_name === carData.selectedModel
      );
      
      if (selectedCar && selectedCar.car_type) {
        const engineType = getEngineTypeFromCarType(selectedCar.car_type);
        if (engineType) {
          // Always update engine type when car model changes
          onFormInputChange('loaiDongCo', engineType);
        }
      }
    }
  }, [carData.selectedBrand, carData.selectedModel, carData.availableModels]);

  // Handle vehicle data changes from CarSelectionForm
  const handleVehicleDataChange = (vehicleData: { tenXe: string; nhanHieu: string; soLoai: string; kieuDang: string; namPhienBan: string }) => {
    // Update form data with vehicle details
    onFormInputChange('tenXe', vehicleData.tenXe);
    onFormInputChange('nhanHieu', vehicleData.nhanHieu);
    onFormInputChange('soLoai', vehicleData.soLoai);
    onFormInputChange('kieuDang', vehicleData.kieuDang);
    onFormInputChange('namPhienBan', vehicleData.namPhienBan);
    
    // Call parent callback if provided
    if (onVehicleDataChange) {
      onVehicleDataChange(vehicleData);
    }
  };


  return (
    <div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Car Selection Section - Thông tin xe tự động */}
        <CarSelectionForm
          carData={carData}
          fieldErrors={fieldErrors}
          onBrandChange={onBrandChange}
          onModelChange={onModelChange}
          onInputChange={onCarInputChange}
          onAcceptSuggestion={onAcceptSuggestion}
          onVehicleDataChange={handleVehicleDataChange}
        />

        <div>
          <label className="block text-white font-medium mb-2">Biển số *</label>
          <input
            type="text"
            name="bienSo"
            value={formData.bienSo}
            onChange={(e) => onFormInputChange('bienSo', e.target.value.toUpperCase())}
            className={`w-full bg-slate-700/50 border rounded-xl px-4 py-3 text-white font-mono min-h-[48px] ${
              fieldErrors.bienSo ? 'border-red-500' : 'border-slate-500/30'
            }`}
            required
          />
          <FieldError fieldName="bienSo" errors={fieldErrors} />
        </div>

        <div>
          <label className="block text-white font-medium mb-2">Số khung *</label>
          <input
            type="text"
            name="soKhung"
            value={formData.soKhung}
            onChange={(e) => onFormInputChange('soKhung', e.target.value)}
            className={`w-full bg-slate-700/50 border rounded-xl px-4 py-3 text-white min-h-[48px] ${
              fieldErrors.soKhung ? 'border-red-500' : 'border-slate-500/30'
            }`}
            required
          />
          <FieldError fieldName="soKhung" errors={fieldErrors} />
        </div>

        <div>
          <label className="block text-white font-medium mb-2">Số máy *</label>
          <input
            type="text"
            name="soMay"
            value={formData.soMay}
            onChange={(e) => onFormInputChange('soMay', e.target.value)}
            className={`w-full bg-slate-700/50 border rounded-xl px-4 py-3 text-white min-h-[48px] ${
              fieldErrors.soMay ? 'border-red-500' : 'border-slate-500/30'
            }`}
            required
          />
          <FieldError fieldName="soMay" errors={fieldErrors} />
        </div>

        <div>
          <label className="block text-white font-medium mb-2">Ngày ĐK lần đầu *</label>
          <input
            type="date"
            name="ngayDKLD"
            value={convertToNativeDate(formData.ngayDKLD)}
            onChange={(e) => {
              // Convert YYYY-MM-DD to DD/MM/YYYY for backend
              const backendFormat = convertToBackendDate(e.target.value);
              onFormInputChange('ngayDKLD', backendFormat);
            }}
            max={new Date().toISOString().split('T')[0]}
            className={`w-full bg-slate-700/50 border rounded-xl px-4 py-3 text-white min-h-[48px] ${
              fieldErrors.ngayDKLD ? 'border-red-500' : 'border-slate-500/30'
            } [color-scheme:dark]`}
            required
          />
          <FieldError fieldName="ngayDKLD" errors={fieldErrors} />
        </div>

        <div>
          <label className="block text-white font-medium mb-2">Năm sản xuất *</label>
          <select
            name="namSanXuat"
            value={formData.namSanXuat}
            onChange={(e) => {
              const newValue = e.target.value ? parseInt(e.target.value) : '';
              onFormInputChange('namSanXuat', newValue);
            }}
            className={`w-full bg-slate-700/50 border rounded-xl px-4 py-3 text-white min-h-[48px] ${
              fieldErrors.namSanXuat ? 'border-red-500' : 'border-slate-500/30'
            }`}
            required
          >
            <option value="">-- Chọn năm sản xuất --</option>
            {Array.from({ length: new Date().getFullYear() - 1980 + 1 }, (_, i) => new Date().getFullYear() - i).map(year => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          <FieldError fieldName="namSanXuat" errors={fieldErrors} />
        </div>

        <div>
          <label className="block text-white font-medium mb-2">Số chỗ ngồi *</label>
          <StepperInput
            value={formData.soChoNgoi}
            onChange={(e) => onFormInputChange('soChoNgoi', e.target.value ? parseInt(e.target.value, 10) : '')}
            onStep={(adjustment) => {
              const currentValue = Number(formData.soChoNgoi) || 1;
              const newValue = Math.max(1, Math.min(64, currentValue + adjustment));
              onFormInputChange('soChoNgoi', newValue);
            }}
            min={1}
            max={64}
            step={1}
            className={`w-full bg-white/10 border rounded-xl flex items-center ${
              fieldErrors.soChoNgoi ? 'border-red-500' : 'border-white/20'
            }`}
            inputClassName="flex-grow text-center bg-transparent text-white focus:outline-none p-2"
            buttonClassName="px-3 py-2 text-white font-bold disabled:opacity-50"
          />
          <FieldError fieldName="soChoNgoi" errors={fieldErrors} />
        </div>

        <div>
          <label className="block text-white font-medium mb-2">Giá trị xe (VNĐ) *</label>
          <input
            type="text"
            name="giaTriXe"
            value={formData.giaTriXe}
            onChange={(e) => onFormInputChange('giaTriXe', formatNumberInput(e.target.value))}
            placeholder="Ví dụ: 800,000,000"
            className={`w-full bg-white/10 border rounded-xl px-4 py-3 text-white min-h-[48px] ${
              fieldErrors.giaTriXe ? 'border-red-500' : 'border-white/20'
            }`}
            required
          />
          <FieldError fieldName="giaTriXe" errors={fieldErrors} />
        </div>

        <div>
          <label htmlFor="loaiXe" className="block text-white font-medium mb-2">Loại xe</label>
          <input
            id="loaiXe"
            type="text"
            value={formData.loaiXe}
            onChange={(e) => onFormInputChange('loaiXe', e.target.value)}
            placeholder="Ví dụ: xe con, xe tải, bán tải..."
            className={`w-full bg-slate-700/50 border rounded-xl px-4 py-3 text-white min-h-[48px] ${
              fieldErrors.loaiXe ? 'border-red-500' : 'border-slate-500/30'
            }`}
          />
          <FieldError fieldName="loaiXe" errors={fieldErrors} />
        </div>

        <div>
          <label className="block text-white font-medium mb-2">Loại động cơ *</label>
          <select
            name="loaiDongCo"
            value={formData.loaiDongCo}
            onChange={(e) => onFormInputChange('loaiDongCo', e.target.value)}
            className={`w-full bg-slate-700/50 border rounded-xl px-4 py-3 text-white min-h-[48px] ${
              fieldErrors.loaiDongCo ? 'border-red-500' : 'border-slate-500/30'
            }`}
            required
          >
            <option value="">-- Chọn loại động cơ --</option>
            {carEngineTypes.map(engine => (
              <option key={engine.value} value={engine.value}>
                {engine.name}
              </option>
            ))}
          </select>
          <FieldError fieldName="loaiDongCo" errors={fieldErrors} />
        </div>


        {isElectricOrHybrid && (
          <div className="lg:col-span-3">
            <label className="block text-white font-medium mb-2">Giá trị Pin (VNĐ) *</label>
            <input 
              type="text" 
              value={formData.giaTriPin}
              onChange={(e) => onFormInputChange('giaTriPin', formatNumberInput(e.target.value))}
              placeholder="Ví dụ: 200,000,000"
              className={`w-full bg-white/10 border rounded-xl px-4 py-2 text-white ${
                fieldErrors.giaTriPin ? 'border-red-500' : 'border-white/20'
              }`}
              required
            />
            <FieldError fieldName="giaTriPin" errors={fieldErrors} />
          </div>
        )}

        <div className="lg:col-span-3">
          <label className="block text-white font-medium mb-2">Loại hình sử dụng *</label>
          <select 
            value={formData.loaiHinhKinhDoanh}
            onChange={(e) => {
              onFormInputChange('loaiHinhKinhDoanh', e.target.value);
            }}
            className={`w-full bg-slate-700/50 border rounded-xl px-4 py-3 text-white min-h-[48px] ${
              fieldErrors.loaiHinhKinhDoanh ? 'border-red-500' : 'border-slate-500/30'
            }`}
            required
          >
            {Object.entries(
              loaiHinhKinhDoanhOptions.reduce((groups, option) => {
                if (!groups[option.group]) groups[option.group] = [];
                groups[option.group].push(option);
                return groups;
              }, {} as Record<string, typeof loaiHinhKinhDoanhOptions>)
            ).map(([group, options]) => (
              <optgroup key={group} label={group}>
                {options.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>


        {requiresPayload(formData.loaiHinhKinhDoanh) && (
          <div className="lg:col-span-3">
            <label className="block text-white font-medium mb-2">Trọng tải (kg) *</label>
            <input 
              type="number" 
              min="1"
              value={formData.trongTai}
              onChange={(e) => onFormInputChange('trongTai', e.target.value ? parseInt(e.target.value) : '')}
              placeholder="Ví dụ: 15000"
              className={`w-full bg-white/10 border rounded-xl px-4 py-2 text-white ${
                fieldErrors.trongTai ? 'border-red-500' : 'border-white/20'
              }`}
              required
            />
            <FieldError fieldName="trongTai" errors={fieldErrors} />
          </div>
        )}
      </div>

      {!hideCalculateButton && (
        <div className="flex justify-center mt-6">
          <button
            type="button"
            onClick={onCalculateRates}
            className="bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-8 rounded-xl transition-colors min-h-[48px] flex items-center justify-center"
          >
            Tính phí & Lập báo giá
          </button>
        </div>
      )}
    </div>
  );
}