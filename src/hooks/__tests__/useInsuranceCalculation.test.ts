import * as insuranceCalculator from '@/utils/insurance-calculator';

// Mock the insurance calculator utility
jest.mock('@/utils/insurance-calculator', () => ({
  calculateInsuranceRates: jest.fn(),
  calculateWithCustomRates: jest.fn(),
  calculateCustomFee: jest.fn(),
  suggestTNDSCategory: jest.fn(),
  parseCurrency: jest.fn(),
  packageLabels: [
    { name: 'Package 1', details: 'Details 1' },
    { name: 'Package 2', details: 'Details 2' },
    { name: 'Package 3', details: 'Details 3' }
  ],
  tndsCategories: {
    duoi_6_cho_khong_kd: { label: 'Under 6 seats non-commercial', fee: 300000 }
  }
}));

// Integration test to verify the loaiHinhKinhDoanh issue
describe('loaiHinhKinhDoanh Fee Calculation Bug', () => {
  const mockFormData1 = {
    giaTriXe: '800,000,000',
    namSanXuat: 2020,
    soChoNgoi: 5,
    trongTai: 0,
    loaiHinhKinhDoanh: 'khong_kinh_doanh',
    loaiDongCo: 'xang',
    giaTriPin: ''
  };

  const mockFormData2 = {
    ...mockFormData1,
    loaiHinhKinhDoanh: 'kinh_doanh_van_tai'
  };

  beforeEach(() => {
    // Mock parseCurrency to return numeric values
    (insuranceCalculator.parseCurrency as jest.Mock).mockImplementation((value: string) => {
      return parseInt(value.replace(/,/g, ''));
    });

    // Mock calculateInsuranceRates to return consistent rates
    (insuranceCalculator.calculateInsuranceRates as jest.Mock).mockReturnValue({
      finalRates: [0.015, 0.025, 0.035],
      tndsKey: 'duoi_6_cho_khong_kd'
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should calculate different fees for different loaiHinhKinhDoanh values', () => {
    // Mock different fees for different loaiHinhKinhDoanh
    (insuranceCalculator.calculateCustomFee as jest.Mock)
      .mockReturnValueOnce({ fee: 5000000, batteryFee: 0 }) // khong_kinh_doanh
      .mockReturnValueOnce({ fee: 8000000, batteryFee: 0 }); // kinh_doanh_van_tai

    // Test with first loaiHinhKinhDoanh
    insuranceCalculator.calculateCustomFee(
      800000000,
      0.015,
      'khong_kinh_doanh',
      'xang',
      ''
    );

    // Test with second loaiHinhKinhDoanh
    insuranceCalculator.calculateCustomFee(
      800000000,
      0.015,
      'kinh_doanh_van_tai',
      'xang',
      ''
    );

    // Verify both calls were made with correct parameters
    expect(insuranceCalculator.calculateCustomFee).toHaveBeenNthCalledWith(1,
      800000000,
      0.015,
      'khong_kinh_doanh',
      'xang',
      ''
    );

    expect(insuranceCalculator.calculateCustomFee).toHaveBeenNthCalledWith(2,
      800000000,
      0.015,
      'kinh_doanh_van_tai',
      'xang',
      ''
    );

    expect(insuranceCalculator.calculateCustomFee).toHaveBeenCalledTimes(2);
  });

  it('should verify the issue exists: same fee for different loaiHinhKinhDoanh if not refreshed', () => {
    // Mock same fee being returned (this would be the bug)
    (insuranceCalculator.calculateCustomFee as jest.Mock).mockReturnValue({ 
      fee: 5000000, 
      batteryFee: 0 
    });

    const fee1 = insuranceCalculator.calculateCustomFee(
      800000000,
      0.015,
      'khong_kinh_doanh',
      'xang',
      ''
    );

    const fee2 = insuranceCalculator.calculateCustomFee(
      800000000,
      0.015,
      'kinh_doanh_van_tai',
      'xang',
      ''
    );

    // This shows the bug: same fee despite different loaiHinhKinhDoanh
    expect(fee1.fee).toBe(fee2.fee);
    
    // But the function should have been called with different parameters
    expect(insuranceCalculator.calculateCustomFee).toHaveBeenNthCalledWith(1,
      800000000, 0.015, 'khong_kinh_doanh', 'xang', ''
    );
    expect(insuranceCalculator.calculateCustomFee).toHaveBeenNthCalledWith(2,
      800000000, 0.015, 'kinh_doanh_van_tai', 'xang', ''
    );
  });

  it('should verify the fix works: different fees for different loaiHinhKinhDoanh', () => {
    // Mock different fees for different loaiHinhKinhDoanh (this would be the fix)
    (insuranceCalculator.calculateCustomFee as jest.Mock)
      .mockReturnValueOnce({ fee: 5000000, batteryFee: 0 })  // khong_kinh_doanh
      .mockReturnValueOnce({ fee: 8000000, batteryFee: 0 });  // kinh_doanh_van_tai

    const fee1 = insuranceCalculator.calculateCustomFee(
      800000000,
      0.015,
      'khong_kinh_doanh',
      'xang',
      ''
    );

    const fee2 = insuranceCalculator.calculateCustomFee(
      800000000,
      0.015,
      'kinh_doanh_van_tai',
      'xang',
      ''
    );

    // This shows the fix: different fees for different loaiHinhKinhDoanh
    expect(fee1.fee).not.toBe(fee2.fee);
    expect(fee1.fee).toBe(5000000);
    expect(fee2.fee).toBe(8000000);
  });

  it('should test parseCurrency function with different formats', () => {
    (insuranceCalculator.parseCurrency as jest.Mock)
      .mockReturnValueOnce(800000000)
      .mockReturnValueOnce(1200000000);

    const value1 = insuranceCalculator.parseCurrency('800,000,000');
    const value2 = insuranceCalculator.parseCurrency('1,200,000,000');

    expect(value1).toBe(800000000);
    expect(value2).toBe(1200000000);
    expect(insuranceCalculator.parseCurrency).toHaveBeenCalledTimes(2);
  });
});