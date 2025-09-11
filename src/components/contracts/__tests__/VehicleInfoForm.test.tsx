import { render, screen, fireEvent } from '@testing-library/react';
import VehicleInfoForm from '../VehicleInfoForm';
import { CarSelection } from '@/types/car';

// Mock dependencies
jest.mock('@/utils/car-engine-mapping', () => ({
  getEngineTypeFromCarType: (carType: string) => {
    if (carType.toLowerCase().includes('hybrid')) return 'hybrid';
    if (carType.toLowerCase().includes('electric')) return 'electric';
    return 'xang';
  }
}));

jest.mock('../FieldError', () => ({ fieldName, errors }: { fieldName: string, errors: Record<string, string> }) => (
  errors[fieldName] ? <div data-testid={`error-${fieldName}`}>{errors[fieldName]}</div> : null
));

jest.mock('../CarSelectionForm', () => ({ carData, onBrandChange, onModelChange }: any) => (
  <div data-testid="car-selection">
    <button onClick={() => onBrandChange('Toyota')}>Select Toyota</button>
    <button onClick={() => onModelChange('Camry')}>Select Camry</button>
  </div>
));

jest.mock('@/utils/insurance-calculator', () => ({
  formatNumberInput: (value: string) => value.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ','),
  loaiHinhKinhDoanhOptions: [
    {
      value: 'kinh-doanh-van-tai',
      label: 'Kinh doanh vận tải',
      group: 'Kinh doanh'
    },
    {
      value: 'tu-su-dung',
      label: 'Tự sử dụng',
      group: 'Cá nhân'
    }
  ]
}));

jest.mock('@db/car_type_engine.json', () => ([
  { name: 'Động cơ đốt trong (Xăng, dầu)', value: '31cd6b1d-39a6-42d5-9c5f-13f44ad1a8a9', code: 'ICE' },
  { name: 'Động cơ Hybrid (Xăng, điện)', value: '2cdc787a-207b-4e8c-b56d-ae016f1c2c94', code: 'HYBRID' },
  { name: 'Động cơ điện', value: '5d3e3af7-ab75-4e57-a952-c815e40adf31', code: 'EV' }
]), { virtual: true });

describe('VehicleInfoForm', () => {
  const mockFormData = {
    // Core shared VehicleFormData fields
    bienSo: '30A-12345',
    soKhung: 'VF1234567',
    soMay: 'ENG123456',
    tenXe: 'Toyota Camry',
    namSanXuat: 2020,
    soChoNgoi: 5,
    trongTai: 0,
    giaTriXe: '800,000,000',
    loaiHinhKinhDoanh: 'kinh-doanh-van-tai',
    loaiDongCo: '31cd6b1d-39a6-42d5-9c5f-13f44ad1a8a9',
    giaTriPin: '',
    ngayDKLD: '01/01/2020',
    chuXe: 'Nguyễn Văn A'
  };

  const mockCarData: CarSelection = {
    selectedBrand: 'Toyota',
    selectedModel: 'Camry',
    availableBrands: ['Toyota', 'Honda'],
    availableModels: [
      { model_name: 'Camry', car_type: 'sedan' },
      { model_name: 'Corolla', car_type: 'sedan' }
    ],
    carSuggestions: [],
    acceptedSuggestion: null
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
    hideCalculateButton: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render all shared VehicleFormData fields', () => {
    render(<VehicleInfoForm {...mockProps} />);

    // Check shared type fields are rendered
    expect(screen.getByDisplayValue('30A-12345')).toBeInTheDocument(); // bienSo
    expect(screen.getByDisplayValue('VF1234567')).toBeInTheDocument(); // soKhung
    expect(screen.getByDisplayValue('ENG123456')).toBeInTheDocument(); // soMay
    expect(screen.getByDisplayValue('01/01/2020')).toBeInTheDocument(); // ngayDKLD
    expect(screen.getByDisplayValue('2020')).toBeInTheDocument(); // namSanXuat
    expect(screen.getByDisplayValue('5')).toBeInTheDocument(); // soChoNgoi
    expect(screen.getByDisplayValue('800,000,000')).toBeInTheDocument(); // giaTriXe
    expect(screen.getByText('Động cơ đốt trong (Xăng, dầu)')).toBeInTheDocument(); // loaiDongCo option
    expect(screen.getByText('Kinh doanh vận tải')).toBeInTheDocument(); // loaiHinhKinhDoanh option
  });

  it('should call onFormInputChange with correct VehicleFormData field names', () => {
    render(<VehicleInfoForm {...mockProps} />);

    // Test bienSo field
    const bienSoInput = screen.getByDisplayValue('30A-12345');
    fireEvent.change(bienSoInput, { target: { value: '30B-54321' } });
    expect(mockProps.onFormInputChange).toHaveBeenCalledWith('bienSo', '30B-54321');

    // Test soKhung field
    const soKhungInput = screen.getByDisplayValue('VF1234567');
    fireEvent.change(soKhungInput, { target: { value: 'VF9876543' } });
    expect(mockProps.onFormInputChange).toHaveBeenCalledWith('soKhung', 'VF9876543');

    // Test namSanXuat field (number)
    const namSanXuatInput = screen.getByDisplayValue('2020');
    fireEvent.change(namSanXuatInput, { target: { value: '2021' } });
    expect(mockProps.onFormInputChange).toHaveBeenCalledWith('namSanXuat', 2021);

    // Test giaTriXe field (formatted number)
    const giaTriXeInput = screen.getByDisplayValue('800,000,000');
    fireEvent.change(giaTriXeInput, { target: { value: '900000000' } });
    expect(mockProps.onFormInputChange).toHaveBeenCalledWith('giaTriXe', '900,000,000');
  });

  it('should show battery price field for electric/hybrid vehicles', () => {
    const electricFormData = {
      ...mockFormData,
      loaiDongCo: '2cdc787a-207b-4e8c-b56d-ae016f1c2c94' // Hybrid UUID
    };

    render(<VehicleInfoForm {...mockProps} formData={electricFormData} />);

    expect(screen.getByText('Giá trị Pin (VNĐ) *')).toBeInTheDocument();
  });

  it('should hide battery price field for non-electric vehicles', () => {
    render(<VehicleInfoForm {...mockProps} />);

    expect(screen.queryByText('Giá trị Pin (VNĐ) *')).not.toBeInTheDocument();
  });

  it('should show weight field for cargo vehicles', () => {
    const cargoFormData = {
      ...mockFormData,
      loaiHinhKinhDoanh: 'kinh-doanh-van-tai-cho_hang'
    };

    render(<VehicleInfoForm {...mockProps} formData={cargoFormData} />);

    expect(screen.getByText('Trọng tải (kg) *')).toBeInTheDocument();
  });

  it('should render calculate rates button by default', () => {
    render(<VehicleInfoForm {...mockProps} />);

    expect(screen.getByText('Tính phí & Lập báo giá')).toBeInTheDocument();
  });

  it('should hide calculate rates button when hideCalculateButton is true', () => {
    render(<VehicleInfoForm {...mockProps} hideCalculateButton={true} />);

    expect(screen.queryByText('Tính phí & Lập báo giá')).not.toBeInTheDocument();
  });

  it('should handle field errors for VehicleFormData fields', () => {
    const propsWithErrors = {
      ...mockProps,
      fieldErrors: {
        bienSo: 'Biển số không hợp lệ',
        soKhung: 'Số khung không hợp lệ',
        giaTriXe: 'Giá trị xe không hợp lệ'
      }
    };

    render(<VehicleInfoForm {...propsWithErrors} />);

    expect(screen.getByTestId('error-bienSo')).toHaveTextContent('Biển số không hợp lệ');
    expect(screen.getByTestId('error-soKhung')).toHaveTextContent('Số khung không hợp lệ');
    expect(screen.getByTestId('error-giaTriXe')).toHaveTextContent('Giá trị xe không hợp lệ');
  });

  it('should use shared VehicleFormData interface correctly', () => {
    // This test ensures TypeScript compilation with shared types
    const validVehicleData = {
      bienSo: '51G-12345',
      soKhung: 'VALID123456',
      soMay: 'ENGINE789',
      tenXe: 'Honda Civic', 
      namSanXuat: 2022,
      soChoNgoi: 5,
      trongTai: 0,
      giaTriXe: '1,200,000,000',
      loaiHinhKinhDoanh: 'tu-su-dung',
      loaiDongCo: '31cd6b1d-39a6-42d5-9c5f-13f44ad1a8a9',
      giaTriPin: '',
      ngayDKLD: '15/06/2022',
      chuXe: 'Trần Thị B'
    };

    render(<VehicleInfoForm {...mockProps} formData={validVehicleData} />);

    // Should render without TypeScript errors
    expect(screen.getByDisplayValue('51G-12345')).toBeInTheDocument();
    expect(screen.getByDisplayValue('VALID123456')).toBeInTheDocument();
    expect(screen.getByDisplayValue('1,200,000,000')).toBeInTheDocument();
  });

  it('should call onCalculateRates when button is clicked', () => {
    render(<VehicleInfoForm {...mockProps} />);

    const calculateButton = screen.getByText('Tính phí & Lập báo giá');
    fireEvent.click(calculateButton);

    expect(mockProps.onCalculateRates).toHaveBeenCalled();
  });
});