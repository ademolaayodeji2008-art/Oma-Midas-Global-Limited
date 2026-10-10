/**
 * AppLayout.jsx — Authenticated page layout with Sidebar + MobileMenu.
 */

import React, { useState } from 'react';
import Sidebar from './Sidebar';
import MobileMenu from './MobileMenu';
import NotificationBell from '../ui/NotificationBell';
import { useAuth } from '../../hooks/useAuth';

/**
 * @param {object} props
 * @param {string} props.title - Page title shown in header
 * @param {React.ReactNode} props.children
 */
export default function AppLayout({ title, children }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="flex-shrink-0 h-14 bg-white border-b border-gray-100 flex items-center justify-between px-4 md:px-6">
          {/* Mobile menu toggle */}
          <button
            type="button"
            className="md:hidden p-2 rounded-xl text-primary hover:bg-sectionBg transition-colors"
            onClick={() => setMobileSidebarOpen(true)}
            aria-label="Open navigation"
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <h1 className="font-heading font-bold text-primary text-base md:text-lg truncate">{title}</h1>

          <div className="flex items-center gap-2">
            <NotificationBell />
            <div className="hidden md:flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center" aria-hidden="true">
                {user?.fullName?.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase() || '?'}
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">
          {children}
        </main>
      </div>

      {/* Mobile bottom tabs */}
      <MobileMenu />
    </div>
  );
}
