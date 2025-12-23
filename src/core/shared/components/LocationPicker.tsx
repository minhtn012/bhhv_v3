'use client';

/**
 * LocationPicker - Reusable province/district/ward hierarchical selector
 * Extracted from BuyerInfoForm for use across different insurance products
 */

import { useEffect, useCallback } from 'react';
import useBuyerLocation from '@/hooks/useBuyerLocation';
import Spinner from '@/components/ui/Spinner';
import SearchableSelect from '@/components/SearchableSelect';

export interface LocationValue {
  provinceCode: string;
  provinceName: string;
  districtWardId: string;
  districtWardName: string;
  specificAddress: string;
}

interface LocationPickerProps {
  value: LocationValue;
  onChange: (value: LocationValue) => void;
  errors?: {
    province?: string;
    districtWard?: string;
    specificAddress?: string;
  };
  disabled?: boolean;
  labels?: {
    province?: string;
    districtWard?: string;
    specificAddress?: string;
  };
  showSpecificAddress?: boolean;
  className?: string;
}

export default function LocationPicker({
  value,
  onChange,
  errors = {},
  disabled = false,
  labels = {},
  showSpecificAddress = true,
  className = '',
}: LocationPickerProps) {
  const {
    provinces,
    loadingProvinces,
    errorProvinces,
    districtsWards,
    loadingDistrictsWards,
    errorDistrictsWards,
    loadDistrictsWards,
    clearDistrictsWards,
  } = useBuyerLocation();

  // Handle province selection
  const handleProvinceChange = useCallback(
    (provinceName: string) => {
      const province = provinces.find((p) => p.province_name === provinceName);
      if (province) {
        onChange({
          ...value,
          provinceCode: province.province_code,
          provinceName: province.province_name,
          districtWardId: '',
          districtWardName: '',
        });
        clearDistrictsWards();
        loadDistrictsWards(province.province_code);
      }
    },
    [provinces, value, onChange, clearDistrictsWards, loadDistrictsWards]
  );

  // Handle district/ward selection
  const handleDistrictWardChange = useCallback(
    (districtWardName: string) => {
      const districtWard = districtsWards.find((d) => d.name === districtWardName);
      if (districtWard) {
        onChange({
          ...value,
          districtWardId: districtWard.id,
          districtWardName: districtWard.name,
        });
      }
    },
    [districtsWards, value, onChange]
  );

  // Handle specific address change
  const handleAddressChange = useCallback(
    (address: string) => {
      onChange({
        ...value,
        specificAddress: address,
      });
    },
    [value, onChange]
  );

  // Load districts when province is already selected
  useEffect(() => {
    if (value.provinceCode && districtsWards.length === 0) {
      loadDistrictsWards(value.provinceCode);
    }
  }, [value.provinceCode, districtsWards.length, loadDistrictsWards]);

  const provinceLabel = labels.province || 'Tỉnh/Thành phố';
  const districtWardLabel = labels.districtWard || 'Quận/Huyện/Xã';
  const addressLabel = labels.specificAddress || 'Địa chỉ cụ thể';

  return (
    <div className={`grid md:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
      {/* Province Selector */}
      <div>
        <label className="block text-white font-medium mb-2">{provinceLabel}</label>
        <div
          className={`${errors.province ? 'border border-red-500 rounded-xl' : ''}`}
        >
          <SearchableSelect
            options={provinces.map((province) => ({
              id: province.province_code,
              name: province.province_name,
            }))}
            value={value.provinceName}
            onChange={handleProvinceChange}
            placeholder="Chọn tỉnh/thành phố"
            loading={loadingProvinces}
            disabled={disabled || loadingProvinces}
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
        {errors.province && (
          <p className="text-xs text-red-400 mt-1">{errors.province}</p>
        )}
      </div>

      {/* District/Ward Selector */}
      <div>
        <label className="block text-white font-medium mb-2">{districtWardLabel}</label>
        <div
          className={`${errors.districtWard ? 'border border-red-500 rounded-xl' : ''}`}
        >
          <SearchableSelect
            options={districtsWards.map((district) => ({
              id: district.id,
              name: district.name,
            }))}
            value={value.districtWardName}
            onChange={handleDistrictWardChange}
            placeholder="Chọn quận/huyện/xã"
            loading={loadingDistrictsWards}
            disabled={disabled || !value.provinceCode || loadingDistrictsWards}
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
        {errors.districtWard && (
          <p className="text-xs text-red-400 mt-1">{errors.districtWard}</p>
        )}
      </div>

      {/* Specific Address */}
      {showSpecificAddress && (
        <div className="lg:col-span-3">
          <label className="block text-white font-medium mb-2">{addressLabel}</label>
          <textarea
            value={value.specificAddress}
            onChange={(e) => handleAddressChange(e.target.value)}
            className={`w-full bg-slate-700/50 border rounded-xl px-4 py-3 text-white h-20 resize-none min-h-[80px] ${
              errors.specificAddress ? 'border-red-500' : 'border-slate-500/30'
            }`}
            placeholder="Số nhà, tên đường, khu vực..."
            disabled={disabled}
          />
          {errors.specificAddress && (
            <p className="text-xs text-red-400 mt-1">{errors.specificAddress}</p>
          )}
        </div>
      )}
    </div>
  );
}
