'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import InsuredPersonForm from '@/components/travel/InsuredPersonForm';
import ProductPlanSelector from '@/components/travel/ProductPlanSelector';
import TravelOCRUpload from '@/components/travel/TravelOCRUpload';
import {
  TRAVEL_POLICY_TYPES,
  TRAVEL_HOLDER_TYPES,
  TRAVEL_COUNTRIES,
} from '@/providers/pacific-cross/products/travel/constants';
import type { TravelInsuredPerson } from '@/types/travel';
import { calculateInsuranceDays } from '@/utils/dateFormatter';

export default function NewTravelContractPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showOCRModal, setShowOCRModal] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/');
      return;
    }
    const user = JSON.parse(userData);
    if (!user.isLoggedIn || user.role === 'admin') {
      router.push('/');
    }
  }, [router]);

  // Form state
  const [owner, setOwner] = useState({
    policyholder: '',
    pocyType: 'Individual' as const,
    pohoType: 'POHO_TYPE_E' as const,
    email: '',
    telNo: '',
    address: '',
    countryAddress: 'VIETNAM',
    startCountry: 'VIETNAM',
  });

  const [period, setPeriod] = useState({
    dateFrom: '',
    dateTo: '',
    days: 0,
  });

  const [phoneError, setPhoneError] = useState('');

  // Get tomorrow's date in YYYY-MM-DD format for min date constraint
  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const minDate = getTomorrowDate();

  // Validate Vietnamese phone number: 10 digits starting with 0, or +84 followed by 9 digits
  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^(0[0-9]{9}|\+84[0-9]{9})$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  const handlePhoneChange = (value: string) => {
    setOwner({...owner, telNo: value});
    if (value && !validatePhone(value)) {
      setPhoneError('SĐT không hợp lệ (VD: 0912345678 hoặc +84912345678)');
    } else {
      setPhoneError('');
    }
  };

  const [product, setProduct] = useState(2); // Travel Flex
  const [plan, setPlan] = useState(534);
  const [hasCarRental, setHasCarRental] = useState(false);

  const [insuredPersons, setInsuredPersons] = useState<Partial<TravelInsuredPerson>[]>([
    { name: '', dob: '', age: 0, gender: 'M', country: 'VIETNAM', personalId: '', relationship: 'RELATION_O', pct: 100 }
  ]);

  // Parallel array for CCCD images from OCR
  const [personImageUrls, setPersonImageUrls] = useState<string[]>(['']);

  const [additionalInfo, setAdditionalInfo] = useState({
    refNo: '',
    pnrNo: '',
    itinerary: '',
    note: '',
  });

  // Calculate days when dates change
  useEffect(() => {
    if (period.dateFrom && period.dateTo) {
      const days = calculateInsuranceDays(period.dateFrom, period.dateTo);
      setPeriod(prev => ({ ...prev, days }));
    }
  }, [period.dateFrom, period.dateTo]);

  const addInsuredPerson = useCallback(() => {
    setInsuredPersons(prev => [
      ...prev,
      { name: '', dob: '', age: 0, gender: 'M', country: 'VIETNAM', personalId: '', relationship: 'RELATION_O', pct: 100 }
    ]);
    setPersonImageUrls(prev => [...prev, '']);
  }, []);

  const removeInsuredPerson = useCallback((index: number) => {
    setInsuredPersons(prev => prev.filter((_, i) => i !== index));
    setPersonImageUrls(prev => prev.filter((_, i) => i !== index));
  }, []);

  const updateInsuredPerson = useCallback((index: number, person: Partial<TravelInsuredPerson>) => {
    setInsuredPersons(prev => prev.map((p, i) => i === index ? person : p));
  }, []);

  const handleExcelImport = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/travel/import-excel', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();

      if (response.ok) {
        setInsuredPersons(data.insuredPersons);
      } else {
        setError(data.error);
      }
    } catch {
      setError('Failed to import Excel file');
    }
  };

  const handleOCRImport = useCallback((extractedPersons: { imageUrl: string; data: Partial<TravelInsuredPerson> }[]) => {
    // Filter existing persons that have names (remove empty entries)
    setInsuredPersons(prev => {
      const existingWithNames = prev.filter(p => p.name);
      return [...existingWithNames, ...extractedPersons.map(p => p.data)];
    });
    setPersonImageUrls(prev => {
      const existingWithNames = prev.slice(0, insuredPersons.filter(p => p.name).length);
      return [...existingWithNames, ...extractedPersons.map(p => p.imageUrl)];
    });
    setShowOCRModal(false);
  }, [insuredPersons]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate phone number if provided
    if (owner.telNo && !validatePhone(owner.telNo)) {
      setError('Số điện thoại không hợp lệ');
      setPhoneError('SĐT không hợp lệ (VD: 0912345678 hoặc +84912345678)');
      setLoading(false);
      return;
    }

    // Validate: if plan has car rental, at least one insured person must select car rental
    if (hasCarRental) {
      const hasAtLeastOneCarRental = insuredPersons.some(p => p.carRental === true);
      if (!hasAtLeastOneCarRental) {
        setError('Gói bảo hiểm có thuê xe, phải có ít nhất 1 người chọn thuê xe');
        setLoading(false);
        return;
      }
    }

    try {
      const response = await fetch('/api/travel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner,
          period,
          product,
          plan,
          insuredPersons,
          ...additionalInfo,
          totalPremium: 0,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        router.push(`/travel/${data.contract.id}`);
      } else {
        setError(data.error);
      }
    } catch {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 hover:border-white/20 transition-all';

  return (
    <DashboardLayout>
      <div className="p-4 lg:p-6">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.push('/travel')}
            className="w-10 h-10 rounded-xl bg-slate-700/50 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold text-white">Tạo hợp đồng Du lịch mới</h1>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Owner Section */}
          <section className="bg-slate-800/90 border border-blue-500/40 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Chủ hợp đồng</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Họ tên <span className="text-orange-400">*</span></label>
                <input
                  type="text"
                  value={owner.policyholder}
                  onChange={(e) => setOwner({...owner, policyholder: e.target.value})}
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Email</label>
                <input
                  type="email"
                  value={owner.email}
                  onChange={(e) => setOwner({...owner, email: e.target.value})}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Số điện thoại</label>
                <input
                  type="tel"
                  value={owner.telNo}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="0912345678"
                  className={`${inputClass} ${phoneError ? 'border-red-500/50' : ''}`}
                />
                {phoneError && <p className="text-red-400 text-xs mt-1">{phoneError}</p>}
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm text-slate-400 mb-1.5">Địa chỉ <span className="text-orange-400">*</span></label>
                <input
                  type="text"
                  value={owner.address}
                  onChange={(e) => setOwner({...owner, address: e.target.value})}
                  className={inputClass}
                  required
                />
              </div>
            </div>
          </section>

          {/* Period Section */}
          <section className="bg-slate-800/90 border border-blue-500/40 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Thời hạn bảo hiểm</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Từ ngày <span className="text-orange-400">*</span></label>
                <input
                  type="date"
                  value={period.dateFrom}
                  onChange={(e) => {
                    const newDateFrom = e.target.value;
                    setPeriod(prev => ({
                      ...prev,
                      dateFrom: newDateFrom,
                      // Reset dateTo if it's before new dateFrom
                      dateTo: prev.dateTo && prev.dateTo < newDateFrom ? newDateFrom : prev.dateTo
                    }));
                  }}
                  min={minDate}
                  className={inputClass}
                  required
                />
                <p className="text-slate-500 text-xs mt-1">Từ ngày mai trở đi</p>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Đến ngày <span className="text-orange-400">*</span></label>
                <input
                  type="date"
                  value={period.dateTo}
                  onChange={(e) => setPeriod({...period, dateTo: e.target.value})}
                  min={period.dateFrom || minDate}
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Số ngày</label>
                <input
                  type="number"
                  value={period.days}
                  readOnly
                  className={inputClass + ' bg-slate-600/50'}
                />
              </div>
            </div>
          </section>

          {/* Product Section */}
          <section className="bg-slate-800/90 border border-blue-500/40 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Sản phẩm</h2>
            <ProductPlanSelector
              selectedProduct={product}
              selectedPlan={plan}
              onProductChange={setProduct}
              onPlanChange={(planId, carRental) => {
                setPlan(planId);
                setHasCarRental(carRental);
              }}
            />
          </section>

          {/* Insured Persons Section */}
          <section className="bg-slate-800/90 border border-blue-500/40 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-white">Người được bảo hiểm ({insuredPersons.length})</h2>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={addInsuredPerson}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
                >
                  + Thêm người
                </button>
                <button
                  type="button"
                  onClick={() => setShowOCRModal(true)}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  OCR CCCD
                </button>
                <label className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm cursor-pointer">
                  Import Excel
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={(e) => e.target.files?.[0] && handleExcelImport(e.target.files[0])}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
            <div className="space-y-4">
              {insuredPersons.map((person, index) => (
                <InsuredPersonForm
                  key={index}
                  index={index}
                  person={person}
                  imageUrl={personImageUrls[index]}
                  showCarRental={hasCarRental}
                  onChange={updateInsuredPerson}
                  onRemove={removeInsuredPerson}
                  canRemove={insuredPersons.length > 1}
                />
              ))}
            </div>
          </section>

          {/* Submit Button */}
          <div className="fixed bottom-6 right-6 z-50">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white font-semibold rounded-xl transition-all disabled:cursor-not-allowed flex items-center gap-2 shadow-xl"
            >
              {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              Tạo hợp đồng
            </button>
          </div>
        </form>

        {/* OCR Modal */}
        {showOCRModal && (
          <TravelOCRUpload
            onImport={handleOCRImport}
            onClose={() => setShowOCRModal(false)}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
