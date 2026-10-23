/**
 * ResetPassword.jsx — Reset password with token from ?token= query param.
 */

import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../lib/api';
import { useToast } from '../../components/ui/Toast';
import Button from '../../components/ui/Button';
import Navbar from '../../components/layout/Navbar';
import PageTransition from '../../components/layout/PageTransition';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const { toast } = useToast();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (password !== confirm) { setError('Passwords do not match'); return; }
    setError('');
    setLoading(true);
    try {
      await api.post('/api/auth/reset-password', { token, password });
      toast({ message: 'Password reset successfully. Please log in.', type: 'success' });
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Reset failed. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <PageTransition>
        <Navbar />
        <main className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 bg-background">
          <div className="card-base text-center max-w-md w-full">
            <h1 className="font-heading text-xl font-bold text-error mb-3">Invalid Reset Link</h1>
            <p className="text-sm text-gray-500 mb-4">This link is missing a token. Please request a new password reset.</p>
            <Link to="/forgot-password" className="text-accent hover:underline text-sm">Request new link</Link>
          </div>
        </main>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <Navbar />
      <main className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12 bg-background">
        <div className="w-full max-w-md">
          <div className="card-base">
            <div className="text-center mb-6">
              <img src="/logo.jpeg" alt="Oma Midas logo" className="h-12 w-12 mx-auto mb-3" />
              <h1 className="font-heading text-2xl font-bold text-primary">Set new password</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-charcoal mb-1">New Password</label>
                <input
                  id="password"
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label htmlFor="confirm" className="block text-sm font-medium text-charcoal mb-1">Confirm Password</label>
                <input
                  id="confirm"
                  type="password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              {error && <p className="text-sm text-error" role="alert">{error}</p>}

              <Button type="submit" variant="primary" size="md" loading={loading} className="w-full">
                Reset Password
              </Button>
            </form>
          </div>
        </div>
      </main>
    </PageTransition>
  );
}
