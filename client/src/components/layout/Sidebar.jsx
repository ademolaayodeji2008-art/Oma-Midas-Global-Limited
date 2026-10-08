/**
 * Sidebar.jsx — Left sidebar for authenticated pages.
 * 240px on desktop, slide-in drawer on mobile.
 */

import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import Button from '../ui/Button';

const memberLinks = [
  { to: '/member/dashboard', label: 'Dashboard', icon: '🏠' },
  { to: '/member/contributions', label: 'Contributions', icon: '💰' },
  { to: '/member/loan-request', label: 'Loan Request', icon: '📋' },
  { to: '/member/loan-repayment', label: 'Loan Repayment', icon: '💳' },
  { to: '/member/refund', label: 'Refund', icon: '↩️' },
  { to: '/member/transactions', label: 'Transactions', icon: '📊' },
  { to: '/member/profile', label: 'Profile', icon: '👤' },
  { to: '/member/notifications', label: 'Notifications', icon: '🔔' },
];

const adminLinks = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: '📈' },
  { to: '/admin/members', label: 'Members', icon: '👥' },
  { to: '/admin/loans', label: 'Loans', icon: '💼' },
  { to: '/admin/refunds', label: 'Refunds', icon: '↩️' },
  { to: '/admin/company-fund', label: 'Company Fund', icon: '🏦' },
  { to: '/admin/reports', label: 'Reports', icon: '📄' },
  { to: '/admin/audit-log', label: 'Audit Log', icon: '🔍' },
  { to: '/admin/settings', label: 'Settings', icon: '⚙️' },
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

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const linkClass = ({ isActive }) =>
    [
      'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors',
      isActive
        ? 'bg-primary text-white'
        : 'text-charcoal hover:bg-blush hover:text-primary',
    ].join(' ');

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-5 border-b border-gray-100">
        <img src="/logo.svg" alt="Oma Midas logo" className="h-8 w-8" />
        <span className="font-heading font-bold text-primary text-lg">Oma Midas</span>
      </div>

      {/* User */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
            {user?.fullName?.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase() || '?'}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-charcoal truncate">{user?.fullName}</p>
            <p className="text-xs text-gray-400 truncate">{isAdmin ? 'Administrator' : 'Member'}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Main navigation">
        <ul className="space-y-1">
          {links.map((link) => (
            <li key={link.to}>
              <NavLink to={link.to} className={linkClass} onClick={onMobileClose}>
                <span aria-hidden="true">{link.icon}</span>
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-gray-100">
        <Button variant="outline" size="sm" className="w-full" onClick={handleLogout}>
          Logout
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-60 flex-shrink-0 bg-white border-r border-gray-100 h-screen sticky top-0 overflow-y-auto">
        {sidebarContent}
      </aside>

      {/* Mobile overlay + drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Overlay */}
            <motion.div
              className="fixed inset-0 bg-black/40 z-40 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onMobileClose}
              aria-hidden="true"
            />
            {/* Drawer */}
            <motion.aside
              className="fixed left-0 top-0 h-full w-60 bg-white z-50 md:hidden overflow-y-auto"
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
