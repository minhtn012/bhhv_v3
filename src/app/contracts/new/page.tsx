'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  parseCurrency,
  tndsCategories
} from '@/utils/insurance-calculator';
import StepIndicator from '@/components/contracts/StepIndicator';
import FileUploadStep from '@/components/contracts/FileUploadStep';
import VehicleInfoForm from '@/components/contracts/VehicleInfoForm';
import PackageSelectionStep from '@/components/contracts/PackageSelectionStep';
import useCarSelection from '@/hooks/useCarSelection';
import useInsuranceCalculation from '@/hooks/useInsuranceCalculation';
import useFormValidation from '@/hooks/useFormValidation';


interface FormData {
  // Thông tin khách hàng
  chuXe: string;
  diaChi: string;
  
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
  
  // Gói bảo hiểm
  selectedPackageIndex: number;
  customRates: number[];
  
  // Các loại phí
  includeTNDS: boolean;
  tndsCategory: string;
  includeNNTX: boolean;
}

export default function NewContractPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form data
  const [formData, setFormData] = useState<FormData>({
    chuXe: '',
    diaChi: '',
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
    selectedPackageIndex: 0,
    customRates: [],
    includeTNDS: true,
    tndsCategory: '',
    includeNNTX: true
  });
  
  const router = useRouter();
  
  // Custom hooks
  const { carData, handleBrandChange, handleModelChange, handleInputChange: handleCarInputChange, acceptSuggestedCar, searchCarFromExtractedData } = useCarSelection();
  const { calculationResult, availablePackages, calculateRates, calculateTotal } = useInsuranceCalculation();
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

    setFormData(prev => ({ 
      ...prev, 
      customRates: result.finalRates.map(r => r || 0) 
    }));

    setCurrentStep(3);
    setError('');
  };

  const totalAmount = calculateTotal(formData);

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
        phiNNTX: formData.includeNNTX ? calculationResult.nntxFee : 0,
        tongPhi: totalFee,
        mucKhauTru: calculationResult.mucKhauTru
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

          {/* Step 1: Upload Images */}
          {currentStep === 1 && (
            <FileUploadStep 
              onExtractSuccess={handleExtractSuccess}
              error={error}
            />
          )}

          {/* Step 2: Verify Information */}
          {currentStep === 2 && (
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
          )}

          {/* Step 3: Package Selection */}
          {currentStep === 3 && calculationResult && availablePackages.length > 0 && (
            <PackageSelectionStep
              availablePackages={availablePackages}
              calculationResult={calculationResult}
              formData={formData}
              totalAmount={totalAmount}
              loading={loading}
              onFormInputChange={handleInputChange}
              onSubmit={submitContract}
            />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}