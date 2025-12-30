'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import '@/components/ui/spinner.css';

interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'user';
  isActive: boolean;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [user, setUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Validate authentication with server
    const validateAuth = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include' // Include cookies
        });

        if (!response.ok) {
          // Token invalid or expired
          localStorage.removeItem('user');
          router.push('/');
          return;
        }

        const data = await response.json();

        // Update user state from server response
        setUser(data.user);

        // Also update localStorage for quick UI rendering on refresh
        localStorage.setItem('user', JSON.stringify({
          ...data.user,
          isLoggedIn: true
        }));
      } catch (error) {
        console.error('Auth validation error:', error);
        localStorage.removeItem('user');
        router.push('/');
      }
    };

    // Quick check: if we have cached data, render immediately
    // But still validate with server in background
    const cachedUser = localStorage.getItem('user');
    if (cachedUser) {
      try {
        const parsed = JSON.parse(cachedUser);
        if (parsed.isLoggedIn) {
          setUser(parsed); // Render immediately with cached data
        }
      } catch (e) {
        // Invalid cached data
        localStorage.removeItem('user');
      }
    }

    // Always validate with server
    validateAuth();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST'
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
    
    localStorage.removeItem('user');
    router.push('/');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 lg:flex">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-80 bg-slate-800/95 transform transition-transform duration-300 ease-out lg:fixed lg:translate-x-0 lg:flex-shrink-0 lg:w-72 lg:bg-slate-800/90 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full max-h-screen">
          {/* Sidebar Header */}
          <div className="p-6 lg:p-5 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-white">BHV AUTO CONTRACT</h1>
                <p className="text-sm text-slate-300 mt-1">
                  {user.role === 'admin' ? '🔑 Administrator' : '👤 User'} Panel
                </p>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-3 rounded-xl text-slate-300 hover:text-white hover:bg-slate-700 transition-all duration-200 min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-6 lg:p-4 min-h-0">
            <div className="space-y-1">
              <a href="/dashboard" className="flex items-center gap-4 px-4 py-4 text-slate-300 hover:text-white hover:bg-slate-700 rounded-xl transition-all duration-200 min-h-[52px]">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
                </svg>
                <span className="font-medium">Dashboard</span>
              </a>
              
              <a href="/dashboard/profile" className="flex items-center gap-4 px-4 py-4 text-slate-300 hover:text-white hover:bg-slate-700 rounded-xl transition-all duration-200 min-h-[52px]">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="font-medium">Profile</span>
              </a>
              
              <a href="/contracts" className="flex items-center gap-4 px-4 py-4 text-slate-300 hover:text-white hover:bg-slate-700 rounded-xl transition-all duration-200 min-h-[52px]">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="font-medium">BH Xe cơ giới</span>
              </a>

              <a href="/health" className="flex items-center gap-4 px-4 py-4 text-slate-300 hover:text-white hover:bg-slate-700 rounded-xl transition-all duration-200 min-h-[52px]">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span className="font-medium">BH Sức khỏe</span>
              </a>
              
              {user.role === 'admin' && (
                <>
                  <div className="pt-6 pb-2">
                    <p className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Admin Tools</p>
                  </div>
                  <a href="/dashboard/users" className="flex items-center gap-4 px-4 py-4 text-slate-300 hover:text-white hover:bg-slate-700 rounded-xl transition-all duration-200 min-h-[52px]">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                    </svg>
                    <span className="font-medium">Users</span>
                  </a>
                  <a href="#" className="flex items-center gap-4 px-4 py-4 text-slate-300 hover:text-white hover:bg-slate-700 rounded-xl transition-all duration-200 min-h-[52px]">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="font-medium">Settings</span>
                  </a>
                </>
              )}
            </div>
          </nav>
          
          {/* User Profile - Always visible at bottom */}
          <div className="p-6 lg:p-4 flex-shrink-0 mt-auto">
            <div className="flex items-center gap-4 p-4 bg-slate-700/50 rounded-xl">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-semibold text-base">
                  {user.username?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-base font-medium truncate">{user.username}</p>
                <p className="text-slate-400 text-sm capitalize">{user.role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-3 text-slate-400 hover:text-red-400 hover:bg-slate-600 rounded-lg transition-all duration-200 min-h-[44px] min-w-[44px] flex items-center justify-center"
                title="Logout"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:min-w-0 lg:ml-72">
        {/* Top Bar */}
        <header className="bg-slate-800/50 px-4 lg:px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-3 rounded-xl text-white hover:bg-slate-700 transition-all duration-200 min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div>
                <h1 className="text-xl lg:text-2xl font-bold text-white">
                  Welcome back, {user.username}! 👋
                </h1>
                <p className="text-slate-300 text-sm lg:text-base mt-1">
                  {user.role === 'admin' 
                    ? 'You have full administrative access to the system.' 
                    : 'You have user-level access to the system.'}
                </p>
              </div>
            </div>
          </div>
        </header>
        
        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}