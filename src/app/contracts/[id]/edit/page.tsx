'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  parseCurrency,
  formatCurrency,
  tndsCategories
} from '@/utils/insurance-calculator';
import BuyerInfoForm from '@/components/contracts/BuyerInfoForm';
import VehicleInfoForm from '@/components/contracts/VehicleInfoForm';
import PackageSelectionStep from '@/components/contracts/PackageSelectionStep';
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
  selectedProvince: string;
  selectedProvinceText: string;
  selectedDistrictWard: string;
  selectedDistrictWardText: string;
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
  mucKhauTru: number;
  taiTucPercentage: number;
}

interface Contract {
  _id: string;
  contractNumber: string;
  chuXe: string;
  diaChi: string;
  
  // Buyer information
  buyerEmail?: string;
  buyerPhone?: string;
  buyerGender?: 'nam' | 'nu' | 'khac';
  buyerCitizenId?: string;
  selectedProvince?: string;
  selectedProvinceText?: string;
  selectedDistrictWard?: string;
  selectedDistrictWardText?: string;
  specificAddress?: string;
  
  bienSo: string;
  nhanHieu: string;
  soLoai: string;
  soKhung: string;
  soMay: string;
  ngayDKLD: string;
  namSanXuat: number;
  soChoNgoi: number;
  trongTai?: number;
  giaTriXe: number;
  loaiHinhKinhDoanh: string;
  
  // Car selection data
  carBrand?: string;
  carModel?: string;
  carBodyStyle?: string;
  carYear?: number;
  
  vatChatPackage: {
    name: string;
    tyLePhi: number;
    phiVatChat: number;
    dkbs: string[];
  };
  
  includeTNDS: boolean;
  tndsCategory: string;
  phiTNDS: number;
  
  includeNNTX: boolean;
  phiNNTX: number;
  
  tongPhi: number;
  mucKhauTru: number;
  
  status: 'nhap' | 'cho_duyet' | 'khach_duyet' | 'ra_hop_dong' | 'huy';
  
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export default function EditContractPage() {
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Form data
  const [formData, setFormData] = useState<FormData>({
    chuXe: '',
    diaChi: '',
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
    mucKhauTru: 500000,
    taiTucPercentage: 0
  });
  
  const router = useRouter();
  const params = useParams();
  const contractId = params.id as string;
  
  // Custom hooks
  const { carData, handleBrandChange, handleModelChange, handleInputChange: handleCarInputChange, acceptSuggestedCar } = useCarSelection();
  const { 
    calculationResult, 
    enhancedResult,
    availablePackages, 
    calculateRates, 
    calculateEnhanced,
    calculateTotal,
    updatePackageRate,
    syncPackageFee
  } = useInsuranceCalculation();
  const { fieldErrors, validateForm } = useFormValidation();

  // Check authentication and fetch contract
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      if (user.isLoggedIn) {
        setCurrentUser(user);
      } else {
        router.push('/');
        return;
      }
    } else {
      router.push('/');
      return;
    }

    if (contractId) {
      fetchContract();
    }
  }, [router, contractId]);

  const fetchContract = async () => {
    try {
      const response = await fetch(`/api/contracts/${contractId}`);
      const data = await response.json();

      if (response.ok) {
        setContract(data.contract);
        populateFormFromContract(data.contract);
        setError('');
      } else {
        setError(data.error || 'Lỗi khi tải thông tin hợp đồng');
        if (response.status === 404) {
          router.push('/contracts');
        }
      }
    } catch (error) {
      setError('Lỗi kết nối');
      console.error('Fetch contract error:', error);
    } finally {
      setLoading(false);
    }
  };

  const populateFormFromContract = (contractData: Contract) => {
    setFormData({
      chuXe: contractData.chuXe,
      diaChi: contractData.diaChi,
      buyerEmail: contractData.buyerEmail || '',
      buyerPhone: contractData.buyerPhone || '',
      buyerGender: contractData.buyerGender || 'nam',
      buyerCitizenId: contractData.buyerCitizenId || '',
      selectedProvince: contractData.selectedProvince || '',
      selectedProvinceText: contractData.selectedProvinceText || '',
      selectedDistrictWard: contractData.selectedDistrictWard || '',
      selectedDistrictWardText: contractData.selectedDistrictWardText || '',
      specificAddress: contractData.specificAddress || '',
      bienSo: contractData.bienSo,
      nhanHieu: contractData.nhanHieu,
      soLoai: contractData.soLoai,
      soKhung: contractData.soKhung,
      soMay: contractData.soMay,
      ngayDKLD: contractData.ngayDKLD,
      namSanXuat: contractData.namSanXuat,
      soChoNgoi: contractData.soChoNgoi,
      trongTai: contractData.trongTai || '',
      giaTriXe: formatCurrency(contractData.giaTriXe),
      loaiHinhKinhDoanh: contractData.loaiHinhKinhDoanh,
      loaiDongCo: '',
      giaTriPin: '',
      selectedPackageIndex: 0, // Will be determined after calculation
      customRates: [],
      includeTNDS: contractData.includeTNDS,
      tndsCategory: contractData.tndsCategory,
      includeNNTX: contractData.includeNNTX,
      selectedNNTXPackage: '',
      tinhTrang: 'cap_moi',
      mucKhauTru: contractData.mucKhauTru,
      taiTucPercentage: 0
    });

    // Set car data if available
    if (contractData.carBrand) {
      handleBrandChange(contractData.carBrand);
      if (contractData.carModel) {
        handleModelChange(contractData.carModel);
      }
    }

    // Calculate initial rates
    setTimeout(() => {
      calculateInitialRates(contractData);
    }, 500);
  };

  const calculateInitialRates = (contractData: Contract) => {
    const tempFormData = {
      ...formData,
      giaTriXe: formatCurrency(contractData.giaTriXe),
      loaiHinhKinhDoanh: contractData.loaiHinhKinhDoanh,
      namSanXuat: contractData.namSanXuat,
      soChoNgoi: contractData.soChoNgoi
    };

    const { result, packages } = calculateRates(tempFormData);
    
    if (result && packages) {
      // Find the package that matches the current contract
      let matchingPackageIndex = 0;
      packages.forEach((pkg, index) => {
        if (Math.abs(pkg.rate - contractData.vatChatPackage.tyLePhi) < 0.01) {
          matchingPackageIndex = index;
        }
      });

      setFormData(prev => ({ 
        ...prev, 
        selectedPackageIndex: matchingPackageIndex,
        customRates: result?.finalRates.map(r => r || 0) || []
      }));

      setTimeout(() => {
        calculateEnhanced({...tempFormData, selectedPackageIndex: matchingPackageIndex});
      }, 100);
    }
  };

  // Handle form input change
  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handle package selection changes
  const handlePackageSelection = (packageIndex: number) => {
    setFormData(prev => ({ ...prev, selectedPackageIndex: packageIndex }));
    
    syncPackageFee(packageIndex, parseCurrency(formData.giaTriXe), formData.loaiHinhKinhDoanh);
    
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
    
    setFormData(prev => {
      const newCustomRates = [...(prev.customRates || [])];
      newCustomRates[packageIndex] = newRate;
      return { ...prev, customRates: newCustomRates };
    });

    handleRecalculate();
  };

  const totalAmount = enhancedResult ? enhancedResult.grandTotal : calculateTotal(formData);

  // Update contract
  const updateContract = async () => {
    if (!contract || !calculationResult || availablePackages.length === 0) {
      setError('Chưa tính toán phí bảo hiểm');
      return;
    }

    const selectedPackage = availablePackages[formData.selectedPackageIndex];
    if (!selectedPackage || !selectedPackage.available) {
      setError('Vui lòng chọn gói bảo hiểm hợp lệ');
      return;
    }

    const isValid = await validateForm(formData, carData);
    if (!isValid) {
      setError('Vui lòng kiểm tra lại thông tin nhập');
      return;
    }

    setSubmitting(true);
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

      const updateData = {
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
        phiNNTX: nntxFee,
        mucKhauTru: formData.mucKhauTru,
        tongPhi: totalFee
      };

      const response = await fetch(`/api/contracts/${contractId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        router.push(`/contracts/${contractId}`);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Lỗi khi cập nhật hợp đồng');
      }
    } catch (error: any) {
      console.error('Update error:', error);
      setError('Đã có lỗi xảy ra khi cập nhật hợp đồng');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!contract) {
    return (
      <DashboardLayout>
        <div className="p-4 lg:p-6">
          <div className="text-center text-gray-400">
            <p>Không tìm thấy hợp đồng</p>
            <button
              onClick={() => router.push('/contracts')}
              className="mt-4 text-blue-400 hover:text-blue-300"
            >
              ← Quay lại danh sách
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (contract.status !== 'nhap') {
    return (
      <DashboardLayout>
        <div className="p-4 lg:p-6">
          <div className="text-center text-gray-400">
            <p>Chỉ có thể chỉnh sửa hợp đồng ở trạng thái nháp</p>
            <button
              onClick={() => router.push(`/contracts/${contractId}`)}
              className="mt-4 text-blue-400 hover:text-blue-300"
            >
              ← Quay lại chi tiết hợp đồng
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-4 lg:p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={() => router.push(`/contracts/${contractId}`)}
              className="text-blue-400 hover:text-blue-300 mb-4"
            >
              ← Quay lại chi tiết hợp đồng
            </button>
            
            <h1 className="text-xl lg:text-2xl font-bold text-white mb-3">
              Chỉnh sửa hợp đồng {contract.contractNumber}
            </h1>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm mb-6">
              {error}
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Buyer Information */}
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Thông tin khách hàng</h2>
                <BuyerInfoForm
                  formData={{
                    chuXe: formData.chuXe,
                    buyerEmail: formData.buyerEmail,
                    buyerPhone: formData.buyerPhone,
                    buyerGender: formData.buyerGender,
                    buyerCitizenId: formData.buyerCitizenId,
                    selectedProvince: formData.selectedProvince,
                    selectedProvinceText: formData.selectedProvinceText,
                    selectedDistrictWard: formData.selectedDistrictWard,
                    selectedDistrictWardText: formData.selectedDistrictWardText,
                    specificAddress: formData.specificAddress
                  }}
                  fieldErrors={fieldErrors}
                  onFormInputChange={handleInputChange}
                  onNext={() => {}} // Not used in edit mode
                  hideNextButton={true}
                />
              </div>

              {/* Vehicle Information */}
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Thông tin xe</h2>
                
                {/* Address field */}
                <div className="mb-6">
                  <label className="block text-white font-medium mb-2">Địa chỉ (theo đăng ký xe)</label>
                  <textarea
                    value={formData.diaChi}
                    onChange={(e) => handleInputChange('diaChi', e.target.value)}
                    className="w-full bg-slate-700/50 border border-slate-500/30 rounded-xl px-4 py-3 text-white h-20 resize-none"
                    placeholder="Nhập địa chỉ theo đăng ký xe..."
                    required
                  />
                </div>

                <VehicleInfoForm
                  formData={formData}
                  carData={carData}
                  fieldErrors={fieldErrors}
                  onFormInputChange={handleInputChange}
                  onBrandChange={handleBrandChange}
                  onModelChange={handleModelChange}
                  onCarInputChange={handleCarInputChange}
                  onAcceptSuggestion={acceptSuggestedCar}
                  onCalculateRates={handleRecalculate}
                  hideCalculateButton={true}
                />
              </div>

              {/* Package Selection */}
              {calculationResult && availablePackages.length > 0 && (
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
                  <h2 className="text-xl font-semibold text-white mb-4">Gói bảo hiểm</h2>
                  <PackageSelectionStep
                    availablePackages={availablePackages}
                    calculationResult={calculationResult}
                    formData={formData}
                    totalAmount={totalAmount}
                    loading={submitting}
                    onFormInputChange={handleInputChange}
                    onPackageSelect={handlePackageSelection}
                    onSubmit={updateContract}
                    onRateChange={handleRateChange}
                    onRecalculate={handleRecalculate}
                    submitButtonText="Cập nhật hợp đồng"
                  />
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Summary */}
              <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-2xl p-6">
                <h3 className="text-xl font-bold text-center text-white mb-4">TỔNG HỢP PHÍ</h3>
                
                {enhancedResult && (
                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex justify-between py-1 border-b border-dashed border-white/20">
                      <span className="text-gray-300">Vật chất:</span>
                      <span className="font-semibold text-white">{formatCurrency(enhancedResult.vatChatFee)}</span>
                    </div>
                    
                    <div className="flex justify-between py-1 border-b border-dashed border-white/20">
                      <span className="text-gray-300">TNDS:</span>
                      <span className="font-semibold text-white">{formatCurrency(enhancedResult.tndsFee)}</span>
                    </div>
                    
                    <div className="flex justify-between py-1 border-b border-dashed border-white/20">
                      <span className="text-gray-300">NNTX:</span>
                      <span className="font-semibold text-white">{formatCurrency(enhancedResult.nntxFee)}</span>
                    </div>
                    
                    <div className="flex justify-between py-1">
                      <span className="text-gray-300">Khấu trừ:</span>
                      <span className="font-semibold text-white">{formatCurrency(formData.mucKhauTru)}/vụ</span>
                    </div>
                  </div>
                )}

                <hr className="border-white/20 my-4" />
                
                <div className="flex justify-between items-center text-base">
                  <span className="font-bold text-white">TỔNG CỘNG:</span>
                  <span className="font-extrabold text-xl text-blue-400">{formatCurrency(totalAmount)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Thao tác</h3>
                <div className="space-y-3">
                  <button
                    onClick={handleRecalculate}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-xl transition-colors"
                  >
                    Tính lại phí
                  </button>
                  <button
                    onClick={updateContract}
                    disabled={submitting || !calculationResult}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-medium py-3 px-4 rounded-xl transition-colors"
                  >
                    {submitting ? 'Đang cập nhật...' : 'Cập nhật hợp đồng'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}