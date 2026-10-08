/**
 * Profile.jsx — View and edit member profile and change password.
 */

import React, { useState } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import BankAccountVerifier from '../../components/forms/BankAccountVerifier';
import PageTransition from '../../components/layout/PageTransition';
import api from '../../lib/api';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../hooks/useAuth';

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [profileForm, setProfileForm] = useState({
    phone: user?.phone || '',
  });
  const [bankData, setBankData] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState('');

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      const payload = { phone: profileForm.phone };
      if (bankData?.accountName) {
        Object.assign(payload, {
          bankName: bankData.bankName,
          accountNumber: bankData.accountNumber,
          accountName: bankData.accountName,
        });
      }
      await api.put('/api/auth/profile', payload);
      toast({ message: 'Profile updated successfully.', type: 'success' });
    } catch (err) {
      toast({ message: err.response?.data?.message || 'Update failed.', type: 'error' });
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword.length < 8) { setPwError('New password must be at least 8 characters.'); return; }
    if (pwForm.newPassword !== pwForm.confirmPassword) { setPwError('Passwords do not match.'); return; }
    setPwError('');
    setPwLoading(true);
    try {
      await api.put('/api/auth/change-password', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      toast({ message: 'Password changed successfully.', type: 'success' });
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPwError(err.response?.data?.message || 'Password change failed.');
    } finally {
      setPwLoading(false);
    }
  };

  const setPw = (field) => (e) => setPwForm((prev) => ({ ...prev, [field]: e.target.value }));

  return (
    <PageTransition>
      <AppLayout title="My Profile">
        <div className="space-y-6 max-w-xl">
          {/* Account info */}
          <Card>
            <h2 className="font-heading font-bold text-primary mb-4">Account Information</h2>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full bg-primary text-white text-xl font-bold flex items-center justify-center">
                {user?.fullName?.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase() || '?'}
              </div>
              <div>
                <p className="font-semibold text-charcoal">{user?.fullName}</p>
                <p className="text-sm text-gray-400">{user?.email}</p>
              </div>
            </div>
          </Card>

          {/* Edit profile */}
          <Card>
            <h2 className="font-heading font-bold text-primary mb-4">Edit Details</h2>
            <form onSubmit={handleProfileSave} className="space-y-4">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-charcoal mb-1">Phone Number</label>
                <input
                  id="phone"
                  type="tel"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ phone: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div>
                <p className="text-sm font-medium text-charcoal mb-2">Update Bank Account (optional)</p>
                <BankAccountVerifier
                  initialValues={{ bankName: user?.bankName, accountNumber: user?.accountNumber }}
                  onVerified={(bankName, accountNumber, accountName, bankCode) =>
                    setBankData({ bankName, accountNumber, accountName, bankCode })
                  }
                />
              </div>

              <Button type="submit" variant="primary" size="md" loading={profileLoading} className="w-full">
                Save Changes
              </Button>
            </form>
          </Card>

          {/* Change password */}
          <Card>
            <h2 className="font-heading font-bold text-primary mb-4">Change Password</h2>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              {(['currentPassword', 'newPassword', 'confirmPassword'] ).map((field) => (
                <div key={field}>
                  <label htmlFor={field} className="block text-sm font-medium text-charcoal mb-1">
                    {field === 'currentPassword' ? 'Current Password' : field === 'newPassword' ? 'New Password' : 'Confirm New Password'}
                  </label>
                  <input
                    id={field}
                    type="password"
                    required
                    value={pwForm[field]}
                    onChange={setPw(field)}
                    autoComplete={field === 'currentPassword' ? 'current-password' : 'new-password'}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              ))}
              {pwError && <p className="text-sm text-error" role="alert">{pwError}</p>}
              <Button type="submit" variant="primary" size="md" loading={pwLoading} className="w-full">
                Change Password
              </Button>
            </form>
          </Card>
        </div>
      </AppLayout>
    </PageTransition>
  );
}
