'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  calculateInsuranceRates, 
  formatCurrency, 
  formatNumberInput,
  parseCurrency,
  loaiHinhKinhDoanhOptions,
  tndsCategories,
  packageLabels,
  type CalculationResult 
} from '@/utils/insurance-calculator';

interface ExtractedData {
  chuXe?: string;
  diaChi?: string;
  nhanHieu?: string;
  soLoai?: string;
  soKhung?: string;
  soMay?: string;
  bienSo?: string;
  namSanXuat?: number;
  soChoNgoi?: number;
  ngayDangKyLanDau?: string;
  trongTaiHangHoa?: number;
  kinhDoanhVanTai?: string;
  loaiXe?: string;
}

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
  const [extracting, setExtracting] = useState(false);
  
  // File uploads
  const [cavetFile, setCavetFile] = useState<File | null>(null);
  const [dangkiemFile, setDangkiemFile] = useState<File | null>(null);
  const cavetInputRef = useRef<HTMLInputElement>(null);
  const dangkiemInputRef = useRef<HTMLInputElement>(null);
  
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
  
  // Calculation results
  const [calculationResult, setCalculationResult] = useState<CalculationResult | null>(null);
  const [availablePackages, setAvailablePackages] = useState<Array<{
    index: number;
    name: string;
    details: string;
    rate: number;
    fee: number;
    available: boolean;
  }>>([]);
  
  const router = useRouter();

  // Check authentication
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData || !JSON.parse(userData).isLoggedIn) {
      router.push('/');
    }
  }, [router]);

  // File to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.onerror = error => reject(error);
    });
  };

  // Handle file upload
  const handleFileUpload = (type: 'cavet' | 'dangkiem', file: File | null) => {
    if (type === 'cavet') {
      setCavetFile(file);
    } else {
      setDangkiemFile(file);
    }
  };

  // Extract information from images
  const extractInformation = async () => {
    if (!cavetFile && !dangkiemFile) {
      setError('Vui lòng tải lên ít nhất một ảnh giấy tờ xe');
      return;
    }

    setExtracting(true);
    setError('');
    
    try {
      let extractedData: ExtractedData = {};
      
      const files = [
        { type: 'cavet', file: cavetFile },
        { type: 'dangkiem', file: dangkiemFile }
      ];

      for (const item of files) {
        if (item.file) {
          const base64Data = await fileToBase64(item.file);
          const response = await fetch('/api/contracts/extract-info', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              imageData: base64Data,
              imageType: item.file.type 
            })
          });

          if (response.ok) {
            const result = await response.json();
            if (result.success && result.data) {
              // Merge data, keeping non-null values
              Object.keys(result.data).forEach(key => {
                if (result.data[key] !== null && result.data[key] !== undefined) {
                  extractedData[key as keyof ExtractedData] = result.data[key];
                }
              });
            }
          } else {
            const errorData = await response.json();
            console.error('Extract error:', errorData);
          }
        }
      }

      if (Object.keys(extractedData).length === 0) {
        throw new Error('Không thể trích xuất thông tin. Vui lòng kiểm tra lại ảnh.');
      }

      // Populate form
      populateForm(extractedData);
      setCurrentStep(2);
      
    } catch (error: any) {
      console.error('Extract error:', error);
      setError(error.message || 'Đã có lỗi xảy ra khi trích xuất thông tin');
    } finally {
      setExtracting(false);
    }
  };

  // Populate form with extracted data
  const populateForm = (data: ExtractedData) => {
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
  };

  // Handle form input change
  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Calculate insurance rates
  const calculateRates = () => {
    const giaTriXeRaw = formData.giaTriXe;
    if (!giaTriXeRaw || !formData.namSanXuat || !formData.soChoNgoi) {
      setError('Vui lòng nhập đủ thông tin: Giá trị xe, Năm sản xuất, Số chỗ ngồi');
      return;
    }

    const giaTriXe = parseCurrency(giaTriXeRaw);
    const namSanXuat = Number(formData.namSanXuat);
    const soChoNgoi = Number(formData.soChoNgoi);
    const trongTai = Number(formData.trongTai) || 0;

    if (namSanXuat < 1980) {
      setError('Năm sản xuất phải từ 1980 trở lên');
      return;
    }

    if ((formData.loaiHinhKinhDoanh.includes('cho_hang') || formData.loaiHinhKinhDoanh.includes('dau_keo')) && trongTai <= 0) {
      setError('Vui lòng nhập trọng tải cho xe tải');
      return;
    }

    const result = calculateInsuranceRates(
      giaTriXe,
      namSanXuat,
      soChoNgoi,
      formData.loaiHinhKinhDoanh,
      trongTai
    );

    setCalculationResult(result);

    // Generate available packages
    const packages = packageLabels.map((pkg, index) => {
      const rate = result.finalRates[index];
      let fee = 0;
      let available = rate !== null;

      if (available) {
        fee = (giaTriXe * rate) / 100;
        
        // Apply minimum fee for non-business cars under 500M
        const isMinFeeApplicable = formData.loaiHinhKinhDoanh === 'khong_kd_cho_nguoi' && giaTriXe < 500000000;
        if (isMinFeeApplicable && fee < 5500000) {
          fee = 5500000;
        }
      }

      return {
        index,
        name: pkg.name,
        details: pkg.details,
        rate: rate || 0,
        fee,
        available
      };
    });

    setAvailablePackages(packages);
    
    // Set default TNDS category
    if (result.tndsKey && tndsCategories[result.tndsKey]) {
      setFormData(prev => ({ ...prev, tndsCategory: result.tndsKey! }));
    }

    // Set custom rates to calculated rates
    setFormData(prev => ({ 
      ...prev, 
      customRates: result.finalRates.map(r => r || 0) 
    }));

    setCurrentStep(3);
    setError('');
  };

  // Calculate total price
  const calculateTotal = () => {
    if (!calculationResult || availablePackages.length === 0) return 0;

    let total = 0;

    // Add selected package fee
    const selectedPackage = availablePackages[formData.selectedPackageIndex];
    if (selectedPackage && selectedPackage.available) {
      total += selectedPackage.fee;
    }

    // Add TNDS fee
    if (formData.includeTNDS && formData.tndsCategory && tndsCategories[formData.tndsCategory]) {
      total += tndsCategories[formData.tndsCategory].fee;
    }

    // Add NNTX fee
    if (formData.includeNNTX && calculationResult.nntxFee) {
      total += calculationResult.nntxFee;
    }

    return total;
  };

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
      const totalFee = calculateTotal();
      
      // Get package DKBS
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

      // Convert files to base64 for storage
      let cavetBase64 = '';
      let dangkiemBase64 = '';
      
      if (cavetFile) {
        cavetBase64 = await fileToBase64(cavetFile);
      }
      if (dangkiemFile) {
        dangkiemBase64 = await fileToBase64(dangkiemFile);
      }

      const contractData = {
        // Thông tin khách hàng
        chuXe: formData.chuXe,
        diaChi: formData.diaChi,
        
        // Thông tin xe
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
        
        // Gói bảo hiểm
        vatChatPackage: {
          name: selectedPackage.name,
          tyLePhi: selectedPackage.rate,
          phiVatChat: selectedPackage.fee,
          dkbs: getDKBS(formData.selectedPackageIndex)
        },
        
        // Các loại phí
        includeTNDS: formData.includeTNDS,
        tndsCategory: formData.tndsCategory,
        phiTNDS: formData.includeTNDS && formData.tndsCategory 
          ? tndsCategories[formData.tndsCategory].fee 
          : 0,
        
        includeNNTX: formData.includeNNTX,
        phiNNTX: formData.includeNNTX ? calculationResult.nntxFee : 0,
        
        // Tổng phí
        tongPhi: totalFee,
        mucKhauTru: calculationResult.mucKhauTru,
        
        // Files
        ...(cavetBase64 && { cavetImage: cavetBase64 }),
        ...(dangkiemBase64 && { dangkiemImage: dangkiemBase64 })
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
            
            {/* Desktop Steps */}
            <div className="hidden md:flex items-center gap-4">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep >= step 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-600 text-gray-300'
                  }`}>
                    {step}
                  </div>
                  <span className={`ml-2 text-sm ${
                    currentStep >= step ? 'text-white' : 'text-gray-400'
                  }`}>
                    {step === 1 && 'Tải ảnh'}
                    {step === 2 && 'Xác nhận thông tin'}
                    {step === 3 && 'Chọn gói & Tạo báo giá'}
                  </span>
                  {step < 3 && <div className="w-12 h-px bg-gray-600 mx-4" />}
                </div>
              ))}
            </div>

            {/* Mobile Steps */}
            <div className="md:hidden flex items-center justify-between">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex flex-col items-center flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium mb-2 ${
                    currentStep >= step 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-600 text-gray-300'
                  }`}>
                    {step}
                  </div>
                  <span className={`text-xs text-center ${
                    currentStep >= step ? 'text-white' : 'text-gray-400'
                  }`}>
                    {step === 1 && 'Tải ảnh'}
                    {step === 2 && 'Xác nhận'}
                    {step === 3 && 'Tạo báo giá'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm mb-6">
              {error}
            </div>
          )}

          {/* Step 1: Upload Images */}
          {currentStep === 1 && (
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Bước 1: Tải lên Giấy tờ Xe</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {/* Cavet Upload */}
                <div>
                  <label className="block text-white font-medium mb-2">Giấy đăng ký (Cà vẹt)</label>
                  <div 
                    onClick={() => cavetInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-400 hover:border-blue-400 rounded-xl p-6 text-center cursor-pointer transition-colors"
                  >
                    <input 
                      ref={cavetInputRef}
                      type="file" 
                      accept="image/*" 
                      className="hidden"
                      onChange={(e) => handleFileUpload('cavet', e.target.files?.[0] || null)}
                    />
                    {cavetFile ? (
                      <div>
                        <img 
                          src={URL.createObjectURL(cavetFile)} 
                          alt="Cà vẹt" 
                          className="h-32 mx-auto rounded-md mb-2 object-contain"
                        />
                        <p className="text-white text-sm">{cavetFile.name}</p>
                      </div>
                    ) : (
                      <div>
                        <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <p className="text-gray-300">Nhấn để chọn ảnh cà vẹt</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Dang Kiem Upload */}
                <div>
                  <label className="block text-white font-medium mb-2">Giấy đăng kiểm</label>
                  <div 
                    onClick={() => dangkiemInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-400 hover:border-blue-400 rounded-xl p-6 text-center cursor-pointer transition-colors"
                  >
                    <input 
                      ref={dangkiemInputRef}
                      type="file" 
                      accept="image/*" 
                      className="hidden"
                      onChange={(e) => handleFileUpload('dangkiem', e.target.files?.[0] || null)}
                    />
                    {dangkiemFile ? (
                      <div>
                        <img 
                          src={URL.createObjectURL(dangkiemFile)} 
                          alt="Đăng kiểm" 
                          className="h-32 mx-auto rounded-md mb-2 object-contain"
                        />
                        <p className="text-white text-sm">{dangkiemFile.name}</p>
                      </div>
                    ) : (
                      <div>
                        <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <p className="text-gray-300">Nhấn để chọn ảnh đăng kiểm</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-center mt-6">
                <button
                  onClick={extractInformation}
                  disabled={extracting || (!cavetFile && !dangkiemFile)}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-medium py-3 px-8 rounded-xl transition-colors"
                >
                  {extracting ? 'Đang trích xuất...' : 'Trích xuất thông tin'}
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Verify Information */}
          {currentStep === 2 && (
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Bước 2: Xác nhận & Bổ sung Thông tin</h2>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-3">
                  <label className="block text-white font-medium mb-2">Chủ xe *</label>
                  <input 
                    type="text" 
                    value={formData.chuXe}
                    onChange={(e) => handleInputChange('chuXe', e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white"
                    required
                  />
                </div>
                
                <div className="lg:col-span-3">
                  <label className="block text-white font-medium mb-2">Địa chỉ *</label>
                  <input 
                    type="text" 
                    value={formData.diaChi}
                    onChange={(e) => handleInputChange('diaChi', e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">Biển số *</label>
                  <input 
                    type="text" 
                    value={formData.bienSo}
                    onChange={(e) => handleInputChange('bienSo', e.target.value.toUpperCase())}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">Nhãn hiệu *</label>
                  <input 
                    type="text" 
                    value={formData.nhanHieu}
                    onChange={(e) => handleInputChange('nhanHieu', e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">Số loại *</label>
                  <input 
                    type="text" 
                    value={formData.soLoai}
                    onChange={(e) => handleInputChange('soLoai', e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">Số khung *</label>
                  <input 
                    type="text" 
                    value={formData.soKhung}
                    onChange={(e) => handleInputChange('soKhung', e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">Số máy *</label>
                  <input 
                    type="text" 
                    value={formData.soMay}
                    onChange={(e) => handleInputChange('soMay', e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">Ngày ĐK lần đầu *</label>
                  <input 
                    type="text" 
                    value={formData.ngayDKLD}
                    onChange={(e) => handleInputChange('ngayDKLD', e.target.value)}
                    placeholder="dd/mm/yyyy"
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">Năm sản xuất *</label>
                  <input 
                    type="number" 
                    value={formData.namSanXuat}
                    onChange={(e) => handleInputChange('namSanXuat', e.target.value ? parseInt(e.target.value) : '')}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">Số chỗ ngồi *</label>
                  <input 
                    type="number" 
                    value={formData.soChoNgoi}
                    onChange={(e) => handleInputChange('soChoNgoi', e.target.value ? parseInt(e.target.value) : '')}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white"
                    required
                  />
                </div>

                <div className="lg:col-span-3">
                  <label className="block text-white font-medium mb-2">Giá trị xe (VNĐ) *</label>
                  <input 
                    type="text" 
                    value={formData.giaTriXe}
                    onChange={(e) => handleInputChange('giaTriXe', formatNumberInput(e.target.value))}
                    placeholder="Ví dụ: 800,000,000"
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white"
                    required
                  />
                </div>

                <div className="lg:col-span-3">
                  <label className="block text-white font-medium mb-2">Loại hình sử dụng *</label>
                  <select 
                    value={formData.loaiHinhKinhDoanh}
                    onChange={(e) => handleInputChange('loaiHinhKinhDoanh', e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white"
                    required
                  >
                    {Object.entries(
                      loaiHinhKinhDoanhOptions.reduce((groups, option) => {
                        if (!groups[option.group]) groups[option.group] = [];
                        groups[option.group].push(option);
                        return groups;
                      }, {} as Record<string, typeof loaiHinhKinhDoanhOptions>)
                    ).map(([group, options]) => (
                      <optgroup key={group} label={group}>
                        {options.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                {(formData.loaiHinhKinhDoanh.includes('cho_hang') || formData.loaiHinhKinhDoanh.includes('dau_keo')) && (
                  <div className="lg:col-span-3">
                    <label className="block text-white font-medium mb-2">Trọng tải (kg) *</label>
                    <input 
                      type="number" 
                      value={formData.trongTai}
                      onChange={(e) => handleInputChange('trongTai', e.target.value ? parseInt(e.target.value) : '')}
                      placeholder="Ví dụ: 15000"
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white"
                      required
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-center mt-6">
                <button
                  onClick={calculateRates}
                  className="bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-8 rounded-xl transition-colors"
                >
                  Tính phí & Lập báo giá
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Package Selection */}
          {currentStep === 3 && calculationResult && availablePackages.length > 0 && (
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Bước 3: Lựa chọn Gói bảo hiểm</h2>
              
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Left: Package Options */}
                <div className="lg:col-span-2 space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">A. Bảo hiểm Vật chất Thân vỏ (Chọn 1 gói)</h3>
                    <div className="space-y-3">
                      {availablePackages.map((pkg) => (
                        <div 
                          key={pkg.index} 
                          className={`p-4 border rounded-xl ${
                            pkg.available 
                              ? 'border-white/20 hover:border-blue-400/50' 
                              : 'border-gray-600 opacity-50'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center">
                              <input 
                                type="radio" 
                                name="package"
                                checked={formData.selectedPackageIndex === pkg.index}
                                onChange={() => pkg.available && handleInputChange('selectedPackageIndex', pkg.index)}
                                disabled={!pkg.available}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                              />
                              <div className="ml-3">
                                <label className="font-semibold text-white">{pkg.name}</label>
                                <p className="text-xs text-gray-400">{pkg.details}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-gray-300">
                                {pkg.rate.toFixed(2)}%
                              </div>
                              <div className="font-bold text-blue-400">
                                {pkg.available ? formatCurrency(pkg.fee) : 'N/A'}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">B. Các hạng mục khác</h3>
                    <div className="space-y-3">
                      {/* TNDS */}
                      <div className="p-4 bg-white/5 rounded-xl">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center">
                            <input 
                              type="checkbox" 
                              checked={formData.includeTNDS}
                              onChange={(e) => handleInputChange('includeTNDS', e.target.checked)}
                              className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
                            />
                            <label className="ml-3 text-white">Bảo hiểm TNDS Bắt buộc</label>
                          </div>
                          <span className="font-semibold text-white">
                            {formData.includeTNDS && formData.tndsCategory && tndsCategories[formData.tndsCategory] 
                              ? formatCurrency(tndsCategories[formData.tndsCategory].fee)
                              : '0 ₫'
                            }
                          </span>
                        </div>
                        {formData.includeTNDS && (
                          <select 
                            value={formData.tndsCategory}
                            onChange={(e) => handleInputChange('tndsCategory', e.target.value)}
                            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white text-sm"
                          >
                            {Object.entries(tndsCategories).map(([key, category]) => (
                              <option key={key} value={key}>
                                {category.label}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>

                      {/* NNTX */}
                      <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                        <div className="flex items-center">
                          <input 
                            type="checkbox" 
                            checked={formData.includeNNTX}
                            onChange={(e) => handleInputChange('includeNNTX', e.target.checked)}
                            className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
                          />
                          <label className="ml-3 text-white">Bảo hiểm Người ngồi trên xe</label>
                        </div>
                        <span className="font-semibold text-white">
                          {formData.includeNNTX ? formatCurrency(calculationResult.nntxFee) : '0 ₫'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Summary */}
                <div>
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6 sticky top-4">
                    <h3 className="text-xl font-bold text-center text-white mb-4">BẢNG TỔNG HỢP PHÍ</h3>
                    
                    <div className="space-y-2 text-sm mb-4">
                      <div className="flex justify-between py-1 border-b border-dashed border-white/20">
                        <span className="text-gray-300">1. Phí bảo hiểm Vật chất:</span>
                        <span className="font-semibold text-white">
                          {availablePackages[formData.selectedPackageIndex]?.available 
                            ? formatCurrency(availablePackages[formData.selectedPackageIndex].fee)
                            : '0 ₫'
                          }
                        </span>
                      </div>
                      
                      <div className="flex justify-between py-1 border-b border-dashed border-white/20">
                        <span className="text-gray-300">2. Phí TNDS Bắt buộc:</span>
                        <span className="font-semibold text-white">
                          {formData.includeTNDS && formData.tndsCategory && tndsCategories[formData.tndsCategory]
                            ? formatCurrency(tndsCategories[formData.tndsCategory].fee)
                            : '0 ₫'
                          }
                        </span>
                      </div>
                      
                      <div className="flex justify-between py-1 border-b border-dashed border-white/20">
                        <span className="text-gray-300">3. Phí Người ngồi trên xe:</span>
                        <span className="font-semibold text-white">
                          {formData.includeNNTX ? formatCurrency(calculationResult.nntxFee) : '0 ₫'}
                        </span>
                      </div>
                      
                      <div className="flex justify-between py-1">
                        <span className="text-gray-300">Mức khấu trừ:</span>
                        <span className="font-semibold text-white">
                          {formatCurrency(calculationResult.mucKhauTru)}/vụ
                        </span>
                      </div>
                    </div>

                    <hr className="border-white/20 my-4" />
                    
                    <div className="flex justify-between items-center text-base">
                      <span className="font-bold text-white">TỔNG CỘNG:</span>
                      <span className="font-extrabold text-xl text-blue-400">
                        {formatCurrency(calculateTotal())}
                      </span>
                    </div>

                    <button
                      onClick={submitContract}
                      disabled={loading}
                      className="w-full mt-6 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-bold py-3 px-4 rounded-xl transition-colors"
                    >
                      {loading ? 'Đang tạo...' : 'Tạo Hợp đồng'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}