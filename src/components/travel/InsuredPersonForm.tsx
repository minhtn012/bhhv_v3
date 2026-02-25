'use client';

import { useState } from 'react';
import { TravelInsuredPerson } from '@/types/travel';
import { TRAVEL_RELATIONSHIP_LABELS, TRAVEL_MEMBER_TYPE_LABELS } from '@/providers/pacific-cross/products/travel/constants';
import SearchableCountrySelect from '@/components/travel/SearchableCountrySelect';

// Car rental options
const CAR_RENTAL_OPTIONS = [
  { value: 'Y', label: 'Có' },
  { value: 'N', label: 'Không' },
];

interface Props {
  index: number;
  person: Partial<TravelInsuredPerson>;
  imageUrl?: string; // CCCD image from OCR
  showCarRental?: boolean; // Show car rental fields when plan includes car rental
  pocyType?: 'Individual' | 'Family'; // Contract type - show memberType for Family
  onChange: (index: number, person: Partial<TravelInsuredPerson>) => void;
  onRemove: (index: number) => void;
  canRemove: boolean;
  errors?: Record<string, string>;
}

export default function InsuredPersonForm({
  index,
  person,
  imageUrl,
  showCarRental = false,
  pocyType = 'Individual',
  onChange,
  onRemove,
  canRemove,
  errors = {},
}: Props) {
  const [expanded, setExpanded] = useState(false);

  const handleChange = (field: string, value: unknown) => {
    const updated = { ...person, [field]: value };

    // Auto-calculate age when DOB changes
    if (field === 'dob' && typeof value === 'string') {
      const dob = new Date(value);
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const monthDiff = today.getMonth() - dob.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        age--;
      }
      updated.age = age;
    }

    onChange(index, updated);
  };

  const inputClass = (hasError: boolean = false) =>
    `w-full px-4 py-2.5 bg-white/5 border rounded-xl text-white placeholder-gray-500 focus:outline-none transition-all ${
      hasError
        ? 'border-red-500 focus:border-red-500'
        : 'border-white/10 focus:border-blue-500/50 hover:border-white/20'
    }`;

  return (
    <div className="bg-slate-700/30 rounded-xl p-4 relative">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-white font-medium">Người được BH #{index + 1}</h4>
        {canRemove && (
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="text-red-400 hover:text-red-300 p-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div className="flex gap-4">
        {/* CCCD Image (left side) - expandable */}
        {imageUrl && (
          <div
            className={`flex-shrink-0 transition-all duration-300 ${expanded ? 'w-2/3' : 'w-48'}`}
          >
            <div
              className="relative cursor-pointer group"
              onClick={() => setExpanded(!expanded)}
            >
              <img
                src={imageUrl}
                alt={`CCCD ${index + 1}`}
                className="w-full h-auto object-contain rounded-xl border border-slate-600 transition-transform group-hover:scale-[1.01]"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-xl transition-colors flex items-center justify-center">
                <span className="opacity-0 group-hover:opacity-100 text-white text-xs bg-black/60 px-2 py-1 rounded">
                  {expanded ? 'Thu nhỏ' : 'Phóng to'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Form Grid (right side) */}
        <div className={`flex-1 grid gap-4 transition-all duration-300 ${
          expanded && imageUrl
            ? 'grid-cols-1'
            : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
        }`}>
        {/* Name */}
        <div>
          <label className="block text-sm text-slate-400 mb-1.5">
            Họ tên <span className="text-orange-400">*</span>
          </label>
          <input
            type="text"
            name={`insured_name_${index}`}
            autoComplete="name"
            value={person.name || ''}
            onChange={(e) => handleChange('name', e.target.value)}
            className={inputClass(!!errors[`name_${index}`])}
            placeholder="Nguyen Van A"
          />
          {errors[`name_${index}`] && (
            <p className="text-red-400 text-xs mt-1">{errors[`name_${index}`]}</p>
          )}
        </div>

        {/* DOB */}
        <div>
          <label className="block text-sm text-slate-400 mb-1.5">
            Ngày sinh <span className="text-orange-400">*</span>
          </label>
          <input
            type="date"
            value={person.dob || ''}
            onChange={(e) => handleChange('dob', e.target.value)}
            className={inputClass(!!errors[`dob_${index}`])}
          />
        </div>

        {/* Age (auto-calculated) */}
        <div>
          <label className="block text-sm text-slate-400 mb-1.5">Tuổi</label>
          <input
            type="number"
            value={person.age || 0}
            readOnly
            className={inputClass() + ' bg-slate-600/50'}
          />
        </div>

        {/* Gender */}
        <div>
          <label className="block text-sm text-slate-400 mb-1.5">
            Giới tính <span className="text-orange-400">*</span>
          </label>
          <select
            value={person.gender || 'M'}
            onChange={(e) => handleChange('gender', e.target.value)}
            className={inputClass()}
          >
            <option value="M">Nam</option>
            <option value="F">Nữ</option>
          </select>
        </div>

        {/* Country */}
        <div>
          <label className="block text-sm text-slate-400 mb-1.5">Quốc tịch</label>
          <SearchableCountrySelect
            value={person.country || 'VIETNAM'}
            onChange={(value) => handleChange('country', value)}
            className={inputClass()}
          />
        </div>

        {/* Personal ID */}
        <div>
          <label className="block text-sm text-slate-400 mb-1.5">
            CCCD/Hộ chiếu <span className="text-orange-400">*</span>
          </label>
          <input
            type="text"
            name={`insured_personalId_${index}`}
            autoComplete="on"
            value={person.personalId || ''}
            onChange={(e) => handleChange('personalId', e.target.value)}
            className={inputClass(!!errors[`personalId_${index}`])}
            placeholder="012345678901"
          />
        </div>

        {/* Tel */}
        <div>
          <label className="block text-sm text-slate-400 mb-1.5">Số điện thoại</label>
          <input
            type="tel"
            name={`insured_telNo_${index}`}
            autoComplete="tel"
            value={person.telNo || ''}
            onChange={(e) => handleChange('telNo', e.target.value)}
            className={inputClass()}
            placeholder="0901234567"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm text-slate-400 mb-1.5">Email</label>
          <input
            type="email"
            name={`insured_email_${index}`}
            autoComplete="email"
            value={person.email || ''}
            onChange={(e) => handleChange('email', e.target.value)}
            className={inputClass()}
            placeholder="email@example.com"
          />
        </div>

        {/* Relationship */}
        <div>
          <label className="block text-sm text-slate-400 mb-1.5">Quan hệ</label>
          <select
            value={person.relationship || 'RELATION_O'}
            onChange={(e) => handleChange('relationship', e.target.value)}
            className={inputClass()}
          >
            {Object.entries(TRAVEL_RELATIONSHIP_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        {/* Member Type - only show for Family plan */}
        {pocyType === 'Family' && (
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">
              Loại thành viên <span className="text-orange-400">*</span>
            </label>
            <select
              value={person.memberType || 'MBR_TYPE_A'}
              onChange={(e) => handleChange('memberType', e.target.value)}
              className={inputClass(!!errors[`memberType_${index}`])}
            >
              {Object.entries(TRAVEL_MEMBER_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            {errors[`memberType_${index}`] && (
              <p className="text-red-400 text-xs mt-1">{errors[`memberType_${index}`]}</p>
            )}
          </div>
        )}

        {/* Car Rental Fields - only show when plan has car rental */}
        {showCarRental && (
          <>
            {/* Car Rental Select */}
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">
                Thuê xe <span className="text-orange-400">*</span>
              </label>
              <select
                value={person.carRental ? 'Y' : 'N'}
                onChange={(e) => handleChange('carRental', e.target.value === 'Y')}
                className={inputClass()}
              >
                {CAR_RENTAL_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Car Rental Date */}
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">
                Ngày thuê xe <span className="text-orange-400">*</span>
              </label>
              <input
                type="date"
                value={person.carRentalDate || ''}
                onChange={(e) => handleChange('carRentalDate', e.target.value)}
                className={inputClass()}
                disabled={!person.carRental}
              />
            </div>

            {/* Car Rental Days */}
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">
                Số ngày thuê xe <span className="text-orange-400">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={person.carRentalDays || ''}
                onChange={(e) => handleChange('carRentalDays', parseInt(e.target.value, 10) || 0)}
                className={inputClass()}
                disabled={!person.carRental}
                placeholder="0"
              />
            </div>
          </>
        )}
        </div>
      </div>
    </div>
  );
}
