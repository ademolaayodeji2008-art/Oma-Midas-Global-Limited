/**
 * Footer.jsx — Public pages footer with logo, contact, and copyright.
 */

import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-primary text-white">
      <hr className="gold-divider border-accent/40" />
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo + tagline */}
          <div className="flex items-center gap-3">
            <img src="/logo.jpeg" alt="Oma Midas logo" className="h-10 w-10" />
            <div>
              <p className="font-heading font-bold text-lg text-white">Oma Midas Global</p>
              <p className="text-xs text-white/60">Your Trusted Savings & Loan Cooperative</p>
            </div>
          </div>

          {/* Links */}
          <nav aria-label="Footer navigation" className="flex gap-6 text-sm text-white/70">
            <Link to="/" className="hover:text-accent transition-colors">Home</Link>
            <Link to="/login" className="hover:text-accent transition-colors">Login</Link>
            <Link to="/signup" className="hover:text-accent transition-colors">Sign Up</Link>
          </nav>

          {/* Contact */}
          <div className="text-sm text-white/60 text-center md:text-right">
            <p>Email: <a href="mailto:omamidasgloballtd@gmail.com" className="text-accent hover:underline">omamidasgloballtd@gmail.com</a></p>
            <p>WhatsApp: <a href="https://wa.me/2347016694445" className="text-accent hover:underline">+2347016694445</a></p>
            <p className="mt-1">Secretary: Ajiboye O.M</p>
          </div>
        </div>

        <hr className="border-white/10 my-6" />
        <p className="text-center text-xs text-white/40">
          &copy; {year} Oma Midas Global Limited. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
