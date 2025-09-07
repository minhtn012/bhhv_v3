import { JWTPayload } from '@/lib/jwt';

// User fixtures
export const mockUsers = {
  admin: {
    userId: '6507f1f77bcf86cd799439b1',
    username: 'admin',
    email: 'admin@test.com',
    role: 'admin' as const,
  } as JWTPayload,
  
  user: {
    userId: '6507f1f77bcf86cd799439b2',
    username: 'testuser',
    email: 'user@test.com',
    role: 'user' as const,
  } as JWTPayload,
};

// Contract fixtures
export const mockContractData = {
  basic: {
    chuXe: 'Nguyễn Văn A',
    diaChi: '123 Đường ABC, Quận 1, TP.HCM',
    buyerEmail: 'nguyenvana@example.com',
    buyerPhone: '0901234567',
    buyerGender: 'nam' as const,
    buyerCitizenId: '123456789012',
    selectedProvince: '79',
    selectedProvinceText: 'TP Hồ Chí Minh',
    selectedDistrictWard: '760',
    selectedDistrictWardText: 'Quận 1',
    specificAddress: '123 Đường ABC',
    bienSo: '51A-123.45',
    soKhung: 'ABC123456789',
    soMay: 'DEF987654321',
    ngayDKLD: '15/06/2020',
    namSanXuat: 2019,
    soChoNgoi: 5,
    trongTai: 0,
    giaTriXe: '800000000',
    loaiHinhKinhDoanh: 'khong_kd_cho_nguoi',
  },
  
  commercial: {
    chuXe: 'Công ty TNHH ABC',
    diaChi: '456 Đường XYZ, Quận 2, TP.HCM',
    buyerEmail: 'company@example.com',
    buyerPhone: '0987654321',
    buyerGender: 'khac' as const,
    buyerCitizenId: '987654321098',
    selectedProvince: '79',
    selectedProvinceText: 'TP Hồ Chí Minh',
    selectedDistrictWard: '763',
    selectedDistrictWardText: 'Quận 2',
    specificAddress: '456 Đường XYZ',
    bienSo: '51B-678.90',
    soKhung: 'XYZ789012345',
    soMay: 'UVW567890123',
    ngayDKLD: '10/03/2021',
    namSanXuat: 2021,
    soChoNgoi: 7,
    trongTai: 0,
    giaTriXe: '1200000000',
    loaiHinhKinhDoanh: 'kd_grab_be',
  },
  
  truck: {
    chuXe: 'Nguyễn Văn B',
    diaChi: '789 Đường PQR, Quận 3, TP.HCM',
    buyerEmail: 'truck@example.com',
    buyerPhone: '0912345678',
    buyerGender: 'nam' as const,
    buyerCitizenId: '456789012345',
    selectedProvince: '79',
    selectedProvinceText: 'TP Hồ Chí Minh',
    selectedDistrictWard: '764',
    selectedDistrictWardText: 'Quận 3',
    specificAddress: '789 Đường PQR',
    bienSo: '51C-111.22',
    soKhung: 'TRK123456789',
    soMay: 'ENG987654321',
    ngayDKLD: '20/08/2018',
    namSanXuat: 2018,
    soChoNgoi: 3,
    trongTai: 5000, // 5 tấn
    giaTriXe: '600000000',
    loaiHinhKinhDoanh: 'kd_cho_hang',
  },
};

// Car selection fixtures
export const mockCarData = {
  toyota: {
    selectedBrand: 'Toyota',
    selectedModel: 'Vios',
    selectedBodyStyle: 'Sedan',
    selectedYear: '2019',
  },
  
  honda: {
    selectedBrand: 'Honda',
    selectedModel: 'City',
    selectedBodyStyle: 'Sedan',
    selectedYear: '2021',
  },
  
  truck: {
    selectedBrand: 'Hyundai',
    selectedModel: 'HD120SL',
    selectedBodyStyle: 'Truck',
    selectedYear: '2018',
  },
};

// Insurance calculation test cases
export const insuranceTestCases = [
  {
    name: 'Xe gia đình dưới 500tr, xe mới (<3 năm)',
    input: {
      giaTriXe: 400_000_000,
      namSanXuat: new Date().getFullYear() - 1,
      soChoNgoi: 5,
      loaiHinhKinhDoanh: 'khong_kd_cho_nguoi',
    },
    expected: {
      ageGroup: 'age_under_3',
      priceGroup: 'duoi_500tr',
      tndsKey: 'duoi_6_cho_khong_kd',
      mucKhauTru: 500000, // 500K cho xe không kinh doanh
    },
  },
  
  {
    name: 'Xe gia đình 500-700tr, xe 4 năm tuổi',
    input: {
      giaTriXe: 600_000_000,
      namSanXuat: new Date().getFullYear() - 4,
      soChoNgoi: 5,
      loaiHinhKinhDoanh: 'khong_kd_cho_nguoi',
    },
    expected: {
      ageGroup: 'age_3_to_6',
      priceGroup: 'tu_500_den_700tr',
      tndsKey: 'duoi_6_cho_khong_kd',
      mucKhauTru: 500000,
    },
  },
  
  {
    name: 'Xe gia đình trên 1 tỷ, xe cũ (>10 năm)',
    input: {
      giaTriXe: 1_200_000_000,
      namSanXuat: new Date().getFullYear() - 12,
      soChoNgoi: 5,
      loaiHinhKinhDoanh: 'khong_kd_cho_nguoi',
    },
    expected: {
      ageGroup: 'age_over_10',
      priceGroup: 'tren_1ty',
      tndsKey: 'duoi_6_cho_khong_kd',
      mucKhauTru: 500000,
      hasNullAU009: true, // Xe >10 năm không có AU009
    },
  },
  
  {
    name: 'Xe Grab/Be kinh doanh, xe mới',
    input: {
      giaTriXe: 700_000_000,
      namSanXuat: new Date().getFullYear() - 2,
      soChoNgoi: 5,
      loaiHinhKinhDoanh: 'kd_grab_be',
    },
    expected: {
      ageGroup: 'age_under_3',
      tndsKey: 'duoi_6_cho_kd',
      mucKhauTru: 1000000, // 1M cho xe kinh doanh
    },
  },
  
  {
    name: 'Xe tải kinh doanh, 5 tấn',
    input: {
      giaTriXe: 800_000_000,
      namSanXuat: new Date().getFullYear() - 3,
      soChoNgoi: 3,
      loaiHinhKinhDoanh: 'kd_cho_hang',
      trongTai: 5000, // 5 tấn
    },
    expected: {
      ageGroup: 'age_3_to_6',
      tndsKey: 'tai_3_den_8_tan',
      mucKhauTru: 1000000,
    },
  },
];

// Form validation test cases
export const validationTestCases = {
  email: [
    { value: 'test@example.com', valid: true },
    { value: 'invalid-email', valid: false },
    { value: '', valid: false },
    { value: 'test@', valid: false },
    { value: '@example.com', valid: false },
  ],
  
  phone: [
    { value: '0901234567', valid: true },
    { value: '0312345678', valid: true },
    { value: '0987654321', valid: true },
    { value: '123456789', valid: false }, // Too short
    { value: '01234567890', valid: false }, // Wrong prefix
    { value: '0201234567', valid: false }, // Invalid prefix
    { value: '', valid: false },
  ],
  
  citizenId: [
    { value: '123456789012', valid: true },
    { value: '98765432109', valid: false }, // Too short
    { value: '1234567890123', valid: false }, // Too long
    { value: 'abcd56789012', valid: false }, // Contains letters
    { value: '', valid: false },
  ],
  
  price: [
    { value: '500000000', valid: true },
    { value: '500,000,000', valid: true },
    { value: '0', valid: false },
    { value: 'abc', valid: false },
    { value: '', valid: false },
  ],
  
  year: [
    { value: 2020, valid: true },
    { value: 1980, valid: true },
    { value: 2024, valid: true }, // Use specific year instead of dynamic
    { value: 1979, valid: false }, // Too old
    { value: 2026, valid: false }, // Future
    { value: 0, valid: false },
  ],
};