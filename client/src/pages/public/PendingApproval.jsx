/**
 * PendingApproval.jsx — Shown after signup while account is under review.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/ui/Button';
import PageTransition from '../../components/layout/PageTransition';

export default function PendingApproval() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <PageTransition>
      <main className="min-h-screen flex items-center justify-center px-4 bg-background">
        <div className="card-base max-w-md w-full text-center">
          <div className="text-5xl mb-4" aria-hidden="true">⏳</div>
          <h1 className="font-heading text-2xl font-bold text-primary mb-3">
            Application Under Review
          </h1>
          <p className="text-sm text-gray-500 mb-4 leading-relaxed">
            Thank you for registering with Oma Midas Global Limited. Your application is currently
            being reviewed by our team. You will receive an email notification once a decision has
            been made.
          </p>
          <p className="text-sm text-gray-400 mb-6">
            This typically takes <strong>1–2 business days</strong>.
          </p>

          <hr className="gold-divider mb-6" />

          <div className="text-sm text-gray-500 mb-6">
            <p className="font-semibold text-charcoal mb-1">Need help?</p>
            <p>Contact us at{' '}
              <a href="mailto:info@omamidas.com" className="text-accent hover:underline">
                info@omamidas.com
              </a>
            </p>
          </div>

          <Button variant="outline" size="sm" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </main>
    </PageTransition>
  );
}
