'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import {
  parseCurrency,
  formatCurrency,
  tndsCategories,
  calculateTotalVehicleValue,
  packageLabels,
  packageLabelsDetail
} from '@/utils/insurance-calculator';
import BuyerInfoForm from '@/components/contracts/BuyerInfoForm';
import VehicleInfoForm from '@/components/contracts/VehicleInfoForm';
import PackageSelectionStep from '@/components/contracts/PackageSelectionStep';
import useCarSelection from '@/hooks/useCarSelection';
import useInsuranceCalculation from '@/hooks/useInsuranceCalculation';
import useFormValidation from '@/hooks/useFormValidation';
import { type BaseContractFormData } from '@/types/contract';

// Extended interface for additional fields specific to edit contract page
interface FormData extends BaseContractFormData {
  // Additional UI-specific fields not in BaseContractFormData
  buyerEmail: string;
  buyerPhone: string;
  buyerGender: 'nam' | 'nu' | 'khac';
  buyerCccd: string;
  customRates: number[];
  selectedNNTXPackage: string;
  tinhTrang: string;
  // Calculated fee fields for database storage
  phiVatChatGoc: number;
  phiTruocKhiGiam: number;
  phiSauKhiGiam: number;
  totalAmount: number;
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
  loaiDongCo?: string;
  giaTriPin?: number;
  loaiXe?: string;

  // Car selection data
  carBrand?: string;
  carModel?: string;
  carBodyStyle?: string;
  carYear?: string;
  
  vatChatPackage: {
    name: string;
    tyLePhi: number;
    customRate?: number;
    isCustomRate?: boolean;
    phiVatChatGoc?: number;
    phiVatChat: number;
    dkbs: string[];
  };
  
  includeTNDS: boolean;
  tndsCategory: string;
  phiTNDS: number;
  
  includeNNTX: boolean;
  phiNNTX: number;

  // Tái tục/Cấp mới
  taiTucPercentage?: number;
  phiTaiTuc?: number;

  phiTruocKhiGiam?: number;
  phiSauKhiGiam?: number;
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
  const [currentUser, setCurrentUser] = useState<unknown>(null);
  const [initializingCarData, setInitializingCarData] = useState(false);
  const [customRate, setCustomRate] = useState<number | null>(null);
  const [isCustomRateModified, setIsCustomRateModified] = useState(false);
  const [nntxFee, setNntxFee] = useState(0);
  
  // Form data
  const [formData, setFormData] = useState<FormData>({
    // Customer Information (BaseContractFormData)
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
    
    // Extended buyer information for edit
    buyerEmail: '',
    buyerPhone: '',
    buyerGender: 'nam',
    buyerCccd: '',
    
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
  const params = useParams();
  const contractId = params.id as string;
  
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
  const { carData, handleBrandChange, handleModelChange, handleInputChange: handleCarInputChange, acceptSuggestedCar, initializeFromExistingContract } = useCarSelection({
    onVehicleDataChange: handleVehicleDataChange
  });
  const { 
    calculationResult, 
    enhancedResult,
    availablePackages, 
    calculateRates, 
    calculateEnhanced,
    calculateTotal,
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
        await populateFormFromContract(data.contract);
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

  const populateFormFromContract = async (contractData: Contract) => {
    // Set NNTX fee from contract data
    setNntxFee(contractData.phiNNTX || 0);

    // Initialize custom rate from contract if it was modified
    if (contractData.vatChatPackage.isCustomRate && contractData.vatChatPackage.customRate) {
      setCustomRate(contractData.vatChatPackage.customRate);
      setIsCustomRateModified(true);
    }

    // Try to determine the selected NNTX package from the stored fee
    let selectedNNTXPackage = '';
    if (contractData.includeNNTX && contractData.phiNNTX > 0) {
      try {
        const { loadNNTXPackages, calculateNNTXFee } = await import('@/utils/insurance-calculator');
        const packages = await loadNNTXPackages();
        const isBusinessVehicle = contractData.loaiHinhKinhDoanh?.startsWith('kd_') || false;

        // Find package that matches the stored fee
        for (const pkg of packages) {
          const packagePrice = isBusinessVehicle ? (pkg.price_kd || pkg.price) : pkg.price;
          const calculatedFee = calculateNNTXFee(packagePrice, contractData.soChoNgoi, contractData.loaiHinhKinhDoanh);
          if (Math.abs(calculatedFee - contractData.phiNNTX) < 1) { // Allow small rounding difference
            selectedNNTXPackage = pkg.value;
            break;
          }
        }
      } catch (error) {
        console.error('Error determining NNTX package:', error);
      }
    }

    // Set basic form data first
    setFormData({
      // Customer Information (BaseContractFormData)
      chuXe: contractData.chuXe,
      email: contractData.buyerEmail || '',
      soDienThoai: contractData.buyerPhone || '',
      cccd: contractData.buyerCitizenId || '',
      gioiTinh: contractData.buyerGender || 'nam',
      userType: 'ca_nhan',

      // Address Structure (BaseContractFormData)
      diaChi: contractData.diaChi,
      selectedProvince: contractData.selectedProvince || '',
      selectedProvinceText: contractData.selectedProvinceText || '',
      selectedDistrictWard: contractData.selectedDistrictWard || '',
      selectedDistrictWardText: contractData.selectedDistrictWardText || '',
      specificAddress: contractData.specificAddress || '',

      // Vehicle Information (BaseContractFormData)
      bienSo: contractData.bienSo,
      soKhung: contractData.soKhung,
      soMay: contractData.soMay,
      namSanXuat: contractData.namSanXuat,
      soChoNgoi: contractData.soChoNgoi,
      trongTai: contractData.trongTai || '',
      giaTriXe: formatCurrency(contractData.giaTriXe),
      loaiHinhKinhDoanh: contractData.loaiHinhKinhDoanh,
      loaiDongCo: contractData.loaiDongCo || '',
      giaTriPin: contractData.giaTriPin ? formatCurrency(contractData.giaTriPin) : '',
      ngayDKLD: contractData.ngayDKLD,
      loaiXe: contractData.loaiXe || '',

      // Vehicle Details from Car Selection (BaseContractFormData)
      tenXe: '',
      nhanHieu: contractData.nhanHieu,
      soLoai: contractData.soLoai,
      kieuDang: contractData.carBodyStyle || '',
      namPhienBan: contractData.carYear || '',

      // Package Selection & Insurance (BaseContractFormData)
      selectedPackageIndex: 0, // Will be determined after calculation
      includeTNDS: contractData.includeTNDS,
      tndsCategory: contractData.tndsCategory,
      includeNNTX: contractData.includeNNTX,
      taiTucPercentage: contractData.taiTucPercentage || 0,
      mucKhauTru: contractData.mucKhauTru,

      // Extended fields specific to edit page
      buyerEmail: contractData.buyerEmail || '',
      buyerPhone: contractData.buyerPhone || '',
      buyerGender: contractData.buyerGender || 'nam',
      buyerCccd: contractData.buyerCitizenId || '',
      customRates: [],
      selectedNNTXPackage: selectedNNTXPackage,
      tinhTrang: 'cap_moi',

      // Calculated fee fields (initialized from contract)
      phiVatChatGoc: contractData.vatChatPackage.phiVatChatGoc || contractData.vatChatPackage.phiVatChat,
      phiTruocKhiGiam: contractData.phiTruocKhiGiam || contractData.tongPhi,
      phiSauKhiGiam: contractData.phiSauKhiGiam || contractData.tongPhi,
      totalAmount: contractData.tongPhi
    });

    // Initialize car data if available
    if (contractData.carBrand && contractData.carModel) {
      setInitializingCarData(true);
      try {
        await initializeFromExistingContract({
          carBrand: contractData.carBrand,
          carModel: contractData.carModel,
          carBodyStyle: contractData.carBodyStyle,
          carYear: contractData.carYear
        });
      } catch (error) {
        console.error('Error initializing car data:', error);
      } finally {
        setInitializingCarData(false);
      }
    }

    // Calculate initial rates after car data is loaded
    calculateInitialRates(contractData);
  };

  const calculateInitialRates = (contractData: Contract) => {
    const tempFormData = {
      ...formData,
      giaTriXe: formatCurrency(contractData.giaTriXe),
      loaiHinhKinhDoanh: contractData.loaiHinhKinhDoanh,
      namSanXuat: contractData.namSanXuat,
      soChoNgoi: contractData.soChoNgoi,
      ngayDKLD: contractData.ngayDKLD,
      trongTai: contractData.trongTai || 0,
      loaiDongCo: contractData.loaiDongCo || '',
      giaTriPin: contractData.giaTriPin ? formatCurrency(contractData.giaTriPin) : ''
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

      // Calculate initial fee values from existing contract data
      const phiVatChatGoc = contractData.vatChatPackage.phiVatChatGoc || contractData.vatChatPackage.phiVatChat;
      const phiTruocKhiGiam = contractData.phiTruocKhiGiam || contractData.tongPhi;
      const phiSauKhiGiam = contractData.phiSauKhiGiam || contractData.tongPhi;

      setFormData(prev => ({
        ...prev,
        selectedPackageIndex: matchingPackageIndex,
        customRates: result?.finalRates.map(r => r || 0) || [],
        phiVatChatGoc: phiVatChatGoc,
        phiTruocKhiGiam: phiTruocKhiGiam,
        phiSauKhiGiam: phiSauKhiGiam,
        totalAmount: contractData.tongPhi
      }));

      setTimeout(() => {
        calculateEnhanced({...tempFormData, selectedPackageIndex: matchingPackageIndex});
      }, 100);
    }
  };

  // Handle form input change
  const handleInputChange = (field: keyof FormData, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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

    setFormData(prev => ({
      ...prev,
      selectedPackageIndex: packageIndex,
      phiVatChatGoc: phiVatChatGoc,
      phiTruocKhiGiam: phiTruocKhiGiam,
      phiSauKhiGiam: phiSauKhiGiam,
      totalAmount: phiSauKhiGiam
    }));

    syncPackageFee(packageIndex, parseCurrency(formData.giaTriXe), formData.loaiHinhKinhDoanh, formData.loaiDongCo, formData.giaTriPin);

    setTimeout(() => {
      const newFormData = { ...formData, selectedPackageIndex: packageIndex };
      calculateEnhanced(newFormData);
    }, 50);
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

  // Handle NNTX fee changes
  const handleNNTXFeeChange = (fee: number) => {
    setNntxFee(fee);
  };

  // Handle recalculate
  const handleRecalculate = () => {
    const { result, packages } = calculateRates(formData);

    if (result && packages) {
      // Preserve the currently selected package index if still valid
      const currentIndex = formData.selectedPackageIndex;
      const isCurrentPackageValid = currentIndex < packages.length && packages[currentIndex].available;
      const selectedIndex = isCurrentPackageValid ? currentIndex : 0;

      setFormData(prev => ({
        ...prev,
        selectedPackageIndex: selectedIndex,
        customRates: result?.finalRates.map(r => r || 0) || []
      }));

      // Recalculate enhanced result with new rates
      setTimeout(() => {
        calculateEnhanced({ ...formData, selectedPackageIndex: selectedIndex });
      }, 50);
    }
  };

  const totalAmount = enhancedResult ? enhancedResult.grandTotal : calculateTotal(formData);

  // Update contract
  const updateContract = async () => {
    if (!contract || !calculationResult || availablePackages.length === 0) {
      setError('Chưa tính toán phí bảo hiểm');
      return;
    }

    if (initializingCarData) {
      setError('Đang tải dữ liệu xe, vui lòng chờ...');
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
        nntxFee = await calculateNNTXFeeByPackage(formData.selectedNNTXPackage, Number(formData.soChoNgoi), formData.loaiHinhKinhDoanh);
      }
      
      // Import required function
      const { calculateTotalVehicleValue } = await import('@/utils/insurance-calculator');
      
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
      const phiNNTX = nntxFee;
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
      
      const getDKBS = (index: number): string[] => {
        if (index >= 0 && index < packageLabels.length) {
          const pkg = packageLabels[index];
          // Extract BS codes from name: "Gói BS001 + BS003" → ["BS001", "BS003"]
          const bsCodes = pkg.name.match(/BS\d+/g) || [];
          return bsCodes.map(code => {
            const detail = packageLabelsDetail.find(item => item.code === code);
            return detail ? `- ${code}: ${detail.name}` : `- ${code}`;
          });
        }
        return [];
      };

      const updateData = {
        chuXe: formData.chuXe,
        diaChi: formData.diaChi,
        // Buyer information (mapped from form fields)
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
          dkbs: getDKBS(formData.selectedPackageIndex)
        },
        includeTNDS: formData.includeTNDS,
        tndsCategory: formData.tndsCategory,
        phiTNDS: phiTNDS,
        includeNNTX: formData.includeNNTX,
        phiNNTX: phiNNTX,
        phiPin: enhancedResult?.totalBatteryFee || 0,
        mucKhauTru: formData.mucKhauTru,
        taiTucPercentage: formData.taiTucPercentage,
        phiTaiTuc: phiTaiTuc,
        phiTruocKhiGiam: phiTruocKhiGiam,
        phiSauKhiGiam: phiSauKhiGiam,
        tongPhi: phiSauKhiGiam
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
    } catch (error: unknown) {
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

  if (contract.status !== 'nhap' && contract.status !== 'cho_duyet') {
    return (
      <DashboardLayout>
        <div className="p-4 lg:p-6">
          <div className="text-center text-gray-400">
            <p>Chỉ có thể chỉnh sửa hợp đồng ở trạng thái "Nháp" hoặc "Chờ duyệt"</p>
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

          <div className="space-y-6">
            {/* Main Content */}
            <div className="space-y-6">
              {/* Buyer Information */}
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Thông tin khách hàng</h2>
                <BuyerInfoForm
                  formData={{
                    chuXe: formData.chuXe,
                    email: formData.email,
                    soDienThoai: formData.soDienThoai,
                    cccd: formData.cccd,
                    gioiTinh: formData.gioiTinh,
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
                  onVehicleDataChange={handleVehicleDataChange}
                  hideCalculateButton={false}
                />
              </div>

              {/* Package Selection */}
              {calculationResult && availablePackages.length > 0 && (
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
                  <h2 className="text-xl font-semibold text-white mb-4">Gói bảo hiểm</h2>
                  <PackageSelectionStep
                    availablePackages={availablePackages}
                    calculationResult={calculationResult}
                    enhancedResult={enhancedResult || undefined}
                    formData={formData}
                    totalAmount={totalAmount}
                    nntxFee={nntxFee}
                    loading={submitting || initializingCarData}
                    onFormInputChange={handleInputChange}
                    onPackageSelect={handlePackageSelection}
                    onSubmit={updateContract}
                    onRecalculate={handleRecalculate}
                    onNNTXFeeChange={handleNNTXFeeChange}
                    onCustomRateChange={handleCustomRateChange}
                    initialCustomRate={customRate}
                    submitButtonText={initializingCarData ? "Đang tải dữ liệu xe..." : "Cập nhật hợp đồng"}
                  />
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}