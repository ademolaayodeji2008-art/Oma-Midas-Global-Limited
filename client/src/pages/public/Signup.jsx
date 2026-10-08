/**
 * Signup.jsx — Registration form with BankAccountVerifier and T&C modal.
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { useToast } from '../../components/ui/Toast';
import Button from '../../components/ui/Button';
import Navbar from '../../components/layout/Navbar';
import PageTransition from '../../components/layout/PageTransition';
import BankAccountVerifier from '../../components/forms/BankAccountVerifier';
import TermsModal from '../../components/forms/TermsModal';

export default function Signup() {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [bankData, setBankData] = useState(null);
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const validate = () => {
    const errs = {};
    if (!form.fullName.trim()) errs.fullName = 'Full name is required';
    if (!form.email) errs.email = 'Email is required';
    if (!form.phone) errs.phone = 'Phone is required';
    if (form.password.length < 8) errs.password = 'Password must be at least 8 characters';
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    if (!bankData?.accountName) errs.bank = 'Please verify your bank account';
    if (!termsAgreed) errs.terms = 'You must agree to the Terms & Conditions';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    try {
      await api.post('/api/auth/register', {
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        password: form.password,
        bankName: bankData.bankName,
        accountNumber: bankData.accountNumber,
        accountName: bankData.accountName,
      });
      navigate('/pending');
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed. Please try again.';
      toast({ message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (field) =>
    `w-full border ${errors[field] ? 'border-error' : 'border-gray-200'} rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50`;

  return (
    <PageTransition>
      <Navbar />
      <main className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12 bg-background">
        <div className="w-full max-w-lg">
          <div className="card-base">
            <div className="text-center mb-6">
              <img src="/logo.svg" alt="Oma Midas logo" className="h-12 w-12 mx-auto mb-3" />
              <h1 className="font-heading text-2xl font-bold text-primary">Create your account</h1>
              <p className="text-sm text-gray-400 mt-1">Join the Oma Midas cooperative</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {/* Full name */}
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-charcoal mb-1">Full Name</label>
                <input id="fullName" type="text" required value={form.fullName} onChange={set('fullName')} className={inputClass('fullName')} autoComplete="name" />
                {errors.fullName && <p className="text-xs text-error mt-1">{errors.fullName}</p>}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-charcoal mb-1">Email</label>
                <input id="email" type="email" required value={form.email} onChange={set('email')} className={inputClass('email')} autoComplete="email" />
                {errors.email && <p className="text-xs text-error mt-1">{errors.email}</p>}
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-charcoal mb-1">Phone Number</label>
                <input id="phone" type="tel" required value={form.phone} onChange={set('phone')} className={inputClass('phone')} autoComplete="tel" />
                {errors.phone && <p className="text-xs text-error mt-1">{errors.phone}</p>}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-charcoal mb-1">Password</label>
                <input id="password" type="password" required value={form.password} onChange={set('password')} className={inputClass('password')} autoComplete="new-password" />
                {errors.password && <p className="text-xs text-error mt-1">{errors.password}</p>}
              </div>

              {/* Confirm password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-charcoal mb-1">Confirm Password</label>
                <input id="confirmPassword" type="password" required value={form.confirmPassword} onChange={set('confirmPassword')} className={inputClass('confirmPassword')} autoComplete="new-password" />
                {errors.confirmPassword && <p className="text-xs text-error mt-1">{errors.confirmPassword}</p>}
              </div>

              {/* Bank verifier */}
              <div>
                <p className="text-sm font-medium text-charcoal mb-2">Bank Account</p>
                <BankAccountVerifier
                  onVerified={(bankName, accountNumber, accountName, bankCode) =>
                    setBankData({ bankName, accountNumber, accountName, bankCode })
                  }
                />
                {errors.bank && <p className="text-xs text-error mt-1">{errors.bank}</p>}
              </div>

              {/* T&C */}
              <div>
                <button
                  type="button"
                  onClick={() => setTermsOpen(true)}
                  className={`flex items-center gap-2 text-sm cursor-pointer ${errors.terms ? 'text-error' : 'text-charcoal'}`}
                >
                  <span
                    className={`w-4 h-4 border-2 rounded flex items-center justify-center flex-shrink-0 ${termsAgreed ? 'border-primary bg-primary text-white' : 'border-gray-300'}`}
                    aria-hidden="true"
                  >
                    {termsAgreed && '✓'}
                  </span>
                  I agree to the{' '}
                  <span className="text-accent underline">Terms &amp; Conditions</span>
                </button>
                {errors.terms && <p className="text-xs text-error mt-1">{errors.terms}</p>}
              </div>

              <Button type="submit" variant="primary" size="md" loading={loading} className="w-full">
                Create Account
              </Button>
            </form>

            <p className="text-center text-sm text-gray-400 mt-5">
              Already have an account?{' '}
              <Link to="/login" className="text-accent font-semibold hover:underline">Sign in</Link>
            </p>
          </div>
        </div>
      </main>

      <TermsModal
        isOpen={termsOpen}
        onClose={() => setTermsOpen(false)}
        onAgree={() => setTermsAgreed(true)}
      />
    </PageTransition>
  );
}
