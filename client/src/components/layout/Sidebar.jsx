/**
 * Sidebar.jsx — Left sidebar for authenticated pages.
 * 240px on desktop, slide-in drawer on mobile.
 */

import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Wallet,
  ClipboardList,
  CreditCard,
  BarChart2,
  RotateCcw,
  ArrowLeftRight,
  User,
  Bell,
  Users,
  Briefcase,
  FileText,
  Building2,
  BookOpen,
  Search,
  Settings,
  LogOut,
  WalletCards,
  ClipboardCheck,
  Mail,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import Button from '../ui/Button';
import api from '../../lib/api';

const memberLinks = [
  { to: '/member/dashboard',      label: 'Dashboard',      Icon: LayoutDashboard },
  { to: '/member/contributions',  label: 'Contributions',  Icon: Wallet },
  { to: '/member/loan-request',   label: 'Loan Request',   Icon: ClipboardList },
  { to: '/member/loan-repayment', label: 'Loan Repayment', Icon: CreditCard },
  { to: '/member/loan-summary',   label: 'Loan Summary',   Icon: BarChart2 },
  { to: '/member/refund',         label: 'Refund',         Icon: RotateCcw },
  { to: '/member/transactions',   label: 'Transactions',   Icon: ArrowLeftRight },
  { to: '/member/profile',        label: 'Profile',        Icon: User },
  { to: '/member/notifications',  label: 'Notifications',  Icon: Bell },
  { to: '/member/clearance-card', label: 'Clearance Card', Icon: WalletCards },
];

const adminLinks = [
  { to: '/admin/dashboard',         label: 'Dashboard',        Icon: LayoutDashboard },
  { to: '/admin/members',           label: 'Members',          Icon: Users },
  { to: '/admin/pending-payments',  label: 'Pending Payments', Icon: ClipboardCheck },
  { to: '/admin/loans',             label: 'Loans',            Icon: Briefcase },
  { to: '/admin/loan-summary',      label: 'Loan Summary',     Icon: BarChart2 },
  { to: '/admin/refunds',           label: 'Refunds',          Icon: RotateCcw },
  { to: '/admin/company-fund',      label: 'Company Fund',     Icon: Building2 },
  { to: '/admin/reports',           label: 'Reports',          Icon: FileText },
  { to: '/admin/audit-log',         label: 'Audit Log',        Icon: BookOpen },
  { to: '/admin/newsletter',        label: 'Newsletter',       Icon: Mail },
  { to: '/admin/settings',          label: 'Settings',         Icon: Settings },
];

const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * @param {object} props
 * @param {boolean} props.mobileOpen - Controls mobile drawer
 * @param {function} props.onMobileClose
 */
export default function Sidebar({ mobileOpen = false, onMobileClose }) {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const links = isAdmin ? adminLinks : memberLinks;
  const [clearancePendingCount, setClearancePendingCount] = useState(0);
  const [repaymentsPendingCount, setRepaymentsPendingCount] = useState(0);

  useEffect(() => {
    if (!isAdmin) return;
    api.get('/api/clearance-card/admin/pending')
      .then((res) => setClearancePendingCount((res.data || []).length))
      .catch(() => {});
    api.get('/api/admin/repayments/pending')
      .then((res) => setRepaymentsPendingCount(res.data?.pagination?.total || (res.data?.installments || []).length))
      .catch(() => {});
  }, [isAdmin]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const linkClass = ({ isActive }) =>
    [
      'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors',
      isActive
        ? 'bg-[#C9A86A] text-[#1E1433] font-bold'
        : 'text-[#F5F0FF]/80 hover:bg-[#2D1B69] hover:text-[#F5F0FF]',
    ].join(' ');

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-5 border-b border-[#2D1B69]/40">
        <img src="/logo.jpeg" alt="Oma Midas logo" className="h-8 w-8" />
        <span className="font-heading font-bold text-[#C9A86A] text-lg">Oma Midas</span>
      </div>

      {/* User */}
      <div className="px-4 py-3 border-b border-[#2D1B69]/40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#C9A86A] text-[#1E1433] text-xs font-bold flex items-center justify-center flex-shrink-0">
            {user?.fullName?.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase() || '?'}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#F5F0FF] truncate">{user?.fullName}</p>
            <p className="text-xs text-[#F5F0FF]/60 truncate">{isAdmin ? 'Administrator' : 'Member'}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Main navigation">
        <ul className="space-y-1">
          {links.map(({ to, label, Icon }) => (
            <li key={to}>
              <NavLink to={to} className={linkClass} onClick={onMobileClose}>
                <Icon size={17} aria-hidden="true" className="flex-shrink-0" />
                {label}
                {isAdmin && to === '/admin/members' && clearancePendingCount > 0 && (
                  <span className="ml-auto inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-[#C9A86A] text-[#1E1433] text-[10px] font-bold leading-none">
                    {clearancePendingCount}
                  </span>
                )}
                {isAdmin && to === '/admin/loans' && repaymentsPendingCount > 0 && (
                  <span className="ml-auto inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-amber-500 text-white text-[10px] font-bold leading-none">
                    {repaymentsPendingCount}
                  </span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-[#2D1B69]/40">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-4 py-2.5 rounded-xl text-sm font-medium text-[#F5F0FF]/70 hover:bg-red-900/20 hover:text-red-400 transition-colors"
        >
          <LogOut size={17} aria-hidden="true" className="flex-shrink-0" />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-60 flex-shrink-0 bg-[#1E1433] border-r border-[#2D1B69] h-screen sticky top-0 overflow-y-auto">
        {sidebarContent}
      </aside>

      {/* Mobile overlay + drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/40 z-40 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onMobileClose}
              aria-hidden="true"
            />
            <motion.aside
              className="fixed left-0 top-0 h-full w-60 bg-[#1E1433] z-50 md:hidden overflow-y-auto"
              initial={prefersReducedMotion ? {} : { x: -240 }}
              animate={prefersReducedMotion ? {} : { x: 0 }}
              exit={prefersReducedMotion ? {} : { x: -240 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              aria-label="Navigation drawer"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
