'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface AutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  field: string; // MongoDB field path e.g. 'owner.email'
  type?: string;
  className?: string;
  placeholder?: string;
  required?: boolean;
}

// Cache suggestions per field to avoid re-fetching
const cache: Record<string, string[]> = {};

export default function AutocompleteInput({
  value,
  onChange,
  field,
  type = 'text',
  className = '',
  placeholder,
  required,
}: AutocompleteInputProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter suggestions client-side based on current value
  const filtered = value
    ? suggestions.filter(s => s.toLowerCase().includes(value.toLowerCase()))
    : suggestions;

  // Fetch suggestions on first focus
  const fetchSuggestions = useCallback(async () => {
    if (cache[field]) {
      setSuggestions(cache[field]);
      setIsOpen(true);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/travel/suggestions?field=${encodeURIComponent(field)}`);
      if (res.ok) {
        const data = await res.json();
        cache[field] = data.suggestions || [];
        setSuggestions(cache[field]);
      }
    } catch {
      // Silently fail - autocomplete is non-critical
    } finally {
      setLoading(false);
      setIsOpen(true);
    }
  }, [field]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={fetchSuggestions}
        className={className}
        placeholder={placeholder}
        required={required}
        autoComplete="off"
      />
      {isOpen && filtered.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-slate-800 border border-white/20 rounded-xl shadow-xl max-h-48 overflow-y-auto">
          {loading ? (
            <div className="px-4 py-2 text-gray-400 text-sm">Đang tải...</div>
          ) : (
            filtered.map((item) => (
              <div
                key={item}
                onMouseDown={() => handleSelect(item)}
                className={`px-4 py-2 cursor-pointer hover:bg-blue-600/30 transition-colors text-sm ${
                  value === item ? 'bg-blue-600/20 text-blue-400' : 'text-white'
                }`}
              >
                {item}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
