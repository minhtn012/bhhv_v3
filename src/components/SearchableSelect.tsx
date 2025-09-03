'use client';

import { useState, useRef, useEffect } from 'react';

interface Option {
  id: string;
  name: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  loading?: boolean;
  disabled?: boolean;
  required?: boolean;
}

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder,
  loading = false,
  disabled = false,
  required = false
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Escape regex special characters
  const escapeRegExp = (string: string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  // Filter options based on search term
  const filteredOptions = options.filter(option =>
    option.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get display value
  const displayValue = value ? options.find(opt => opt.name === value)?.name || value : '';

  // Handle input focus
  const handleFocus = () => {
    setIsOpen(true);
    setSearchTerm('');
    setHighlightedIndex(-1);
  };

  // Handle input blur
  const handleBlur = (e: React.FocusEvent) => {
    // Don't close if clicking on dropdown
    if (dropdownRef.current && dropdownRef.current.contains(e.relatedTarget as Node)) {
      return;
    }
    setTimeout(() => {
      setIsOpen(false);
      setSearchTerm('');
    }, 150);
  };

  // Handle option selection
  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchTerm('');
    inputRef.current?.blur();
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown') {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0) {
          handleSelect(filteredOptions[highlightedIndex].name);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSearchTerm('');
        inputRef.current?.blur();
        break;
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <input
        ref={inputRef}
        type="text"
        value={isOpen ? searchTerm : displayValue}
        onChange={(e) => setSearchTerm(e.target.value)}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={loading ? 'Đang tải...' : placeholder}
        disabled={disabled || loading}
        required={required}
        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white placeholder-gray-400 focus:border-blue-400 focus:outline-none"
        autoComplete="off"
      />
      
      {/* Dropdown Arrow */}
      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Dropdown Options */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-white/20 rounded-xl shadow-lg max-h-60 overflow-y-auto">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option, index) => (
              <div
                key={option.id}
                onClick={() => handleSelect(option.name)}
                className={`px-4 py-2 cursor-pointer transition-colors ${
                  index === highlightedIndex
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                {/* Highlight search term */}
                {searchTerm ? (
                  <span
                    dangerouslySetInnerHTML={{
                      __html: option.name.replace(
                        new RegExp(`(${escapeRegExp(searchTerm)})`, 'gi'),
                        '<mark class="bg-yellow-400 text-black px-1 rounded">$1</mark>'
                      )
                    }}
                  />
                ) : (
                  option.name
                )}
              </div>
            ))
          ) : (
            <div className="px-4 py-2 text-gray-500 italic">
              {searchTerm ? 'Không tìm thấy kết quả' : 'Không có dữ liệu'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}