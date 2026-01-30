'use client';

import { useState, useEffect, useMemo, useRef } from 'react';

interface Plan {
  PLAN_ID: number;
  PLAN_NAME: string;
  hasCarRental: boolean;
  medical: string;
  territory: string;
  personalAccident: string;
  incidental: string;
  carRental: string;
}

interface PriceRecord {
  plan_id: number;
  code: string;
  days_from: number;
  days_to: number;
  price: number;
}

interface Props {
  selectedPlan: number;
  days: number;
  onPlanChange: (plan: number, hasCarRental: boolean) => void;
}

// Filter options
const MEDICAL_OPTIONS = [
  { value: 'A', label: '2 tỷ (Hạng A)' },
  { value: 'B', label: '1.5 tỷ (Hạng B)' },
  { value: 'C', label: '1 tỷ (Hạng C)' },
];

const TERRITORY_OPTIONS = [
  { value: 'W', label: 'Toàn cầu' },
  { value: 'A', label: 'Châu Á' },
  { value: 'E', label: 'Đông Nam Á' },
];

const PERSONAL_ACCIDENT_OPTIONS = [
  { value: '1', label: '400 triệu' },
  { value: '2', label: '1 tỷ' },
  { value: '3', label: '2 tỷ' },
  { value: '4', label: '5 tỷ' },
];

const INCIDENTAL_OPTIONS = [
  { value: 'Y', label: 'Có (cùng hạng Y tế)' },
  { value: 'N', label: 'Không' },
];

const CAR_RENTAL_OPTIONS = [
  { value: 'C', label: 'Có' },
  { value: 'N', label: 'Không' },
];

// Parse plan code from name
function parsePlanCode(planName: string) {
  const match = planName.match(/^([ABC])([WAE])(\d)([ABCN])([CN])/);
  if (!match) return null;
  return {
    medical: match[1],
    territory: match[2],
    personalAccident: match[3],
    incidental: match[4],
    carRental: match[5],
  };
}

export default function ProductPlanSelector({ selectedPlan, days, onPlanChange }: Props) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [prices, setPrices] = useState<PriceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter state
  const [filters, setFilters] = useState({
    medical: 'A',
    territory: 'A',
    personalAccident: '1',
    incidental: 'Y',
    carRental: 'N',
  });

  // Track if change came from filter or dropdown
  const [changeSource, setChangeSource] = useState<'filter' | 'dropdown' | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/travel/plans');
      const data = await response.json();

      if (response.ok) {
        const parsedPlans = (data.plans || []).map((p: { PLAN_ID: number; PLAN_NAME: string }) => {
          const parsed = parsePlanCode(p.PLAN_NAME);
          return {
            ...p,
            hasCarRental: p.PLAN_NAME.includes('Có Thuê xe'),
            medical: parsed?.medical || '',
            territory: parsed?.territory || '',
            personalAccident: parsed?.personalAccident || '',
            incidental: parsed?.incidental || '',
            carRental: parsed?.carRental || '',
          };
        });
        setPlans(parsedPlans);
        setPrices(data.prices || []);
      } else {
        setError(data.error || 'Không thể tải danh sách gói');
      }
    } catch {
      setError('Lỗi kết nối server');
    } finally {
      setLoading(false);
    }
  };

  // Find matching plan based on filters
  const matchingPlan = useMemo(() => {
    const incidentalValue = filters.incidental === 'Y' ? filters.medical : 'N';
    return plans.find(p =>
      p.medical === filters.medical &&
      p.territory === filters.territory &&
      p.personalAccident === filters.personalAccident &&
      p.incidental === incidentalValue &&
      p.carRental === filters.carRental
    );
  }, [plans, filters]);

  // Get price for selected plan based on days
  const selectedPrice = useMemo(() => {
    if (!selectedPlan || days <= 0) return null;
    return prices.find(p =>
      p.plan_id === selectedPlan &&
      days >= p.days_from &&
      days <= p.days_to
    );
  }, [prices, selectedPlan, days]);

  // Format currency
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price) + ' VND';
  };

  // When filters change → update selected plan
  useEffect(() => {
    if (changeSource === 'filter' && matchingPlan) {
      onPlanChange(matchingPlan.PLAN_ID, matchingPlan.hasCarRental);
    }
    setChangeSource(null);
  }, [matchingPlan, changeSource, onPlanChange]);

  // When plan selected from dropdown → update filters
  const handlePlanSelect = (plan: Plan) => {
    setChangeSource('dropdown');
    setFilters({
      medical: plan.medical,
      territory: plan.territory,
      personalAccident: plan.personalAccident,
      incidental: plan.incidental === 'N' ? 'N' : 'Y',
      carRental: plan.carRental,
    });
    onPlanChange(plan.PLAN_ID, plan.hasCarRental);
    setIsDropdownOpen(false);
    setSearchTerm('');
  };

  // Handle filter change
  const handleFilterChange = (key: string, value: string) => {
    setChangeSource('filter');
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const selectedPlanDetails = plans.find(p => p.PLAN_ID === selectedPlan);
  const selectClass = 'w-full px-3 py-2 bg-slate-700 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500/50';
  const labelClass = 'block text-sm text-slate-400 mb-1.5';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div>
          <label className={labelClass}>Y tế <span className="text-orange-400">*</span></label>
          <select value={filters.medical} onChange={(e) => handleFilterChange('medical', e.target.value)} className={selectClass}>
            {MEDICAL_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Khu vực <span className="text-orange-400">*</span></label>
          <select value={filters.territory} onChange={(e) => handleFilterChange('territory', e.target.value)} className={selectClass}>
            {TERRITORY_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Tai nạn cá nhân <span className="text-orange-400">*</span></label>
          <select value={filters.personalAccident} onChange={(e) => handleFilterChange('personalAccident', e.target.value)} className={selectClass}>
            {PERSONAL_ACCIDENT_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Sự cố bất ngờ <span className="text-orange-400">*</span></label>
          <select value={filters.incidental} onChange={(e) => handleFilterChange('incidental', e.target.value)} className={selectClass}>
            {INCIDENTAL_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Thuê xe <span className="text-orange-400">*</span></label>
          <select value={filters.carRental} onChange={(e) => handleFilterChange('carRental', e.target.value)} className={selectClass}>
            {CAR_RENTAL_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>
      </div>

      {/* Selected Plan Display */}
      <div className={`p-4 rounded-xl border ${matchingPlan ? 'bg-green-900/20 border-green-500/40' : 'bg-red-900/20 border-red-500/40'}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {matchingPlan ? (
              <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            )}
            <span className={`font-medium ${matchingPlan ? 'text-green-400' : 'text-red-400'}`}>
              {matchingPlan ? 'Gói bảo hiểm đã chọn' : 'Không tìm thấy gói phù hợp'}
            </span>
          </div>
          {/* Price Display */}
          {selectedPrice && days > 0 && (
            <div className="text-right">
              <span className="text-2xl font-bold text-yellow-400">{formatPrice(selectedPrice.price)}</span>
              <span className="text-slate-400 text-sm ml-1">/ người ({days} ngày)</span>
            </div>
          )}
          {!selectedPrice && days > 0 && matchingPlan && (
            <span className="text-slate-400 text-sm">Chọn ngày để xem giá</span>
          )}
        </div>
        {selectedPlanDetails && (
          <p className="text-white text-sm">{selectedPlanDetails.PLAN_NAME}</p>
        )}
      </div>

      {/* Plan Dropdown Select */}
      <div ref={dropdownRef} className="relative">
        <label className={labelClass}>Hoặc chọn trực tiếp gói bảo hiểm</label>
        <div
          className="w-full px-4 py-2.5 bg-slate-700 border border-white/10 rounded-xl text-white cursor-pointer hover:border-white/20 transition-all flex items-center justify-between"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        >
          <span className="truncate text-sm">
            {selectedPlanDetails?.PLAN_NAME || 'Chọn gói bảo hiểm...'}
          </span>
          <svg className={`w-5 h-5 text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {isDropdownOpen && (
          <div className="absolute z-50 w-full mt-1 bg-slate-800 border border-white/10 rounded-xl shadow-xl overflow-hidden">
            <div className="p-2 border-b border-white/10">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm kiếm gói bảo hiểm..."
                className="w-full px-3 py-2 bg-slate-700 border border-white/10 rounded-lg text-white text-sm placeholder-slate-400 focus:outline-none focus:border-blue-500/50"
                autoFocus
              />
            </div>
            <div className="max-h-60 overflow-y-auto">
              {plans
                .filter(p => p.PLAN_NAME.toLowerCase().includes(searchTerm.toLowerCase()))
                .map((plan) => (
                  <div
                    key={plan.PLAN_ID}
                    className={`px-4 py-2.5 cursor-pointer transition-colors text-sm ${
                      plan.PLAN_ID === selectedPlan ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-slate-700'
                    }`}
                    onClick={() => handlePlanSelect(plan)}
                  >
                    {plan.PLAN_NAME}
                  </div>
                ))}
              {plans.filter(p => p.PLAN_NAME.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
                <div className="px-4 py-3 text-slate-400 text-sm text-center">Không tìm thấy gói phù hợp</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
