'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import {
  HEALTH_PACKAGES,
  HEALTH_PACKAGE_LABELS,
  HEALTH_RELATIONSHIPS,
  HEALTH_RELATIONSHIP_LABELS,
} from '@/providers/bhv-online/products/health/constants';
import { HEALTH_QUESTION_DEFINITIONS } from '@/providers/bhv-online/products/health/health-questions';

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

// Field wrapper with change indicator
function Field({
  label,
  required,
  isChanged,
  children,
  className = '',
}: {
  label: string;
  required?: boolean;
  isChanged?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      <label className="block text-sm text-slate-400 mb-1.5 font-medium">
        {label} {required && <span className="text-orange-400">*</span>}
      </label>
      <div className="relative">
        {children}
        {isChanged && (
          <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
        )}
      </div>
    </div>
  );
}

interface HealthContractData {
  _id: string;
  contractNumber: string;
  kindAction: string;
  certificateCode?: string;
  packageType: string;
  packageName: string;
  purchaseYears: number;
  benefitAddons: {
    maternity: boolean;
    outpatient: boolean;
    diseaseDeath: boolean;
  };
  healthQuestions: Array<{
    questionId: string;
    answer: boolean;
    details?: string;
  }>;
  buyer: {
    fullname: string;
    email: string;
    identityCard: string;
    phone: string;
    birthday: string;
    gender: string;
    job?: string;
    address?: string;
  };
  insuredPerson: {
    fullname: string;
    email?: string;
    identityCard: string;
    phone?: string;
    birthday: string;
    gender: string;
    relationship: string;
  };
  beneficiary: {
    fullname: string;
    identityCard: string;
    relationship: string;
  };
  customerKind: string;
  activeDate: string;
  inactiveDate: string;
  totalPremium: number;
  status: string;
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
  buyerDistrict: string;
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
  insuredDistrict: string;
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
  beneficiaryDistrict: string;
  beneficiaryAddress: string;
  activeDate: string;
  inactiveDate: string;
  totalPremium: string;
  agreeTerms: boolean;
};

const initialFormData: FormDataType = {
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
  buyerDistrict: '',
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
  insuredDistrict: '',
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
  beneficiaryDistrict: '',
  beneficiaryAddress: '',
  activeDate: '',
  inactiveDate: '',
  totalPremium: '',
  agreeTerms: true,
};

export default function EditHealthContractPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [contractNumber, setContractNumber] = useState('');

  // Form state
  const [formData, setFormData] = useState<FormDataType>(initialFormData);
  // Original data for change tracking
  const [originalData, setOriginalData] = useState<FormDataType>(initialFormData);

  // Track changed fields
  const changedFields = useMemo(() => {
    const changed = new Set<string>();
    (Object.keys(formData) as Array<keyof FormDataType>).forEach((key) => {
      if (formData[key] !== originalData[key]) {
        changed.add(key);
      }
    });
    return changed;
  }, [formData, originalData]);

  const hasChanges = changedFields.size > 0;

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/');
      return;
    }
    const user = JSON.parse(userData);
    if (!user.isLoggedIn) {
      router.push('/');
      return;
    }

    fetchContract();
  }, [router, params.id]);

  const fetchContract = async () => {
    try {
      const response = await fetch(`/api/contracts/health/${params.id}`);
      const data = await response.json();

      if (response.ok) {
        const contract: HealthContractData = data.contract;

        if (contract.status !== 'nhap') {
          setError('Chỉ có thể sửa hợp đồng ở trạng thái nháp');
          setLoading(false);
          return;
        }

        setContractNumber(contract.contractNumber);

        const insuredSameAsBuyer =
          contract.buyer.fullname === contract.insuredPerson.fullname &&
          contract.buyer.identityCard === contract.insuredPerson.identityCard;

        const beneficiarySameAsInsured =
          contract.insuredPerson.fullname === contract.beneficiary.fullname &&
          contract.insuredPerson.identityCard === contract.beneficiary.identityCard;

        const mappedData: FormDataType = {
          kindAction: contract.kindAction || 'insert',
          certificateCode: contract.certificateCode || '',
          packageType: contract.packageType,
          purchaseYears: String(contract.purchaseYears),
          benefitMaternity: contract.benefitAddons?.maternity || false,
          benefitOutpatient: contract.benefitAddons?.outpatient || false,
          benefitDiseaseDeath: contract.benefitAddons?.diseaseDeath || false,
          q1Answer: contract.healthQuestions?.[0]?.answer ? 'true' : 'false',
          q1Details: contract.healthQuestions?.[0]?.details || '',
          q2Answer: contract.healthQuestions?.[1]?.answer ? 'true' : 'false',
          q2Details: contract.healthQuestions?.[1]?.details || '',
          q3Answer: contract.healthQuestions?.[2]?.answer ? 'true' : 'false',
          q3Details: contract.healthQuestions?.[2]?.details || '',
          q4Answer: contract.healthQuestions?.[3]?.answer ? 'true' : 'false',
          q4Details: contract.healthQuestions?.[3]?.details || '',
          q5Answer: contract.healthQuestions?.[4]?.answer ? 'true' : 'false',
          q5Details: contract.healthQuestions?.[4]?.details || '',
          customerKind: contract.customerKind || 'personal',
          buyerFullname: contract.buyer.fullname,
          buyerEmail: contract.buyer.email || '',
          buyerIdentityCard: contract.buyer.identityCard,
          buyerPhone: contract.buyer.phone,
          buyerBirthday: contract.buyer.birthday,
          buyerGender: contract.buyer.gender,
          buyerJob: contract.buyer.job || '',
          buyerCity: '',
          buyerDistrict: '',
          buyerAddress: contract.buyer.address || '',
          insuredSameAsBuyer,
          insuredRelationship: contract.insuredPerson.relationship,
          insuredFullname: contract.insuredPerson.fullname,
          insuredEmail: contract.insuredPerson.email || '',
          insuredIdentityCard: contract.insuredPerson.identityCard,
          insuredPhone: contract.insuredPerson.phone || '',
          insuredBirthday: contract.insuredPerson.birthday,
          insuredGender: contract.insuredPerson.gender,
          insuredJob: '',
          insuredCity: '',
          insuredDistrict: '',
          insuredAddress: '',
          beneficiarySameAsInsured,
          beneficiaryRelationship: contract.beneficiary.relationship,
          beneficiaryFullname: contract.beneficiary.fullname,
          beneficiaryEmail: '',
          beneficiaryIdentityCard: contract.beneficiary.identityCard,
          beneficiaryPhone: '',
          beneficiaryBirthday: '',
          beneficiaryGender: 'male',
          beneficiaryJob: '',
          beneficiaryCity: '',
          beneficiaryDistrict: '',
          beneficiaryAddress: '',
          activeDate: contract.activeDate,
          inactiveDate: contract.inactiveDate,
          totalPremium: String(contract.totalPremium),
          agreeTerms: true,
        };

        setFormData(mappedData);
        setOriginalData(mappedData);
      } else {
        setError(data.error || 'Không thể tải hợp đồng');
      }
    } catch {
      setError('Lỗi kết nối server');
    } finally {
      setLoading(false);
    }
  };

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

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.packageType) errors.packageType = 'Vui lòng chọn gói bảo hiểm';
    if (!formData.buyerFullname) errors.buyerFullname = 'Vui lòng nhập họ tên';
    if (!formData.buyerIdentityCard) errors.buyerIdentityCard = 'Vui lòng nhập CCCD/CMND';
    if (!formData.buyerPhone) errors.buyerPhone = 'Vui lòng nhập số điện thoại';
    if (!formData.buyerBirthday) errors.buyerBirthday = 'Vui lòng nhập ngày sinh';

    // Health questions validation - require details when answer is "Có"
    for (let i = 1; i <= 5; i++) {
      const answerKey = `q${i}Answer` as keyof FormDataType;
      const detailsKey = `q${i}Details` as keyof FormDataType;
      if (formData[answerKey] === 'true' && !formData[detailsKey]?.toString().trim()) {
        errors[detailsKey] = 'Vui lòng nhập chi tiết khi chọn "Có"';
      }
    }

    if (!formData.insuredSameAsBuyer) {
      if (!formData.insuredFullname) errors.insuredFullname = 'Vui lòng nhập họ tên';
      if (!formData.insuredIdentityCard) errors.insuredIdentityCard = 'Vui lòng nhập CCCD/CMND';
    }

    if (!formData.beneficiarySameAsInsured) {
      if (!formData.beneficiaryFullname) errors.beneficiaryFullname = 'Vui lòng nhập họ tên';
      if (!formData.beneficiaryIdentityCard) errors.beneficiaryIdentityCard = 'Vui lòng nhập CCCD/CMND';
    }

    if (!formData.activeDate) errors.activeDate = 'Vui lòng chọn ngày bắt đầu';
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

    setSaving(true);
    setError('');

    try {
      const submitData = {
        ...formData,
        buyerLocation: {
          province: formData.buyerCity,
          district: formData.buyerDistrict,
        },
        insuredLocation: {
          province: formData.insuredCity,
          district: formData.insuredDistrict,
        },
        beneficiaryLocation: {
          province: formData.beneficiaryCity,
          district: formData.beneficiaryDistrict,
        },
      };

      const response = await fetch(`/api/contracts/health/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      const data = await response.json();

      if (response.ok) {
        router.push(`/health/${params.id}`);
      } else {
        setError(data.error || 'Không thể cập nhật hợp đồng');
      }
    } catch {
      setError('Lỗi kết nối server');
    } finally {
      setSaving(false);
    }
  };

  // Input style helper
  const inputClass = (fieldName: string, hasError = false) => {
    const isChanged = changedFields.has(fieldName);
    return `w-full px-4 py-2.5 bg-white/5 border rounded-xl text-white placeholder-gray-500 focus:outline-none transition-all duration-200 ${
      hasError
        ? 'border-red-500/70 focus:border-red-500'
        : isChanged
          ? 'border-orange-500/70 focus:border-orange-400 ring-1 ring-orange-500/20'
          : 'border-white/10 focus:border-blue-500/50 hover:border-white/20'
    }`;
  };

  const selectClass = (fieldName: string, hasError = false) => inputClass(fieldName, hasError);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-gray-400 text-sm">Đang tải...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error && !formData.buyerFullname) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center bg-slate-800/60 border border-slate-600/30 rounded-2xl p-8 max-w-md">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-gray-300 mb-6">{error}</p>
            <button
              onClick={() => router.push('/health')}
              className="px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors"
            >
              Quay lại danh sách
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-4 lg:p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => router.push(`/health/${params.id}`)}
              className="w-10 h-10 rounded-xl bg-slate-700/50 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Sửa hợp đồng</h1>
              <p className="text-sm text-gray-400">{contractNumber}</p>
            </div>
            {hasChanges && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-500/10 border border-orange-500/20 rounded-lg ml-auto">
                <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
                <span className="text-orange-400 text-sm font-medium">{changedFields.size} thay đổi</span>
              </div>
            )}
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm mb-6">
              {error}
            </div>
          )}

          {/* Main form */}
          <form onSubmit={handleSubmit} className="space-y-6">
          {/* Package Selection */}
          <section className="bg-slate-800/90 border border-blue-500/40 rounded-2xl p-6">
            <SectionHeader
              title="Gói bảo hiểm"
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              }
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              {Object.entries(HEALTH_PACKAGES).map(([key, value]) => {
                const isSelected = formData.packageType === value;
                const isChanged = changedFields.has('packageType') && isSelected;
                return (
                  <label
                    key={key}
                    className={`relative p-4 border rounded-xl cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? isChanged
                          ? 'border-orange-500 bg-orange-900/30 shadow-lg shadow-orange-500/10'
                          : 'border-green-500 bg-green-900/30 shadow-lg shadow-green-500/10'
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
                          isSelected
                            ? isChanged
                              ? 'border-orange-400 bg-orange-400'
                              : 'border-green-500 bg-green-500'
                            : 'border-white/30'
                        }`}
                      >
                        {isSelected && (
                          <svg className="w-3 h-3 text-black" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <span className={`font-medium ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                        {HEALTH_PACKAGE_LABELS[value]}
                      </span>
                    </div>
                    {isChanged && (
                      <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    )}
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
                  const isChanged = changedFields.has(benefit.name);
                  return (
                    <label
                      key={benefit.name}
                      className={`relative flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                        isChecked
                          ? isChanged
                            ? 'bg-orange-900/30 border border-orange-500/30'
                            : 'bg-green-900/30 border border-green-500/30'
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
                          isChecked
                            ? isChanged
                              ? 'border-orange-400 bg-orange-400'
                              : 'border-green-500 bg-green-500'
                            : 'border-white/30'
                        }`}
                      >
                        {isChecked && (
                          <svg className="w-3 h-3 text-black" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <span className={`text-sm ${isChecked ? 'text-white' : 'text-gray-400'}`}>{benefit.label}</span>
                      {isChanged && (
                        <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                      )}
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              }
            />

            <div className="space-y-4">
              {HEALTH_QUESTION_DEFINITIONS.map((q, index) => {
                const answerKey = `q${index + 1}Answer` as keyof FormDataType;
                const detailsKey = `q${index + 1}Details` as keyof FormDataType;
                const isYes = formData[answerKey] === 'true';
                const isAnswerChanged = changedFields.has(answerKey);
                const isDetailsChanged = changedFields.has(detailsKey);

                return (
                  <div
                    key={q.id}
                    className={`p-4 rounded-xl border transition-all ${
                      isAnswerChanged
                        ? 'bg-amber-500/5 border-amber-500/30'
                        : 'bg-white/5 border-white/10'
                    }`}
                  >
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
                              formData[answerKey] === val
                                ? isAnswerChanged
                                  ? 'border-orange-400 bg-orange-400'
                                  : 'border-green-500 bg-green-500'
                                : 'border-white/30'
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
                          className={`w-full px-4 py-2.5 bg-white/5 border rounded-xl text-white placeholder-gray-500 focus:outline-none transition-all ${
                            fieldErrors[detailsKey]
                              ? 'border-red-500 focus:border-red-500'
                              : isDetailsChanged
                                ? 'border-orange-500/70 focus:border-orange-400'
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              }
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Field label="Họ và tên" required isChanged={changedFields.has('buyerFullname')}>
                <input
                  type="text"
                  name="buyerFullname"
                  value={formData.buyerFullname}
                  onChange={handleChange}
                  className={inputClass('buyerFullname', !!fieldErrors.buyerFullname)}
                />
                {fieldErrors.buyerFullname && (
                  <p className="text-red-400 text-xs mt-1">{fieldErrors.buyerFullname}</p>
                )}
              </Field>

              <Field label="Email" isChanged={changedFields.has('buyerEmail')}>
                <input
                  type="email"
                  name="buyerEmail"
                  value={formData.buyerEmail}
                  onChange={handleChange}
                  className={inputClass('buyerEmail')}
                />
              </Field>

              <Field label="Số CCCD" required isChanged={changedFields.has('buyerIdentityCard')}>
                <input
                  type="text"
                  name="buyerIdentityCard"
                  value={formData.buyerIdentityCard}
                  onChange={handleChange}
                  className={inputClass('buyerIdentityCard', !!fieldErrors.buyerIdentityCard)}
                />
                {fieldErrors.buyerIdentityCard && (
                  <p className="text-red-400 text-xs mt-1">{fieldErrors.buyerIdentityCard}</p>
                )}
              </Field>

              <Field label="Số điện thoại" required isChanged={changedFields.has('buyerPhone')}>
                <input
                  type="tel"
                  name="buyerPhone"
                  value={formData.buyerPhone}
                  onChange={handleChange}
                  className={inputClass('buyerPhone', !!fieldErrors.buyerPhone)}
                />
                {fieldErrors.buyerPhone && (
                  <p className="text-red-400 text-xs mt-1">{fieldErrors.buyerPhone}</p>
                )}
              </Field>

              <Field label="Ngày sinh" required isChanged={changedFields.has('buyerBirthday')}>
                <input
                  type="date"
                  name="buyerBirthday"
                  value={formData.buyerBirthday}
                  onChange={handleChange}
                  className={inputClass('buyerBirthday', !!fieldErrors.buyerBirthday)}
                />
                {fieldErrors.buyerBirthday && (
                  <p className="text-red-400 text-xs mt-1">{fieldErrors.buyerBirthday}</p>
                )}
              </Field>

              <Field label="Giới tính" required isChanged={changedFields.has('buyerGender')}>
                <select
                  name="buyerGender"
                  value={formData.buyerGender}
                  onChange={handleChange}
                  className={selectClass('buyerGender')}
                >
                  <option value="male">Nam</option>
                  <option value="female">Nữ</option>
                </select>
              </Field>

              <Field label="Địa chỉ" isChanged={changedFields.has('buyerAddress')} className="sm:col-span-2 lg:col-span-3">
                <input
                  type="text"
                  name="buyerAddress"
                  value={formData.buyerAddress}
                  onChange={handleChange}
                  className={inputClass('buyerAddress')}
                />
              </Field>
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
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
                      formData.insuredSameAsBuyer
                        ? changedFields.has('insuredSameAsBuyer')
                          ? 'border-orange-400 bg-orange-400'
                          : 'border-green-500 bg-green-500'
                        : 'border-white/30'
                    }`}
                  >
                    {formData.insuredSameAsBuyer && (
                      <svg className="w-3 h-3 text-black" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <span className="text-gray-400 text-sm">Giống người mua</span>
                </label>
              </div>

              <div className="space-y-4">
                <Field label="Quan hệ với người mua" isChanged={changedFields.has('insuredRelationship')}>
                  <select
                    name="insuredRelationship"
                    value={formData.insuredRelationship}
                    onChange={handleChange}
                    className={selectClass('insuredRelationship')}
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
                    <Field label="Họ và tên" required isChanged={changedFields.has('insuredFullname')}>
                      <input
                        type="text"
                        name="insuredFullname"
                        value={formData.insuredFullname}
                        onChange={handleChange}
                        className={inputClass('insuredFullname', !!fieldErrors.insuredFullname)}
                      />
                      {fieldErrors.insuredFullname && (
                        <p className="text-red-400 text-xs mt-1">{fieldErrors.insuredFullname}</p>
                      )}
                    </Field>

                    <Field label="Số CCCD" required isChanged={changedFields.has('insuredIdentityCard')}>
                      <input
                        type="text"
                        name="insuredIdentityCard"
                        value={formData.insuredIdentityCard}
                        onChange={handleChange}
                        className={inputClass('insuredIdentityCard', !!fieldErrors.insuredIdentityCard)}
                      />
                      {fieldErrors.insuredIdentityCard && (
                        <p className="text-red-400 text-xs mt-1">{fieldErrors.insuredIdentityCard}</p>
                      )}
                    </Field>

                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Ngày sinh" isChanged={changedFields.has('insuredBirthday')}>
                        <input
                          type="date"
                          name="insuredBirthday"
                          value={formData.insuredBirthday}
                          onChange={handleChange}
                          className={inputClass('insuredBirthday')}
                        />
                      </Field>

                      <Field label="Giới tính" isChanged={changedFields.has('insuredGender')}>
                        <select
                          name="insuredGender"
                          value={formData.insuredGender}
                          onChange={handleChange}
                          className={selectClass('insuredGender')}
                        >
                          <option value="male">Nam</option>
                          <option value="female">Nữ</option>
                        </select>
                      </Field>
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
                      formData.beneficiarySameAsInsured
                        ? changedFields.has('beneficiarySameAsInsured')
                          ? 'border-orange-400 bg-orange-400'
                          : 'border-green-500 bg-green-500'
                        : 'border-white/30'
                    }`}
                  >
                    {formData.beneficiarySameAsInsured && (
                      <svg className="w-3 h-3 text-black" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <span className="text-gray-400 text-sm">Giống người được BH</span>
                </label>
              </div>

              <div className="space-y-4">
                <Field label="Quan hệ với người được BH" isChanged={changedFields.has('beneficiaryRelationship')}>
                  <select
                    name="beneficiaryRelationship"
                    value={formData.beneficiaryRelationship}
                    onChange={handleChange}
                    className={selectClass('beneficiaryRelationship')}
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
                    <Field label="Họ và tên" required isChanged={changedFields.has('beneficiaryFullname')}>
                      <input
                        type="text"
                        name="beneficiaryFullname"
                        value={formData.beneficiaryFullname}
                        onChange={handleChange}
                        className={inputClass('beneficiaryFullname', !!fieldErrors.beneficiaryFullname)}
                      />
                      {fieldErrors.beneficiaryFullname && (
                        <p className="text-red-400 text-xs mt-1">{fieldErrors.beneficiaryFullname}</p>
                      )}
                    </Field>

                    <Field label="Số CCCD" required isChanged={changedFields.has('beneficiaryIdentityCard')}>
                      <input
                        type="text"
                        name="beneficiaryIdentityCard"
                        value={formData.beneficiaryIdentityCard}
                        onChange={handleChange}
                        className={inputClass('beneficiaryIdentityCard', !!fieldErrors.beneficiaryIdentityCard)}
                      />
                      {fieldErrors.beneficiaryIdentityCard && (
                        <p className="text-red-400 text-xs mt-1">{fieldErrors.beneficiaryIdentityCard}</p>
                      )}
                    </Field>
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              }
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Ngày bắt đầu" required isChanged={changedFields.has('activeDate')}>
                <input
                  type="date"
                  name="activeDate"
                  value={formData.activeDate}
                  onChange={handleChange}
                  className={inputClass('activeDate', !!fieldErrors.activeDate)}
                />
                {fieldErrors.activeDate && (
                  <p className="text-red-400 text-xs mt-1">{fieldErrors.activeDate}</p>
                )}
              </Field>

              <Field label="Ngày kết thúc" isChanged={changedFields.has('inactiveDate')}>
                <input
                  type="date"
                  name="inactiveDate"
                  value={formData.inactiveDate}
                  onChange={handleChange}
                  className={inputClass('inactiveDate')}
                />
              </Field>

              <Field label="Phí bảo hiểm (VND)" required isChanged={changedFields.has('totalPremium')}>
                <input
                  type="number"
                  name="totalPremium"
                  value={formData.totalPremium}
                  onChange={handleChange}
                  min="0"
                  className={inputClass('totalPremium', !!fieldErrors.totalPremium)}
                />
                {fieldErrors.totalPremium && (
                  <p className="text-red-400 text-xs mt-1">{fieldErrors.totalPremium}</p>
                )}
              </Field>
            </div>
          </section>

          </form>

          {/* Fixed Save Button - always visible at bottom right */}
          <div className="fixed bottom-6 right-6 z-50">
            <button
              onClick={handleSubmit}
              disabled={saving || !hasChanges}
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-slate-600 disabled:to-slate-600 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-xl shadow-green-900/30"
            >
              {saving && (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {hasChanges ? `Cập nhật (${changedFields.size})` : 'Cập nhật'}
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
