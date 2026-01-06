import { useEffect, useState } from 'react';
import FieldError from './FieldError';
import useBuyerLocation from '@/hooks/useBuyerLocation';
import Spinner from '@/components/ui/Spinner';
import SearchableSelect from '@/components/SearchableSelect';
import { BuyerFormData } from '@/types/contract';

// Extended form data for local UI state management
interface ExtendedBuyerFormData extends BuyerFormData {
  selectedProvince: string;
  selectedProvinceText: string;
  selectedDistrictWard: string;
  selectedDistrictWardText: string;
  specificAddress: string;
  newSelectedProvince: string;
  newSelectedProvinceText: string;
  newSelectedDistrictWard: string;
  newSelectedDistrictWardText: string;
  newSpecificAddress: string;
  buyerPaymentDate: string;
}

interface BuyerInfoFormProps {
  formData: ExtendedBuyerFormData;
  fieldErrors: Record<string, string>;
  onFormInputChange: (field: keyof ExtendedBuyerFormData, value: string) => void;
  onNext: () => void;
  hideNextButton?: boolean;
}

export default function BuyerInfoForm({
  formData,
  fieldErrors,
  onFormInputChange,
  onNext,
  hideNextButton = false
}: BuyerInfoFormProps) {
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});

  // Hook for old address (from vehicle registration)
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

  // Hook for new address (current address)
  const {
    provinces: newProvinces,
    loadingProvinces: newLoadingProvinces,
    errorProvinces: newErrorProvinces,
    districtsWards: newDistrictsWards,
    loadingDistrictsWards: newLoadingDistrictsWards,
    errorDistrictsWards: newErrorDistrictsWards,
    loadDistrictsWards: newLoadDistrictsWards,
    clearDistrictsWards: newClearDistrictsWards,
    getProvinceByCode: newGetProvinceByCode,
    getDistrictWardById: newGetDistrictWardById
  } = useBuyerLocation();

  // Debug mode: populate default values
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && process.env.DEBUG === 'true') {
      const hasEmptyFields = !formData.chuXe || !formData.email || !formData.soDienThoai ||
                            !formData.cccd || !formData.specificAddress;

      if (hasEmptyFields) {
        onFormInputChange('chuXe', 'Nguyễn Văn A');
        onFormInputChange('email', 'nguyenvana@example.com');
        onFormInputChange('soDienThoai', '0901234567');
        onFormInputChange('cccd', '123456789012');
        onFormInputChange('specificAddress', '123 Đường ABC, Phường XYZ');
      }
    }
  }, [formData, onFormInputChange]);

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

  // Handle new province selection
  const handleNewProvinceChange = (provinceCode: string) => {
    const province = newGetProvinceByCode(provinceCode);

    onFormInputChange('newSelectedProvince', provinceCode);
    onFormInputChange('newSelectedProvinceText', province?.province_name || '');

    // Clear district/ward selection
    onFormInputChange('newSelectedDistrictWard', '');
    onFormInputChange('newSelectedDistrictWardText', '');
    newClearDistrictsWards();

    // Load new districts/wards
    if (provinceCode) {
      newLoadDistrictsWards(provinceCode);
    }
  };

  // Handle new district/ward selection
  const handleNewDistrictWardChange = (districtWardId: string) => {
    const districtWard = newGetDistrictWardById(districtWardId);

    onFormInputChange('newSelectedDistrictWard', districtWardId);
    onFormInputChange('newSelectedDistrictWardText', districtWard?.name || '');
  };

  // Load districts/wards if province is already selected
  useEffect(() => {
    if (formData.selectedProvince && districtsWards.length === 0) {
      loadDistrictsWards(formData.selectedProvince);
    }
  }, [formData.selectedProvince, districtsWards.length, loadDistrictsWards]);

  // Load districts/wards for new address if province is already selected
  useEffect(() => {
    if (formData.newSelectedProvince && newDistrictsWards.length === 0) {
      newLoadDistrictsWards(formData.newSelectedProvince);
    }
  }, [formData.newSelectedProvince, newDistrictsWards.length, newLoadDistrictsWards]);

  // Auto-detect company type based on name
  useEffect(() => {
    if (formData.chuXe) {
      const nameLower = formData.chuXe.toLowerCase();
      const companyKeywords = ['tnhh', 'công ty', 'cong ty', 'cty', 'ctcp', 'cổ phần', 'co phan'];

      const isCompany = companyKeywords.some(keyword => nameLower.includes(keyword));

      if (isCompany && formData.userType !== 'cong_ty') {
        onFormInputChange('userType', 'cong_ty');
      }
    }
  }, [formData.chuXe, formData.userType, onFormInputChange]);

  // Clear local errors when field values change
  useEffect(() => {
    setLocalErrors({});
  }, [formData.chuXe, formData.email, formData.soDienThoai, formData.cccd, formData.buyerPaymentDate, formData.selectedProvince, formData.selectedDistrictWard, formData.specificAddress, formData.newSelectedProvince, formData.newSelectedDistrictWard, formData.newSpecificAddress]);

  // Get combined errors (prioritize local errors over global)
  const getCombinedErrors = () => {
    return { ...fieldErrors, ...localErrors };
  };

  const combinedErrors = getCombinedErrors();

  // Validate form before proceeding
  const handleNext = async () => {
    // Basic validation for required fields
    const errors: Record<string, string> = {};

    // Validate name (chuXe) - ONLY REQUIRED FIELD
    if (!formData.chuXe || formData.chuXe.trim().length === 0) {
      errors.chuXe = 'Vui lòng nhập họ và tên';
    } else if (formData.chuXe.trim().length < 2) {
      errors.chuXe = 'Họ và tên phải có ít nhất 2 ký tự';
    }

    // Optional: Validate email format if provided
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Vui lòng nhập email hợp lệ';
    }

    // Optional: Validate phone format if provided
    if (formData.soDienThoai && !/^(0[3-9])[0-9]{8}$/.test(formData.soDienThoai)) {
      errors.soDienThoai = 'Số điện thoại phải có 10 chữ số và bắt đầu bằng 03-09';
    }

    // Optional: Validate CCCD format if provided
    if (formData.cccd && !/^[0-9]{12}$/.test(formData.cccd)) {
      errors.cccd = 'Căn cước công dân phải có đúng 12 chữ số';
    }

    // Optional: Validate address length if provided
    if (formData.specificAddress && formData.specificAddress.trim().length > 0 && formData.specificAddress.trim().length < 10) {
      errors.specificAddress = 'Địa chỉ cụ thể phải có ít nhất 10 ký tự';
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
        {/* Họ tên và Loại khách hàng (same row) */}
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Họ tên (editable, pre-filled from extracted data) */}
          <div>
            <label className="block text-white font-medium mb-2">Họ và tên *</label>
            <input
              type="text"
              name="chuXe"
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

          {/* Loại khách hàng */}
          <div>
            <label className="block text-white font-medium mb-2">Loại khách hàng *</label>
            <div className="flex items-center gap-6 h-[48px]">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="userType"
                  value="ca_nhan"
                  checked={formData.userType === 'ca_nhan'}
                  onChange={(e) => onFormInputChange('userType', e.target.value as 'ca_nhan' | 'cong_ty')}
                  className="w-4 h-4 text-blue-500 bg-slate-700/50 border-slate-500/30 focus:ring-blue-500 focus:ring-2"
                />
                <span className="ml-2 text-white">Cá nhân</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="userType"
                  value="cong_ty"
                  checked={formData.userType === 'cong_ty'}
                  onChange={(e) => onFormInputChange('userType', e.target.value as 'ca_nhan' | 'cong_ty')}
                  className="w-4 h-4 text-blue-500 bg-slate-700/50 border-slate-500/30 focus:ring-blue-500 focus:ring-2"
                />
                <span className="ml-2 text-white">Công ty</span>
              </label>
            </div>
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-white font-medium mb-2">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={(e) => onFormInputChange('email', e.target.value)}
            className={`w-full bg-slate-700/50 border rounded-xl px-4 py-3 text-white min-h-[48px] ${
              combinedErrors.email ? 'border-red-500' : 'border-slate-500/30'
            }`}
            placeholder="email@example.com"
          />
          <FieldError fieldName="email" errors={combinedErrors} />
        </div>

        {/* Số điện thoại */}
        <div>
          <label className="block text-white font-medium mb-2">Số điện thoại</label>
          <input
            type="tel"
            name="soDienThoai"
            value={formData.soDienThoai}
            onChange={(e) => onFormInputChange('soDienThoai', e.target.value)}
            className={`w-full bg-slate-700/50 border rounded-xl px-4 py-3 text-white min-h-[48px] ${
              combinedErrors.soDienThoai ? 'border-red-500' : 'border-slate-500/30'
            }`}
            placeholder="0123456789"
          />
          <FieldError fieldName="soDienThoai" errors={combinedErrors} />
        </div>

        {/* Số căn cước công dân */}
        <div>
          <label className="block text-white font-medium mb-2">Căn cước công dân</label>
          <input
            type="text"
            value={formData.cccd}
            onChange={(e) => onFormInputChange('cccd', e.target.value)}
            className={`w-full bg-slate-700/50 border rounded-xl px-4 py-3 text-white min-h-[48px] ${
              combinedErrors.cccd ? 'border-red-500' : 'border-slate-500/30'
            }`}
            placeholder="123456789012"
            maxLength={12}
          />
          <FieldError fieldName="cccd" errors={combinedErrors} />
        </div>

        {/* Ngày thanh toán */}
        <div>
          <label className="block text-white font-medium mb-2">Ngày thanh toán</label>
          <input
            type="text"
            name="buyerPaymentDate"
            value={formData.buyerPaymentDate || ''}
            onChange={(e) => onFormInputChange('buyerPaymentDate', e.target.value)}
            className={`w-full bg-slate-700/50 border rounded-xl px-4 py-3 text-white min-h-[48px] ${
              combinedErrors.buyerPaymentDate ? 'border-red-500' : 'border-slate-500/30'
            }`}
            placeholder="DD/MM/YYYY"
          />
          <FieldError fieldName="buyerPaymentDate" errors={combinedErrors} />
        </div>

        {/* Tỉnh/Thành phố */}
        <div>
          <label className="block text-white font-medium mb-2">Tỉnh/Thành phố</label>
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
          <label className="block text-white font-medium mb-2">Quận/Huyện/Xã</label>
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
          <label className="block text-white font-medium mb-2">Địa chỉ cụ thể (từ đăng ký xe)</label>
          <textarea
            value={formData.specificAddress}
            onChange={(e) => onFormInputChange('specificAddress', e.target.value)}
            className={`w-full bg-slate-700/50 border rounded-xl px-4 py-3 text-white h-20 resize-none min-h-[80px] ${
              combinedErrors.specificAddress ? 'border-red-500' : 'border-slate-500/30'
            }`}
            placeholder="Số nhà, tên đường, khu vực..."
          />
          <FieldError fieldName="specificAddress" errors={combinedErrors} />
          <p className="text-xs text-white/50 mt-1">Tự động điền từ thông tin trích xuất (phần đầu của địa chỉ)</p>
        </div>
      </div>

      {/* New Address Section */}
      <div className="mt-8 pt-6 border-t border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">Địa chỉ mới (nếu khác địa chỉ đăng ký xe)</h3>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Tỉnh/Thành phố mới */}
          <div>
            <label className="block text-white font-medium mb-2">Tỉnh/Thành phố</label>
            <div className={`${combinedErrors.newSelectedProvince ? 'border border-red-500 rounded-xl' : ''}`}>
              <SearchableSelect
                options={newProvinces.map(province => ({
                  id: province.province_code,
                  name: province.province_name
                }))}
                value={formData.newSelectedProvinceText}
                onChange={(value) => {
                  const selectedProvince = newProvinces.find(p => p.province_name === value);
                  if (selectedProvince) {
                    handleNewProvinceChange(selectedProvince.province_code);
                  }
                }}
                placeholder="Chọn tỉnh/thành phố"
                loading={newLoadingProvinces}
                disabled={newLoadingProvinces}
              />
            </div>
            {newLoadingProvinces && (
              <div className="flex items-center gap-2 mt-2">
                <Spinner size="small" className="!m-0 !w-3 !h-3 !max-w-3" />
                <p className="text-xs text-blue-400">Đang tải danh sách tỉnh/thành...</p>
              </div>
            )}
            {newErrorProvinces && (
              <p className="text-xs text-red-400 mt-1">{newErrorProvinces}</p>
            )}
            <FieldError fieldName="newSelectedProvince" errors={combinedErrors} />
          </div>

          {/* Quận/Huyện/Xã mới */}
          <div>
            <label className="block text-white font-medium mb-2">Quận/Huyện/Xã</label>
            <div className={`${combinedErrors.newSelectedDistrictWard ? 'border border-red-500 rounded-xl' : ''}`}>
              <SearchableSelect
                options={newDistrictsWards.map(district => ({
                  id: district.id,
                  name: district.name
                }))}
                value={formData.newSelectedDistrictWardText}
                onChange={(value) => {
                  const selectedDistrict = newDistrictsWards.find(d => d.name === value);
                  if (selectedDistrict) {
                    handleNewDistrictWardChange(selectedDistrict.id);
                  }
                }}
                placeholder="Chọn quận/huyện/xã"
                loading={newLoadingDistrictsWards}
                disabled={!formData.newSelectedProvince || newLoadingDistrictsWards}
              />
            </div>
            {newLoadingDistrictsWards && (
              <div className="flex items-center gap-2 mt-2">
                <Spinner size="small" className="!m-0 !w-3 !h-3 !max-w-3" />
                <p className="text-xs text-blue-400">Đang tải danh sách quận/huyện/xã...</p>
              </div>
            )}
            {newErrorDistrictsWards && (
              <p className="text-xs text-red-400 mt-1">{newErrorDistrictsWards}</p>
            )}
            <FieldError fieldName="newSelectedDistrictWard" errors={combinedErrors} />
          </div>

          {/* Địa chỉ cụ thể mới */}
          <div className="lg:col-span-3">
            <label className="block text-white font-medium mb-2">Địa chỉ cụ thể</label>
            <textarea
              value={formData.newSpecificAddress}
              onChange={(e) => onFormInputChange('newSpecificAddress', e.target.value)}
              className={`w-full bg-slate-700/50 border rounded-xl px-4 py-3 text-white h-20 resize-none min-h-[80px] ${
                combinedErrors.newSpecificAddress ? 'border-red-500' : 'border-slate-500/30'
              }`}
              placeholder="Số nhà, tên đường, khu vực..."
            />
            <FieldError fieldName="newSpecificAddress" errors={combinedErrors} />
          </div>
        </div>
      </div>

      {/* Next Button */}
      {!hideNextButton && (
        <div className="flex justify-end mt-6">
          <button
            type="button"
            onClick={handleNext}
            className="px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-medium min-h-[48px] flex items-center justify-center"
          >
            Tiếp theo
          </button>
        </div>
      )}
    </div>
  );
}