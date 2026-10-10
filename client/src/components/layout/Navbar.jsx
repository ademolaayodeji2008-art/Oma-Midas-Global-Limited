/**
 * Navbar.jsx — Sticky top navigation for public pages.
 * Adds shadow on scroll. Shows for public pages only.
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import Button from '../ui/Button';
import NotificationBell from '../ui/NotificationBell';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const initials = user?.fullName
    ? user.fullName.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  return (
    <motion.nav
      className={[
        'sticky top-0 z-40 bg-white transition-shadow duration-300',
        scrolled ? 'shadow-card' : '',
      ].join(' ')}
      initial={{ y: -8, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-heading font-bold text-primary text-lg">
          <img src="/logo.svg" alt="Oma Midas logo" className="h-8 w-8" />
          Oma Midas
        </Link>

        {/* Desktop right section */}
        <div className="hidden md:flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <NotificationBell />
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center"
                  aria-label={`Logged in as ${user?.fullName}`}
                >
                  {initials}
                </div>
                <span className="text-sm font-medium text-charcoal">{user?.fullName}</span>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout}>Logout</Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm">Login</Button>
              </Link>
              <Link to="/signup">
                <Button variant="primary" size="sm">Join Now</Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          className="md:hidden p-2 rounded-xl text-primary hover:bg-sectionBg transition-colors"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
        >
          <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-6 py-4 flex flex-col gap-3">
          {isAuthenticated ? (
            <>
              <span className="text-sm font-medium">{user?.fullName}</span>
              <Button variant="outline" size="sm" onClick={handleLogout}>Logout</Button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setMenuOpen(false)}>
                <Button variant="ghost" size="sm" className="w-full">Login</Button>
              </Link>
              <Link to="/signup" onClick={() => setMenuOpen(false)}>
                <Button variant="primary" size="sm" className="w-full">Join Now</Button>
              </Link>
            </>
          )}
        </div>
      )}
    </motion.nav>
  );
}
