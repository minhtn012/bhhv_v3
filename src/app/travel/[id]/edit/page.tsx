'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import InsuredPersonForm from '@/components/travel/InsuredPersonForm';
import ProductPlanSelector from '@/components/travel/ProductPlanSelector';
import type { TravelInsuredPerson } from '@/types/travel';
import { calculateInsuranceDays } from '@/utils/dateFormatter';

export default function EditTravelContractPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

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

  const [product, setProduct] = useState(2);
  const [plan, setPlan] = useState(534);
  const [insuredPersons, setInsuredPersons] = useState<Partial<TravelInsuredPerson>[]>([]);
  const [canEdit, setCanEdit] = useState(false);
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
      const response = await fetch(`/api/travel/${params.id}`);
      const data = await response.json();

      if (response.ok) {
        const contract = data.contract;

        // Check if editable (travel allows edit in nhap, cho_duyet, khach_duyet)
        const editableStatuses = ['nhap', 'cho_duyet', 'khach_duyet'];
        if (!editableStatuses.includes(contract.status)) {
          setError('Chỉ có thể sửa hợp đồng ở trạng thái Nháp, Chờ duyệt, hoặc Khách duyệt');
          setCanEdit(false);
          return;
        }

        setCanEdit(true);
        setOwner(contract.owner);
        setPeriod(contract.period);
        setProduct(contract.product);
        setPlan(contract.plan);
        setInsuredPersons(contract.insuredPersons);
      } else {
        setError(data.error || 'Không thể tải hợp đồng');
      }
    } catch {
      setError('Lỗi kết nối server');
    } finally {
      setLoading(false);
    }
  };

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
  }, []);

  const removeInsuredPerson = useCallback((index: number) => {
    setInsuredPersons(prev => prev.filter((_, i) => i !== index));
  }, []);

  const updateInsuredPerson = useCallback((index: number, person: Partial<TravelInsuredPerson>) => {
    setInsuredPersons(prev => prev.map((p, i) => i === index ? person : p));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    // Validate phone number if provided
    if (owner.telNo && !validatePhone(owner.telNo)) {
      setError('Số điện thoại không hợp lệ');
      setPhoneError('SĐT không hợp lệ (VD: 0912345678 hoặc +84912345678)');
      setSaving(false);
      return;
    }

    try {
      const response = await fetch(`/api/travel/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner,
          period,
          product,
          plan,
          insuredPersons,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        router.push(`/travel/${params.id}`);
      } else {
        setError(data.error);
      }
    } catch {
      setError('Connection error');
    } finally {
      setSaving(false);
    }
  };

  const inputClass = 'w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 hover:border-white/20 transition-all';

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!canEdit) {
    return (
      <DashboardLayout>
        <div className="p-4 lg:p-6">
          <div className="text-center text-gray-400">
            <p>{error || 'Không thể sửa hợp đồng'}</p>
            <button
              onClick={() => router.push(`/travel/${params.id}`)}
              className="mt-4 text-blue-400 hover:text-blue-300"
            >
              ← Quay lại chi tiết
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-4 lg:p-6">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.push(`/travel/${params.id}`)}
            className="w-10 h-10 rounded-xl bg-slate-700/50 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold text-white">Chỉnh sửa hợp đồng Du lịch</h1>
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
              onPlanChange={setPlan}
            />
          </section>

          {/* Insured Persons Section */}
          <section className="bg-slate-800/90 border border-blue-500/40 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-white">Người được bảo hiểm ({insuredPersons.length})</h2>
              <button
                type="button"
                onClick={addInsuredPerson}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
              >
                + Thêm người
              </button>
            </div>
            <div className="space-y-4">
              {insuredPersons.map((person, index) => (
                <InsuredPersonForm
                  key={index}
                  index={index}
                  person={person}
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
              disabled={saving}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white font-semibold rounded-xl transition-all disabled:cursor-not-allowed flex items-center gap-2 shadow-xl"
            >
              {saving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              Lưu thay đổi
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
