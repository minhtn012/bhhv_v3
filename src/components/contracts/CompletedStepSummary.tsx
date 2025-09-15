'use client';

import { formatCurrency } from '@/utils/insurance-calculator';
import { getVehicleTypeText } from '@/utils/vehicle-type-mapping';

interface FileUploadSummaryProps {
  cavetFileName?: string;
  dangkiemFileName?: string;
}

interface VehicleInfoSummaryProps {
  formData: {
    chuXe: string;
    bienSo: string;
    nhanHieu: string;
    soLoai: string;
    namSanXuat: number | '';
    soChoNgoi: number | '';
    giaTriXe: string;
    loaiHinhKinhDoanh: string;
  };
}

interface PackageSelectionSummaryProps {
  selectedPackageName: string;
  selectedRate: number;
  packageFee: number;
  includeTNDS: boolean;
  tndsCategory: string;
  tndsFee: number;
  includeNNTX: boolean;
  nntxFee: number;
  totalAmount: number;
}

export function FileUploadSummary({ cavetFileName, dangkiemFileName }: FileUploadSummaryProps) {
  return (
    <div className="text-sm text-gray-300 space-y-2">
      <h4 className="font-semibold text-white">Giấy tờ đã tải lên:</h4>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <span className="text-gray-400">Cà vẹt:</span>
          <p className="text-green-400">{cavetFileName || 'Chưa tải'}</p>
        </div>
        <div>
          <span className="text-gray-400">Đăng kiểm:</span>
          <p className="text-green-400">{dangkiemFileName || 'Chưa tải'}</p>
        </div>
      </div>
    </div>
  );
}

export function VehicleInfoSummary({ formData }: VehicleInfoSummaryProps) {

  return (
    <div className="text-sm text-gray-300 space-y-3">
      <h4 className="font-semibold text-white">Thông tin xe đã nhập:</h4>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <div>
          <span className="text-gray-400">Chủ xe:</span>
          <p className="text-white font-medium">{formData.chuXe || 'Chưa nhập'}</p>
        </div>
        <div>
          <span className="text-gray-400">Biển số:</span>
          <p className="text-white font-medium">{formData.bienSo || 'Chưa nhập'}</p>
        </div>
        <div>
          <span className="text-gray-400">Nhãn hiệu:</span>
          <p className="text-white font-medium">{formData.nhanHieu || 'Chưa nhập'}</p>
        </div>
        <div>
          <span className="text-gray-400">Số loại:</span>
          <p className="text-white font-medium">{formData.soLoai || 'Chưa nhập'}</p>
        </div>
        <div>
          <span className="text-gray-400">Năm sản xuất:</span>
          <p className="text-white font-medium">{formData.namSanXuat || 'Chưa nhập'}</p>
        </div>
        <div>
          <span className="text-gray-400">Số chỗ ngồi:</span>
          <p className="text-white font-medium">{formData.soChoNgoi || 'Chưa nhập'}</p>
        </div>
        <div>
          <span className="text-gray-400">Định giá xe:</span>
          <p className="text-blue-400 font-medium">{formData.giaTriXe || 'Chưa nhập'}</p>
        </div>
        <div className="lg:col-span-2">
          <span className="text-gray-400">Loại hình sử dụng:</span>
          <p className="text-white font-medium">{getVehicleTypeText(formData.loaiHinhKinhDoanh)}</p>
        </div>
      </div>
    </div>
  );
}

export function PackageSelectionSummary({ 
  selectedPackageName,
  selectedRate,
  packageFee,
  includeTNDS,
  tndsCategory,
  tndsFee,
  includeNNTX,
  nntxFee,
  totalAmount 
}: PackageSelectionSummaryProps) {
  return (
    <div className="text-sm text-gray-300 space-y-3">
      <h4 className="font-semibold text-white">Gói bảo hiểm đã chọn:</h4>
      
      {/* Selected Package */}
      <div className="p-3 bg-white/5 rounded-lg">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-white font-medium">{selectedPackageName}</p>
            <p className="text-gray-400">Tỷ lệ: {selectedRate.toFixed(2)}%</p>
          </div>
          <p className="text-blue-400 font-semibold">{formatCurrency(packageFee)}</p>
        </div>
      </div>

      {/* Insurance Options */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-gray-400">TNDS Bắt buộc:</span>
          <span className={includeTNDS ? 'text-green-400' : 'text-gray-500'}>
            {includeTNDS ? formatCurrency(tndsFee) : 'Không chọn'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Người ngồi trên xe:</span>
          <span className={includeNNTX ? 'text-green-400' : 'text-gray-500'}>
            {includeNNTX ? formatCurrency(nntxFee) : 'Không chọn'}
          </span>
        </div>
      </div>

      {/* Total */}
      <div className="pt-2 border-t border-gray-600">
        <div className="flex justify-between items-center">
          <span className="text-white font-semibold">Tổng phí:</span>
          <span className="text-blue-400 font-bold text-lg">{formatCurrency(totalAmount)}</span>
        </div>
      </div>
    </div>
  );
}