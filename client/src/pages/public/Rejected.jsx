/**
 * Rejected.jsx — Shown when a member application is rejected.
 * Reads reason from ?reason= query param.
 */

import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/ui/Button';
import PageTransition from '../../components/layout/PageTransition';

export default function Rejected() {
  const [searchParams] = useSearchParams();
  const reason = searchParams.get('reason');
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
          <div className="text-5xl mb-4" aria-hidden="true">❌</div>
          <h1 className="font-heading text-2xl font-bold text-error mb-3">
            Application Not Approved
          </h1>
          <p className="text-sm text-gray-500 mb-4 leading-relaxed">
            Unfortunately, your application to join Oma Midas Global Limited was not approved at
            this time.
          </p>

          {reason && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4 text-left">
              <p className="text-xs font-semibold text-error mb-1">Reason</p>
              <p className="text-sm text-charcoal">{reason}</p>
            </div>
          )}

          <p className="text-sm text-gray-400 mb-6">
            If you believe this is an error, please contact us for clarification.
          </p>

          <hr className="gold-divider mb-6" />

          <div className="text-sm text-gray-500 mb-6">
            <p className="font-semibold text-charcoal mb-1">Contact us</p>
            <p>
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
