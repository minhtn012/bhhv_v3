import { renderHook, act } from '@testing-library/react';
import useFormValidation from '../useFormValidation';
import { validationTestCases } from '../../__tests__/test-helpers/fixtures';

describe('useFormValidation', () => {
  describe('Hook Initialization', () => {
    test('should initialize with empty field errors', () => {
      const { result } = renderHook(() => useFormValidation());
      
      expect(result.current.fieldErrors).toEqual({});
      expect(typeof result.current.validateForm).toBe('function');
      expect(typeof result.current.setFieldErrors).toBe('function');
    });
  });

  describe('Email Validation', () => {
    validationTestCases.email.forEach(({ value, valid }) => {
      test(`should ${valid ? 'accept' : 'reject'} email: "${value}"`, async () => {
        const { result } = renderHook(() => useFormValidation());
        
        const formData = {
          chuXe: 'Nguyễn Văn A',
          diaChi: '123 Đường ABC',
          buyerEmail: value,
          buyerPhone: '0901234567',
          buyerGender: 'nam' as const,
          buyerCitizenId: '123456789012',
          selectedProvince: '79',
          selectedProvinceText: 'TP.HCM',
          selectedDistrictWard: '760',
          selectedDistrictWardText: 'Quận 1',
          specificAddress: '123 ABC',
          bienSo: '51A-123.45',
          soKhung: 'ABC123',
          soMay: 'DEF456',
          ngayDKLD: '15/06/2020',
          namSanXuat: 2020,
          soChoNgoi: 5,
          trongTai: 0,
          giaTriXe: '500000000',
          loaiHinhKinhDoanh: 'khong_kd_cho_nguoi',
        };

        const carData = {
          selectedBrand: 'Toyota',
          selectedModel: 'Vios',
          selectedBodyStyle: 'Sedan',
          selectedYear: '2020',
        };

        const isValid = await act(async () => {
          return await result.current.validateForm(formData, carData);
        });

        if (valid) {
          expect(isValid).toBe(true);
          expect(result.current.fieldErrors.buyerEmail).toBeUndefined();
        } else {
          expect(isValid).toBe(false);
          expect(result.current.fieldErrors.buyerEmail).toBeDefined();
          expect(result.current.fieldErrors.buyerEmail).toContain('email');
        }
      });
    });
  });

  describe('Phone Number Validation', () => {
    validationTestCases.phone.forEach(({ value, valid }) => {
      test(`should ${valid ? 'accept' : 'reject'} phone: "${value}"`, async () => {
        const { result } = renderHook(() => useFormValidation());
        
        const formData = {
          chuXe: 'Nguyễn Văn A',
          diaChi: '123 Đường ABC',
          buyerEmail: 'test@example.com',
          buyerPhone: value,
          buyerGender: 'nam' as const,
          buyerCitizenId: '123456789012',
          selectedProvince: '79',
          selectedProvinceText: 'TP.HCM',
          selectedDistrictWard: '760',
          selectedDistrictWardText: 'Quận 1',
          specificAddress: '123 ABC',
          bienSo: '51A-123.45',
          soKhung: 'ABC123',
          soMay: 'DEF456',
          ngayDKLD: '15/06/2020',
          namSanXuat: 2020,
          soChoNgoi: 5,
          trongTai: 0,
          giaTriXe: '500000000',
          loaiHinhKinhDoanh: 'khong_kd_cho_nguoi',
        };

        const carData = {
          selectedBrand: 'Toyota',
          selectedModel: 'Vios',
          selectedBodyStyle: 'Sedan',
          selectedYear: '2020',
        };

        const isValid = await act(async () => {
          return await result.current.validateForm(formData, carData);
        });

        if (valid) {
          expect(isValid).toBe(true);
          expect(result.current.fieldErrors.buyerPhone).toBeUndefined();
        } else {
          expect(isValid).toBe(false);
          expect(result.current.fieldErrors.buyerPhone).toBeDefined();
          expect(result.current.fieldErrors.buyerPhone).toMatch(/số điện thoại|chữ số/i);
        }
      });
    });
  });

  describe('Citizen ID Validation', () => {
    validationTestCases.citizenId.forEach(({ value, valid }) => {
      test(`should ${valid ? 'accept' : 'reject'} citizen ID: "${value}"`, async () => {
        const { result } = renderHook(() => useFormValidation());
        
        const formData = {
          chuXe: 'Nguyễn Văn A',
          diaChi: '123 Đường ABC',
          buyerEmail: 'test@example.com',
          buyerPhone: '0901234567',
          buyerGender: 'nam' as const,
          buyerCitizenId: value,
          selectedProvince: '79',
          selectedProvinceText: 'TP.HCM',
          selectedDistrictWard: '760',
          selectedDistrictWardText: 'Quận 1',
          specificAddress: '123 ABC',
          bienSo: '51A-123.45',
          soKhung: 'ABC123',
          soMay: 'DEF456',
          ngayDKLD: '15/06/2020',
          namSanXuat: 2020,
          soChoNgoi: 5,
          trongTai: 0,
          giaTriXe: '500000000',
          loaiHinhKinhDoanh: 'khong_kd_cho_nguoi',
        };

        const carData = {
          selectedBrand: 'Toyota',
          selectedModel: 'Vios',
          selectedBodyStyle: 'Sedan',
          selectedYear: '2020',
        };

        const isValid = await act(async () => {
          return await result.current.validateForm(formData, carData);
        });

        if (valid) {
          expect(isValid).toBe(true);
          expect(result.current.fieldErrors.buyerCitizenId).toBeUndefined();
        } else {
          expect(isValid).toBe(false);
          expect(result.current.fieldErrors.buyerCitizenId).toBeDefined();
          expect(result.current.fieldErrors.buyerCitizenId).toMatch(/căn cước|chữ số/i);
        }
      });
    });
  });

  describe('Vehicle Price Validation', () => {
    validationTestCases.price.forEach(({ value, valid }) => {
      test(`should ${valid ? 'accept' : 'reject'} price: "${value}"`, async () => {
        const { result } = renderHook(() => useFormValidation());
        
        const formData = {
          chuXe: 'Nguyễn Văn A',
          diaChi: '123 Đường ABC',
          buyerEmail: 'test@example.com',
          buyerPhone: '0901234567',
          buyerGender: 'nam' as const,
          buyerCitizenId: '123456789012',
          selectedProvince: '79',
          selectedProvinceText: 'TP.HCM',
          selectedDistrictWard: '760',
          selectedDistrictWardText: 'Quận 1',
          specificAddress: '123 ABC',
          bienSo: '51A-123.45',
          soKhung: 'ABC123',
          soMay: 'DEF456',
          ngayDKLD: '15/06/2020',
          namSanXuat: 2020,
          soChoNgoi: 5,
          trongTai: 0,
          giaTriXe: value,
          loaiHinhKinhDoanh: 'khong_kd_cho_nguoi',
        };

        const carData = {
          selectedBrand: 'Toyota',
          selectedModel: 'Vios',
          selectedBodyStyle: 'Sedan',
          selectedYear: '2020',
        };

        const isValid = await act(async () => {
          return await result.current.validateForm(formData, carData);
        });

        if (valid) {
          expect(isValid).toBe(true);
          expect(result.current.fieldErrors.giaTriXe).toBeUndefined();
        } else {
          expect(isValid).toBe(false);
          expect(result.current.fieldErrors.giaTriXe).toBeDefined();
          expect(result.current.fieldErrors.giaTriXe).toMatch(/giá trị xe/i);
        }
      });
    });
  });

  describe('Manufacturing Year Validation', () => {
    validationTestCases.year.forEach(({ value, valid }) => {
      test(`should ${valid ? 'accept' : 'reject'} year: ${value}`, async () => {
        const { result } = renderHook(() => useFormValidation());
        
        const formData = {
          chuXe: 'Nguyễn Văn A',
          diaChi: '123 Đường ABC',
          buyerEmail: 'test@example.com',
          buyerPhone: '0901234567',
          buyerGender: 'nam' as const,
          buyerCitizenId: '123456789012',
          selectedProvince: '79',
          selectedProvinceText: 'TP.HCM',
          selectedDistrictWard: '760',
          selectedDistrictWardText: 'Quận 1',
          specificAddress: '123 ABC',
          bienSo: '51A-123.45',
          soKhung: 'ABC123',
          soMay: 'DEF456',
          ngayDKLD: `15/06/${Math.max(value, 2020)}`, // Ensure registration date is after manufacturing year
          namSanXuat: value,
          soChoNgoi: 5,
          trongTai: 0,
          giaTriXe: '500000000',
          loaiHinhKinhDoanh: 'khong_kd_cho_nguoi',
        };

        const carData = {
          selectedBrand: 'Toyota',
          selectedModel: 'Vios',
          selectedBodyStyle: 'Sedan',
          selectedYear: '2020',
        };

        const isValid = await act(async () => {
          return await result.current.validateForm(formData, carData);
        });

        if (valid) {
          expect(isValid).toBe(true);
          expect(result.current.fieldErrors.namSanXuat).toBeUndefined();
        } else {
          expect(isValid).toBe(false);
          expect(result.current.fieldErrors.namSanXuat).toBeDefined();
          expect(result.current.fieldErrors.namSanXuat).toMatch(/năm sản xuất/i);
        }
      });
    });
  });

  describe('Date Validation', () => {
    test('should validate date format correctly', async () => {
      const { result } = renderHook(() => useFormValidation());
      
      const formData = {
        chuXe: 'Nguyễn Văn A',
        diaChi: '123 Đường ABC',
        buyerEmail: 'test@example.com',
        buyerPhone: '0901234567',
        buyerGender: 'nam' as const,
        buyerCitizenId: '123456789012',
        selectedProvince: '79',
        selectedProvinceText: 'TP.HCM',
        selectedDistrictWard: '760',
        selectedDistrictWardText: 'Quận 1',
        specificAddress: '123 ABC',
        bienSo: '51A-123.45',
        soKhung: 'ABC123',
        soMay: 'DEF456',
        ngayDKLD: 'invalid-date',
        namSanXuat: 2020,
        soChoNgoi: 5,
        trongTai: 0,
        giaTriXe: '500000000',
        loaiHinhKinhDoanh: 'khong_kd_cho_nguoi',
      };

      const carData = {
        selectedBrand: 'Toyota',
        selectedModel: 'Vios',
        selectedBodyStyle: 'Sedan',
        selectedYear: '2020',
      };

      const isValid = await act(async () => {
        return await result.current.validateForm(formData, carData);
      });

      expect(isValid).toBe(false);
      expect(result.current.fieldErrors.ngayDKLD).toBeDefined();
      expect(result.current.fieldErrors.ngayDKLD).toMatch(/ngày không hợp lệ/i);
    });

    test('should reject future dates', async () => {
      const { result } = renderHook(() => useFormValidation());
      
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const futureDateStr = `${futureDate.getDate().toString().padStart(2, '0')}/${(futureDate.getMonth() + 1).toString().padStart(2, '0')}/${futureDate.getFullYear()}`;
      
      const formData = {
        chuXe: 'Nguyễn Văn A',
        diaChi: '123 Đường ABC',
        buyerEmail: 'test@example.com',
        buyerPhone: '0901234567',
        buyerGender: 'nam' as const,
        buyerCitizenId: '123456789012',
        selectedProvince: '79',
        selectedProvinceText: 'TP.HCM',
        selectedDistrictWard: '760',
        selectedDistrictWardText: 'Quận 1',
        specificAddress: '123 ABC',
        bienSo: '51A-123.45',
        soKhung: 'ABC123',
        soMay: 'DEF456',
        ngayDKLD: futureDateStr,
        namSanXuat: 2020,
        soChoNgoi: 5,
        trongTai: 0,
        giaTriXe: '500000000',
        loaiHinhKinhDoanh: 'khong_kd_cho_nguoi',
      };

      const carData = {
        selectedBrand: 'Toyota',
        selectedModel: 'Vios',
        selectedBodyStyle: 'Sedan',
        selectedYear: '2020',
      };

      const isValid = await act(async () => {
        return await result.current.validateForm(formData, carData);
      });

      expect(isValid).toBe(false);
      expect(result.current.fieldErrors.ngayDKLD).toBeDefined();
      expect(result.current.fieldErrors.ngayDKLD).toMatch(/ngày hiện tại/i);
    });

    test('should validate date against manufacturing year', async () => {
      const { result } = renderHook(() => useFormValidation());
      
      const formData = {
        chuXe: 'Nguyễn Văn A',
        diaChi: '123 Đường ABC',
        buyerEmail: 'test@example.com',
        buyerPhone: '0901234567',
        buyerGender: 'nam' as const,
        buyerCitizenId: '123456789012',
        selectedProvince: '79',
        selectedProvinceText: 'TP.HCM',
        selectedDistrictWard: '760',
        selectedDistrictWardText: 'Quận 1',
        specificAddress: '123 ABC',
        bienSo: '51A-123.45',
        soKhung: 'ABC123',
        soMay: 'DEF456',
        ngayDKLD: '15/06/2019', // Registration before manufacturing
        namSanXuat: 2020,
        soChoNgoi: 5,
        trongTai: 0,
        giaTriXe: '500000000',
        loaiHinhKinhDoanh: 'khong_kd_cho_nguoi',
      };

      const carData = {
        selectedBrand: 'Toyota',
        selectedModel: 'Vios',
        selectedBodyStyle: 'Sedan',
        selectedYear: '2020',
      };

      const isValid = await act(async () => {
        return await result.current.validateForm(formData, carData);
      });

      expect(isValid).toBe(false);
      expect(result.current.fieldErrors.ngayDKLD).toBeDefined();
      expect(result.current.fieldErrors.ngayDKLD).toMatch(/năm sản xuất/i);
    });
  });

  describe('Conditional Validation - Truck Weight', () => {
    test('should require weight for commercial trucks', async () => {
      const { result } = renderHook(() => useFormValidation());
      
      const formData = {
        chuXe: 'Công ty ABC',
        diaChi: '123 Đường ABC',
        buyerEmail: 'test@example.com',
        buyerPhone: '0901234567',
        buyerGender: 'nam' as const,
        buyerCitizenId: '123456789012',
        selectedProvince: '79',
        selectedProvinceText: 'TP.HCM',
        selectedDistrictWard: '760',
        selectedDistrictWardText: 'Quận 1',
        specificAddress: '123 ABC',
        bienSo: '51A-123.45',
        soKhung: 'ABC123',
        soMay: 'DEF456',
        ngayDKLD: '15/06/2020',
        namSanXuat: 2020,
        soChoNgoi: 3,
        trongTai: '' as any, // Empty weight for truck
        giaTriXe: '800000000',
        loaiHinhKinhDoanh: 'kd_cho_hang', // Commercial truck
      };

      const carData = {
        selectedBrand: 'Hyundai',
        selectedModel: 'HD120SL',
        selectedBodyStyle: 'Truck',
        selectedYear: '2020',
      };

      const isValid = await act(async () => {
        return await result.current.validateForm(formData, carData);
      });

      expect(isValid).toBe(false);
      expect(result.current.fieldErrors.trongTai).toBeDefined();
      expect(result.current.fieldErrors.trongTai).toMatch(/trọng tải|number/i);
    });

    test('should not require weight for passenger cars', async () => {
      const { result } = renderHook(() => useFormValidation());
      
      const formData = {
        chuXe: 'Nguyễn Văn A',
        diaChi: '123 Đường ABC',
        buyerEmail: 'test@example.com',
        buyerPhone: '0901234567',
        buyerGender: 'nam' as const,
        buyerCitizenId: '123456789012',
        selectedProvince: '79',
        selectedProvinceText: 'TP.HCM',
        selectedDistrictWard: '760',
        selectedDistrictWardText: 'Quận 1',
        specificAddress: '123 ABC',
        bienSo: '51A-123.45',
        soKhung: 'ABC123',
        soMay: 'DEF456',
        ngayDKLD: '15/06/2020',
        namSanXuat: 2020,
        soChoNgoi: 5,
        trongTai: 0, // Weight not required for passenger cars
        giaTriXe: '500000000',
        loaiHinhKinhDoanh: 'khong_kd_cho_nguoi', // Passenger car
      };

      const carData = {
        selectedBrand: 'Toyota',
        selectedModel: 'Vios',
        selectedBodyStyle: 'Sedan',
        selectedYear: '2020',
      };

      const isValid = await act(async () => {
        return await result.current.validateForm(formData, carData);
      });

      expect(isValid).toBe(true);
      expect(result.current.fieldErrors.trongTai).toBeUndefined();
    });
  });

  describe('Car Selection Validation', () => {
    test('should validate required car fields', async () => {
      const { result } = renderHook(() => useFormValidation());
      
      const validFormData = {
        chuXe: 'Nguyễn Văn A',
        diaChi: '123 Đường ABC',
        buyerEmail: 'test@example.com',
        buyerPhone: '0901234567',
        buyerGender: 'nam' as const,
        buyerCitizenId: '123456789012',
        selectedProvince: '79',
        selectedProvinceText: 'TP.HCM',
        selectedDistrictWard: '760',
        selectedDistrictWardText: 'Quận 1',
        specificAddress: '123 ABC',
        bienSo: '51A-123.45',
        soKhung: 'ABC123',
        soMay: 'DEF456',
        ngayDKLD: '15/06/2020',
        namSanXuat: 2020,
        soChoNgoi: 5,
        trongTai: 0,
        giaTriXe: '500000000',
        loaiHinhKinhDoanh: 'khong_kd_cho_nguoi',
      };

      const incompleteCarData = {
        selectedBrand: '', // Missing brand
        selectedModel: 'Vios',
        selectedBodyStyle: 'Sedan',
        selectedYear: '2020',
      };

      const isValid = await act(async () => {
        return await result.current.validateForm(validFormData, incompleteCarData);
      });

      expect(isValid).toBe(false);
      expect(result.current.fieldErrors.selectedBrand).toBeDefined();
      expect(result.current.fieldErrors.selectedBrand).toMatch(/nhãn hiệu xe/i);
    });
  });

  describe('Field Error Management', () => {
    test('should clear field errors when validation passes', async () => {
      const { result } = renderHook(() => useFormValidation());
      
      // First validation with invalid data
      const invalidFormData = {
        chuXe: '', // Invalid - required
        diaChi: '123 Đường ABC',
        buyerEmail: 'invalid-email', // Invalid email
        buyerPhone: '0901234567',
        buyerGender: 'nam' as const,
        buyerCitizenId: '123456789012',
        selectedProvince: '79',
        selectedProvinceText: 'TP.HCM',
        selectedDistrictWard: '760',
        selectedDistrictWardText: 'Quận 1',
        specificAddress: '123 ABC',
        bienSo: '51A-123.45',
        soKhung: 'ABC123',
        soMay: 'DEF456',
        ngayDKLD: '15/06/2020',
        namSanXuat: 2020,
        soChoNgoi: 5,
        trongTai: 0,
        giaTriXe: '500000000',
        loaiHinhKinhDoanh: 'khong_kd_cho_nguoi',
      };

      const carData = {
        selectedBrand: 'Toyota',
        selectedModel: 'Vios',
        selectedBodyStyle: 'Sedan',
        selectedYear: '2020',
      };

      await act(async () => {
        await result.current.validateForm(invalidFormData, carData);
      });

      expect(Object.keys(result.current.fieldErrors)).toHaveLength(2);
      expect(result.current.fieldErrors.chuXe).toBeDefined();
      expect(result.current.fieldErrors.buyerEmail).toBeDefined();

      // Second validation with valid data
      const validFormData = {
        ...invalidFormData,
        chuXe: 'Nguyễn Văn A',
        buyerEmail: 'valid@example.com',
      };

      const isValid = await act(async () => {
        return await result.current.validateForm(validFormData, carData);
      });

      expect(isValid).toBe(true);
      expect(result.current.fieldErrors).toEqual({});
    });

    test('should allow manual field error setting', () => {
      const { result } = renderHook(() => useFormValidation());
      
      act(() => {
        result.current.setFieldErrors({ 
          customError: 'This is a custom error' 
        });
      });

      expect(result.current.fieldErrors.customError).toBe('This is a custom error');
    });
  });

  describe('Seat Count Validation', () => {
    test('should validate seat count range', async () => {
      const { result } = renderHook(() => useFormValidation());
      
      const formData = {
        chuXe: 'Nguyễn Văn A',
        diaChi: '123 Đường ABC',
        buyerEmail: 'test@example.com',
        buyerPhone: '0901234567',
        buyerGender: 'nam' as const,
        buyerCitizenId: '123456789012',
        selectedProvince: '79',
        selectedProvinceText: 'TP.HCM',
        selectedDistrictWard: '760',
        selectedDistrictWardText: 'Quận 1',
        specificAddress: '123 ABC',
        bienSo: '51A-123.45',
        soKhung: 'ABC123',
        soMay: 'DEF456',
        ngayDKLD: '15/06/2020',
        namSanXuat: 2020,
        soChoNgoi: 100, // Invalid - too many seats
        trongTai: 0,
        giaTriXe: '500000000',
        loaiHinhKinhDoanh: 'khong_kd_cho_nguoi',
      };

      const carData = {
        selectedBrand: 'Toyota',
        selectedModel: 'Vios',
        selectedBodyStyle: 'Sedan',
        selectedYear: '2020',
      };

      const isValid = await act(async () => {
        return await result.current.validateForm(formData, carData);
      });

      expect(isValid).toBe(false);
      expect(result.current.fieldErrors.soChoNgoi).toBeDefined();
      expect(result.current.fieldErrors.soChoNgoi).toMatch(/64/);
    });
  });
});