/**
 * ForgotPassword.jsx — Send password reset email.
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import Button from '../../components/ui/Button';
import Navbar from '../../components/layout/Navbar';
import PageTransition from '../../components/layout/PageTransition';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/api/auth/forgot-password', { email });
    } catch {
      // Intentionally swallow — always show same message
    } finally {
      setSent(true);
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <Navbar />
      <main className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12 bg-background">
        <div className="w-full max-w-md">
          <div className="card-base text-center">
            <img src="/logo.svg" alt="Oma Midas logo" className="h-12 w-12 mx-auto mb-4" />
            <h1 className="font-heading text-2xl font-bold text-primary mb-2">Reset your password</h1>

            {sent ? (
              <>
                <p className="text-sm text-gray-500 mb-6">
                  If an account exists for <strong>{email}</strong>, you will receive a password reset link shortly.
                </p>
                <Link to="/login" className="text-accent text-sm hover:underline">Back to login</Link>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-400 mb-6">Enter your email and we&apos;ll send a reset link.</p>
                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                  <div className="text-left">
                    <label htmlFor="email" className="block text-sm font-medium text-charcoal mb-1">Email address</label>
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      autoComplete="email"
                    />
                  </div>
                  <Button type="submit" variant="primary" size="md" loading={loading} className="w-full">
                    Send Reset Link
                  </Button>
                </form>
                <p className="text-sm text-gray-400 mt-4">
                  <Link to="/login" className="text-accent hover:underline">Back to login</Link>
                </p>
              </>
            )}
          </div>
        </div>
      </main>
    </PageTransition>
  );
}
