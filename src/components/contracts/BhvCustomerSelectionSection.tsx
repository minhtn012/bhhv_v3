/**
 * BHV Customer Selection Section
 *
 * Section for selecting BHV customer, partner, and agency with searchable dropdowns.
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
  const [customers, setCustomers] = useState<BhvOption[]>([]);
  const [partners, setPartners] = useState<BhvOption[]>([]);
  const [agents, setAgents] = useState<BhvOption[]>([]);

  // Load data on mount
  useEffect(() => {
    setCustomers(customersData as BhvOption[]);
    setPartners(partnersData as BhvOption[]);
    setAgents(agentsData as BhvOption[]);
  }, []);

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

  return (
    <div>
      <p className="text-xs text-white/50 mb-4">
        Chọn từ hệ thống BHV Online (không bắt buộc)
      </p>

      <div className="grid md:grid-cols-3 gap-4">
        {/* Khách hàng */}
        <div>
          <label className="block text-white font-medium mb-2 text-sm">Khách hàng</label>
          <SearchableSelect
            options={customers.map(c => ({ id: c.value, name: c.name }))}
            value={customerName}
            onChange={handleCustomerSelect}
            placeholder="Tìm kiếm khách hàng..."
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
            placeholder="Tìm kiếm đối tác..."
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
            placeholder="Tìm kiếm đại lý..."
          />
          {agencyCode && (
            <p className="text-xs text-white/40 mt-1">Mã: {agencyCode}</p>
          )}
        </div>
      </div>
    </div>
  );
}
