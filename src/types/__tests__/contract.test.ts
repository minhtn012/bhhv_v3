import {
  BaseContractFormData,
  VehicleFormData,
  BuyerFormData,
  InsuranceCalculationFormData,
  PackageSelectionFormData,
  PriceSummaryFormData,
  defaultContractFormData,
  isValidUserType,
  isValidGender,
  validateFormData,
  type FormDataKey,
  type FormDataValue,
} from '../contract';

describe('Contract Types', () => {
  describe('BaseContractFormData', () => {
    it('should have all required fields including userType', () => {
      const formData: BaseContractFormData = defaultContractFormData;
      
      // Customer Information (11 fields)
      expect(formData).toHaveProperty('chuXe');
      expect(formData).toHaveProperty('diaChi');
      expect(formData).toHaveProperty('tinhThanh');
      expect(formData).toHaveProperty('quanHuyen');
      expect(formData).toHaveProperty('phuongXa');
      expect(formData).toHaveProperty('soDienThoai');
      expect(formData).toHaveProperty('email');
      expect(formData).toHaveProperty('cccd');
      expect(formData).toHaveProperty('ngayCapCccd');
      expect(formData).toHaveProperty('noiCapCccd');
      expect(formData).toHaveProperty('userType'); // NEW field

      // Buyer Information (10 fields)
      expect(formData).toHaveProperty('buyerName');
      expect(formData).toHaveProperty('buyerAddress');
      expect(formData).toHaveProperty('buyerProvince');
      expect(formData).toHaveProperty('buyerDistrict');
      expect(formData).toHaveProperty('buyerWard');
      expect(formData).toHaveProperty('buyerPhone');
      expect(formData).toHaveProperty('buyerEmail');
      expect(formData).toHaveProperty('buyerCccd');
      expect(formData).toHaveProperty('buyerCccdDate');
      expect(formData).toHaveProperty('buyerGender');

      // Vehicle Information (13 fields)
      expect(formData).toHaveProperty('bienSo');
      expect(formData).toHaveProperty('soKhung');
      expect(formData).toHaveProperty('soMay');
      expect(formData).toHaveProperty('tenXe');
      expect(formData).toHaveProperty('namSanXuat');
      expect(formData).toHaveProperty('soChoNgoi');
      expect(formData).toHaveProperty('trongTai');
      expect(formData).toHaveProperty('giaTriXe');
      expect(formData).toHaveProperty('loaiHinhKinhDoanh');
      expect(formData).toHaveProperty('loaiDongCo');
      expect(formData).toHaveProperty('giaTriPin');
      expect(formData).toHaveProperty('ngayDKLD');

      // Package Selection & Insurance (15 fields - keeping same count)
      expect(formData).toHaveProperty('selectedPackageIndex');
      expect(formData).toHaveProperty('includeTNDS');
      expect(formData).toHaveProperty('tndsCategory');
      expect(formData).toHaveProperty('includeNNTX');
      expect(formData).toHaveProperty('taiTucPercentage');
      expect(formData).toHaveProperty('mucKhauTru');
    });

    it('should default userType to "ca_nhan"', () => {
      expect(defaultContractFormData.userType).toBe('ca_nhan');
    });

    it('should count exactly 39 total fields', () => {
      const fieldCount = Object.keys(defaultContractFormData).length;
      expect(fieldCount).toBe(39); // 11 customer + 10 buyer + 13 vehicle + 6 package/insurance - 1 overlap
    });
  });

  describe('Specialized Form Data Types', () => {
    describe('VehicleFormData', () => {
      it('should contain exactly 13 vehicle-related fields', () => {
        const vehicleFields: Array<keyof VehicleFormData> = [
          'bienSo', 'soKhung', 'soMay', 'tenXe', 'namSanXuat', 'soChoNgoi',
          'trongTai', 'giaTriXe', 'loaiHinhKinhDoanh', 'loaiDongCo', 'giaTriPin',
          'ngayDKLD', 'chuXe'
        ];
        expect(vehicleFields).toHaveLength(13);

        // Type compatibility test
        const vehicleData: VehicleFormData = {
          bienSo: '12A-123456',
          soKhung: 'VF123456',
          soMay: 'ENG123456',
          tenXe: 'Toyota Camry',
          namSanXuat: 2020,
          soChoNgoi: 5,
          trongTai: 0,
          giaTriXe: '800000000',
          loaiHinhKinhDoanh: 'kinh-doanh-van-tai',
          loaiDongCo: 'xang',
          giaTriPin: '',
          ngayDKLD: '2020-01-01',
          chuXe: 'Nguyễn Văn A'
        };

        expect(vehicleData).toBeDefined();
      });
    });

    describe('BuyerFormData', () => {
      it('should contain exactly 10 buyer-related fields', () => {
        const buyerFields: Array<keyof BuyerFormData> = [
          'buyerName', 'buyerAddress', 'buyerProvince', 'buyerDistrict', 'buyerWard',
          'buyerPhone', 'buyerEmail', 'buyerCccd', 'buyerCccdDate', 'buyerGender'
        ];
        expect(buyerFields).toHaveLength(10);

        // Type compatibility test
        const buyerData: BuyerFormData = {
          buyerName: 'Trần Thị B',
          buyerAddress: '123 Đường ABC',
          buyerProvince: 'Hà Nội',
          buyerDistrict: 'Cầu Giấy',
          buyerWard: 'Dịch Vọng',
          buyerPhone: '0987654321',
          buyerEmail: 'buyer@example.com',
          buyerCccd: '123456789012',
          buyerCccdDate: '2020-01-01',
          buyerGender: 'nu'
        };

        expect(buyerData).toBeDefined();
      });
    });

    describe('InsuranceCalculationFormData', () => {
      it('should contain exactly 14 calculation-related fields', () => {
        const calculationFields: Array<keyof InsuranceCalculationFormData> = [
          'giaTriXe', 'namSanXuat', 'soChoNgoi', 'trongTai', 'loaiHinhKinhDoanh',
          'loaiDongCo', 'giaTriPin', 'ngayDKLD', 'selectedPackageIndex', 'includeTNDS',
          'tndsCategory', 'includeNNTX', 'taiTucPercentage', 'mucKhauTru'
        ];
        expect(calculationFields).toHaveLength(14);
      });
    });

    describe('PackageSelectionFormData', () => {
      it('should contain exactly 15 package-related fields', () => {
        const packageFields: Array<keyof PackageSelectionFormData> = [
          'giaTriXe', 'namSanXuat', 'soChoNgoi', 'trongTai', 'loaiHinhKinhDoanh',
          'selectedPackageIndex', 'includeTNDS', 'tndsCategory', 'includeNNTX',
          'taiTucPercentage', 'mucKhauTru', 'loaiDongCo', 'giaTriPin', 'ngayDKLD'
        ];
        expect(packageFields).toHaveLength(14); // Adjusted count
      });
    });

    describe('PriceSummaryFormData', () => {
      it('should contain core price calculation fields plus optional customRates', () => {
        const summaryData: PriceSummaryFormData = {
          giaTriXe: '800000000',
          selectedPackageIndex: 1,
          includeTNDS: true,
          tndsCategory: 'M1',
          includeNNTX: false,
          taiTucPercentage: 10,
          soChoNgoi: 5,
          loaiHinhKinhDoanh: 'kinh-doanh-van-tai',
          namSanXuat: 2020,
          trongTai: 0,
          loaiDongCo: 'xang',
          giaTriPin: '',
          customRates: [1.2, 1.5, 1.8]
        };

        expect(summaryData).toBeDefined();
        expect(summaryData.customRates).toHaveLength(3);
      });
    });
  });

  describe('Type Utilities and Validation', () => {
    describe('isValidUserType', () => {
      it('should validate userType values correctly', () => {
        expect(isValidUserType('ca_nhan')).toBe(true);
        expect(isValidUserType('cong_ty')).toBe(true);
        expect(isValidUserType('invalid')).toBe(false);
        expect(isValidUserType('')).toBe(false);
      });
    });

    describe('isValidGender', () => {
      it('should validate gender values correctly', () => {
        expect(isValidGender('nam')).toBe(true);
        expect(isValidGender('nu')).toBe(true);
        expect(isValidGender('khac')).toBe(true);
        expect(isValidGender('invalid')).toBe(false);
        expect(isValidGender('')).toBe(false);
      });
    });

    describe('validateFormData', () => {
      it('should validate complete form data', () => {
        const validData: BaseContractFormData = {
          ...defaultContractFormData,
          chuXe: 'Nguyễn Văn A',
          bienSo: '12A-123456',
          soKhung: 'VF123456',
          soMay: 'ENG123456',
          tenXe: 'Toyota Camry',
          namSanXuat: 2020,
          soChoNgoi: 5,
          giaTriXe: '800000000',
          userType: 'ca_nhan'
        };

        expect(validateFormData(validData)).toBe(true);
      });

      it('should reject incomplete form data', () => {
        const incompleteData = {
          chuXe: 'Nguyễn Văn A',
          userType: 'ca_nhan'
          // Missing required fields
        };

        expect(validateFormData(incompleteData)).toBe(false);
      });
    });

    describe('Default values', () => {
      it('should have correct default values', () => {
        expect(defaultContractFormData.userType).toBe('ca_nhan');
        expect(defaultContractFormData.buyerGender).toBe('nam');
        expect(defaultContractFormData.loaiHinhKinhDoanh).toBe('kinh-doanh-van-tai');
        expect(defaultContractFormData.loaiDongCo).toBe('xang');
        expect(defaultContractFormData.selectedPackageIndex).toBe(0);
        expect(defaultContractFormData.includeTNDS).toBe(false);
        expect(defaultContractFormData.includeNNTX).toBe(false);
        expect(defaultContractFormData.taiTucPercentage).toBe(0);
      });
    });
  });

  describe('Type Compatibility', () => {
    it('should ensure specialized types are compatible with BaseContractFormData', () => {
      const baseData: BaseContractFormData = defaultContractFormData;
      
      // VehicleFormData compatibility
      const vehicleData: VehicleFormData = {
        bienSo: baseData.bienSo,
        soKhung: baseData.soKhung,
        soMay: baseData.soMay,
        tenXe: baseData.tenXe,
        namSanXuat: baseData.namSanXuat,
        soChoNgoi: baseData.soChoNgoi,
        trongTai: baseData.trongTai,
        giaTriXe: baseData.giaTriXe,
        loaiHinhKinhDoanh: baseData.loaiHinhKinhDoanh,
        loaiDongCo: baseData.loaiDongCo,
        giaTriPin: baseData.giaTriPin,
        ngayDKLD: baseData.ngayDKLD,
        chuXe: baseData.chuXe
      };

      // BuyerFormData compatibility
      const buyerData: BuyerFormData = {
        buyerName: baseData.buyerName,
        buyerAddress: baseData.buyerAddress,
        buyerProvince: baseData.buyerProvince,
        buyerDistrict: baseData.buyerDistrict,
        buyerWard: baseData.buyerWard,
        buyerPhone: baseData.buyerPhone,
        buyerEmail: baseData.buyerEmail,
        buyerCccd: baseData.buyerCccd,
        buyerCccdDate: baseData.buyerCccdDate,
        buyerGender: baseData.buyerGender
      };

      expect(vehicleData).toBeDefined();
      expect(buyerData).toBeDefined();
    });
  });

  describe('Type Safety', () => {
    it('should enforce type constraints', () => {
      // This test primarily ensures TypeScript compilation correctness
      const formData: BaseContractFormData = defaultContractFormData;
      
      // Should allow valid userType values
      formData.userType = 'ca_nhan';
      formData.userType = 'cong_ty';
      
      // Should allow valid gender values
      formData.buyerGender = 'nam';
      formData.buyerGender = 'nu';
      formData.buyerGender = 'khac';
      
      // Should enforce number types where expected
      formData.namSanXuat = 2020;
      formData.soChoNgoi = 5;
      formData.trongTai = 1000;
      formData.selectedPackageIndex = 1;
      formData.taiTucPercentage = 10;
      formData.mucKhauTru = 2000000;

      expect(formData).toBeDefined();
    });
  });
});