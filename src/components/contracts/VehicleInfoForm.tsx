import { formatNumberInput, loaiHinhKinhDoanhOptions } from '@/utils/insurance-calculator';
import { CarSelection } from '@/types/car';
import FieldError from './FieldError';
import CarSelectionForm from './CarSelectionForm';

interface FormData {
  chuXe: string;
  diaChi: string;
  bienSo: string;
  soKhung: string;
  soMay: string;
  ngayDKLD: string;
  namSanXuat: number | '';
  soChoNgoi: number | '';
  trongTai: number | '';
  giaTriXe: string;
  loaiHinhKinhDoanh: string;
}

interface VehicleInfoFormProps {
  formData: FormData;
  carData: CarSelection;
  fieldErrors: Record<string, string>;
  onFormInputChange: (field: keyof FormData, value: any) => void;
  onBrandChange: (brand: string) => void;
  onModelChange: (model: string) => void;
  onCarInputChange: (field: keyof CarSelection, value: any) => void;
  onAcceptSuggestion: () => void;
  onCalculateRates: () => void;
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
  onCalculateRates
}: VehicleInfoFormProps) {
  return (
    <div>      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="block text-white font-medium mb-2">Biển số *</label>
          <input 
            type="text" 
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
            type="text" 
            value={formData.ngayDKLD}
            onChange={(e) => onFormInputChange('ngayDKLD', e.target.value)}
            placeholder="dd/mm/yyyy (VD: 15/03/2020)"
            pattern="^([0-2][0-9]|3[0-1])/(0[1-9]|1[0-2])/[0-9]{4}$"
            title="Vui lòng nhập ngày theo định dạng dd/mm/yyyy"
            className={`w-full bg-slate-700/50 border rounded-xl px-4 py-3 text-white min-h-[48px] ${
              fieldErrors.ngayDKLD ? 'border-red-500' : 'border-slate-500/30'
            }`}
            required
          />
          <FieldError fieldName="ngayDKLD" errors={fieldErrors} />
        </div>

        <div>
          <label className="block text-white font-medium mb-2">Năm sản xuất *</label>
          <input 
            type="number" 
            min="1980"
            max={new Date().getFullYear()}
            value={formData.namSanXuat}
            onChange={(e) => onFormInputChange('namSanXuat', e.target.value ? parseInt(e.target.value) : '')}
            className={`w-full bg-white/10 border rounded-xl px-4 py-2 text-white ${
              fieldErrors.namSanXuat ? 'border-red-500' : 'border-white/20'
            }`}
            required
          />
          <FieldError fieldName="namSanXuat" errors={fieldErrors} />
        </div>

        <div>
          <label className="block text-white font-medium mb-2">Số chỗ ngồi *</label>
          <input 
            type="number" 
            min="1"
            max="64"
            value={formData.soChoNgoi}
            onChange={(e) => onFormInputChange('soChoNgoi', e.target.value ? parseInt(e.target.value) : '')}
            className={`w-full bg-white/10 border rounded-xl px-4 py-2 text-white ${
              fieldErrors.soChoNgoi ? 'border-red-500' : 'border-white/20'
            }`}
            required
          />
          <FieldError fieldName="soChoNgoi" errors={fieldErrors} />
        </div>

        {/* Car Selection Section */}
        <CarSelectionForm
          carData={carData}
          fieldErrors={fieldErrors}
          onBrandChange={onBrandChange}
          onModelChange={onModelChange}
          onInputChange={onCarInputChange}
          onAcceptSuggestion={onAcceptSuggestion}
        />

        <div className="lg:col-span-3">
          <label className="block text-white font-medium mb-2">Giá trị xe (VNĐ) *</label>
          <input 
            type="text" 
            value={formData.giaTriXe}
            onChange={(e) => onFormInputChange('giaTriXe', formatNumberInput(e.target.value))}
            placeholder="Ví dụ: 800,000,000"
            className={`w-full bg-white/10 border rounded-xl px-4 py-2 text-white ${
              fieldErrors.giaTriXe ? 'border-red-500' : 'border-white/20'
            }`}
            required
          />
          <FieldError fieldName="giaTriXe" errors={fieldErrors} />
        </div>

        <div className="lg:col-span-3">
          <label className="block text-white font-medium mb-2">Loại hình sử dụng *</label>
          <select 
            value={formData.loaiHinhKinhDoanh}
            onChange={(e) => onFormInputChange('loaiHinhKinhDoanh', e.target.value)}
            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white"
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

        {(formData.loaiHinhKinhDoanh.includes('cho_hang') || formData.loaiHinhKinhDoanh.includes('dau_keo')) && (
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

      <div className="flex justify-center mt-6">
        <button
          onClick={onCalculateRates}
          className="bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-8 rounded-xl transition-colors"
        >
          Tính phí & Lập báo giá
        </button>
      </div>
    </div>
  );
}