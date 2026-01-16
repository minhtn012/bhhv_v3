'use client';

import { useState, useRef, useEffect } from 'react';

export interface SalesUser {
  _id: string;
  username: string;
}

interface UserFilterDropdownProps {
  users: SalesUser[];
  selectedUserId: string | null;
  onChange: (userId: string | null) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export default function UserFilterDropdown({
  users,
  selectedUserId,
  onChange,
  isLoading,
  disabled
}: UserFilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedUser = users.find(u => u._id === selectedUserId);
  const displayText = selectedUser ? selectedUser.username : 'Tất cả Sales';

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled || isLoading}
        className={`
          inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg
          bg-white/[0.03] border border-white/5 text-gray-300
          hover:bg-white/[0.06] hover:border-white/10 transition-all duration-200
          ${disabled || isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <span className="max-w-[80px] truncate">{displayText}</span>
        <svg className={`w-3 h-3 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-1 w-44 z-50
          bg-gray-900/98 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl
          overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="max-h-56 overflow-y-auto py-1">
            {/* All users option */}
            <button
              onClick={() => { onChange(null); setIsOpen(false); }}
              className={`
                w-full px-3 py-2 text-left text-xs transition-colors flex items-center gap-2
                ${!selectedUserId
                  ? 'bg-white/10 text-white'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'}
              `}
            >
              <div className={`w-1.5 h-1.5 rounded-full ${!selectedUserId ? 'bg-violet-500' : 'bg-transparent'}`} />
              Tất cả Sales
            </button>

            {/* Divider */}
            {users.length > 0 && <div className="border-t border-white/5 my-1" />}

            {/* User list */}
            {users.map(user => (
              <button
                key={user._id}
                onClick={() => { onChange(user._id); setIsOpen(false); }}
                className={`
                  w-full px-3 py-2 text-left text-xs transition-colors flex items-center gap-2
                  ${selectedUserId === user._id
                    ? 'bg-white/10 text-white'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'}
                `}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${selectedUserId === user._id ? 'bg-violet-500' : 'bg-transparent'}`} />
                {user.username}
              </button>
            ))}

            {users.length === 0 && (
              <div className="px-3 py-4 text-center text-gray-600 text-xs">
                Không có sales nào
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
