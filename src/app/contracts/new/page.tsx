'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  parseCurrency,
  tndsCategories,
  calculateTotalVehicleValue
} from '@/utils/insurance-calculator';
import StepIndicator from '@/components/contracts/StepIndicator';
import StepWrapper from '@/components/contracts/StepWrapper';
import FileUploadStep from '@/components/contracts/FileUploadStep';
import BuyerInfoForm from '@/components/contracts/BuyerInfoForm';
import VehicleInfoForm from '@/components/contracts/VehicleInfoForm';
import PackageSelectionStep from '@/components/contracts/PackageSelectionStep';
import { FileUploadSummary, VehicleInfoSummary } from '@/components/contracts/CompletedStepSummary';
import useCarSelection from '@/hooks/useCarSelection';
import useInsuranceCalculation from '@/hooks/useInsuranceCalculation';
import useFormValidation from '@/hooks/useFormValidation';
import { type BaseContractFormData } from '@/types/contract';

// Extended interface for additional fields specific to new contract page
interface FormData extends BaseContractFormData {
  // Additional UI-specific fields not in BaseContractFormData
  selectedProvince: string; // province_code
  selectedProvinceText: string; // province_name for display
  selectedDistrictWard: string; // district/ward id
  selectedDistrictWardText: string; // district/ward name for display
  specificAddress: string;
  nhanHieu: string;
  soLoai: string;
  customRates: number[];
  selectedNNTXPackage: string;
  tinhTrang: string;
  // Calculated fee fields for database storage
  phiVatChatGoc: number;
  phiTruocKhiGiam: number;
  phiSauKhiGiam: number;
  totalAmount: number;
  // Ensure diaChi is included (from BaseContractFormData)
}

export default function NewContractPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [nntxFee, setNntxFee] = useState(0);
  const [customRate, setCustomRate] = useState<number | null>(null);
  const [isCustomRateModified, setIsCustomRateModified] = useState(false);
  const [uploadedFiles] = useState({
    cavetFileName: '',
    dangkiemFileName: ''
  });
  
  // Form data
  const [formData, setFormData] = useState<FormData>({
    // Customer/Owner Information (consolidated)
    chuXe: '',
    email: '',
    soDienThoai: '',
    cccd: '',
    gioiTinh: 'nam',
    userType: 'ca_nhan',
    
    // Address Structure (from BaseContractFormData)
    diaChi: '',
    selectedProvince: '',
    selectedProvinceText: '',
    selectedDistrictWard: '',
    selectedDistrictWardText: '',
    specificAddress: '',
    
    // Vehicle Information (BaseContractFormData)
    bienSo: '',
    soKhung: '',
    soMay: '',
    tenXe: '',
    namSanXuat: '',
    soChoNgoi: '',
    trongTai: '',
    giaTriXe: '',
    loaiHinhKinhDoanh: 'khong_kd_cho_nguoi',
    loaiDongCo: '',
    giaTriPin: '',
    ngayDKLD: '',
    loaiXe: '',
    
    // Vehicle Details from Car Selection
    nhanHieu: '',
    soLoai: '',
    kieuDang: '',
    namPhienBan: '',
    
    // Package Selection & Insurance (BaseContractFormData)
    selectedPackageIndex: 0,
    includeTNDS: true,
    tndsCategory: '',
    includeNNTX: true,
    taiTucPercentage: 0,
    mucKhauTru: 500000,
    
    // Additional UI-specific fields
    customRates: [],
    selectedNNTXPackage: '',
    tinhTrang: 'cap_moi',

    // Calculated fee fields (initialized to 0)
    phiVatChatGoc: 0,
    phiTruocKhiGiam: 0,
    phiSauKhiGiam: 0,
    totalAmount: 0
  });
  
  const router = useRouter();
  
  // Scroll utility function
  const scrollToStep = (stepNumber: number, delay: number = 500) => {
    setTimeout(() => {
      const stepElement = document.querySelector(`[data-step="${stepNumber}"]`);
      if (stepElement) {
        stepElement.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start',
          inline: 'nearest' 
        });
      }
    }, delay);
  };
  
  // Handle vehicle data changes from car selection
  const handleVehicleDataChange = (vehicleData: { tenXe: string; nhanHieu: string; soLoai: string; kieuDang: string; namPhienBan: string }) => {
    setFormData(prev => ({
      ...prev,
      tenXe: vehicleData.tenXe,
      nhanHieu: vehicleData.nhanHieu,
      soLoai: vehicleData.soLoai,
      kieuDang: vehicleData.kieuDang,
      namPhienBan: vehicleData.namPhienBan
    }));
  };

  // Custom hooks
  const { carData, handleBrandChange, handleModelChange, handleInputChange: handleCarInputChange, acceptSuggestedCar, searchCarFromExtractedData } = useCarSelection({
    onVehicleDataChange: handleVehicleDataChange
  });
  const { 
    calculationResult, 
    enhancedResult,
    availablePackages, 
    customRates: _customRates, // eslint-disable-line @typescript-eslint/no-unused-vars
    calculateRates, 
    calculateEnhanced,
    calculateTotal,
    syncPackageFee,
  } = useInsuranceCalculation();
  const { fieldErrors, validateForm } = useFormValidation();



  // Check authentication
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData || !JSON.parse(userData).isLoggedIn) {
      router.push('/');
    }
  }, [router]);


  // Populate form with extracted data
  const populateForm = async (data: any) => {
    const newFormData = { ...formData };
    
    if (data.chuXe) newFormData.chuXe = data.chuXe;
    if (data.diaChi) newFormData.diaChi = data.diaChi;
    if (data.bienSo) newFormData.bienSo = data.bienSo;
    if (data.nhanHieu) newFormData.nhanHieu = data.nhanHieu;
    if (data.soLoai) newFormData.soLoai = data.soLoai;
    if (data.tenXe) newFormData.tenXe = data.tenXe;
    if (data.soKhung) newFormData.soKhung = data.soKhung;
    if (data.soMay) newFormData.soMay = data.soMay;
    if (data.ngayDangKyLanDau) newFormData.ngayDKLD = data.ngayDangKyLanDau;
    if (data.namSanXuat) newFormData.namSanXuat = data.namSanXuat;
    if (data.soChoNgoi) newFormData.soChoNgoi = data.soChoNgoi;
    if (data.trongTaiHangHoa) newFormData.trongTai = data.trongTaiHangHoa;
    if (data.loaiXe) newFormData.loaiXe = data.loaiXe;
    
    // Auto-select loại hình kinh doanh
    if (data.kinhDoanhVanTai && data.loaiXe) {
      const loaiXeText = data.loaiXe.toLowerCase();
      const isKinhDoanh = data.kinhDoanhVanTai.toLowerCase() === 'có';
      
      if (isKinhDoanh) {
        if (loaiXeText.includes('tải')) {
          newFormData.loaiHinhKinhDoanh = 'kd_cho_hang';
        } else if (loaiXeText.includes('bán tải') || loaiXeText.includes('pickup')) {
          newFormData.loaiHinhKinhDoanh = 'kd_pickup_van';
        } else {
          newFormData.loaiHinhKinhDoanh = 'kd_cho_khach_lien_tinh';
        }
      } else {
        if (loaiXeText.includes('tải')) {
          newFormData.loaiHinhKinhDoanh = 'khong_kd_cho_hang';
        } else if (loaiXeText.includes('bán tải') || loaiXeText.includes('pickup')) {
          newFormData.loaiHinhKinhDoanh = 'khong_kd_pickup_van';
        } else {
          newFormData.loaiHinhKinhDoanh = 'khong_kd_cho_nguoi';
        }
      }
    }

    setFormData(newFormData);

    // Auto-search for car information
    await searchCarFromExtractedData(data);
  };


  // Handle form input change
  const handleInputChange = useCallback((field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  // Handle extract success
  const handleExtractSuccess = (data: any) => {
    populateForm(data);
    setCurrentStep(2);
    scrollToStep(2);
  };

  // Handle buyer info completion
  const handleBuyerInfoNext = () => {
    setCurrentStep(3);
    scrollToStep(3);
  };



  // Calculate insurance rates
  const handleCalculateRates = async () => {

    const isValid = await validateForm(formData, carData);
    if (!isValid) {
      return;
    }

    const { result, packages, defaultTndsCategory } = calculateRates(formData);

    // Calculate initial fee values
    const selectedPackage = packages && packages.length > 0 ? packages[0] : null;
    const phiVatChatGoc = selectedPackage ? selectedPackage.fee : 0;

    // Calculate basic totals (will be updated when package is selected)
    const phiTNDS = formData.includeTNDS && defaultTndsCategory && tndsCategories[defaultTndsCategory as keyof typeof tndsCategories]
      ? tndsCategories[defaultTndsCategory as keyof typeof tndsCategories].fee
      : 0;
    const phiNNTX = formData.includeNNTX ? nntxFee : 0;
    const phiTaiTuc = 0; // Will be calculated based on taiTucPercentage

    const phiTruocKhiGiam = phiVatChatGoc + phiTNDS + phiNNTX + phiTaiTuc;
    const phiSauKhiGiam = phiTruocKhiGiam; // Initially same, will change with custom rates

    // Create updated form data with new values
    const updatedFormData = {
      ...formData,
      tndsCategory: defaultTndsCategory && tndsCategories[defaultTndsCategory as keyof typeof tndsCategories]
        ? defaultTndsCategory
        : formData.tndsCategory,
      customRates: result?.finalRates.map(r => r || 0) || [],
      phiVatChatGoc: phiVatChatGoc,
      phiTruocKhiGiam: phiTruocKhiGiam,
      phiSauKhiGiam: phiSauKhiGiam,
      totalAmount: phiSauKhiGiam
    };

    // Update state and calculate enhanced results with updated data immediately
    setFormData(updatedFormData);

    // Note: No need for refreshPackageFees here - calculateRates already created packages with correct fees
    calculateEnhanced(updatedFormData);

    setCurrentStep(4);
    setError('');
    scrollToStep(4);
  };

  // Handle package selection changes
  const handlePackageSelection = (packageIndex: number) => {
    // Calculate updated fee values based on new package selection
    const selectedPackage = availablePackages[packageIndex];
    const phiVatChatGoc = selectedPackage ? selectedPackage.fee : 0;

    // Calculate other fees
    const phiTNDS = formData.includeTNDS && formData.tndsCategory && tndsCategories[formData.tndsCategory as keyof typeof tndsCategories]
      ? tndsCategories[formData.tndsCategory as keyof typeof tndsCategories].fee
      : 0;
    const phiNNTX = formData.includeNNTX ? nntxFee : 0;
    const phiTaiTuc = (() => {
      if (formData.taiTucPercentage !== 0) {
        const totalVehicleValue = calculateTotalVehicleValue(
          parseCurrency(formData.giaTriXe),
          formData.giaTriPin,
          formData.loaiDongCo
        );
        return (totalVehicleValue * formData.taiTucPercentage) / 100;
      }
      return 0;
    })();

    const phiTruocKhiGiam = phiVatChatGoc + phiTNDS + phiNNTX + phiTaiTuc;
    const phiSauKhiGiam = phiTruocKhiGiam; // Will be updated if custom rate is applied

    // Create updated form data with new package selection and calculated fees
    const updatedFormData = {
      ...formData,
      selectedPackageIndex: packageIndex,
      phiVatChatGoc: phiVatChatGoc,
      phiTruocKhiGiam: phiTruocKhiGiam,
      phiSauKhiGiam: phiSauKhiGiam,
      totalAmount: phiSauKhiGiam
    };

    // Update state
    setFormData(updatedFormData);

    // Sync package fee to ensure correct calculation
    syncPackageFee(packageIndex, parseCurrency(formData.giaTriXe), formData.loaiHinhKinhDoanh, formData.loaiDongCo, formData.giaTriPin);

    // Trigger enhanced calculation with updated data immediately
    calculateEnhanced(updatedFormData);
  };

  // Handle recalculate
  const handleRecalculate = () => {
    // Then calculate enhanced results
    calculateEnhanced(formData);
  };


  const totalAmount = enhancedResult ? enhancedResult.grandTotal : calculateTotal(formData);

  // Handle NNTX fee changes from DynamicTNDSSelector
  const handleNNTXFeeChange = (fee: number) => {
    setNntxFee(fee);
  };

  // Handle custom rate changes from PriceSummaryCard
  const handleCustomRateChange = useCallback((customRateValue: number | null, isModified: boolean) => {
    setCustomRate(customRateValue);
    setIsCustomRateModified(isModified);

    // Update formData with new calculated fees when custom rate changes
    if (isModified && customRateValue !== null && availablePackages.length > 0) {
      const selectedPackage = availablePackages[formData.selectedPackageIndex];
      const phiVatChatGoc = selectedPackage ? selectedPackage.fee : 0;

      // Calculate custom vat chat fee
      const totalVehicleValue = calculateTotalVehicleValue(
        parseCurrency(formData.giaTriXe),
        formData.giaTriPin,
        formData.loaiDongCo
      );
      const customVatChatFee = (totalVehicleValue * customRateValue) / 100;

      // Calculate other fees
      const phiTNDS = formData.includeTNDS && formData.tndsCategory && tndsCategories[formData.tndsCategory as keyof typeof tndsCategories]
        ? tndsCategories[formData.tndsCategory as keyof typeof tndsCategories].fee
        : 0;
      const phiNNTX = formData.includeNNTX ? nntxFee : 0;
      const phiTaiTuc = (() => {
        if (formData.taiTucPercentage !== 0) {
          return (totalVehicleValue * formData.taiTucPercentage) / 100;
        }
        return 0;
      })();

      const phiTruocKhiGiam = phiVatChatGoc + phiTNDS + phiNNTX + phiTaiTuc;
      const phiSauKhiGiam = customVatChatFee + phiTNDS + phiNNTX + phiTaiTuc;

      setFormData(prev => ({
        ...prev,
        phiVatChatGoc: phiVatChatGoc,
        phiTruocKhiGiam: phiTruocKhiGiam,
        phiSauKhiGiam: phiSauKhiGiam,
        totalAmount: phiSauKhiGiam
      }));
    }
  }, [availablePackages, formData, nntxFee]);

  // Submit contract
  const submitContract = async () => {
    if (!calculationResult || availablePackages.length === 0) {
      setError('Chưa tính toán phí bảo hiểm');
      return;
    }

    const selectedPackage = availablePackages[formData.selectedPackageIndex];
    if (!selectedPackage || !selectedPackage.available) {
      setError('Vui lòng chọn gói bảo hiểm hợp lệ');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // NNTX fee is already calculated by DynamicTNDSSelector
      
      const getDKBS = (index: number): string[] => {
        switch(index) {
          case 0: return ['Cơ bản'];
          case 1: return ['- AU001: Mới thay cũ'];
          case 2: return ['- AU001: Mới thay cũ', '- AU006: Thủy kích'];
          case 3: return ['- AU001: Mới thay cũ', '- AU002: Lựa chọn cơ sở sửa chữa', '- AU006: Thủy kích'];
          case 4: return ['- AU001: Mới thay cũ', '- AU002: Lựa chọn cơ sở sửa chữa', '- AU006: Thủy kích', '- AU009: Mất cắp bộ phận'];
          default: return [];
        }
      };

      // Use calculated fee data from formData (already calculated in handleCustomRateChange and handlePackageSelection)
      const phiVatChatGoc = formData.phiVatChatGoc;
      const phiTruocKhiGiam = formData.phiTruocKhiGiam;
      const phiSauKhiGiam = formData.phiSauKhiGiam;

      // Calculate final vat chat fee based on custom rate if available
      const finalVatChatFee = isCustomRateModified && customRate
        ? (() => {
            const totalVehicleValue = calculateTotalVehicleValue(
              parseCurrency(formData.giaTriXe),
              formData.giaTriPin,
              formData.loaiDongCo
            );
            return (totalVehicleValue * customRate) / 100;
          })()
        : phiVatChatGoc;

      // Calculate other fees for contract data
      const phiTNDS = formData.includeTNDS && formData.tndsCategory
        ? tndsCategories[formData.tndsCategory as keyof typeof tndsCategories].fee
        : 0;
      const phiNNTX = formData.includeNNTX ? nntxFee : 0;
      const phiTaiTuc = (() => {
        if (formData.taiTucPercentage !== 0) {
          const totalVehicleValue = calculateTotalVehicleValue(
            parseCurrency(formData.giaTriXe),
            formData.giaTriPin,
            formData.loaiDongCo
          );
          return (totalVehicleValue * formData.taiTucPercentage) / 100;
        }
        return 0;
      })();

      const contractData = {
        chuXe: formData.chuXe,
        diaChi: formData.diaChi, // Specific address
        // Buyer information
        buyerEmail: formData.email,
        buyerPhone: formData.soDienThoai,
        buyerGender: formData.gioiTinh,
        buyerCitizenId: formData.cccd,
        selectedProvince: formData.selectedProvince,
        selectedProvinceText: formData.selectedProvinceText,
        selectedDistrictWard: formData.selectedDistrictWard,
        selectedDistrictWardText: formData.selectedDistrictWardText,
        specificAddress: formData.specificAddress,
        // Vehicle information
        bienSo: formData.bienSo,
        nhanHieu: formData.nhanHieu,
        soLoai: formData.soLoai,
        soKhung: formData.soKhung,
        soMay: formData.soMay,
        ngayDKLD: formData.ngayDKLD,
        namSanXuat: Number(formData.namSanXuat),
        soChoNgoi: Number(formData.soChoNgoi),
        trongTai: Number(formData.trongTai) || undefined,
        giaTriXe: parseCurrency(formData.giaTriXe),
        loaiHinhKinhDoanh: formData.loaiHinhKinhDoanh,
        loaiDongCo: formData.loaiDongCo,
        giaTriPin: formData.giaTriPin ? parseCurrency(formData.giaTriPin) : undefined,
        loaiXe: formData.loaiXe,
        carBrand: carData.selectedBrand,
        carModel: carData.selectedModel,
        carBodyStyle: carData.selectedBodyStyle,
        carYear: carData.selectedYear,
        vatChatPackage: {
          name: selectedPackage.name,
          tyLePhi: selectedPackage.rate, // Original package rate
          customRate: isCustomRateModified ? customRate : undefined, // Custom rate if modified
          isCustomRate: isCustomRateModified, // Flag to indicate if custom rate is used
          phiVatChatGoc: phiVatChatGoc, // Phí vật chất theo rate gốc
          phiVatChat: finalVatChatFee, // Phí vật chất cuối cùng (đã custom)
          taiTucPercentage: formData.taiTucPercentage,
          dkbs: getDKBS(formData.selectedPackageIndex)
        },
        includeTNDS: formData.includeTNDS,
        tndsCategory: formData.tndsCategory,
        phiTNDS: phiTNDS,
        includeNNTX: formData.includeNNTX,
        selectedNNTXPackage: formData.selectedNNTXPackage,
        phiNNTX: phiNNTX,
        phiPin: enhancedResult?.totalBatteryFee || 0,
        mucKhauTru: formData.mucKhauTru,
        taiTucPercentage: formData.taiTucPercentage,
        phiTaiTuc: phiTaiTuc,
        phiTruocKhiGiam: phiTruocKhiGiam,
        phiSauKhiGiam: phiSauKhiGiam,
        tongPhi: phiSauKhiGiam
      };

      const response = await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contractData)
      });

      if (response.ok) {
        const result = await response.json();
        router.push(`/contracts/${result.contract.id}`);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Lỗi khi tạo hợp đồng');
      }
    } catch (error: unknown) {
      console.error('Submit error:', error);
      setError('Đã có lỗi xảy ra khi tạo hợp đồng');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-4 lg:p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white mb-4">Tạo báo giá mới</h1>
            <StepIndicator currentStep={currentStep} />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm mb-6">
              {error}
            </div>
          )}

          {/* Progressive Steps */}
          <div className="space-y-6">
            {/* Step 1: Upload Images */}
            <div data-step="1">
              <StepWrapper
                stepNumber={1}
                title="Bước 1: Tải ảnh"
                currentStep={currentStep}
                isCompleted={currentStep > 1}
                summary={currentStep > 1 ? (
                  <FileUploadSummary 
                    cavetFileName={uploadedFiles.cavetFileName}
                    dangkiemFileName={uploadedFiles.dangkiemFileName}
                  />
                ) : undefined}
              >
                <FileUploadStep 
                  onExtractSuccess={handleExtractSuccess}
                  error={error}
                />
              </StepWrapper>
            </div>

            {/* Step 2: Buyer Information */}
            {currentStep >= 2 && (
              <div data-step="2">
                <StepWrapper
                  stepNumber={2}
                  title="Bước 2: Xác nhận thông tin"
                  currentStep={currentStep}
                  isCompleted={currentStep > 2}
                  summary={currentStep > 2 ? (
                    <div className="text-sm text-white/70 space-y-1">
                      <p><strong>Họ tên:</strong> {formData.chuXe}</p>
                      <p><strong>Email:</strong> {formData.email}</p>
                      <p><strong>Điện thoại:</strong> {formData.soDienThoai}</p>
                      <p><strong>Địa chỉ:</strong> {formData.selectedProvinceText}, {formData.selectedDistrictWardText}</p>
                    </div>
                  ) : undefined}
                >
                  <BuyerInfoForm
                    formData={formData}
                    fieldErrors={fieldErrors}
                    onFormInputChange={handleInputChange}
                    onNext={handleBuyerInfoNext}
                  />
                </StepWrapper>
              </div>
            )}

            {/* Step 3: Verify Vehicle Information */}
            {currentStep >= 3 && (
              <div data-step="3">
                <StepWrapper
                  stepNumber={3}
                  title="Bước 3: Thông tin xe"
                  currentStep={currentStep}
                  isCompleted={currentStep > 3}
                  summary={currentStep > 3 ? (
                    <VehicleInfoSummary formData={formData} />
                  ) : undefined}
                >
                  <VehicleInfoForm
                    formData={formData}
                    carData={carData}
                    fieldErrors={fieldErrors}
                    onFormInputChange={handleInputChange}
                    onBrandChange={handleBrandChange}
                    onModelChange={handleModelChange}
                    onCarInputChange={handleCarInputChange}
                    onAcceptSuggestion={acceptSuggestedCar}
                    onCalculateRates={handleCalculateRates}
                    onVehicleDataChange={handleVehicleDataChange}
                  />
                </StepWrapper>
              </div>
            )}

            {/* Step 4: Package Selection */}
            {currentStep >= 4 && calculationResult && availablePackages.length > 0 && (
              <div data-step="4">
                <StepWrapper
                  stepNumber={4}
                  title="Bước 4: Chọn gói & Tạo báo giá"
                  currentStep={currentStep}
                  isCompleted={false}
                  summary={undefined}
                >
                  <PackageSelectionStep
                    availablePackages={availablePackages}
                    calculationResult={calculationResult}
                    enhancedResult={enhancedResult || undefined}
                    formData={formData}
                    totalAmount={totalAmount}
                    nntxFee={nntxFee}
                    loading={loading}
                    onFormInputChange={handleInputChange}
                    onPackageSelect={handlePackageSelection}
                    onSubmit={submitContract}
                    onRecalculate={handleRecalculate}
                    onNNTXFeeChange={handleNNTXFeeChange}
                    onCustomRateChange={handleCustomRateChange}
                  />
                </StepWrapper>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}