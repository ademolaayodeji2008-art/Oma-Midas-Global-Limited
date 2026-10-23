/**
 * MobileMenu.jsx — Bottom tab bar for authenticated pages on mobile.
 * Hidden on desktop (md:hidden).
 */

import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Wallet,
  ClipboardList,
  ArrowLeftRight,
  User,
  Users,
  Briefcase,
  FileText,
  Settings,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const memberTabs = [
  { to: '/member/dashboard',     label: 'Home',     Icon: LayoutDashboard },
  { to: '/member/contributions', label: 'Save',     Icon: Wallet },
  { to: '/member/loan-request',  label: 'Loans',    Icon: ClipboardList },
  { to: '/member/transactions',  label: 'History',  Icon: ArrowLeftRight },
  { to: '/member/profile',       label: 'Profile',  Icon: User },
];

const adminTabs = [
  { to: '/admin/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { to: '/admin/members',   label: 'Members',   Icon: Users },
  { to: '/admin/loans',     label: 'Loans',     Icon: Briefcase },
  { to: '/admin/reports',   label: 'Reports',   Icon: FileText },
  { to: '/admin/settings',  label: 'Settings',  Icon: Settings },
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
        {tabs.map(({ to, label, Icon }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              className={({ isActive }) =>
                [
                  'flex flex-col items-center gap-1 py-2 text-xs font-medium transition-colors',
                  isActive ? 'text-primary' : 'text-gray-400 hover:text-primary',
                ].join(' ')
              }
            >
              <Icon size={20} aria-hidden="true" />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
