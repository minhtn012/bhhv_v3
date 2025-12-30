'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
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

export default function NewHealthContractPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

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

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.packageType) errors.packageType = 'Vui lòng chọn gói bảo hiểm';
    if (!formData.buyerFullname) errors.buyerFullname = 'Vui lòng nhập họ tên';
    if (!formData.buyerIdentityCard) errors.buyerIdentityCard = 'Vui lòng nhập CCCD/CMND';
    if (!formData.buyerPhone) errors.buyerPhone = 'Vui lòng nhập số điện thoại';
    if (!formData.buyerBirthday) errors.buyerBirthday = 'Vui lòng nhập ngày sinh';

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
    if (!formData.agreeTerms) errors.agreeTerms = 'Vui lòng đồng ý điều khoản';

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
        <div className="max-w-4xl mx-auto">
          {/* Sticky Header */}
          <div className="sticky top-0 z-20 bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-900/80 backdrop-blur-sm -mx-4 lg:-mx-6 px-4 lg:px-6 py-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
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

              {/* Save button */}
              <button
                onClick={handleSubmit}
                disabled={loading || !formData.agreeTerms}
                className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-slate-600 disabled:to-slate-600 text-white font-medium rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg"
              >
                {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Tạo hợp đồng
              </button>
            </div>
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
                      <textarea
                        name={detailsKey}
                        value={formData[detailsKey] as string}
                        onChange={handleChange}
                        placeholder={q.textPlaceholder}
                        rows={2}
                        className="mt-3 w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-green-500/50 transition-all"
                      />
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

              <Field label="Email">
                <input
                  type="email"
                  name="buyerEmail"
                  value={formData.buyerEmail}
                  onChange={handleChange}
                  className={inputClass()}
                />
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

              <Field label="Địa chỉ" className="sm:col-span-2 lg:col-span-3">
                <input
                  type="text"
                  name="buyerAddress"
                  value={formData.buyerAddress}
                  onChange={handleChange}
                  className={inputClass()}
                />
              </Field>
            </div>
          </section>

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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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

                  <Field label="Ngày sinh">
                    <input
                      type="date"
                      name="insuredBirthday"
                      value={formData.insuredBirthday}
                      onChange={handleChange}
                      className={inputClass()}
                    />
                  </Field>

                  <Field label="Giới tính">
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
                <span className="text-gray-400 text-sm">Giống người được BH</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Field label="Quan hệ với người được BH">
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
                </>
              )}
            </div>
          </section>

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

            {/* Terms Agreement */}
            <label
              className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all ${
                fieldErrors.agreeTerms
                  ? 'bg-red-500/10 border border-red-500/50'
                  : formData.agreeTerms
                    ? 'bg-green-900/30 border border-green-500/30'
                    : 'bg-white/5 border border-white/10 hover:bg-white/10'
              }`}
            >
              <input
                type="checkbox"
                name="agreeTerms"
                checked={formData.agreeTerms}
                onChange={handleChange}
                className="sr-only"
              />
              <div
                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                  formData.agreeTerms ? 'border-green-500 bg-green-500' : 'border-white/30'
                }`}
              >
                {formData.agreeTerms && (
                  <svg className="w-3 h-3 text-black" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
              <span className={`text-sm ${formData.agreeTerms ? 'text-white' : 'text-gray-400'}`}>
                Tôi đã đọc và đồng ý với điều khoản bảo hiểm
              </span>
            </label>
            {fieldErrors.agreeTerms && <p className="text-red-400 text-xs mt-2">{fieldErrors.agreeTerms}</p>}
          </section>

          </form>

          {/* Floating Save Button (mobile) */}
          <div className="fixed bottom-6 left-4 right-4 lg:hidden">
            <button
              onClick={handleSubmit}
              disabled={loading || !formData.agreeTerms}
              className="w-full py-3.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-slate-600 disabled:to-slate-600 text-white font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Tạo hợp đồng
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
