'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  parseCurrency,
  tndsCategories
} from '@/utils/insurance-calculator';
import StepIndicator from '@/components/contracts/StepIndicator';
import StepWrapper from '@/components/contracts/StepWrapper';
import FileUploadStep from '@/components/contracts/FileUploadStep';
import BuyerInfoForm from '@/components/contracts/BuyerInfoForm';
import VehicleInfoForm from '@/components/contracts/VehicleInfoForm';
import PackageSelectionStep from '@/components/contracts/PackageSelectionStep';
import { FileUploadSummary, VehicleInfoSummary, PackageSelectionSummary } from '@/components/contracts/CompletedStepSummary';
import useCarSelection from '@/hooks/useCarSelection';
import useInsuranceCalculation from '@/hooks/useInsuranceCalculation';
import useFormValidation from '@/hooks/useFormValidation';


interface FormData {
  // Thông tin khách hàng
  chuXe: string;
  diaChi: string;
  
  // Thông tin người mua (buyer information)
  buyerEmail: string;
  buyerPhone: string;
  buyerGender: 'nam' | 'nu' | 'khac';
  buyerCitizenId: string;
  selectedProvince: string; // province_code
  selectedProvinceText: string; // province_name for display
  selectedDistrictWard: string; // district/ward id
  selectedDistrictWardText: string; // district/ward name for display
  specificAddress: string;
  
  // Thông tin xe
  bienSo: string;
  nhanHieu: string;
  soLoai: string;
  soKhung: string;
  soMay: string;
  ngayDKLD: string;
  namSanXuat: number | '';
  soChoNgoi: number | '';
  trongTai: number | '';
  giaTriXe: string;
  loaiHinhKinhDoanh: string;
  loaiDongCo: string;
  giaTriPin: string;
  
  // Gói bảo hiểm
  selectedPackageIndex: number;
  customRates: number[];
  
  // Các loại phí
  includeTNDS: boolean;
  tndsCategory: string;
  includeNNTX: boolean;
  selectedNNTXPackage: string;
  tinhTrang: string;
  mucKhauTru: number; // 500000 or 1000000
  taiTucPercentage: number; // percentage for renewal discount/markup
}

export default function NewContractPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState({
    cavetFileName: '',
    dangkiemFileName: ''
  });
  
  // Form data
  const [formData, setFormData] = useState<FormData>({
    chuXe: '',
    diaChi: '',
    // Buyer information defaults
    buyerEmail: '',
    buyerPhone: '',
    buyerGender: 'nam',
    buyerCitizenId: '',
    selectedProvince: '',
    selectedProvinceText: '',
    selectedDistrictWard: '',
    selectedDistrictWardText: '',
    specificAddress: '',
    bienSo: '',
    nhanHieu: '',
    soLoai: '',
    soKhung: '',
    soMay: '',
    ngayDKLD: '',
    namSanXuat: '',
    soChoNgoi: '',
    trongTai: '',
    giaTriXe: '',
    loaiHinhKinhDoanh: 'khong_kd_cho_nguoi',
    loaiDongCo: '',
    giaTriPin: '',
    selectedPackageIndex: 0,
    customRates: [],
    includeTNDS: true,
    tndsCategory: '',
    includeNNTX: true,
    selectedNNTXPackage: '',
    tinhTrang: 'cap_moi',
    mucKhauTru: 500000, // Default to 500K
    taiTucPercentage: 0 // Default to 0% (Cấp mới)
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
  
  // Custom hooks
  const { carData, handleBrandChange, handleModelChange, handleInputChange: handleCarInputChange, acceptSuggestedCar, searchCarFromExtractedData } = useCarSelection();
  const { 
    calculationResult, 
    enhancedResult,
    availablePackages, 
    customRates,
    calculateRates, 
    calculateEnhanced,
    calculateTotal,
    updatePackageRate,
    syncPackageFee,
    autoSuggestTNDS
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
    if (data.soKhung) newFormData.soKhung = data.soKhung;
    if (data.soMay) newFormData.soMay = data.soMay;
    if (data.ngayDangKyLanDau) newFormData.ngayDKLD = data.ngayDangKyLanDau;
    if (data.namSanXuat) newFormData.namSanXuat = data.namSanXuat;
    if (data.soChoNgoi) newFormData.soChoNgoi = data.soChoNgoi;
    if (data.trongTaiHangHoa) newFormData.trongTai = data.trongTaiHangHoa;
    
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
  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

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


  // Track uploaded files
  const handleFileUpload = (files: { cavet?: File; dangkiem?: File }) => {
    setUploadedFiles({
      cavetFileName: files.cavet?.name || uploadedFiles.cavetFileName,
      dangkiemFileName: files.dangkiem?.name || uploadedFiles.dangkiemFileName
    });
  };

  // Calculate insurance rates
  const handleCalculateRates = async () => {
    const isValid = await validateForm(formData, carData);
    if (!isValid) {
      return;
    }

    const { result, packages, defaultTndsCategory } = calculateRates(formData);
    
    if (defaultTndsCategory && tndsCategories[defaultTndsCategory as keyof typeof tndsCategories]) {
      setFormData(prev => ({ ...prev, tndsCategory: defaultTndsCategory }));
    }

    // Initialize custom rates with base rates
    setFormData(prev => ({ 
      ...prev, 
      customRates: result?.finalRates.map(r => r || 0) || []
    }));

    // Calculate enhanced results with initial custom rates
    setTimeout(() => {
      calculateEnhanced(formData);
    }, 100);

    setCurrentStep(4);
    setError('');
    scrollToStep(4);
  };

  // Handle package selection changes
  const handlePackageSelection = (packageIndex: number) => {
    setFormData(prev => ({ ...prev, selectedPackageIndex: packageIndex }));
    
    // Sync package fee to ensure correct calculation
    syncPackageFee(packageIndex, parseCurrency(formData.giaTriXe), formData.loaiHinhKinhDoanh);
    
    // Trigger enhanced calculation after package selection
    setTimeout(() => {
      const newFormData = { ...formData, selectedPackageIndex: packageIndex };
      calculateEnhanced(newFormData);
    }, 50);
  };

  // Handle recalculate
  const handleRecalculate = () => {
    setTimeout(() => {
      calculateEnhanced(formData);
    }, 50);
  };

  // Handle package rate changes
  const handleRateChange = (packageIndex: number, newRate: number, newFee: number) => {
    updatePackageRate(packageIndex, newRate, newFee);
    
    // Update custom rates in form data
    setFormData(prev => {
      const newCustomRates = [...(prev.customRates || [])];
      newCustomRates[packageIndex] = newRate;
      return { ...prev, customRates: newCustomRates };
    });

    // Trigger enhanced calculation
    handleRecalculate();
  };

  const totalAmount = enhancedResult ? enhancedResult.grandTotal : calculateTotal(formData);

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
      // Calculate NNTX fee dynamically based on selected package
      let nntxFee = 0;
      if (formData.includeNNTX && formData.selectedNNTXPackage) {
        const { calculateNNTXFeeByPackage } = await import('@/utils/insurance-calculator');
        nntxFee = await calculateNNTXFeeByPackage(formData.selectedNNTXPackage, Number(formData.soChoNgoi));
      }
      
      const totalFee = totalAmount;
      
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

      const contractData = {
        chuXe: formData.chuXe,
        diaChi: formData.diaChi,
        // Buyer information
        buyerEmail: formData.buyerEmail,
        buyerPhone: formData.buyerPhone,
        buyerGender: formData.buyerGender,
        buyerCitizenId: formData.buyerCitizenId,
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
        carBrand: carData.selectedBrand,
        carModel: carData.selectedModel,
        carBodyStyle: carData.selectedBodyStyle,
        carYear: carData.selectedYear,
        vatChatPackage: {
          name: selectedPackage.name,
          tyLePhi: selectedPackage.rate,
          phiVatChat: selectedPackage.fee,
          dkbs: getDKBS(formData.selectedPackageIndex)
        },
        includeTNDS: formData.includeTNDS,
        tndsCategory: formData.tndsCategory,
        phiTNDS: formData.includeTNDS && formData.tndsCategory 
          ? tndsCategories[formData.tndsCategory as keyof typeof tndsCategories].fee 
          : 0,
        includeNNTX: formData.includeNNTX,
        selectedNNTXPackage: formData.selectedNNTXPackage,
        phiNNTX: nntxFee,
        mucKhauTru: formData.mucKhauTru,
        taiTucPercentage: formData.taiTucPercentage,
        tongPhi: totalFee
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
    } catch (error: any) {
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
                      <p><strong>Email:</strong> {formData.buyerEmail}</p>
                      <p><strong>Điện thoại:</strong> {formData.buyerPhone}</p>
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
                    formData={formData}
                    totalAmount={totalAmount}
                    loading={loading}
                    onFormInputChange={handleInputChange}
                    onPackageSelect={handlePackageSelection}
                    onSubmit={submitContract}
                    onRateChange={handleRateChange}
                    onRecalculate={handleRecalculate}
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