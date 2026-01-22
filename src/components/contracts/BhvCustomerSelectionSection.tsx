/**
 * BHV Customer Selection Section
 *
 * Collapsible section for selecting BHV customer, partner, and agency.
 * Data loaded from static JSON files for dropdown search/filter.
 * Used in Step 2 of new contract creation.
 */

'use client';

import { useState, useEffect } from 'react';
import SearchableSelect from '@/components/SearchableSelect';

// JSON data imports
import customersData from '@db/bhv_customers.json';
import partnersData from '@db/bhv_partners.json';
import agentsData from '@db/bhv_agents.json';

interface BhvOption {
  id: string;
  name: string;
  value: string;
}

interface BhvCustomerSelectionSectionProps {
  customerCode: string;
  customerName: string;
  partnerCode: string;
  partnerName: string;
  agencyCode: string;
  agencyName: string;
  onCustomerChange: (code: string, name: string) => void;
  onPartnerChange: (code: string, name: string) => void;
  onAgencyChange: (code: string, name: string) => void;
}

export default function BhvCustomerSelectionSection({
  customerCode,
  customerName,
  partnerCode,
  partnerName,
  agencyCode,
  agencyName,
  onCustomerChange,
  onPartnerChange,
  onAgencyChange
}: BhvCustomerSelectionSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [customers, setCustomers] = useState<BhvOption[]>([]);
  const [partners, setPartners] = useState<BhvOption[]>([]);
  const [agents, setAgents] = useState<BhvOption[]>([]);

  // Load data on mount
  useEffect(() => {
    setCustomers(customersData as BhvOption[]);
    setPartners(partnersData as BhvOption[]);
    setAgents(agentsData as BhvOption[]);
  }, []);

  // Auto-expand if any field has value
  useEffect(() => {
    if (customerCode || partnerCode || agencyCode) {
      setIsExpanded(true);
    }
  }, [customerCode, partnerCode, agencyCode]);

  // Handle customer selection
  const handleCustomerSelect = (name: string) => {
    const selected = customers.find(c => c.name === name);
    if (selected) {
      onCustomerChange(selected.value, selected.name);
    } else if (!name) {
      onCustomerChange('', '');
    }
  };

  // Handle partner selection
  const handlePartnerSelect = (name: string) => {
    const selected = partners.find(p => p.name === name);
    if (selected) {
      onPartnerChange(selected.value, selected.name);
    } else if (!name) {
      onPartnerChange('', '');
    }
  };

  // Handle agency selection
  const handleAgencySelect = (name: string) => {
    const selected = agents.find(a => a.name === name);
    if (selected) {
      onAgencyChange(selected.value, selected.name);
    } else if (!name) {
      onAgencyChange('', '');
    }
  };

  // Count selected items for badge
  const selectedCount = [customerCode, partnerCode, agencyCode].filter(Boolean).length;

  return (
    <div className="border border-white/10 rounded-xl">
      {/* Header - Click to toggle */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-700/30 hover:bg-slate-700/50 transition-colors rounded-t-xl"
      >
        <div className="flex items-center gap-3">
          <span className="text-white font-medium">Thông tin khách hàng BHV</span>
          {selectedCount > 0 && (
            <span className="bg-blue-500/20 text-blue-400 text-xs px-2 py-0.5 rounded-full">
              {selectedCount} đã chọn
            </span>
          )}
        </div>
        <svg
          className={`w-5 h-5 text-white/60 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Collapsible Content */}
      <div
        className={`transition-all duration-200 ease-in-out overflow-visible ${
          isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0 !overflow-hidden'
        }`}
      >
        <div className="p-4 space-y-4 bg-slate-800/30 rounded-b-xl">
          <p className="text-xs text-white/50 mb-2">
            Chọn thông tin khách hàng từ hệ thống BHV Online (không bắt buộc)
          </p>

          <div className="grid md:grid-cols-3 gap-4">
            {/* Khách hàng */}
            <div>
              <label className="block text-white font-medium mb-2 text-sm">Khách hàng</label>
              <SearchableSelect
                options={customers.map(c => ({ id: c.value, name: c.name }))}
                value={customerName}
                onChange={handleCustomerSelect}
                placeholder="Chọn khách hàng"
              />
              {customerCode && (
                <p className="text-xs text-white/40 mt-1">Mã: {customerCode}</p>
              )}
            </div>

            {/* Đối tác */}
            <div>
              <label className="block text-white font-medium mb-2 text-sm">Đối tác</label>
              <SearchableSelect
                options={partners.map(p => ({ id: p.value, name: p.name }))}
                value={partnerName}
                onChange={handlePartnerSelect}
                placeholder="Chọn đối tác"
              />
              {partnerCode && (
                <p className="text-xs text-white/40 mt-1">Mã: {partnerCode}</p>
              )}
            </div>

            {/* Đại lý */}
            <div>
              <label className="block text-white font-medium mb-2 text-sm">Đại lý</label>
              <SearchableSelect
                options={agents.map(a => ({ id: a.value, name: a.name }))}
                value={agencyName}
                onChange={handleAgencySelect}
                placeholder="Chọn đại lý"
              />
              {agencyCode && (
                <p className="text-xs text-white/40 mt-1">Mã: {agencyCode}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
