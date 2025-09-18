import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import VehicleInfoForm from '../VehicleInfoForm';
import { type VehicleFormData } from '@/types/contract';
import { type CarSelection } from '@/types/car';

// Mock data
const mockFormData: VehicleFormData = {
  bienSo: '',
  soKhung: '',
  soMay: '',
  namSanXuat: '',
  soChoNgoi: '',
  trongTai: '',
  giaTriXe: '',
  loaiHinhKinhDoanh: 'khong_kd_cho_nguoi',
  loaiDongCo: '',
  giaTriPin: '',
  ngayDKLD: '',
  loaiXe: '', // Our new field
  chuXe: '',
  tenXe: '',
  nhanHieu: '',
  soLoai: '',
  kieuDang: '',
  namPhienBan: ''
};

const mockCarData: CarSelection = {
  selectedBrand: '',
  selectedModel: '',
  selectedBodyStyle: '',
  selectedYear: '',
  availableBrands: [],
  availableModels: [],
  availableBodyStyles: [],
  availableYears: [],
  suggestions: [],
  showSuggestions: false
};

const mockProps = {
  formData: mockFormData,
  carData: mockCarData,
  fieldErrors: {},
  onFormInputChange: jest.fn(),
  onBrandChange: jest.fn(),
  onModelChange: jest.fn(),
  onCarInputChange: jest.fn(),
  onAcceptSuggestion: jest.fn(),
  onCalculateRates: jest.fn(),
};

describe('VehicleInfoForm - loaiXe Field', () => {
  it('should render loaiXe input field', () => {
    render(<VehicleInfoForm {...mockProps} />);

    const loaiXeInput = screen.getByLabelText(/Loại xe/i);
    expect(loaiXeInput).toBeInTheDocument();
    expect(loaiXeInput).toHaveAttribute('placeholder', 'Ví dụ: xe con, xe tải, bán tải...');
  });

  it('should display current loaiXe value', () => {
    const formDataWithLoaiXe = {
      ...mockFormData,
      loaiXe: 'xe con'
    };

    render(<VehicleInfoForm {...mockProps} formData={formDataWithLoaiXe} />);

    const loaiXeInput = screen.getByLabelText(/Loại xe/i) as HTMLInputElement;
    expect(loaiXeInput.value).toBe('xe con');
  });

  it('should call onFormInputChange when loaiXe input changes', () => {
    const mockOnFormInputChange = jest.fn();

    render(<VehicleInfoForm {...mockProps} onFormInputChange={mockOnFormInputChange} />);

    const loaiXeInput = screen.getByLabelText(/Loại xe/i);
    fireEvent.change(loaiXeInput, { target: { value: 'xe tải' } });

    expect(mockOnFormInputChange).toHaveBeenCalledWith('loaiXe', 'xe tải');
  });

  it('should show field error for loaiXe when present', () => {
    const fieldErrors = {
      loaiXe: 'Loại xe không hợp lệ'
    };

    render(<VehicleInfoForm {...mockProps} fieldErrors={fieldErrors} />);

    const errorElement = screen.getByText('Loại xe không hợp lệ');
    expect(errorElement).toBeInTheDocument();

    const loaiXeInput = screen.getByLabelText(/Loại xe/i);
    expect(loaiXeInput).toHaveClass('border-red-500');
  });

  it('should not have error styling when no field error', () => {
    render(<VehicleInfoForm {...mockProps} />);

    const loaiXeInput = screen.getByLabelText(/Loại xe/i);
    expect(loaiXeInput).not.toHaveClass('border-red-500');
    expect(loaiXeInput).toHaveClass('border-slate-500/30');
  });
});