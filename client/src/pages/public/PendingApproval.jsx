/**
 * PendingApproval.jsx — Shown after signup while account is under review.
 * Auto-checks every 10 seconds if user has been approved and redirects.
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/ui/Button';
import PageTransition from '../../components/layout/PageTransition';

export default function PendingApproval() {
  const { logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(false);

  // Auto-check approval status every 10 seconds
  useEffect(() => {
    const checkApproval = async () => {
      setChecking(true);
      const updatedUser = await refreshUser();
      setChecking(false);
      
      if (updatedUser && updatedUser.status === 'ACTIVE') {
        // User has been approved! Redirect to dashboard
        navigate('/member/dashboard', { replace: true });
      }
    };

    // Check immediately on mount
    checkApproval();

    // Then check every 10 seconds
    const interval = setInterval(checkApproval, 10000);

    return () => clearInterval(interval);
  }, [refreshUser, navigate]);

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

          {checking && (
            <div className="flex items-center justify-center gap-2 text-xs text-gray-400 mb-4">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
              <span>Checking approval status...</span>
            </div>
          )}

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
