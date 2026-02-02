'use client';

import { useState, useRef, useEffect } from 'react';
import travelCountries from '@db/travel_countries.json';

// Filter out empty value entry and ensure type safety
const countries = travelCountries.filter((c: { value: string; text: string }) => c.value !== '');

interface SearchableCountrySelectProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  required?: boolean;
  placeholder?: string;
}

export default function SearchableCountrySelect({
  value,
  onChange,
  className = '',
  required = false,
  placeholder = 'Tìm kiếm quốc gia...'
}: SearchableCountrySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Get display text for current value
  const selectedCountry = countries.find(c => c.value === value);
  const displayText = selectedCountry?.text || value || '';

  // Filter countries based on search
  const filteredCountries = search
    ? countries.filter(c =>
        c.text.toLowerCase().includes(search.toLowerCase())
      )
    : countries;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle selection
  const handleSelect = (countryValue: string) => {
    onChange(countryValue);
    setIsOpen(false);
    setSearch('');
  };

  // Handle input focus
  const handleInputFocus = () => {
    setIsOpen(true);
    setSearch('');
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Hidden input for form validation */}
      <input type="hidden" value={value} required={required} />

      {/* Display input */}
      <div
        onClick={() => {
          setIsOpen(true);
          setTimeout(() => inputRef.current?.focus(), 0);
        }}
        className={`${className} cursor-pointer flex items-center justify-between`}
      >
        {isOpen ? (
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={handleInputFocus}
            placeholder={placeholder}
            className="w-full bg-transparent outline-none text-white placeholder-gray-500"
            autoComplete="off"
          />
        ) : (
          <span className={displayText ? 'text-white' : 'text-gray-500'}>
            {displayText || placeholder}
          </span>
        )}
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-slate-800 border border-white/20 rounded-xl shadow-xl max-h-60 overflow-y-auto">
          {filteredCountries.length === 0 ? (
            <div className="px-4 py-3 text-gray-400 text-sm">
              Không tìm thấy quốc gia
            </div>
          ) : (
            filteredCountries.map((country) => (
              <div
                key={country.value}
                onClick={() => handleSelect(country.value)}
                className={`px-4 py-2 cursor-pointer hover:bg-blue-600/30 transition-colors ${
                  value === country.value ? 'bg-blue-600/20 text-blue-400' : 'text-white'
                }`}
              >
                {country.text}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
