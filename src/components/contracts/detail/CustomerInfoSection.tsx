interface Contract {
  chuXe: string;
  diaChi: string;
  buyerEmail?: string;
  buyerPhone?: string;
  buyerCitizenId?: string;
  selectedProvince?: string;
  selectedProvinceText?: string;
  selectedDistrictWard?: string;
  selectedDistrictWardText?: string;
  specificAddress?: string;
  newSelectedProvince?: string;
  newSelectedProvinceText?: string;
  newSelectedDistrictWard?: string;
  newSelectedDistrictWardText?: string;
  newSpecificAddress?: string;
  ngayBatDauBaoHiem?: string;
  ngayKetThucBaoHiem?: string;
}

interface CustomerInfoSectionProps {
  contract: Contract;
}

export default function CustomerInfoSection({ contract }: CustomerInfoSectionProps) {
  return (
    <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
      <h2 className="text-xl font-semibold text-white mb-4">Thông tin khách hàng</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="block text-gray-300 text-sm mb-1">Chủ xe</label>
          <p className="text-white font-medium">{contract.chuXe}</p>
        </div>
        {contract.buyerEmail && (
          <div>
            <label className="block text-gray-300 text-sm mb-1">Email</label>
            <p className="text-white">{contract.buyerEmail}</p>
          </div>
        )}
        {contract.buyerPhone && (
          <div>
            <label className="block text-gray-300 text-sm mb-1">Số điện thoại</label>
            <p className="text-white">{contract.buyerPhone}</p>
          </div>
        )}
        {contract.buyerCitizenId && (
          <div>
            <label className="block text-gray-300 text-sm mb-1">Số CCCD</label>
            <p className="text-white font-mono">{contract.buyerCitizenId}</p>
          </div>
        )}
        {contract.selectedProvinceText && (
          <div>
            <label className="block text-gray-300 text-sm mb-1">Tỉnh/Thành phố</label>
            <p className="text-white">{contract.selectedProvinceText}</p>
          </div>
        )}
        {contract.selectedDistrictWardText && (
          <div>
            <label className="block text-gray-300 text-sm mb-1">Quận/Huyện</label>
            <p className="text-white">{contract.selectedDistrictWardText}</p>
          </div>
        )}
        {contract.specificAddress && (
          <div className="md:col-span-2 lg:col-span-3">
            <label className="block text-gray-300 text-sm mb-1">Địa chỉ cụ thể</label>
            <p className="text-white">{contract.specificAddress}</p>
          </div>
        )}
        <div className="md:col-span-2 lg:col-span-3">
          <label className="block text-gray-300 text-sm mb-1">Địa chỉ gốc (từ đăng ký xe)</label>
          <p className="text-white">{contract.diaChi}</p>
        </div>
        {contract.newSelectedProvinceText && (
          <>
            <div className="md:col-span-2 lg:col-span-3 border-t border-white/10 pt-4 mt-2">
              <label className="block text-gray-300 text-sm mb-3 font-semibold">Địa chỉ mới</label>
            </div>
            <div>
              <label className="block text-gray-300 text-sm mb-1">Tỉnh/Thành phố</label>
              <p className="text-white">{contract.newSelectedProvinceText}</p>
            </div>
            {contract.newSelectedDistrictWardText && (
              <div>
                <label className="block text-gray-300 text-sm mb-1">Quận/Huyện</label>
                <p className="text-white">{contract.newSelectedDistrictWardText}</p>
              </div>
            )}
            {contract.newSpecificAddress && (
              <div className="md:col-span-2 lg:col-span-3">
                <label className="block text-gray-300 text-sm mb-1">Địa chỉ cụ thể</label>
                <p className="text-white">{contract.newSpecificAddress}</p>
              </div>
            )}
          </>
        )}
        {contract.ngayBatDauBaoHiem && (
          <div>
            <label className="block text-gray-300 text-sm mb-1">Ngày bắt đầu bảo hiểm</label>
            <p className="text-white font-medium">{contract.ngayBatDauBaoHiem}</p>
          </div>
        )}
        {contract.ngayKetThucBaoHiem && (
          <div>
            <label className="block text-gray-300 text-sm mb-1">Ngày kết thúc bảo hiểm</label>
            <p className="text-white font-medium">{contract.ngayKetThucBaoHiem}</p>
          </div>
        )}
      </div>
    </div>
  );
}