/**
 * Contract Validation Schema (Zod)
 *
 * API-level validation for contract creation and updates.
 * Provides type-safe runtime validation and better error messages.
 */

import { z } from 'zod';

/**
 * Business usage type enum (loaiHinhKinhDoanh)
 */
const BusinessTypeSchema = z.enum([
  'khong_kd_cho_nguoi',
  'khong_kd_cho_hang',
  'khong_kd_pickup_van',
  'kd_cho_hang',
  'kd_dau_keo',
  'kd_cho_khach_lien_tinh',
  'kd_grab_be',
  'kd_taxi_tu_lai',
  'kd_hop_dong_tren_9c',
  'kd_bus',
  'kd_pickup_van',
  'kd_chuyen_dung',
  'kd_romooc_ben',
]);

/**
 * Package information schema
 */
const VatChatPackageSchema = z.object({
  name: z.string().min(1, 'Tên gói bảo hiểm là bắt buộc'),
  rate: z.number()
    .min(0, 'Tỷ lệ phí không được âm')
    .max(10, 'Tỷ lệ phí không được vượt quá 10%'),
  tyLePhi: z.number()
    .min(0, 'Tỷ lệ phí là bắt buộc')
    .max(10, 'Tỷ lệ phí không được vượt quá 10%'),
  customRate: z.number()
    .min(0.1, 'Tỷ lệ tùy chỉnh phải từ 0.1%')
    .max(10, 'Tỷ lệ tùy chỉnh không được vượt quá 10%')
    .optional(),
  isCustomRate: z.boolean().optional(),
  phiVatChatGoc: z.number()
    .min(0, 'Phí vật chất gốc không được âm')
    .optional(),
  phiVatChat: z.number()
    .min(0, 'Phí vật chất không được âm'),
  taiTucPercentage: z.number()
    .min(-100, 'Tỷ lệ tái tục không được nhỏ hơn -100%')
    .max(100, 'Tỷ lệ tái tục không được lớn hơn 100%')
    .optional(),
  dkbs: z.array(z.string()),
});

/**
 * Contract creation/update validation schema
 */
export const ContractSchema = z.object({
  // Customer information
  chuXe: z.string()
    .min(1, 'Tên chủ xe là bắt buộc')
    .max(200, 'Tên chủ xe không được vượt quá 200 ký tự'),

  diaChi: z.string()
    .min(1, 'Địa chỉ là bắt buộc')
    .max(500, 'Địa chỉ không được vượt quá 500 ký tự'),

  // Buyer information (optional fields - transform empty strings to undefined)
  buyerEmail: z.string()
    .transform((val) => val === '' ? undefined : val)
    .pipe(z.string().email('Email không hợp lệ').optional()),

  buyerPhone: z.string()
    .transform((val) => val === '' ? undefined : val)
    .pipe(z.string()
      .regex(/^(0[3-9])[0-9]{8}$/, 'Số điện thoại phải có 10 chữ số')
      .optional()),

  buyerCitizenId: z.string()
    .transform((val) => val === '' ? undefined : val)
    .pipe(z.string()
      .regex(/^[0-9]{12}$/, 'CCCD phải có đúng 12 chữ số')
      .optional()),

  selectedProvince: z.string()
    .transform((val) => val === '' ? undefined : val)
    .optional(),
  selectedProvinceText: z.string()
    .transform((val) => val === '' ? undefined : val)
    .optional(),
  selectedDistrictWard: z.string()
    .transform((val) => val === '' ? undefined : val)
    .optional(),
  selectedDistrictWardText: z.string()
    .transform((val) => val === '' ? undefined : val)
    .optional(),
  specificAddress: z.string()
    .transform((val) => val === '' ? undefined : val)
    .optional(),

  // New address (current address if different from registration)
  newSelectedProvince: z.string()
    .transform((val) => val === '' ? undefined : val)
    .optional(),
  newSelectedProvinceText: z.string()
    .transform((val) => val === '' ? undefined : val)
    .optional(),
  newSelectedDistrictWard: z.string()
    .transform((val) => val === '' ? undefined : val)
    .optional(),
  newSelectedDistrictWardText: z.string()
    .transform((val) => val === '' ? undefined : val)
    .optional(),
  newSpecificAddress: z.string()
    .transform((val) => val === '' ? undefined : val)
    .optional(),

  // Vehicle information
  bienSo: z.string()
    .min(1, 'Biển số xe là bắt buộc')
    .max(20, 'Biển số xe không được vượt quá 20 ký tự')
    .transform(val => val.toUpperCase()),

  nhanHieu: z.string()
    .min(1, 'Nhãn hiệu xe là bắt buộc')
    .max(100, 'Nhãn hiệu xe không được vượt quá 100 ký tự'),

  soLoai: z.string()
    .min(1, 'Số loại xe là bắt buộc')
    .max(100, 'Số loại xe không được vượt quá 100 ký tự'),

  soKhung: z.string()
    .min(1, 'Số khung là bắt buộc')
    .max(50, 'Số khung không được vượt quá 50 ký tự'),

  soMay: z.string()
    .min(1, 'Số máy là bắt buộc')
    .max(50, 'Số máy không được vượt quá 50 ký tự'),

  ngayDKLD: z.string()
    .regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Ngày đăng ký lần đầu phải có định dạng dd/mm/yyyy'),

  namSanXuat: z.number()
    .int('Năm sản xuất phải là số nguyên')
    .min(1980, 'Năm sản xuất phải từ 1980 trở lên')
    .max(new Date().getFullYear() + 1, `Năm sản xuất không được lớn hơn ${new Date().getFullYear() + 1}`),

  soChoNgoi: z.number()
    .int('Số chỗ ngồi phải là số nguyên')
    .min(1, 'Số chỗ ngồi phải lớn hơn 0')
    .max(64, 'Số chỗ ngồi không được lớn hơn 64'),

  trongTai: z.number()
    .min(0, 'Trọng tải không được âm')
    .optional(),

  giaTriXe: z.number()
    .min(1000000, 'Giá trị xe phải lớn hơn 1,000,000 VNĐ')
    .max(50000000000, 'Giá trị xe không được vượt quá 50 tỷ VNĐ'),

  loaiHinhKinhDoanh: BusinessTypeSchema,

  loaiDongCo: z.string()
    .min(1, 'Loại động cơ là bắt buộc'),

  giaTriPin: z.number()
    .min(0, 'Giá trị pin không được âm')
    .optional(),

  loaiXe: z.string().optional(),

  // Car selection details (optional)
  carBrand: z.string().optional(),
  carModel: z.string().optional(),
  carBodyStyle: z.string().optional(),
  carYear: z.string().optional(),

  // Package and insurance
  vatChatPackage: VatChatPackageSchema,

  includeTNDS: z.boolean(),

  tndsCategory: z.string().optional(),

  phiTNDS: z.number()
    .min(0, 'Phí TNDS không được âm'),

  includeNNTX: z.boolean(),

  selectedNNTXPackage: z.string().optional(),

  phiNNTX: z.number()
    .min(0, 'Phí NNTX không được âm'),

  phiPin: z.number()
    .min(0, 'Phí pin không được âm')
    .optional()
    .default(0),

  mucKhauTru: z.number()
    .min(0, 'Mức khấu trừ không được âm'),

  taiTucPercentage: z.number()
    .min(-100, 'Tỷ lệ tái tục không được nhỏ hơn -100%')
    .max(100, 'Tỷ lệ tái tục không được lớn hơn 100%')
    .optional()
    .default(0),

  phiTaiTuc: z.number()
    .min(0, 'Phí tái tục không được âm')
    .optional()
    .default(0),

  phiTaiTucInfo: z.object({
    soVu: z.number()
      .int('Số vụ phải là số nguyên')
      .min(0, 'Số vụ không được âm'),
    phanTramChiPhi: z.number()
      .min(0, '% chi phí không được âm')
  }).optional(),

  phiTruocKhiGiam: z.number()
    .min(0, 'Tổng phí trước giảm không được âm')
    .optional(),

  phiSauKhiGiam: z.number()
    .min(0, 'Tổng phí sau giảm không được âm')
    .optional(),

  tongPhi: z.number()
    .min(0, 'Tổng phí không được âm'),
})
  // Custom validation: TNDS category required if includeTNDS is true
  .refine(
    (data) => {
      if (data.includeTNDS && !data.tndsCategory) {
        return false;
      }
      return true;
    },
    {
      message: 'Vui lòng chọn loại TNDS khi bao gồm bảo hiểm TNDS',
      path: ['tndsCategory'],
    }
  )
  // Custom validation: phiSauKhiGiam should not exceed phiTruocKhiGiam
  .refine(
    (data) => {
      if (data.phiTruocKhiGiam && data.phiSauKhiGiam) {
        return data.phiSauKhiGiam <= data.phiTruocKhiGiam;
      }
      return true;
    },
    {
      message: 'Phí sau giảm không được lớn hơn phí trước giảm',
      path: ['phiSauKhiGiam'],
    }
  )
  // Custom validation: Battery value required for EV/Hybrid
  .refine(
    (data) => {
      const isElectric = data.loaiDongCo &&
        (data.loaiDongCo.toLowerCase().includes('hybrid') ||
         data.loaiDongCo.toLowerCase().includes('dien') ||
         data.loaiDongCo.toLowerCase().includes('điện'));

      if (isElectric && (!data.giaTriPin || data.giaTriPin <= 0)) {
        return false;
      }
      return true;
    },
    {
      message: 'Giá trị pin là bắt buộc cho xe hybrid/điện',
      path: ['giaTriPin'],
    }
  )
  // Custom validation: trongTai required for cargo vehicles
  .refine(
    (data) => {
      const requiresTrongTai = data.loaiHinhKinhDoanh &&
        (data.loaiHinhKinhDoanh.includes('cho_hang') ||
         data.loaiHinhKinhDoanh.includes('dau_keo'));

      if (requiresTrongTai && (!data.trongTai || data.trongTai <= 0)) {
        return false;
      }
      return true;
    },
    {
      message: 'Trọng tải là bắt buộc cho xe tải/đầu kéo',
      path: ['trongTai'],
    }
  );

/**
 * Type inference from schema
 */
export type ContractInput = z.infer<typeof ContractSchema>;

/**
 * Validate contract data and return typed result
 *
 * @param data - Data to validate
 * @returns Validation result with parsed data or errors
 */
export function validateContract(data: unknown): {
  success: boolean;
  data?: ContractInput;
  errors?: Array<{ path: string; message: string }>;
} {
  const result = ContractSchema.safeParse(data);

  if (result.success) {
    return {
      success: true,
      data: result.data,
    };
  }

  // Format Zod errors into user-friendly format
  const errors = result.error.issues.map((err) => ({
    path: err.path.join('.'),
    message: err.message,
  }));

  return {
    success: false,
    errors,
  };
}