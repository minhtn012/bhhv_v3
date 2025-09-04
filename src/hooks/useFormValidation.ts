import { useState } from 'react';
import * as Yup from 'yup';
import { CarSelection } from '@/types/car';

interface FormData {
  chuXe: string;
  diaChi: string;
  bienSo: string;
  soKhung: string;
  soMay: string;
  ngayDKLD: string;
  namSanXuat: number | '';
  soChoNgoi: number | '';
  trongTai: number | '';
  giaTriXe: string;
  loaiHinhKinhDoanh: string;
}

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
    chuXe: Yup.string().required('Vui lòng nhập chủ xe'),
    diaChi: Yup.string().required('Vui lòng nhập địa chỉ'),
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
    trongTai: Yup.number().when('loaiHinhKinhDoanh', {
      is: (loaiHinh: string) => loaiHinh?.includes('cho_hang') || loaiHinh?.includes('dau_keo'),
      then: (schema) => schema.required('Vui lòng nhập trọng tải cho xe tải').min(1, 'Trọng tải phải lớn hơn 0'),
      otherwise: (schema) => schema.notRequired()
    })
  });

  const carValidationSchema = Yup.object().shape({
    selectedBrand: Yup.string().required('Vui lòng chọn nhãn hiệu xe'),
    selectedModel: Yup.string().required('Vui lòng chọn dòng xe'),
    selectedBodyStyle: Yup.string().required('Vui lòng chọn kiểu dáng xe'),
    selectedYear: Yup.string().required('Vui lòng chọn năm/phiên bản xe')
  });

  const validateForm = async (formData: FormData, carData: CarSelection): Promise<boolean> => {
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