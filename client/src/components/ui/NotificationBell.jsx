/**
 * NotificationBell.jsx — Bell icon with unread count badge and dropdown.
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications } from '../../hooks/useNotifications';

const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function NotificationBell() {
  const { notifications, unreadCount, markRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleMarkAll = () => {
    const ids = notifications.filter((n) => !n.isRead).map((n) => n.id);
    if (ids.length) markRead(ids);
  };

  const recent = notifications.slice(0, 8);

  return (
    <div ref={ref} className="relative">
      <motion.button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        aria-expanded={open}
        aria-haspopup="true"
        className="relative p-2 rounded-xl text-primary hover:bg-sectionBg transition-colors focus:outline-none focus:ring-2 focus:ring-accent"
        whileHover={prefersReducedMotion ? {} : { scale: 1.05 }}
        whileTap={prefersReducedMotion ? {} : { scale: 0.95 }}
      >
        {/* Bell icon */}
        <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-5-5.917V4a1 1 0 10-2 0v1.083A6 6 0 006 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0a3 3 0 11-6 0m6 0H9" />
        </svg>

        {/* Unread badge */}
        {unreadCount > 0 && (
          <motion.span
            initial={prefersReducedMotion ? {} : { scale: 0 }}
            animate={prefersReducedMotion ? {} : { scale: 1 }}
            className="absolute -top-0.5 -right-0.5 bg-error text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center"
            aria-hidden="true"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </motion.button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={prefersReducedMotion ? {} : { opacity: 0, y: -8 }}
            animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? {} : { opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-hover border border-gray-100 z-50"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <span className="font-semibold text-primary">Notifications</span>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAll}
                  className="text-xs text-accent hover:underline"
                >
                  Mark all read
                </button>
              )}
            </div>

            <ul className="max-h-72 overflow-y-auto divide-y divide-gray-50">
              {recent.length === 0 ? (
                <li className="px-4 py-6 text-center text-sm text-gray-400">No notifications</li>
              ) : (
                recent.map((n) => (
                  <li
                    key={n.id}
                    className={['px-4 py-3 text-sm', !n.isRead ? 'bg-sectionBg/60' : ''].join(' ')}
                  >
                    <p className="font-medium text-charcoal">{n.title || n.message}</p>
                    {n.title && n.message && (
                      <p className="text-gray-500 text-xs mt-0.5 line-clamp-2">{n.message}</p>
                    )}
                    <span className="text-gray-400 text-xs">
                      {n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}
                    </span>
                  </li>
                ))
              )}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
