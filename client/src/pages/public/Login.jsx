/**
 * Login.jsx — Email + password login page.
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../components/ui/Toast';
import Button from '../../components/ui/Button';
import Navbar from '../../components/layout/Navbar';
import PageTransition from '../../components/layout/PageTransition';

export default function Login() {
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await login({ email, password });
      const user = data.user;

      if (user.status === 'PENDING') {
        navigate('/pending');
        return;
      }
      if (user.status === 'REJECTED') {
        const reason = user.rejectionReason ? `?reason=${encodeURIComponent(user.rejectionReason)}` : '';
        navigate(`/rejected${reason}`);
        return;
      }

      if (user.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else {
        navigate('/member/dashboard');
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed. Check your credentials.';
      // Check if PENDING/REJECTED returned as error
      if (err.response?.data?.status === 'PENDING') {
        navigate('/pending');
        return;
      }
      if (err.response?.data?.status === 'REJECTED') {
        const reason = err.response?.data?.reason || '';
        navigate(`/rejected${reason ? `?reason=${encodeURIComponent(reason)}` : ''}`);
        return;
      }
      toast({ message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <Navbar />
      <main className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12 bg-background">
        <div className="w-full max-w-md">
          <div className="card-base">
            <div className="text-center mb-6">
              <img src="/logo.jpeg" alt="Oma Midas logo" className="h-12 w-12 mx-auto mb-3" />
              <h1 className="font-heading text-2xl font-bold text-primary">Welcome back</h1>
              <p className="text-sm text-gray-400 mt-1">Sign in to your account</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-charcoal mb-1">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-charcoal mb-1">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div className="text-right">
                <Link to="/forgot-password" className="text-xs text-accent hover:underline">
                  Forgot password?
                </Link>
              </div>

              <Button type="submit" variant="primary" size="md" loading={loading} className="w-full">
                Sign In
              </Button>
            </form>

            <p className="text-center text-sm text-gray-400 mt-5">
              Don&apos;t have an account?{' '}
              <Link to="/signup" className="text-accent font-semibold hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </main>
    </PageTransition>
  );
}
