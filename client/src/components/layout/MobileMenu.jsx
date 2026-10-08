/**
 * MobileMenu.jsx — Bottom tab bar for authenticated pages on mobile.
 * Hidden on desktop (md:hidden).
 */

import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const memberTabs = [
  { to: '/member/dashboard', label: 'Home', icon: '🏠' },
  { to: '/member/contributions', label: 'Save', icon: '💰' },
  { to: '/member/loan-request', label: 'Loans', icon: '📋' },
  { to: '/member/transactions', label: 'History', icon: '📊' },
  { to: '/member/profile', label: 'Profile', icon: '👤' },
];

const adminTabs = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: '📈' },
  { to: '/admin/members', label: 'Members', icon: '👥' },
  { to: '/admin/loans', label: 'Loans', icon: '💼' },
  { to: '/admin/reports', label: 'Reports', icon: '📄' },
  { to: '/admin/settings', label: 'Settings', icon: '⚙️' },
];

export default function MobileMenu() {
  const { isAdmin } = useAuth();
  const tabs = isAdmin ? adminTabs : memberTabs;

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 shadow-card"
      aria-label="Bottom navigation"
    >
      <ul className="flex justify-around">
        {tabs.map((tab) => (
          <li key={tab.to} className="flex-1">
            <NavLink
              to={tab.to}
              className={({ isActive }) =>
                [
                  'flex flex-col items-center gap-0.5 py-2 text-xs font-medium transition-colors',
                  isActive ? 'text-primary' : 'text-gray-400',
                ].join(' ')
              }
            >
              <span className="text-xl" aria-hidden="true">{tab.icon}</span>
              {tab.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
