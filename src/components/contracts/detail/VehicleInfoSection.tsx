import { formatCurrency, isElectricOrHybridEngine, calculateTotalVehicleValue } from '@/utils/insurance-calculator';
import { getVehicleTypeText } from '@/utils/vehicle-type-mapping';
import carEngineTypes from '@db/car_type_engine.json';

interface Contract {
  bienSo: string;
  carBrand?: string;
  carModel?: string;
  carBodyStyle?: string;
  soKhung: string;
  soMay: string;
  ngayDKLD: string;
  namSanXuat: number;
  carYear?: number;
  soChoNgoi: number;
  trongTai?: number;
  giaTriXe: number;
  loaiDongCo?: string;
  giaTriPin?: number;
  loaiHinhKinhDoanh: string;
}

interface VehicleInfoSectionProps {
  contract: Contract;
}


const getEngineTypeText = (engineTypeId: string): string => {
  const engineType = carEngineTypes.find(engine => engine.value === engineTypeId);
  return engineType?.name || engineTypeId;
};

export default function VehicleInfoSection({ contract }: VehicleInfoSectionProps) {
  return (
    <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
      <h2 className="text-xl font-semibold text-white mb-4">Thông tin xe</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="block text-gray-300 text-sm mb-1">Biển số</label>
          <p className="text-white font-mono font-medium">{contract.bienSo}</p>
        </div>
        {contract.carBrand && (
          <div>
            <label className="block text-gray-300 text-sm mb-1">Thương hiệu xe</label>
            <p className="text-white">{contract.carBrand}</p>
          </div>
        )}
        {contract.carModel && (
          <div>
            <label className="block text-gray-300 text-sm mb-1">Dòng xe</label>
            <p className="text-white">{contract.carModel}</p>
          </div>
        )}
        {contract.carBodyStyle && (
          <div>
            <label className="block text-gray-300 text-sm mb-1">Kiểu dáng</label>
            <p className="text-white">{contract.carBodyStyle}</p>
          </div>
        )}
        <div>
          <label className="block text-gray-300 text-sm mb-1">Số khung</label>
          <p className="text-white font-mono text-sm">{contract.soKhung}</p>
        </div>
        <div>
          <label className="block text-gray-300 text-sm mb-1">Số máy</label>
          <p className="text-white font-mono text-sm">{contract.soMay}</p>
        </div>
        <div>
          <label className="block text-gray-300 text-sm mb-1">ĐKLĐ</label>
          <p className="text-white">{contract.ngayDKLD}</p>
        </div>
        <div>
          <label className="block text-gray-300 text-sm mb-1">Năm SX</label>
          <p className="text-white">{contract.namSanXuat}</p>
        </div>
        {contract.carYear && contract.carYear !== contract.namSanXuat && (
          <div>
            <label className="block text-gray-300 text-sm mb-1">Năm xe (hệ thống)</label>
            <p className="text-white">{contract.carYear}</p>
          </div>
        )}
        <div>
          <label className="block text-gray-300 text-sm mb-1">Số chỗ ngồi</label>
          <p className="text-white">{contract.soChoNgoi}</p>
        </div>
        {contract.trongTai && (
          <div>
            <label className="block text-gray-300 text-sm mb-1">Trọng tải (kg)</label>
            <p className="text-white">{contract.trongTai.toLocaleString()}</p>
          </div>
        )}
        <div className="md:col-span-2">
          <label className="block text-gray-300 text-sm mb-1">Giá trị xe</label>
          <p className="text-white font-medium">{formatCurrency(contract.giaTriXe)}</p>
        </div>
        {contract.loaiDongCo && (
          <div>
            <label className="block text-gray-300 text-sm mb-1">Loại động cơ</label>
            <p className="text-white">{getEngineTypeText(contract.loaiDongCo)}</p>
          </div>
        )}
        {contract.giaTriPin && (
          <div>
            <label className="block text-gray-300 text-sm mb-1">Giá trị pin</label>
            <p className="text-white font-medium">{formatCurrency(contract.giaTriPin)}</p>
          </div>
        )}
        {contract.giaTriPin && isElectricOrHybridEngine(contract.loaiDongCo) && (
          <div className="md:col-span-2">
            <label className="block text-gray-300 text-sm mb-1">Tổng giá trị (xe + pin)</label>
            <p className="text-green-400 font-bold">{formatCurrency(calculateTotalVehicleValue(contract.giaTriXe, contract.giaTriPin, contract.loaiDongCo))}</p>
          </div>
        )}
        <div className="md:col-span-3">
          <label className="block text-gray-300 text-sm mb-1">Mục đích sử dụng</label>
          <p className="text-white">{getVehicleTypeText(contract.loaiHinhKinhDoanh)}</p>
        </div>
      </div>
    </div>
  );
}