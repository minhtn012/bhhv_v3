'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import LocationPicker, { LocationValue } from '@/core/shared/components/LocationPicker';
import {
  HEALTH_PACKAGES,
  HEALTH_PACKAGE_LABELS,
  HEALTH_RELATIONSHIPS,
  HEALTH_RELATIONSHIP_LABELS,
} from '@/providers/bhv-online/products/health/constants';
import { HEALTH_QUESTION_DEFINITIONS } from '@/providers/bhv-online/products/health/health-questions';
import { mapOCRToHealthForm, HealthOCROutput } from '@/utils/ocr-health-mapper';

// Section Header Component
function SectionHeader({ title, icon }: { title: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 flex items-center justify-center text-blue-400">
        {icon}
      </div>
      <h2 className="text-lg font-semibold text-white tracking-tight">{title}</h2>
    </div>
  );
}

// Field wrapper component
function Field({
  label,
  required,
  children,
  className = '',
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      <label className="block text-sm text-slate-400 mb-1.5 font-medium">
        {label} {required && <span className="text-orange-400">*</span>}
      </label>
      <div className="relative">{children}</div>
    </div>
  );
}

type FormDataType = {
  kindAction: string;
  certificateCode: string;
  packageType: string;
  purchaseYears: string;
  benefitMaternity: boolean;
  benefitOutpatient: boolean;
  benefitDiseaseDeath: boolean;
  q1Answer: string;
  q1Details: string;
  q2Answer: string;
  q2Details: string;
  q3Answer: string;
  q3Details: string;
  q4Answer: string;
  q4Details: string;
  q5Answer: string;
  q5Details: string;
  customerKind: string;
  buyerFullname: string;
  buyerEmail: string;
  buyerIdentityCard: string;
  buyerPhone: string;
  buyerBirthday: string;
  buyerGender: string;
  buyerJob: string;
  buyerCity: string;
  buyerCityText: string;
  buyerDistrict: string;
  buyerDistrictText: string;
  buyerAddress: string;
  insuredSameAsBuyer: boolean;
  insuredRelationship: string;
  insuredFullname: string;
  insuredEmail: string;
  insuredIdentityCard: string;
  insuredPhone: string;
  insuredBirthday: string;
  insuredGender: string;
  insuredJob: string;
  insuredCity: string;
  insuredCityText: string;
  insuredDistrict: string;
  insuredDistrictText: string;
  insuredAddress: string;
  beneficiarySameAsInsured: boolean;
  beneficiaryRelationship: string;
  beneficiaryFullname: string;
  beneficiaryEmail: string;
  beneficiaryIdentityCard: string;
  beneficiaryPhone: string;
  beneficiaryBirthday: string;
  beneficiaryGender: string;
  beneficiaryJob: string;
  beneficiaryCity: string;
  beneficiaryCityText: string;
  beneficiaryDistrict: string;
  beneficiaryDistrictText: string;
  beneficiaryAddress: string;
  activeDate: string;
  inactiveDate: string;
  totalPremium: string;
  agreeTerms: boolean;
};

export default function NewHealthContractPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // OCR Upload State
  const [ocrFiles, setOcrFiles] = useState<File[]>([]);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrError, setOcrError] = useState('');
  const [ocrSuccess, setOcrSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState<FormDataType>({
    kindAction: 'insert',
    certificateCode: '',
    packageType: HEALTH_PACKAGES.DIAMOND as string,
    purchaseYears: '1',
    benefitMaternity: false,
    benefitOutpatient: false,
    benefitDiseaseDeath: false,
    q1Answer: 'false',
    q1Details: '',
    q2Answer: 'false',
    q2Details: '',
    q3Answer: 'false',
    q3Details: '',
    q4Answer: 'false',
    q4Details: '',
    q5Answer: 'false',
    q5Details: '',
    customerKind: 'personal',
    buyerFullname: '',
    buyerEmail: '',
    buyerIdentityCard: '',
    buyerPhone: '',
    buyerBirthday: '',
    buyerGender: 'male',
    buyerJob: '',
    buyerCity: '',
    buyerCityText: '',
    buyerDistrict: '',
    buyerDistrictText: '',
    buyerAddress: '',
    insuredSameAsBuyer: true,
    insuredRelationship: HEALTH_RELATIONSHIPS.SELF as string,
    insuredFullname: '',
    insuredEmail: '',
    insuredIdentityCard: '',
    insuredPhone: '',
    insuredBirthday: '',
    insuredGender: 'male',
    insuredJob: '',
    insuredCity: '',
    insuredCityText: '',
    insuredDistrict: '',
    insuredDistrictText: '',
    insuredAddress: '',
    beneficiarySameAsInsured: true,
    beneficiaryRelationship: HEALTH_RELATIONSHIPS.SELF as string,
    beneficiaryFullname: '',
    beneficiaryEmail: '',
    beneficiaryIdentityCard: '',
    beneficiaryPhone: '',
    beneficiaryBirthday: '',
    beneficiaryGender: 'male',
    beneficiaryJob: '',
    beneficiaryCity: '',
    beneficiaryCityText: '',
    beneficiaryDistrict: '',
    beneficiaryDistrictText: '',
    beneficiaryAddress: '',
    activeDate: '',
    inactiveDate: '',
    totalPremium: '',
    agreeTerms: false,
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/');
      return;
    }
    const user = JSON.parse(userData);
    if (!user.isLoggedIn || user.role === 'admin') {
      router.push('/');
      return;
    }

    // Set default dates
    const today = new Date();
    const nextYear = new Date(today);
    nextYear.setFullYear(nextYear.getFullYear() + 1);

    setFormData((prev) => ({
      ...prev,
      activeDate: today.toISOString().split('T')[0],
      inactiveDate: nextYear.toISOString().split('T')[0],
    }));
  }, [router]);

  
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value, type } = e.target;
      const checked = (e.target as HTMLInputElement).checked;

      setFormData((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));

      if (fieldErrors[name]) {
        setFieldErrors((prev) => {
          const updated = { ...prev };
          delete updated[name];
          return updated;
        });
      }
    },
    [fieldErrors]
  );

  // Location handlers for each person section
  const handleBuyerLocationChange = useCallback((location: LocationValue) => {
    setFormData((prev) => ({
      ...prev,
      buyerCity: location.provinceCode,
      buyerCityText: location.provinceName,
      buyerDistrict: location.districtWardId,
      buyerDistrictText: location.districtWardName,
      buyerAddress: location.specificAddress,
    }));
  }, []);

  const handleInsuredLocationChange = useCallback((location: LocationValue) => {
    setFormData((prev) => ({
      ...prev,
      insuredCity: location.provinceCode,
      insuredCityText: location.provinceName,
      insuredDistrict: location.districtWardId,
      insuredDistrictText: location.districtWardName,
      insuredAddress: location.specificAddress,
    }));
  }, []);

  const handleBeneficiaryLocationChange = useCallback((location: LocationValue) => {
    setFormData((prev) => ({
      ...prev,
      beneficiaryCity: location.provinceCode,
      beneficiaryCityText: location.provinceName,
      beneficiaryDistrict: location.districtWardId,
      beneficiaryDistrictText: location.districtWardName,
      beneficiaryAddress: location.specificAddress,
    }));
  }, []);

  // OCR File Handling
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(
      (f) => f.type.startsWith('image/') && f.size <= 10 * 1024 * 1024
    );
    setOcrFiles((prev) => [...prev, ...validFiles].slice(0, 5));
    setOcrError('');
    setOcrSuccess(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const validFiles = files.filter(
      (f) => f.type.startsWith('image/') && f.size <= 10 * 1024 * 1024
    );
    setOcrFiles((prev) => [...prev, ...validFiles].slice(0, 5));
    setOcrError('');
    setOcrSuccess(false);
  }, []);

  const removeFile = useCallback((index: number) => {
    setOcrFiles((prev) => prev.filter((_, i) => i !== index));
    setOcrSuccess(false);
  }, []);

  // Convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data:image/xxx;base64, prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
    });
  };

  const processOCR = useCallback(async () => {
    if (ocrFiles.length === 0) return;

    setOcrLoading(true);
    setOcrError('');
    setOcrSuccess(false);

    try {
      // Process first image (Gemini API takes one image at a time)
      const file = ocrFiles[0];
      const imageData = await fileToBase64(file);

      const response = await fetch('/api/health/extract-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageData,
          imageType: file.type || 'image/jpeg',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'OCR processing failed');
      }

      // Map OCR result to form data
      const ocrResult = data.data as Partial<HealthOCROutput>;
      const mappedData = mapOCRToHealthForm(ocrResult);

      // Update form with mapped data
      setFormData((prev) => ({
        ...prev,
        ...mappedData,
      }));

      setOcrSuccess(true);
      setOcrError('');
    } catch (err) {
      setOcrError(err instanceof Error ? err.message : 'OCR processing failed');
    } finally {
      setOcrLoading(false);
    }
  }, [ocrFiles]);

  // Real-time form validity check for button state
  const isFormValid = useMemo(() => {
    // Package - required
    if (!formData.packageType) return false;

    // Buyer fields - ALL required
    if (!formData.buyerFullname?.trim()) return false;
    if (!formData.buyerEmail?.trim()) return false;
    if (!formData.buyerIdentityCard?.trim()) return false;
    if (!formData.buyerPhone?.trim()) return false;
    if (!formData.buyerBirthday) return false;
    if (!formData.buyerGender) return false;
    if (!formData.buyerJob?.trim()) return false;
    if (!formData.buyerCity) return false;
    if (!formData.buyerDistrict) return false;
    if (!formData.buyerAddress?.trim()) return false;

    // Health questions - details required when answer is "Có"
    for (let i = 1; i <= 5; i++) {
      const answerKey = `q${i}Answer` as keyof FormDataType;
      const detailsKey = `q${i}Details` as keyof FormDataType;
      if (formData[answerKey] === 'true' && !formData[detailsKey]?.toString().trim()) {
        return false;
      }
    }

    // Insured person - ALL required when not same as buyer
    if (!formData.insuredSameAsBuyer) {
      if (!formData.insuredFullname?.trim()) return false;
      if (!formData.insuredEmail?.trim()) return false;
      if (!formData.insuredIdentityCard?.trim()) return false;
      if (!formData.insuredPhone?.trim()) return false;
      if (!formData.insuredBirthday) return false;
      if (!formData.insuredGender) return false;
      if (!formData.insuredJob?.trim()) return false;
      if (!formData.insuredCity) return false;
      if (!formData.insuredDistrict) return false;
      if (!formData.insuredAddress?.trim()) return false;
    }

    // Beneficiary - ALL required when not same as insured
    if (!formData.beneficiarySameAsInsured) {
      if (!formData.beneficiaryFullname?.trim()) return false;
      if (!formData.beneficiaryEmail?.trim()) return false;
      if (!formData.beneficiaryIdentityCard?.trim()) return false;
      if (!formData.beneficiaryPhone?.trim()) return false;
      if (!formData.beneficiaryBirthday) return false;
      if (!formData.beneficiaryGender) return false;
      if (!formData.beneficiaryJob?.trim()) return false;
      if (!formData.beneficiaryCity) return false;
      if (!formData.beneficiaryDistrict) return false;
      if (!formData.beneficiaryAddress?.trim()) return false;
    }

    // Dates & Premium - ALL required
    if (!formData.activeDate) return false;
    if (!formData.inactiveDate) return false;
    if (!formData.totalPremium) return false;

    return true;
  }, [formData]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Package
    if (!formData.packageType) errors.packageType = 'Vui lòng chọn gói bảo hiểm';

    // Buyer fields - ALL required
    if (!formData.buyerFullname) errors.buyerFullname = 'Vui lòng nhập họ tên';
    if (!formData.buyerEmail) errors.buyerEmail = 'Vui lòng nhập email';
    if (!formData.buyerIdentityCard) errors.buyerIdentityCard = 'Vui lòng nhập CCCD/CMND';
    if (!formData.buyerPhone) errors.buyerPhone = 'Vui lòng nhập số điện thoại';
    if (!formData.buyerBirthday) errors.buyerBirthday = 'Vui lòng nhập ngày sinh';
    if (!formData.buyerJob) errors.buyerJob = 'Vui lòng nhập nghề nghiệp';
    if (!formData.buyerCity) errors.buyerCity = 'Vui lòng chọn tỉnh/thành phố';
    if (!formData.buyerDistrict) errors.buyerDistrict = 'Vui lòng chọn quận/huyện';
    if (!formData.buyerAddress) errors.buyerAddress = 'Vui lòng nhập địa chỉ';

    // Health questions validation - require details when answer is "Có"
    for (let i = 1; i <= 5; i++) {
      const answerKey = `q${i}Answer` as keyof FormDataType;
      const detailsKey = `q${i}Details` as keyof FormDataType;
      if (formData[answerKey] === 'true' && !formData[detailsKey]?.toString().trim()) {
        errors[detailsKey] = 'Vui lòng nhập chi tiết khi chọn "Có"';
      }
    }

    // Insured person - ALL required when not same as buyer
    if (!formData.insuredSameAsBuyer) {
      if (!formData.insuredFullname) errors.insuredFullname = 'Vui lòng nhập họ tên';
      if (!formData.insuredEmail) errors.insuredEmail = 'Vui lòng nhập email';
      if (!formData.insuredIdentityCard) errors.insuredIdentityCard = 'Vui lòng nhập CCCD/CMND';
      if (!formData.insuredPhone) errors.insuredPhone = 'Vui lòng nhập số điện thoại';
      if (!formData.insuredBirthday) errors.insuredBirthday = 'Vui lòng nhập ngày sinh';
      if (!formData.insuredJob) errors.insuredJob = 'Vui lòng nhập nghề nghiệp';
      if (!formData.insuredCity) errors.insuredCity = 'Vui lòng chọn tỉnh/thành phố';
      if (!formData.insuredDistrict) errors.insuredDistrict = 'Vui lòng chọn quận/huyện';
      if (!formData.insuredAddress) errors.insuredAddress = 'Vui lòng nhập địa chỉ';
    }

    // Beneficiary - ALL required when not same as insured
    if (!formData.beneficiarySameAsInsured) {
      if (!formData.beneficiaryFullname) errors.beneficiaryFullname = 'Vui lòng nhập họ tên';
      if (!formData.beneficiaryEmail) errors.beneficiaryEmail = 'Vui lòng nhập email';
      if (!formData.beneficiaryIdentityCard) errors.beneficiaryIdentityCard = 'Vui lòng nhập CCCD/CMND';
      if (!formData.beneficiaryPhone) errors.beneficiaryPhone = 'Vui lòng nhập số điện thoại';
      if (!formData.beneficiaryBirthday) errors.beneficiaryBirthday = 'Vui lòng nhập ngày sinh';
      if (!formData.beneficiaryJob) errors.beneficiaryJob = 'Vui lòng nhập nghề nghiệp';
      if (!formData.beneficiaryCity) errors.beneficiaryCity = 'Vui lòng chọn tỉnh/thành phố';
      if (!formData.beneficiaryDistrict) errors.beneficiaryDistrict = 'Vui lòng chọn quận/huyện';
      if (!formData.beneficiaryAddress) errors.beneficiaryAddress = 'Vui lòng nhập địa chỉ';
    }

    // Dates & Premium - ALL required
    if (!formData.activeDate) errors.activeDate = 'Vui lòng chọn ngày bắt đầu';
    if (!formData.inactiveDate) errors.inactiveDate = 'Vui lòng chọn ngày kết thúc';
    if (!formData.totalPremium) errors.totalPremium = 'Vui lòng nhập phí bảo hiểm';

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      setError('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Handle "same as" logic for city/district
      const insuredCity = formData.insuredSameAsBuyer ? formData.buyerCity : formData.insuredCity;
      const insuredCityText = formData.insuredSameAsBuyer ? formData.buyerCityText : formData.insuredCityText;
      const insuredDistrict = formData.insuredSameAsBuyer ? formData.buyerDistrict : formData.insuredDistrict;
      const insuredDistrictText = formData.insuredSameAsBuyer ? formData.buyerDistrictText : formData.insuredDistrictText;
      const insuredAddress = formData.insuredSameAsBuyer ? formData.buyerAddress : formData.insuredAddress;

      // When beneficiary is "Bản thân", use buyer data (not insured)
      const beneficiaryCity = formData.beneficiarySameAsInsured ? formData.buyerCity : formData.beneficiaryCity;
      const beneficiaryCityText = formData.beneficiarySameAsInsured ? formData.buyerCityText : formData.beneficiaryCityText;
      const beneficiaryDistrict = formData.beneficiarySameAsInsured ? formData.buyerDistrict : formData.beneficiaryDistrict;
      const beneficiaryDistrictText = formData.beneficiarySameAsInsured ? formData.buyerDistrictText : formData.beneficiaryDistrictText;
      const beneficiaryAddress = formData.beneficiarySameAsInsured ? formData.buyerAddress : formData.beneficiaryAddress;

      const submitData = {
        ...formData,
        // Include text fields for display
        buyerCityText: formData.buyerCityText,
        buyerDistrictText: formData.buyerDistrictText,
        insuredCity,
        insuredCityText,
        insuredDistrict,
        insuredDistrictText,
        insuredAddress,
        beneficiaryCity,
        beneficiaryCityText,
        beneficiaryDistrict,
        beneficiaryDistrictText,
        beneficiaryAddress,
        // Location objects for mapper
        buyerLocation: {
          province: formData.buyerCity,
          district: formData.buyerDistrict,
        },
        insuredLocation: {
          province: insuredCity,
          district: insuredDistrict,
        },
        beneficiaryLocation: {
          province: beneficiaryCity,
          district: beneficiaryDistrict,
        },
      };

      const response = await fetch('/api/contracts/health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      const data = await response.json();

      if (response.ok) {
        router.push(`/health/${data.contract.id}`);
      } else {
        setError(data.error || 'Không thể tạo hợp đồng');
      }
    } catch {
      setError('Lỗi kết nối server');
    } finally {
      setLoading(false);
    }
  };

  // Input style helper (matching vehicle insurance pages)
  const inputClass = (hasError = false) =>
    `w-full px-4 py-2.5 bg-white/5 border rounded-xl text-white placeholder-gray-500 focus:outline-none transition-all duration-200 ${
      hasError
        ? 'border-red-500 focus:border-red-500'
        : 'border-white/10 focus:border-blue-500/50 hover:border-white/20'
    }`;

  const selectClass = (hasError = false) => inputClass(hasError);

  return (
    <DashboardLayout>
      <div className="p-4 lg:p-6">
        <div className="w-full">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => router.push('/health')}
              className="w-10 h-10 rounded-xl bg-slate-700/50 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-2xl font-bold text-white">Tạo hợp đồng Sức khỏe mới</h1>
          </div>

          {/* Fixed Save Button - always visible at bottom right */}
          <div className="fixed bottom-6 right-6 z-50">
            <button
              onClick={handleSubmit}
              disabled={loading || !isFormValid}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white font-semibold rounded-xl transition-all disabled:cursor-not-allowed flex items-center gap-2 shadow-xl shadow-green-900/30"
            >
              {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Tạo hợp đồng
            </button>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm mb-6">
              {error}
            </div>
          )}

          {/* OCR Upload Section */}
          <section className="bg-slate-800/90 border border-emerald-500/40 rounded-2xl p-6 mb-6">
            <SectionHeader
              title="Quét ảnh tự động điền (OCR)"
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              }
            />

            {/* Drag & Drop Zone */}
            <div
              className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                ocrLoading
                  ? 'border-slate-500/30 bg-slate-800/50 cursor-not-allowed opacity-60'
                  : ocrFiles.length > 0
                    ? 'border-emerald-500/50 bg-emerald-900/10 cursor-pointer'
                    : 'border-white/20 hover:border-white/40 bg-white/5 cursor-pointer'
              }`}
              onDrop={ocrLoading ? undefined : handleDrop}
              onDragOver={(e) => { e.preventDefault(); if (ocrLoading) e.dataTransfer.dropEffect = 'none'; }}
              onClick={ocrLoading ? undefined : () => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                disabled={ocrLoading}
              />
              <div className="flex flex-col items-center gap-2">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${ocrLoading ? 'bg-slate-600/20' : 'bg-emerald-500/20'}`}>
                  {ocrLoading ? (
                    <div className="w-6 h-6 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
                  ) : (
                    <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  )}
                </div>
                <p className={`text-sm ${ocrLoading ? 'text-slate-500' : 'text-gray-300'}`}>
                  {ocrLoading ? (
                    'Đang xử lý OCR, vui lòng chờ...'
                  ) : (
                    <>Kéo thả hoặc <span className="text-emerald-400 underline">chọn ảnh</span> phiếu yêu cầu BH</>
                  )}
                </p>
                {!ocrLoading && <p className="text-gray-500 text-xs">Tối đa 5 ảnh, mỗi ảnh ≤ 10MB (JPG, PNG)</p>}
              </div>
            </div>

            {/* File List */}
            {ocrFiles.length > 0 && (
              <div className={`mt-4 space-y-2 ${ocrLoading ? 'opacity-60' : ''}`}>
                {ocrFiles.map((file, index) => (
                  <div
                    key={`${file.name}-${index}`}
                    className={`flex items-center gap-3 p-3 bg-white/5 rounded-lg border ${ocrLoading ? 'border-emerald-500/30' : 'border-white/10'}`}
                  >
                    <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center overflow-hidden relative">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        className="w-full h-full object-cover"
                      />
                      {ocrLoading && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <div className="w-4 h-4 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{file.name}</p>
                      <p className="text-xs text-gray-500">
                        {ocrLoading ? 'Đang xử lý...' : `${(file.size / 1024 / 1024).toFixed(2)} MB`}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(index);
                      }}
                      disabled={ocrLoading}
                      className={`p-1.5 rounded-lg transition-colors ${
                        ocrLoading
                          ? 'text-gray-600 cursor-not-allowed'
                          : 'hover:bg-red-500/20 text-gray-400 hover:text-red-400'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}

                {/* Process Button */}
                <button
                  type="button"
                  onClick={processOCR}
                  disabled={ocrLoading || ocrFiles.length === 0}
                  className="w-full mt-3 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-600 text-white font-semibold rounded-xl transition-all disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {ocrLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Đang xử lý OCR...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      Quét và điền tự động
                    </>
                  )}
                </button>
              </div>
            )}

            {/* OCR Error */}
            {ocrError && (
              <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                {ocrError}
              </div>
            )}

            {/* OCR Success */}
            {ocrSuccess && (
              <div className="mt-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-sm flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Đã điền tự động! Vui lòng kiểm tra và bổ sung thông tin còn thiếu.
              </div>
            )}
          </section>

          {/* Main form */}
          <form onSubmit={handleSubmit} className="space-y-6">
          <fieldset disabled={ocrLoading} className={ocrLoading ? 'opacity-50 pointer-events-none' : ''}>
          {/* Package Selection */}
          <section className="bg-slate-800/90 border border-blue-500/40 rounded-2xl p-6">
            <SectionHeader
              title="Gói bảo hiểm"
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              }
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              {Object.entries(HEALTH_PACKAGES).map(([key, value]) => {
                const isSelected = formData.packageType === value;
                return (
                  <label
                    key={key}
                    className={`relative p-4 border rounded-xl cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? 'border-green-500 bg-green-900/30 shadow-lg shadow-green-500/10'
                        : 'border-white/20 hover:border-white/40 bg-white/5'
                    }`}
                  >
                    <input
                      type="radio"
                      name="packageType"
                      value={value}
                      checked={isSelected}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                          isSelected ? 'border-green-500 bg-green-500' : 'border-white/30'
                        }`}
                      >
                        {isSelected && (
                          <svg className="w-3 h-3 text-black" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </div>
                      <span className={`font-medium ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                        {HEALTH_PACKAGE_LABELS[value]}
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>

            {/* Benefit Addons */}
            <div className="pt-4 border-t border-white/10">
              <p className="text-sm text-gray-400 mb-3 font-medium">Quyền lợi bổ sung</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { name: 'benefitMaternity', label: 'Thai sản' },
                  { name: 'benefitOutpatient', label: 'Ngoại trú' },
                  { name: 'benefitDiseaseDeath', label: 'Tử vong do bệnh' },
                ].map((benefit) => {
                  const isChecked = formData[benefit.name as keyof FormDataType] as boolean;
                  return (
                    <label
                      key={benefit.name}
                      className={`relative flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-green-900/30 border border-green-500/30'
                          : 'bg-white/5 border border-white/10 hover:border-white/20'
                      }`}
                    >
                      <input
                        type="checkbox"
                        name={benefit.name}
                        checked={isChecked}
                        onChange={handleChange}
                        className="sr-only"
                      />
                      <div
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                          isChecked ? 'border-green-500 bg-green-500' : 'border-white/30'
                        }`}
                      >
                        {isChecked && (
                          <svg className="w-3 h-3 text-black" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </div>
                      <span className={`text-sm ${isChecked ? 'text-white' : 'text-gray-400'}`}>{benefit.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Health Questions */}
          <section className="bg-slate-800/90 border border-blue-500/40 rounded-2xl p-6">
            <SectionHeader
              title="Khai báo sức khỏe"
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              }
            />

            <div className="space-y-4">
              {HEALTH_QUESTION_DEFINITIONS.map((q, index) => {
                const answerKey = `q${index + 1}Answer` as keyof FormDataType;
                const detailsKey = `q${index + 1}Details` as keyof FormDataType;
                const isYes = formData[answerKey] === 'true';

                return (
                  <div key={q.id} className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-gray-300 text-sm mb-3">{q.description}</p>
                    <div className="flex gap-4">
                      {['true', 'false'].map((val) => (
                        <label key={val} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name={answerKey}
                            value={val}
                            checked={formData[answerKey] === val}
                            onChange={handleChange}
                            className="sr-only"
                          />
                          <div
                            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                              formData[answerKey] === val ? 'border-green-500 bg-green-500' : 'border-white/30'
                            }`}
                          >
                            {formData[answerKey] === val && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                          </div>
                          <span className="text-gray-300 text-sm">{val === 'true' ? 'Có' : 'Không'}</span>
                        </label>
                      ))}
                    </div>
                    {isYes && (
                      <div className="mt-3">
                        <textarea
                          name={detailsKey}
                          value={formData[detailsKey] as string}
                          onChange={handleChange}
                          placeholder={q.textPlaceholder}
                          rows={2}
                          className={`w-full px-4 py-2.5 bg-white/5 border rounded-xl text-white placeholder-zinc-500 focus:outline-none transition-all ${
                            fieldErrors[detailsKey]
                              ? 'border-red-500 focus:border-red-500'
                              : 'border-white/10 focus:border-green-500/50'
                          }`}
                        />
                        {fieldErrors[detailsKey] && (
                          <p className="text-red-400 text-xs mt-1">{fieldErrors[detailsKey]}</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Buyer Info */}
          <section className="bg-slate-800/90 border border-blue-500/40 rounded-2xl p-6">
            <SectionHeader
              title="Người mua bảo hiểm"
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              }
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Field label="Họ và tên" required>
                <input
                  type="text"
                  name="buyerFullname"
                  value={formData.buyerFullname}
                  onChange={handleChange}
                  className={inputClass(!!fieldErrors.buyerFullname)}
                />
                {fieldErrors.buyerFullname && <p className="text-red-400 text-xs mt-1">{fieldErrors.buyerFullname}</p>}
              </Field>

              <Field label="Email" required>
                <input
                  type="email"
                  name="buyerEmail"
                  value={formData.buyerEmail}
                  onChange={handleChange}
                  className={inputClass(!!fieldErrors.buyerEmail)}
                />
                {fieldErrors.buyerEmail && <p className="text-red-400 text-xs mt-1">{fieldErrors.buyerEmail}</p>}
              </Field>

              <Field label="Số CCCD" required>
                <input
                  type="text"
                  name="buyerIdentityCard"
                  value={formData.buyerIdentityCard}
                  onChange={handleChange}
                  className={inputClass(!!fieldErrors.buyerIdentityCard)}
                />
                {fieldErrors.buyerIdentityCard && (
                  <p className="text-red-400 text-xs mt-1">{fieldErrors.buyerIdentityCard}</p>
                )}
              </Field>

              <Field label="Số điện thoại" required>
                <input
                  type="tel"
                  name="buyerPhone"
                  value={formData.buyerPhone}
                  onChange={handleChange}
                  className={inputClass(!!fieldErrors.buyerPhone)}
                />
                {fieldErrors.buyerPhone && <p className="text-red-400 text-xs mt-1">{fieldErrors.buyerPhone}</p>}
              </Field>

              <Field label="Ngày sinh" required>
                <input
                  type="date"
                  name="buyerBirthday"
                  value={formData.buyerBirthday}
                  onChange={handleChange}
                  className={inputClass(!!fieldErrors.buyerBirthday)}
                />
                {fieldErrors.buyerBirthday && <p className="text-red-400 text-xs mt-1">{fieldErrors.buyerBirthday}</p>}
              </Field>

              <Field label="Giới tính" required>
                <select name="buyerGender" value={formData.buyerGender} onChange={handleChange} className={selectClass()}>
                  <option value="male">Nam</option>
                  <option value="female">Nữ</option>
                </select>
              </Field>

              <Field label="Nghề nghiệp" required>
                <input
                  type="text"
                  name="buyerJob"
                  value={formData.buyerJob}
                  onChange={handleChange}
                  className={inputClass(!!fieldErrors.buyerJob)}
                />
                {fieldErrors.buyerJob && <p className="text-red-400 text-xs mt-1">{fieldErrors.buyerJob}</p>}
              </Field>
            </div>

            {/* Buyer Location */}
            <div className="mt-4">
              <LocationPicker
                value={{
                  provinceCode: formData.buyerCity,
                  provinceName: formData.buyerCityText,
                  districtWardId: formData.buyerDistrict,
                  districtWardName: formData.buyerDistrictText,
                  specificAddress: formData.buyerAddress,
                }}
                onChange={handleBuyerLocationChange}
                errors={{
                  province: fieldErrors.buyerCity,
                  districtWard: fieldErrors.buyerDistrict,
                  specificAddress: fieldErrors.buyerAddress,
                }}
                labels={{
                  province: 'Tỉnh/Thành phố',
                  districtWard: 'Quận/Huyện',
                  specificAddress: 'Số nhà, tên đường',
                }}
              />
            </div>
          </section>

          {/* Insured Person & Beneficiary - side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Insured Person */}
            <section className="bg-slate-800/90 border border-blue-500/40 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <SectionHeader
                  title="Người được bảo hiểm"
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                  }
                />
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="insuredSameAsBuyer"
                    checked={formData.insuredSameAsBuyer}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                      formData.insuredSameAsBuyer ? 'border-green-500 bg-green-500' : 'border-white/30'
                    }`}
                  >
                    {formData.insuredSameAsBuyer && (
                      <svg className="w-3 h-3 text-black" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                  <span className="text-gray-400 text-sm">Giống người mua</span>
                </label>
              </div>

              <div className="space-y-4">
                <Field label="Quan hệ với người mua">
                  <select
                    name="insuredRelationship"
                    value={formData.insuredRelationship}
                    onChange={handleChange}
                    className={selectClass()}
                  >
                    {Object.entries(HEALTH_RELATIONSHIPS).map(([key, value]) => (
                      <option key={key} value={value}>
                        {HEALTH_RELATIONSHIP_LABELS[value]}
                      </option>
                    ))}
                  </select>
                </Field>

                {!formData.insuredSameAsBuyer && (
                  <>
                    <Field label="Họ và tên" required>
                      <input
                        type="text"
                        name="insuredFullname"
                        value={formData.insuredFullname}
                        onChange={handleChange}
                        className={inputClass(!!fieldErrors.insuredFullname)}
                      />
                      {fieldErrors.insuredFullname && (
                        <p className="text-red-400 text-xs mt-1">{fieldErrors.insuredFullname}</p>
                      )}
                    </Field>

                    <Field label="Số CCCD" required>
                      <input
                        type="text"
                        name="insuredIdentityCard"
                        value={formData.insuredIdentityCard}
                        onChange={handleChange}
                        className={inputClass(!!fieldErrors.insuredIdentityCard)}
                      />
                      {fieldErrors.insuredIdentityCard && (
                        <p className="text-red-400 text-xs mt-1">{fieldErrors.insuredIdentityCard}</p>
                      )}
                    </Field>

                    <Field label="Email" required>
                      <input
                        type="email"
                        name="insuredEmail"
                        value={formData.insuredEmail}
                        onChange={handleChange}
                        className={inputClass(!!fieldErrors.insuredEmail)}
                      />
                      {fieldErrors.insuredEmail && <p className="text-red-400 text-xs mt-1">{fieldErrors.insuredEmail}</p>}
                    </Field>

                    <Field label="Số điện thoại" required>
                      <input
                        type="tel"
                        name="insuredPhone"
                        value={formData.insuredPhone}
                        onChange={handleChange}
                        className={inputClass(!!fieldErrors.insuredPhone)}
                      />
                      {fieldErrors.insuredPhone && <p className="text-red-400 text-xs mt-1">{fieldErrors.insuredPhone}</p>}
                    </Field>

                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Ngày sinh" required>
                        <input
                          type="date"
                          name="insuredBirthday"
                          value={formData.insuredBirthday}
                          onChange={handleChange}
                          className={inputClass(!!fieldErrors.insuredBirthday)}
                        />
                        {fieldErrors.insuredBirthday && <p className="text-red-400 text-xs mt-1">{fieldErrors.insuredBirthday}</p>}
                      </Field>

                      <Field label="Giới tính" required>
                        <select
                          name="insuredGender"
                          value={formData.insuredGender}
                          onChange={handleChange}
                          className={selectClass()}
                        >
                          <option value="male">Nam</option>
                          <option value="female">Nữ</option>
                        </select>
                      </Field>
                    </div>

                    <Field label="Nghề nghiệp" required>
                      <input
                        type="text"
                        name="insuredJob"
                        value={formData.insuredJob}
                        onChange={handleChange}
                        className={inputClass(!!fieldErrors.insuredJob)}
                      />
                      {fieldErrors.insuredJob && <p className="text-red-400 text-xs mt-1">{fieldErrors.insuredJob}</p>}
                    </Field>

                    {/* Insured Location */}
                    <div className="mt-2">
                      <LocationPicker
                        value={{
                          provinceCode: formData.insuredCity,
                          provinceName: formData.insuredCityText,
                          districtWardId: formData.insuredDistrict,
                          districtWardName: formData.insuredDistrictText,
                          specificAddress: formData.insuredAddress,
                        }}
                        onChange={handleInsuredLocationChange}
                        errors={{
                          province: fieldErrors.insuredCity,
                          districtWard: fieldErrors.insuredDistrict,
                          specificAddress: fieldErrors.insuredAddress,
                        }}
                        labels={{
                          province: 'Tỉnh/Thành phố',
                          districtWard: 'Quận/Huyện',
                          specificAddress: 'Địa chỉ',
                        }}
                        className="!grid-cols-1"
                      />
                    </div>
                  </>
                )}
              </div>
            </section>

            {/* Beneficiary */}
            <section className="bg-slate-800/90 border border-blue-500/40 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <SectionHeader
                  title="Người thụ hưởng"
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  }
                />
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="beneficiarySameAsInsured"
                    checked={formData.beneficiarySameAsInsured}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                      formData.beneficiarySameAsInsured ? 'border-green-500 bg-green-500' : 'border-white/30'
                    }`}
                  >
                    {formData.beneficiarySameAsInsured && (
                      <svg className="w-3 h-3 text-black" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                  <span className="text-gray-400 text-sm">Giống người mua BH</span>
                </label>
              </div>

              <div className="space-y-4">
                <Field label="Quan hệ với người mua BH">
                  <select
                    name="beneficiaryRelationship"
                    value={formData.beneficiaryRelationship}
                    onChange={handleChange}
                    className={selectClass()}
                  >
                    {Object.entries(HEALTH_RELATIONSHIPS).map(([key, value]) => (
                      <option key={key} value={value}>
                        {HEALTH_RELATIONSHIP_LABELS[value]}
                      </option>
                    ))}
                  </select>
                </Field>

                {!formData.beneficiarySameAsInsured && (
                  <>
                    <Field label="Họ và tên" required>
                      <input
                        type="text"
                        name="beneficiaryFullname"
                        value={formData.beneficiaryFullname}
                        onChange={handleChange}
                        className={inputClass(!!fieldErrors.beneficiaryFullname)}
                      />
                      {fieldErrors.beneficiaryFullname && (
                        <p className="text-red-400 text-xs mt-1">{fieldErrors.beneficiaryFullname}</p>
                      )}
                    </Field>

                    <Field label="Số CCCD" required>
                      <input
                        type="text"
                        name="beneficiaryIdentityCard"
                        value={formData.beneficiaryIdentityCard}
                        onChange={handleChange}
                        className={inputClass(!!fieldErrors.beneficiaryIdentityCard)}
                      />
                      {fieldErrors.beneficiaryIdentityCard && (
                        <p className="text-red-400 text-xs mt-1">{fieldErrors.beneficiaryIdentityCard}</p>
                      )}
                    </Field>

                    <Field label="Email" required>
                      <input
                        type="email"
                        name="beneficiaryEmail"
                        value={formData.beneficiaryEmail}
                        onChange={handleChange}
                        className={inputClass(!!fieldErrors.beneficiaryEmail)}
                      />
                      {fieldErrors.beneficiaryEmail && <p className="text-red-400 text-xs mt-1">{fieldErrors.beneficiaryEmail}</p>}
                    </Field>

                    <Field label="Số điện thoại" required>
                      <input
                        type="tel"
                        name="beneficiaryPhone"
                        value={formData.beneficiaryPhone}
                        onChange={handleChange}
                        className={inputClass(!!fieldErrors.beneficiaryPhone)}
                      />
                      {fieldErrors.beneficiaryPhone && <p className="text-red-400 text-xs mt-1">{fieldErrors.beneficiaryPhone}</p>}
                    </Field>

                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Ngày sinh" required>
                        <input
                          type="date"
                          name="beneficiaryBirthday"
                          value={formData.beneficiaryBirthday}
                          onChange={handleChange}
                          className={inputClass(!!fieldErrors.beneficiaryBirthday)}
                        />
                        {fieldErrors.beneficiaryBirthday && <p className="text-red-400 text-xs mt-1">{fieldErrors.beneficiaryBirthday}</p>}
                      </Field>

                      <Field label="Giới tính" required>
                        <select
                          name="beneficiaryGender"
                          value={formData.beneficiaryGender}
                          onChange={handleChange}
                          className={selectClass()}
                        >
                          <option value="male">Nam</option>
                          <option value="female">Nữ</option>
                        </select>
                      </Field>
                    </div>

                    <Field label="Nghề nghiệp" required>
                      <input
                        type="text"
                        name="beneficiaryJob"
                        value={formData.beneficiaryJob}
                        onChange={handleChange}
                        className={inputClass(!!fieldErrors.beneficiaryJob)}
                      />
                      {fieldErrors.beneficiaryJob && <p className="text-red-400 text-xs mt-1">{fieldErrors.beneficiaryJob}</p>}
                    </Field>

                    {/* Beneficiary Location */}
                    <div className="mt-2">
                      <LocationPicker
                        value={{
                          provinceCode: formData.beneficiaryCity,
                          provinceName: formData.beneficiaryCityText,
                          districtWardId: formData.beneficiaryDistrict,
                          districtWardName: formData.beneficiaryDistrictText,
                          specificAddress: formData.beneficiaryAddress,
                        }}
                        onChange={handleBeneficiaryLocationChange}
                        errors={{
                          province: fieldErrors.beneficiaryCity,
                          districtWard: fieldErrors.beneficiaryDistrict,
                          specificAddress: fieldErrors.beneficiaryAddress,
                        }}
                        labels={{
                          province: 'Tỉnh/Thành phố',
                          districtWard: 'Quận/Huyện',
                          specificAddress: 'Địa chỉ',
                        }}
                        className="!grid-cols-1"
                      />
                    </div>
                  </>
                )}
              </div>
            </section>
          </div>

          {/* Dates & Premium */}
          <section className="bg-slate-800/90 border border-blue-500/40 rounded-2xl p-6">
            <SectionHeader
              title="Thời hạn & Phí bảo hiểm"
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              }
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <Field label="Ngày bắt đầu" required>
                <input
                  type="date"
                  name="activeDate"
                  value={formData.activeDate}
                  onChange={handleChange}
                  className={inputClass(!!fieldErrors.activeDate)}
                />
                {fieldErrors.activeDate && <p className="text-red-400 text-xs mt-1">{fieldErrors.activeDate}</p>}
              </Field>

              <Field label="Ngày kết thúc">
                <input
                  type="date"
                  name="inactiveDate"
                  value={formData.inactiveDate}
                  onChange={handleChange}
                  className={inputClass()}
                />
              </Field>

              <Field label="Phí bảo hiểm (VND)" required>
                <input
                  type="number"
                  name="totalPremium"
                  value={formData.totalPremium}
                  onChange={handleChange}
                  min="0"
                  className={inputClass(!!fieldErrors.totalPremium)}
                />
                {fieldErrors.totalPremium && <p className="text-red-400 text-xs mt-1">{fieldErrors.totalPremium}</p>}
              </Field>
            </div>

          </section>

          </fieldset>
          </form>

        </div>
      </div>
    </DashboardLayout>
  );
}
