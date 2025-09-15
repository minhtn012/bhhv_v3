/**
 * Centralized mapping for vehicle type (loaiHinhKinhDoanh) values to display text
 */

export const vehicleTypeMapping: { [key: string]: string } = {
  'khong_kd_cho_nguoi': 'Xe chở người (xe gia đình)',
  'khong_kd_cho_hang': 'Xe chở hàng (không kinh doanh vận tải)',
  'khong_kd_pickup_van': 'Xe bán tải / Van (không kinh doanh)',
  'kd_cho_hang': 'Xe tải kinh doanh',
  'kd_dau_keo': 'Xe đầu kéo',
  'kd_cho_khach_lien_tinh': 'Xe khách liên tỉnh, nội tỉnh',
  'kd_grab_be': 'Grab, Be, taxi công nghệ (< 9 chỗ)',
  'kd_taxi_tu_lai': 'Taxi, xe cho thuê tự lái',
  'kd_hop_dong_tren_9c': 'Xe khách hợp đồng (> 9 chỗ)',
  'kd_bus': 'Xe bus',
  'kd_pickup_van': 'Xe bán tải / Van (kinh doanh)',
  'kd_chuyen_dung': 'Xe chuyên dùng khác (xe cứu thương...)'
};

/**
 * Get display text for vehicle type
 * @param vehicleType - The vehicle type key
 * @returns The display text for the vehicle type, or the original value if not found
 */
export const getVehicleTypeText = (vehicleType: string): string => {
  return vehicleTypeMapping[vehicleType] || vehicleType;
};