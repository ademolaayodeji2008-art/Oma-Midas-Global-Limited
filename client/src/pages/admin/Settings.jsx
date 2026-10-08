/**
 * Settings.jsx — System settings and T&C editor.
 */

import React, { useEffect, useState } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import PageTransition from '../../components/layout/PageTransition';
import api from '../../lib/api';
import { useToast } from '../../components/ui/Toast';

const numericSettings = [
  { key: 'fee_percentage', label: 'Fee Percentage (%)', type: 'number', min: 0, max: 100, step: 1 },
  { key: 'loan_multiplier', label: 'Loan Multiplier (×)', type: 'number', min: 1, step: 0.5 },
  { key: 'min_consecutive_months', label: 'Min. Consecutive Months', type: 'number', min: 1, step: 1 },
];

export default function Settings() {
  const { toast } = useToast();
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const [terms, setTerms] = useState('');
  const [savingTerms, setSavingTerms] = useState(false);
  const [cycleModal, setCycleModal] = useState(false);
  const [startingCycle, setStartingCycle] = useState(false);

  useEffect(() => {
    api.get('/api/admin/settings')
      .then((res) => {
        const data = res.data.settings || res.data || [];
        const map = {};
        (Array.isArray(data) ? data : Object.entries(data).map(([key, value]) => ({ key, value }))).forEach((s) => {
          map[s.key] = s.value;
        });
        setSettings(map);
        setTerms(map.terms_and_conditions || '');
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSaveSetting = async (key) => {
    setSaving((prev) => ({ ...prev, [key]: true }));
    try {
      await api.put(`/api/admin/settings/${key}`, { value: settings[key] });
      toast({ message: `Setting "${key}" saved.`, type: 'success' });
    } catch (err) {
      toast({ message: err.response?.data?.message || 'Save failed.', type: 'error' });
    } finally {
      setSaving((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleSaveTerms = async () => {
    setSavingTerms(true);
    try {
      await api.put('/api/admin/settings/terms_and_conditions', { value: terms });
      toast({ message: 'Terms & Conditions saved.', type: 'success' });
    } catch (err) {
      toast({ message: err.response?.data?.message || 'Save failed.', type: 'error' });
    } finally {
      setSavingTerms(false);
    }
  };

  const handleStartCycle = async () => {
    setStartingCycle(true);
    try {
      await api.post('/api/admin/cycles/new');
      toast({ message: 'New cycle started successfully.', type: 'success' });
      setCycleModal(false);
    } catch (err) {
      toast({ message: err.response?.data?.message || 'Failed to start cycle.', type: 'error' });
    } finally {
      setStartingCycle(false);
    }
  };

  return (
    <PageTransition>
      <AppLayout title="Settings">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="space-y-6 max-w-2xl">
            {/* Numeric settings */}
            <Card>
              <h2 className="font-heading font-bold text-primary mb-4">System Settings</h2>
              <div className="space-y-4">
                {numericSettings.map((setting) => (
                  <div key={setting.key} className="flex items-end gap-3">
                    <div className="flex-1">
                      <label htmlFor={setting.key} className="block text-sm font-medium text-charcoal mb-1">
                        {setting.label}
                      </label>
                      <input
                        id={setting.key}
                        type={setting.type}
                        min={setting.min}
                        max={setting.max}
                        step={setting.step}
                        value={settings[setting.key] ?? ''}
                        onChange={(e) => setSettings((prev) => ({ ...prev, [setting.key]: e.target.value }))}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      loading={saving[setting.key]}
                      onClick={() => handleSaveSetting(setting.key)}
                    >
                      Save
                    </Button>
                  </div>
                ))}
              </div>
            </Card>

            {/* T&C editor */}
            <Card>
              <h2 className="font-heading font-bold text-primary mb-4">Terms &amp; Conditions</h2>
              <textarea
                rows={12}
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                placeholder="Enter HTML or plain text T&C content…"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50 mb-3"
                aria-label="Terms and conditions content"
              />
              <Button variant="primary" size="md" loading={savingTerms} onClick={handleSaveTerms}>
                Save Terms &amp; Conditions
              </Button>
            </Card>

            {/* Cycle management */}
            <Card>
              <h2 className="font-heading font-bold text-primary mb-2">Cycle Management</h2>
              <p className="text-sm text-gray-500 mb-4">
                Starting a new cycle closes the current one and creates a fresh contribution period. This action cannot be undone.
              </p>
              <Button variant="danger" size="md" onClick={() => setCycleModal(true)}>
                Start New Cycle
              </Button>
            </Card>
          </div>
        )}

        {/* Confirm cycle modal */}
        <Modal isOpen={cycleModal} onClose={() => setCycleModal(false)} title="Start New Cycle?" size="sm">
          <p className="text-sm text-gray-500 mb-5">
            This will close the current cycle and start a new one. All members will begin a fresh contribution period.
            This action cannot be reversed.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" size="sm" onClick={() => setCycleModal(false)}>Cancel</Button>
            <Button variant="danger" size="sm" loading={startingCycle} onClick={handleStartCycle}>
              Yes, Start New Cycle
            </Button>
          </div>
        </Modal>
      </AppLayout>
    </PageTransition>
  );
}
