import { render, screen, fireEvent } from '@testing-library/react';
import BuyerInfoForm from '../BuyerInfoForm';

// Mock dependencies
jest.mock('@/hooks/useBuyerLocation', () => ({
  __esModule: true,
  default: () => ({
    provinces: [
      { province_code: '01', province_name: 'Hà Nội' },
      { province_code: '79', province_name: 'TP Hồ Chí Minh' }
    ],
    loadingProvinces: false,
    errorProvinces: null,
    districtsWards: [
      { id: '001', name: 'Ba Đình' },
      { id: '002', name: 'Hoàn Kiếm' }
    ],
    loadingDistrictsWards: false,
    errorDistrictsWards: null,
    loadDistrictsWards: jest.fn(),
    clearDistrictsWards: jest.fn(),
    getProvinceByCode: (code: string) => 
      code === '01' ? { province_code: '01', province_name: 'Hà Nội' } : null,
    getDistrictWardById: (id: string) => 
      id === '001' ? { id: '001', name: 'Ba Đình' } : null,
  })
}));

jest.mock('../FieldError', () => ({ fieldName, errors }: { fieldName: string, errors: Record<string, string> }) => (
  errors[fieldName] ? <div data-testid={`error-${fieldName}`}>{errors[fieldName]}</div> : null
));

jest.mock('@/components/ui/Spinner', () => () => <div data-testid="spinner">Loading...</div>);

jest.mock('@/components/SearchableSelect', () => ({ value, onChange, options, placeholder }: any) => (
  <select 
    data-testid="searchable-select"
    value={value}
    onChange={(e) => onChange(e.target.value)}
  >
    <option value="">{placeholder}</option>
    {options.map((option: any) => (
      <option key={option.id} value={option.name}>{option.name}</option>
    ))}
  </select>
));

describe('BuyerInfoForm', () => {
  const mockFormData = {
    // Core shared type fields
    buyerName: 'Nguyễn Văn A',
    buyerAddress: '',
    buyerProvince: '',
    buyerDistrict: '',
    buyerWard: '',
    buyerPhone: '0912345678',
    buyerEmail: 'test@example.com',
    buyerCccd: '123456789012',
    buyerCccdDate: '',
    buyerGender: 'nam' as const,
    
    // Extended fields for UI
    selectedProvince: '01',
    selectedProvinceText: 'Hà Nội',
    selectedDistrictWard: '001',
    selectedDistrictWardText: 'Ba Đình',
    specificAddress: 'Số 123, Đường ABC'
  };

  const mockProps = {
    formData: mockFormData,
    fieldErrors: {},
    onFormInputChange: jest.fn(),
    onNext: jest.fn(),
    hideNextButton: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render all form fields with shared type values', () => {
    render(<BuyerInfoForm {...mockProps} />);

    // Check shared type fields are rendered with correct values
    expect(screen.getByDisplayValue('Nguyễn Văn A')).toBeInTheDocument();
    expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('0912345678')).toBeInTheDocument();
    expect(screen.getByDisplayValue('123456789012')).toBeInTheDocument();
    expect(screen.getByText('Nam')).toBeInTheDocument(); // Gender is displayed as text, not form value
    expect(screen.getByDisplayValue('Số 123, Đường ABC')).toBeInTheDocument();
  });

  it('should call onFormInputChange with correct field names from shared types', () => {
    render(<BuyerInfoForm {...mockProps} />);

    // Test buyerName field (mapped from old chuXe)
    const nameInput = screen.getByDisplayValue('Nguyễn Văn A');
    fireEvent.change(nameInput, { target: { value: 'Trần Thị B' } });
    expect(mockProps.onFormInputChange).toHaveBeenCalledWith('buyerName', 'Trần Thị B');

    // Test buyerCccd field (mapped from old buyerCitizenId)
    const cccdInput = screen.getByDisplayValue('123456789012');
    fireEvent.change(cccdInput, { target: { value: '987654321098' } });
    expect(mockProps.onFormInputChange).toHaveBeenCalledWith('buyerCccd', '987654321098');

    // Test other shared type fields
    const emailInput = screen.getByDisplayValue('test@example.com');
    fireEvent.change(emailInput, { target: { value: 'new@example.com' } });
    expect(mockProps.onFormInputChange).toHaveBeenCalledWith('buyerEmail', 'new@example.com');
  });

  it('should validate shared type fields correctly', async () => {
    const emptyFormData = {
      ...mockFormData,
      buyerName: '',
      buyerEmail: '',
      buyerPhone: '',
      buyerCccd: ''
    };

    render(<BuyerInfoForm {...mockProps} formData={emptyFormData} />);

    const nextButton = screen.getByText('Tiếp theo');
    fireEvent.click(nextButton);

    // Should not proceed to next step due to validation errors
    expect(mockProps.onNext).not.toHaveBeenCalled();
  });

  it('should handle field errors for shared type fields', () => {
    const propsWithErrors = {
      ...mockProps,
      fieldErrors: {
        buyerName: 'Tên không hợp lệ',
        buyerCccd: 'CCCD không hợp lệ',
        buyerEmail: 'Email không hợp lệ'
      }
    };

    render(<BuyerInfoForm {...propsWithErrors} />);

    expect(screen.getByTestId('error-buyerName')).toHaveTextContent('Tên không hợp lệ');
    expect(screen.getByTestId('error-buyerCccd')).toHaveTextContent('CCCD không hợp lệ');
    expect(screen.getByTestId('error-buyerEmail')).toHaveTextContent('Email không hợp lệ');
  });

  it('should proceed when all shared type fields are valid', async () => {
    render(<BuyerInfoForm {...mockProps} />);

    const nextButton = screen.getByText('Tiếp theo');
    fireEvent.click(nextButton);

    // Should proceed to next step with valid data
    expect(mockProps.onNext).toHaveBeenCalled();
  });

  it('should use shared BuyerFormData interface correctly', () => {
    // This test ensures TypeScript compilation with shared types
    const validBuyerData = {
      ...mockFormData,
      // These fields should be available from BuyerFormData
      buyerName: 'Test Name',
      buyerEmail: 'test@email.com', 
      buyerPhone: '0123456789',
      buyerGender: 'nu' as const,
      buyerCccd: '123456789012',
      buyerCccdDate: '2020-01-01',
      buyerAddress: 'Test Address',
      buyerProvince: 'Test Province',
      buyerDistrict: 'Test District', 
      buyerWard: 'Test Ward'
    };

    render(<BuyerInfoForm {...mockProps} formData={validBuyerData} />);

    // Should render without TypeScript errors
    expect(screen.getByDisplayValue('Test Name')).toBeInTheDocument();
    expect(screen.getByDisplayValue('test@email.com')).toBeInTheDocument();
  });
});