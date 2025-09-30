import { useState } from 'react';
import * as Yup from 'yup';
import { CarSelection } from '@/types/car';
import { type BaseContractFormData } from '@/types/contract';
import carEngineTypes from '@db/car_type_engine.json';

export default function useFormValidation() {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const parseDate = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    
    const parts = dateStr.split('/');
    if (parts.length !== 3) return null;
    
    const day = parseInt(parts[0]);
    const month = parseInt(parts[1]);
    const year = parseInt(parts[2]);
    
    if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
    if (day < 1 || day > 31 || month < 1 || month > 12) return null;
    
    const date = new Date(year, month - 1, day);
    
    if (date.getDate() !== day || date.getMonth() !== month - 1 || date.getFullYear() !== year) {
      return null;
    }
    
    return date;
  };

  const parseCurrency = (value: string): number => {
    return parseFloat(value.replace(/[^\d]/g, ''));
  };

  const validationSchema = Yup.object().shape({
    // Customer/Owner Information (consolidated)
    chuXe: Yup.string().required('Vui lòng nhập họ và tên'),
    email: Yup.string()
      .transform((value) => value === '' ? undefined : value)
      .email('Vui lòng nhập email hợp lệ')
      .notRequired(),
    soDienThoai: Yup.string()
      .transform((value) => value === '' ? undefined : value)
      .matches(/^(0[3-9])[0-9]{8}$/, 'Số điện thoại phải có 10 chữ số và bắt đầu bằng 03-09')
      .notRequired(),
    cccd: Yup.string()
      .transform((value) => value === '' ? undefined : value)
      .matches(/^[0-9]{12}$/, 'Căn cước công dân phải có đúng 12 chữ số')
      .notRequired(),
    gioiTinh: Yup.mixed<'nam' | 'nu' | 'khac'>().oneOf(['nam', 'nu', 'khac']).required('Vui lòng chọn giới tính'),
    userType: Yup.mixed<'ca_nhan' | 'cong_ty'>().oneOf(['ca_nhan', 'cong_ty']).required('Vui lòng chọn loại khách hàng'),

    // Address Structure (actual form fields) - now optional
    selectedProvince: Yup.string().notRequired(),
    selectedProvinceText: Yup.string().notRequired(),
    selectedDistrictWard: Yup.string().notRequired(),
    selectedDistrictWardText: Yup.string().notRequired(),
    specificAddress: Yup.string().notRequired(),
    
    // Buyer fields removed - consolidated into customer fields above
    
    // Vehicle information
    bienSo: Yup.string().required('Vui lòng nhập biển số'),
    soKhung: Yup.string().required('Vui lòng nhập số khung'),
    soMay: Yup.string().required('Vui lòng nhập số máy'),
    ngayDKLD: Yup.string()
      .required('Vui lòng nhập ngày đăng ký lần đầu')
      .test('valid-date', 'Ngày không hợp lệ. Vui lòng nhập theo định dạng dd/mm/yyyy', function(value) {
        if (!value) return false;
        const date = parseDate(value);
        return date !== null;
      })
      .test('not-future', 'Ngày đăng ký lần đầu phải nhỏ hơn ngày hiện tại', function(value) {
        if (!value) return true;
        const date = parseDate(value);
        if (!date) return true;
        return date < new Date();
      })
      .test('after-manufacture', 'Ngày đăng ký không thể trước năm sản xuất', function(value) {
        if (!value) return true;
        const namSanXuat = this.parent.namSanXuat;
        if (!namSanXuat) return true;
        const date = parseDate(value);
        if (!date) return true;
        const manufacturingYear = new Date(Number(namSanXuat), 0, 1);
        return date >= manufacturingYear;
      }),
    namSanXuat: Yup.number()
      .required('Vui lòng nhập năm sản xuất')
      .min(1980, 'Năm sản xuất phải từ 1980 trở lên')
      .max(new Date().getFullYear(), `Năm sản xuất không được lớn hơn năm hiện tại (${new Date().getFullYear()})`),
    soChoNgoi: Yup.number()
      .required('Vui lòng nhập số chỗ ngồi')
      .min(1, 'Số chỗ ngồi phải lớn hơn 0')
      .max(64, 'Số chỗ ngồi không được lớn hơn 64'),
    giaTriXe: Yup.string()
      .required('Vui lòng nhập giá trị xe')
      .test('valid-price', 'Giá trị xe phải lớn hơn 0', function(value) {
        if (!value) return false;
        const price = parseCurrency(value);
        return !isNaN(price) && price > 0;
      }),
    trongTai: Yup.mixed().when('loaiHinhKinhDoanh', {
      is: (loaiHinh: string) => loaiHinh?.includes('cho_hang') || loaiHinh?.includes('dau_keo'),
      then: (schema) => schema
        .required('Vui lòng nhập trọng tải cho xe tải')
        .test('is-number', 'Trọng tải phải là số', (value) => {
          return value !== '' && !isNaN(Number(value));
        })
        .test('min-value', 'Trọng tải phải lớn hơn 0', (value) => {
          return Number(value) > 0;
        }),
      otherwise: (schema) => schema.nullable().notRequired()
    }),
    loaiDongCo: Yup.string().required('Vui lòng chọn loại động cơ'),
    giaTriPin: Yup.string().when('loaiDongCo', {
      is: (loaiDongCo: string) => {
        if (!loaiDongCo) return false;
        const selectedEngine = carEngineTypes.find(engine => engine.value === loaiDongCo);
        return selectedEngine && (selectedEngine.name.includes('Hybrid') || selectedEngine.name.includes('điện'));
      },
      then: (schema) => schema
        .required('Vui lòng nhập giá trị pin khi chọn động cơ hybrid hoặc điện')
        .test('valid-battery-price', 'Giá trị pin phải lớn hơn 0', function(value) {
          if (!value) return false;
          const price = parseCurrency(value);
          return !isNaN(price) && price > 0;
        }),
      otherwise: (schema) => schema.notRequired()
    }),
    
    // // Package Selection & Insurance fields
    // selectedPackageIndex: Yup.number()
    //   .required('Vui lòng chọn gói bảo hiểm')
    //   .min(0, 'Gói bảo hiểm không hợp lệ'),
    // includeTNDS: Yup.boolean().required(),
    // tndsCategory: Yup.string().when('includeTNDS', {
    //   is: true,
    //   then: (schema) => schema.required('Vui lòng chọn loại TNDS'),
    //   otherwise: (schema) => schema.notRequired()
    // }),
    // includeNNTX: Yup.boolean().required(),
    // taiTucPercentage: Yup.number()
    //   .required('Vui lòng nhập tỷ lệ tái tục')
    //   .min(0, 'Tỷ lệ tái tục phải từ 0% trở lên')
    //   .max(100, 'Tỷ lệ tái tục không được vượt quá 100%'),
    // mucKhauTru: Yup.number()
    //   .required('Vui lòng nhập mức khấu trừ')
    //   .min(0, 'Mức khấu trừ phải từ 0 trở lên')
  });

  const carValidationSchema = Yup.object().shape({
    selectedBrand: Yup.string().required('Vui lòng chọn nhãn hiệu xe'),
    selectedModel: Yup.string().required('Vui lòng chọn dòng xe'),
    selectedBodyStyle: Yup.string().required('Vui lòng chọn kiểu dáng xe'),
    selectedYear: Yup.string().required('Vui lòng chọn năm/phiên bản xe')
  });

  const validateForm = async (formData: BaseContractFormData, carData: CarSelection): Promise<boolean> => {
    try {
      setFieldErrors({});

      await validationSchema.validate(formData, { abortEarly: false });
      await carValidationSchema.validate(carData, { abortEarly: false });

      return true;
    } catch (err) {
      if (err instanceof Yup.ValidationError) {
        const errors: Record<string, string> = {};

        err.inner.forEach((error) => {
          if (error.path) {
            errors[error.path] = error.message;
          }
        });

        setFieldErrors(errors);
      }
      return false;
    }
  };

  return {
    fieldErrors,
    validateForm,
    setFieldErrors
  };
}