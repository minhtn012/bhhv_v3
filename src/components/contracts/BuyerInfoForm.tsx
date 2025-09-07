import { useEffect, useState } from 'react';
import FieldError from './FieldError';
import useBuyerLocation from '@/hooks/useBuyerLocation';
import Spinner from '@/components/ui/Spinner';
import SearchableSelect from '@/components/SearchableSelect';

interface BuyerFormData {
  chuXe: string;
  buyerEmail: string;
  buyerPhone: string;
  buyerGender: 'nam' | 'nu' | 'khac';
  buyerCitizenId: string;
  selectedProvince: string;
  selectedProvinceText: string;
  selectedDistrictWard: string;
  selectedDistrictWardText: string;
  specificAddress: string;
}

interface BuyerInfoFormProps {
  formData: BuyerFormData;
  fieldErrors: Record<string, string>;
  onFormInputChange: (field: keyof BuyerFormData, value: string) => void;
  onNext: () => void;
}

export default function BuyerInfoForm({
  formData,
  fieldErrors,
  onFormInputChange,
  onNext
}: BuyerInfoFormProps) {
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  const {
    provinces,
    loadingProvinces,
    errorProvinces,
    districtsWards,
    loadingDistrictsWards,
    errorDistrictsWards,
    loadDistrictsWards,
    clearDistrictsWards,
    getProvinceByCode,
    getDistrictWardById
  } = useBuyerLocation();

  // Handle province selection
  const handleProvinceChange = (provinceCode: string) => {
    const province = getProvinceByCode(provinceCode);
    
    onFormInputChange('selectedProvince', provinceCode);
    onFormInputChange('selectedProvinceText', province?.province_name || '');
    
    // Clear district/ward selection
    onFormInputChange('selectedDistrictWard', '');
    onFormInputChange('selectedDistrictWardText', '');
    clearDistrictsWards();
    
    // Load new districts/wards
    if (provinceCode) {
      loadDistrictsWards(provinceCode);
    }
  };

  // Handle district/ward selection
  const handleDistrictWardChange = (districtWardId: string) => {
    const districtWard = getDistrictWardById(districtWardId);
    
    onFormInputChange('selectedDistrictWard', districtWardId);
    onFormInputChange('selectedDistrictWardText', districtWard?.name || '');
  };

  // Load districts/wards if province is already selected
  useEffect(() => {
    if (formData.selectedProvince && districtsWards.length === 0) {
      loadDistrictsWards(formData.selectedProvince);
    }
  }, [formData.selectedProvince, districtsWards.length, loadDistrictsWards]);

  // Clear local errors when field values change
  useEffect(() => {
    setLocalErrors({});
  }, [formData.chuXe, formData.buyerEmail, formData.buyerPhone, formData.buyerCitizenId, formData.selectedProvince, formData.selectedDistrictWard, formData.specificAddress]);

  // Get combined errors (prioritize local errors over global)
  const getCombinedErrors = () => {
    return { ...fieldErrors, ...localErrors };
  };

  const combinedErrors = getCombinedErrors();

  // Validate form before proceeding
  const handleNext = async () => {
    // Basic validation for required fields
    const errors: Record<string, string> = {};
    
    // Validate name (chuXe)
    if (!formData.chuXe || formData.chuXe.trim().length === 0) {
      errors.chuXe = 'Vui lòng nhập họ và tên';
    } else if (formData.chuXe.trim().length < 2) {
      errors.chuXe = 'Họ và tên phải có ít nhất 2 ký tự';
    }
    
    if (!formData.buyerEmail) {
      errors.buyerEmail = 'Vui lòng nhập email';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.buyerEmail)) {
      errors.buyerEmail = 'Vui lòng nhập email hợp lệ';
    }
    
    if (!formData.buyerPhone) {
      errors.buyerPhone = 'Vui lòng nhập số điện thoại';
    } else if (!/^(0[3-9])[0-9]{8}$/.test(formData.buyerPhone)) {
      errors.buyerPhone = 'Số điện thoại phải có 10 chữ số và bắt đầu bằng 03-09';
    }
    
    if (!formData.buyerCitizenId) {
      errors.buyerCitizenId = 'Vui lòng nhập căn cước công dân';
    } else if (!/^[0-9]{12}$/.test(formData.buyerCitizenId)) {
      errors.buyerCitizenId = 'Căn cước công dân phải có đúng 12 chữ số';
    }
    
    if (!formData.selectedProvince) {
      errors.selectedProvince = 'Vui lòng chọn tỉnh/thành phố';
    }
    
    if (!formData.selectedDistrictWard) {
      errors.selectedDistrictWard = 'Vui lòng chọn quận/huyện/xã';
    }
    
    if (!formData.specificAddress || formData.specificAddress.trim().length < 10) {
      errors.specificAddress = 'Vui lòng nhập địa chỉ cụ thể (ít nhất 10 ký tự)';
    }
    
    // If there are validation errors, don't proceed
    if (Object.keys(errors).length > 0) {
      setLocalErrors(errors);
      return;
    }
    
    // Clear errors if validation passes
    setLocalErrors({});
    onNext();
  };

  return (
    <div>
      <h2 className="text-xl lg:text-lg font-semibold text-white mb-6 lg:mb-4">Thông tin người mua</h2>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Họ tên (editable, pre-filled from extracted data) */}
        <div className="lg:col-span-3">
          <label className="block text-white font-medium mb-2">Họ và tên *</label>
          <input 
            type="text" 
            value={formData.chuXe}
            onChange={(e) => onFormInputChange('chuXe', e.target.value)}
            className={`w-full bg-slate-700/50 border rounded-xl px-4 py-3 text-white min-h-[48px] ${
              combinedErrors.chuXe ? 'border-red-500' : 'border-slate-500/30'
            }`}
            placeholder="Nhập họ và tên"
            required
          />
          <FieldError fieldName="chuXe" errors={combinedErrors} />
          <p className="text-xs text-white/50 mt-1">Tự động điền từ thông tin trích xuất, có thể chỉnh sửa</p>
        </div>

        {/* Email */}
        <div>
          <label className="block text-white font-medium mb-2">Email *</label>
          <input 
            type="email" 
            value={formData.buyerEmail}
            onChange={(e) => onFormInputChange('buyerEmail', e.target.value)}
            className={`w-full bg-slate-700/50 border rounded-xl px-4 py-3 text-white min-h-[48px] ${
              combinedErrors.buyerEmail ? 'border-red-500' : 'border-slate-500/30'
            }`}
            placeholder="email@example.com"
            required
          />
          <FieldError fieldName="buyerEmail" errors={combinedErrors} />
        </div>

        {/* Giới tính */}
        <div>
          <label className="block text-white font-medium mb-2">Giới tính *</label>
          <select 
            value={formData.buyerGender}
            onChange={(e) => onFormInputChange('buyerGender', e.target.value as 'nam' | 'nu' | 'khac')}
            className="w-full bg-slate-700/50 border border-slate-500/30 rounded-xl px-4 py-3 text-white min-h-[48px]"
          >
            <option value="nam">Nam</option>
            <option value="nu">Nữ</option>
            <option value="khac">Khác</option>
          </select>
        </div>

        {/* Số điện thoại */}
        <div>
          <label className="block text-white font-medium mb-2">Số điện thoại *</label>
          <input 
            type="tel" 
            value={formData.buyerPhone}
            onChange={(e) => onFormInputChange('buyerPhone', e.target.value)}
            className={`w-full bg-slate-700/50 border rounded-xl px-4 py-3 text-white min-h-[48px] ${
              combinedErrors.buyerPhone ? 'border-red-500' : 'border-slate-500/30'
            }`}
            placeholder="0123456789"
            required
          />
          <FieldError fieldName="buyerPhone" errors={combinedErrors} />
        </div>

        {/* Số căn cước công dân */}
        <div>
          <label className="block text-white font-medium mb-2">Căn cước công dân *</label>
          <input 
            type="text" 
            value={formData.buyerCitizenId}
            onChange={(e) => onFormInputChange('buyerCitizenId', e.target.value)}
            className={`w-full bg-slate-700/50 border rounded-xl px-4 py-3 text-white min-h-[48px] ${
              combinedErrors.buyerCitizenId ? 'border-red-500' : 'border-slate-500/30'
            }`}
            placeholder="123456789012"
            maxLength={12}
            required
          />
          <FieldError fieldName="buyerCitizenId" errors={combinedErrors} />
        </div>

        {/* Tỉnh/Thành phố */}
        <div>
          <label className="block text-white font-medium mb-2">Tỉnh/Thành phố *</label>
          <div className={`${combinedErrors.selectedProvince ? 'border border-red-500 rounded-xl' : ''}`}>
            <SearchableSelect
              options={provinces.map(province => ({ 
                id: province.province_code, 
                name: province.province_name 
              }))}
              value={formData.selectedProvinceText}
              onChange={(value) => {
                const selectedProvince = provinces.find(p => p.province_name === value);
                if (selectedProvince) {
                  handleProvinceChange(selectedProvince.province_code);
                }
              }}
              placeholder="Chọn tỉnh/thành phố"
              loading={loadingProvinces}
              disabled={loadingProvinces}
              required
            />
          </div>
          {loadingProvinces && (
            <div className="flex items-center gap-2 mt-2">
              <Spinner size="small" className="!m-0 !w-3 !h-3 !max-w-3" />
              <p className="text-xs text-blue-400">Đang tải danh sách tỉnh/thành...</p>
            </div>
          )}
          {errorProvinces && (
            <p className="text-xs text-red-400 mt-1">{errorProvinces}</p>
          )}
          <FieldError fieldName="selectedProvince" errors={combinedErrors} />
        </div>

        {/* Quận/Huyện/Xã */}
        <div>
          <label className="block text-white font-medium mb-2">Quận/Huyện/Xã *</label>
          <div className={`${combinedErrors.selectedDistrictWard ? 'border border-red-500 rounded-xl' : ''}`}>
            <SearchableSelect
              options={districtsWards.map(district => ({ 
                id: district.id, 
                name: district.name 
              }))}
              value={formData.selectedDistrictWardText}
              onChange={(value) => {
                const selectedDistrict = districtsWards.find(d => d.name === value);
                if (selectedDistrict) {
                  handleDistrictWardChange(selectedDistrict.id);
                }
              }}
              placeholder="Chọn quận/huyện/xã"
              loading={loadingDistrictsWards}
              disabled={!formData.selectedProvince || loadingDistrictsWards}
              required
            />
          </div>
          {loadingDistrictsWards && (
            <div className="flex items-center gap-2 mt-2">
              <Spinner size="small" className="!m-0 !w-3 !h-3 !max-w-3" />
              <p className="text-xs text-blue-400">Đang tải danh sách quận/huyện/xã...</p>
            </div>
          )}
          {errorDistrictsWards && (
            <p className="text-xs text-red-400 mt-1">{errorDistrictsWards}</p>
          )}
          <FieldError fieldName="selectedDistrictWard" errors={combinedErrors} />
        </div>

        {/* Địa chỉ cụ thể */}
        <div className="lg:col-span-3">
          <label className="block text-white font-medium mb-2">Địa chỉ cụ thể *</label>
          <textarea 
            value={formData.specificAddress}
            onChange={(e) => onFormInputChange('specificAddress', e.target.value)}
            className={`w-full bg-slate-700/50 border rounded-xl px-4 py-3 text-white h-20 resize-none min-h-[80px] ${
              combinedErrors.specificAddress ? 'border-red-500' : 'border-slate-500/30'
            }`}
            placeholder="Số nhà, tên đường, khu vực..."
            required
          />
          <FieldError fieldName="specificAddress" errors={combinedErrors} />
        </div>
      </div>

      {/* Next Button */}
      <div className="flex justify-end mt-6">
        <button
          type="button"
          onClick={handleNext}
          className="px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-medium min-h-[48px] flex items-center justify-center"
        >
          Tiếp theo
        </button>
      </div>
    </div>
  );
}