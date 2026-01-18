'use client';

import { useState, useEffect, useRef } from 'react';
import { TRAVEL_PRODUCTS, TRAVEL_PRODUCT_LABELS } from '@/providers/pacific-cross/products/travel/constants';

interface Plan {
  PLAN_ID: number;
  PLAN_NAME: string;
  hasCarRental: boolean;
}

interface Props {
  selectedProduct: number;
  selectedPlan: number;
  onProductChange: (product: number) => void;
  onPlanChange: (plan: number, hasCarRental: boolean) => void;
}

export default function ProductPlanSelector({
  selectedProduct,
  selectedPlan,
  onProductChange,
  onPlanChange,
}: Props) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
    fetchPlans(selectedProduct);
  }, [selectedProduct]);

  const fetchPlans = async (productId: number) => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/travel/plans?product=${productId}`);
      const data = await response.json();

      if (response.ok) {
        // Add hasCarRental flag based on plan name
        const plansWithCarRental = (data.plans || []).map((p: { PLAN_ID: number; PLAN_NAME: string }) => ({
          ...p,
          hasCarRental: p.PLAN_NAME.includes('Có Thuê xe')
        }));
        setPlans(plansWithCarRental);
        // Auto-select first plan if none selected
        if (plansWithCarRental.length > 0 && !selectedPlan) {
          const firstPlan = plansWithCarRental[0];
          onPlanChange(firstPlan.PLAN_ID, firstPlan.hasCarRental);
        }
      } else {
        setError(data.error || 'Không thể tải danh sách gói');
        setPlans([]);
      }
    } catch {
      setError('Lỗi kết nối server');
      setPlans([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Product Selection */}
      <div>
        <label className="block text-sm text-slate-400 mb-3 font-medium">
          Chọn sản phẩm <span className="text-orange-400">*</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.entries(TRAVEL_PRODUCTS).map(([key, value]) => {
            const isSelected = selectedProduct === value;
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
                  name="product"
                  value={value}
                  checked={isSelected}
                  onChange={() => onProductChange(value)}
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
                  <span className={`font-medium text-sm ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                    {TRAVEL_PRODUCT_LABELS[value]}
                  </span>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* Plan Selection */}
      <div>
        <label className="block text-sm text-slate-400 mb-3 font-medium">
          Chọn gói bảo hiểm <span className="text-orange-400">*</span>
        </label>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm">
            {error}
          </div>
        ) : plans.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center text-gray-400">
            Không có gói bảo hiểm nào
          </div>
        ) : (
          <div ref={dropdownRef} className="relative">
            {/* Selected value / Search input */}
            <div
              className="w-full px-4 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-white cursor-pointer hover:border-white/20 transition-all flex items-center justify-between"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <span className="truncate">
                {plans.find(p => p.PLAN_ID === selectedPlan)?.PLAN_NAME || 'Chọn gói bảo hiểm...'}
              </span>
              <svg className={`w-5 h-5 text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            {/* Dropdown */}
            {isDropdownOpen && (
              <div className="absolute z-50 w-full mt-1 bg-slate-800 border border-white/10 rounded-xl shadow-xl overflow-hidden">
                {/* Search input */}
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

                {/* Options list */}
                <div className="max-h-60 overflow-y-auto">
                  {plans
                    .filter(p => p.PLAN_NAME.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map((plan) => (
                      <div
                        key={plan.PLAN_ID}
                        className={`px-4 py-2.5 cursor-pointer transition-colors text-sm ${
                          plan.PLAN_ID === selectedPlan
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-300 hover:bg-slate-700'
                        }`}
                        onClick={() => {
                          onPlanChange(plan.PLAN_ID, plan.hasCarRental);
                          setIsDropdownOpen(false);
                          setSearchTerm('');
                        }}
                      >
                        {plan.PLAN_NAME}
                      </div>
                    ))}
                  {plans.filter(p => p.PLAN_NAME.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
                    <div className="px-4 py-3 text-slate-400 text-sm text-center">
                      Không tìm thấy gói phù hợp
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
