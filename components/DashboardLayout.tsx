"use client";

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useTenantSettings } from './TenantSettingsProvider';
import { supabaseBrowser } from '../lib/supabaseBrowser';

export type TimePeriod = 'Today' | 'Week' | 'Month' | 'Year';

interface DashboardLayoutProps {
  children: React.ReactNode;
  onTimeFilterChange?: (period: TimePeriod) => void;
  defaultTimePeriod?: TimePeriod;
}

export default function DashboardLayout({ 
  children, 
  onTimeFilterChange,
  defaultTimePeriod = 'Month'
}: DashboardLayoutProps) {
  const pathname = usePathname();
  const [activePeriod, setActivePeriod] = useState<TimePeriod>(defaultTimePeriod);
  const { settings } = useTenantSettings();

  const agencyName = settings?.agency_name || 'Travel Agency';
  const logoSrcRaw = settings?.logo_url || '/habibi-logo.jpeg';
  let logoSrc = '/habibi-logo.jpeg';
  if (logoSrcRaw) {
    try {
      if (logoSrcRaw.startsWith('http')) {
        new URL(logoSrcRaw);
        logoSrc = logoSrcRaw;
      } else {
        logoSrc = logoSrcRaw;
      }
    } catch {
      console.warn('Invalid logo_url in tenant_settings – falling back to default image');
    }
  }

  const agentDisplay = settings?.agency_name ? settings.agency_name.split(' ')[0] : 'Agent';

  // Show time filter only on Analytics and All Applications pages
  const showTimeFilter = pathname === '/' || pathname === '/all-applications';

  const handlePeriodChange = (period: TimePeriod) => {
    setActivePeriod(period);
    onTimeFilterChange?.(period);
  };

  const Icons = {
    analytics: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    entry: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    plus: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v14m7-7H5" />
      </svg>
    ),
    search: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    )
  };

  const navigationItems = [
    { href: '/applications', label: 'New', icon: Icons.plus },
    { href: '/', label: 'Analytics', icon: Icons.analytics },
    { href: '/all-applications', label: 'All Applications', icon: Icons.entry },
    { href: '/settings', label: 'Settings', icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 3a.75.75 0 01.75-.75h3a.75.75 0 01.75.75v1.011a7.5 7.5 0 013.823 1.647l.715-.715a.75.75 0 011.06 0l2.121 2.122a.75.75 0 010 1.06l-.715.715A7.5 7.5 0 0120.989 11h1.011a.75.75 0 01.75.75v3a.75.75 0 01-.75.75h-1.011a7.5 7.5 0 01-1.647 3.823l.715.715a.75.75 0 010 1.06l-2.122 2.121a.75.75 0 01-1.06 0l-.715-.715A7.5 7.5 0 0115 20.989v1.011a.75.75 0 01-.75.75h-3a.75.75 0 01-.75-.75v-1.011a7.5 7.5 0 01-3.823-1.647l-.715.715a.75.75 0 01-1.06 0l-2.121-2.122a.75.75 0 010-1.06l.715-.715A7.5 7.5 0 013.011 15H2a.75.75 0 01-.75-.75v-3A.75.75 0 012 10.5h1.011a7.5 7.5 0 011.647-3.823l-.715-.715a.75.75 0 010-1.06l2.122-2.122a.75.75 0 011.06 0l.715.715A7.5 7.5 0 019 4.011V3z" />
        </svg>
      ) }
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname === href;
  };

  return (
    <div className="min-h-screen">
      {/* ===== NEW CONSOLIDATED NAV BAR ===== */}
      <nav className="bg-white border-b border-slate-200 shadow-sm">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Agent info & navigation links */}
            <div className="flex items-center space-x-6">
              {/* Navigation links */}
              <div className="flex space-x-6">
                {navigationItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={true}
                    className={`flex items-center space-x-2 font-medium text-sm transition-all duration-200 ${
                      isActive(item.href)
                        ? "text-blue-600"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    <span className={isActive(item.href) ? "text-blue-600" : "text-slate-400"}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Center: Brand */}
            <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center space-x-2 select-none">
              {logoSrc && (
                <Image
                  src={logoSrc}
                  alt={agencyName + ' Logo'}
                  width={40}
                  height={40}
                  priority
                  className="rounded-full object-contain shadow-lg"
                />
              )}
              <span className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight whitespace-nowrap max-w-[40vw] truncate">
                {agencyName}
              </span>
            </div>

            {/* Right: Time filter (optional) & Sign Out */}
            <div className="flex items-center space-x-2">
              {showTimeFilter && (
                <div className="hidden lg:flex items-center space-x-1 bg-slate-100 rounded-xl p-1 z-10">
                  {( ["Today", "Week", "Month", "Year"] as TimePeriod[]).map((period) => (
                    <button
                      key={period}
                      onClick={() => handlePeriodChange(period)}
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                        period === activePeriod
                          ? "bg-white text-slate-900 shadow-sm"
                          : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                      }`}
                    >
                      {period}
                    </button>
                  ))}
                </div>
              )}

              <button
                onClick={async () => {
                  await supabaseBrowser.auth.signOut();
                  window.location.href = '/login';
                }}
                className="text-sm text-slate-500 hover:text-red-600 whitespace-nowrap"
              >
                Sign&nbsp;Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ===== MAIN CONTENT AREA ===== */}
      <main className="w-full">
        {children}
      </main>
    </div>
  );
} 