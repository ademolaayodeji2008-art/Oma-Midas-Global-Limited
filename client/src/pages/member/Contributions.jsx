/**
 * Contributions.jsx — Member contributions page.
 * Manual bank-transfer flow: form → bank details → confirm → pending.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { Clock, Copy, Check, ArrowLeft, Flame } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import PageTransition from '../../components/layout/PageTransition';
import api from '../../lib/api';
import { useToast } from '../../components/ui/Toast';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function statusVariant(status) {
  switch (status) {
    case 'PAID': return 'success';
    case 'PENDING_CONFIRMATION': return 'warning';
    case 'PENDING': return 'neutral';
    default: return 'neutral';
  }
}

function statusLabel(status) {
  switch (status) {
    case 'PAID': return 'Paid';
    case 'PENDING_CONFIRMATION': return 'Awaiting Confirmation';
    case 'PENDING': return 'Unpaid';
    default: return status;
  }
}

// VIEW 1 — List of contributions
function ContributionList({ contributions, loading, onMakePayment, currentMonth, currentYear }) {
  const streak = contributions.filter((c) => c.status === 'PAID').length;

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Group contributions by month for display
  const thisMonthContributions = contributions.filter(
    (c) => c.month === currentMonth && c.year === currentYear
  );
  const otherContributions = contributions.filter(
    (c) => !(c.month === currentMonth && c.year === currentYear)
  );

  const thisMonthPaid = thisMonthContributions.filter((c) => c.status === 'PAID').length;
  const thisMonthPending = thisMonthContributions.filter((c) => c.status === 'PENDING_CONFIRMATION').length;
  const thisMonthTotal = thisMonthContributions
    .filter((c) => c.status === 'PAID')
    .reduce((sum, c) => sum + c.amountKobo, 0);

  return (
    <div className="space-y-6">
      {/* Streak card */}
      <Card className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
          <Flame size={22} className="text-orange-500" aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm text-gray-400">Payment Streak</p>
          <p className="font-heading text-2xl font-bold text-primary">
            {streak} month{streak !== 1 ? 's' : ''} paid
          </p>
        </div>
      </Card>

      {/* Current Month Summary & Make Payment Button */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-heading font-bold text-primary">
              {MONTHS[currentMonth - 1]} {currentYear}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {thisMonthPaid} paid • {thisMonthPending} pending
              {thisMonthTotal > 0 && ` • Total: ₦${(thisMonthTotal / 100).toLocaleString()}`}
            </p>
          </div>
          <Button 
            variant="primary" 
            onClick={() => onMakePayment({ month: currentMonth, year: currentYear })}
          >
            + Make Contribution
          </Button>
        </div>

        {thisMonthContributions.length > 0 && (
          <div className="space-y-2 mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              This Month&apos;s Contributions
            </p>
            {thisMonthContributions.map((c) => (
              <div
                key={c.id}
                className={[
                  'rounded-lg border p-3 flex items-center justify-between',
                  c.status === 'PAID' ? 'border-emerald-200 bg-emerald-50' :
                  c.status === 'PENDING_CONFIRMATION' ? 'border-amber-200 bg-amber-50' :
                  'border-gray-200 bg-white',
                ].join(' ')}
              >
                <div>
                  <Badge variant={statusVariant(c.status)}>{statusLabel(c.status)}</Badge>
                  {c.status === 'PAID' && c.amountKobo && (
                    <p className="text-sm font-semibold text-gray-700 mt-1">
                      ₦{(c.amountKobo / 100).toLocaleString()}
                    </p>
                  )}
                  {c.submittedAt && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(c.submittedAt).toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })}
                    </p>
                  )}
                </div>
                {c.rejectionReason && (
                  <p className="text-xs text-red-600 leading-tight max-w-xs">
                    Rejected: {c.rejectionReason}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Previous Months */}
      {otherContributions.length > 0 && (
        <Card>
          <h2 className="font-heading font-bold text-primary mb-4">Previous Months</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {otherContributions.map((c) => (
              <div
                key={c.id}
                className={[
                  'rounded-xl border p-3 flex flex-col gap-2',
                  c.status === 'PAID' ? 'border-emerald-200 bg-emerald-50' :
                  c.status === 'PENDING_CONFIRMATION' ? 'border-amber-200 bg-amber-50' :
                  'border-gray-200 bg-white',
                ].join(' ')}
              >
                <p className="text-xs font-semibold text-gray-600">
                  {MONTHS[c.month - 1]} {c.year}
                </p>
                <Badge variant={statusVariant(c.status)}>{statusLabel(c.status)}</Badge>
                {c.status === 'PAID' && c.amountKobo && (
                  <p className="text-xs text-gray-500">₦{(c.amountKobo / 100).toLocaleString()}</p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

// VIEW 2 — Payment form
function PaymentForm({ monthlyAmountKobo, currentMonth, currentYear, onProceed, onBack }) {
  const [amountNaira, setAmountNaira] = useState(
    monthlyAmountKobo ? String(monthlyAmountKobo / 100) : ''
  );
  const [note, setNote] = useState('');

  const handleProceed = () => {
    const parsed = parseFloat(amountNaira);
    if (!parsed || parsed <= 0) return;
    onProceed({ amountKobo: Math.round(parsed * 100), paymentNote: note.trim() || null });
  };

  const minNaira = monthlyAmountKobo ? monthlyAmountKobo / 100 : 0;

  return (
    <Card className="max-w-md mx-auto">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-gray-500 hover:text-primary mb-4 transition-colors">
        <ArrowLeft size={15} /> Back
      </button>
      <h2 className="font-heading text-xl font-bold text-primary mb-1">Make Monthly Contribution</h2>
      <p className="text-sm text-gray-500 mb-5">
        {MONTHS[currentMonth - 1]} {currentYear}
      </p>

      <div className="space-y-4">
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-charcoal mb-1">
            Amount (₦) <span className="text-gray-400 font-normal">— min. ₦{minNaira.toLocaleString()}</span>
          </label>
          <input
            id="amount"
            type="number"
            min={minNaira}
            step="0.01"
            value={amountNaira}
            onChange={(e) => setAmountNaira(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder={`e.g. ${minNaira}`}
          />
        </div>

        <div>
          <label htmlFor="note" className="block text-sm font-medium text-charcoal mb-1">
            Payment reference or note <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            id="note"
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            placeholder="e.g. Transfer from GTB, ref: ABC123"
          />
        </div>

        <Button
          variant="primary"
          size="md"
          className="w-full"
          disabled={!amountNaira || parseFloat(amountNaira) < minNaira}
          onClick={handleProceed}
        >
          Proceed
        </Button>
      </div>
    </Card>
  );
}

// VIEW 3 — Bank details + confirm
function BankDetails({ bankDetails, amountKobo, onConfirm, onBack, submitting }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(bankDetails.accountNumber || '').then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <Card className="max-w-md mx-auto">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-gray-500 hover:text-primary mb-4 transition-colors">
        <ArrowLeft size={15} /> Back
      </button>
      <h2 className="font-heading text-xl font-bold text-primary mb-4">Complete Your Payment</h2>

      {/* Bank details card */}
      <div className="rounded-xl border border-[#C9A86A]/40 bg-[#FBF7EF] p-4 mb-4 space-y-3">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">Bank Name</p>
          <p className="font-semibold text-charcoal">{bankDetails.bankName || '—'}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Account Number</p>
          <div className="flex items-center gap-2">
            <p className="font-mono text-xl font-bold text-primary tracking-widest">
              {bankDetails.accountNumber || '—'}
            </p>
            <button
              onClick={handleCopy}
              aria-label="Copy account number"
              className="p-1.5 rounded-lg hover:bg-[#C9A86A]/20 transition-colors"
            >
              {copied ? (
                <Check size={16} className="text-emerald-500" />
              ) : (
                <Copy size={16} className="text-gray-500" />
              )}
            </button>
            {copied && <span className="text-xs text-emerald-600">Copied!</span>}
          </div>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">Account Name</p>
          <p className="font-semibold text-charcoal">{bankDetails.accountName || '—'}</p>
        </div>
      </div>

      {/* Amount */}
      <div className="text-center mb-4">
        <p className="text-sm text-gray-500">Amount to transfer</p>
        <p className="font-heading text-3xl font-bold text-primary">
          ₦{(amountKobo / 100).toLocaleString('en-NG')}
        </p>
      </div>

      <p className="text-sm text-gray-500 text-center mb-5">
        Transfer exactly <strong>₦{(amountKobo / 100).toLocaleString('en-NG')}</strong> to the account above.
        Once done, click the button below.
      </p>

      <Button
        variant="primary"
        size="md"
        className="w-full bg-[#C9A86A] hover:bg-[#b8935a] text-[#1E1433] font-bold"
        loading={submitting}
        onClick={onConfirm}
      >
        I Have Made This Payment
      </Button>
    </Card>
  );
}

// VIEW 4 — Pending confirmation
function PendingConfirmation({ onBack }) {
  return (
    <Card className="max-w-md mx-auto text-center py-8">
      <div className="flex justify-center mb-4">
        <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
          <Clock size={32} className="text-amber-500" />
        </div>
      </div>
      <h2 className="font-heading text-xl font-bold text-primary mb-2">Payment Submitted</h2>
      <p className="text-sm text-gray-500 mb-6 leading-relaxed">
        Your payment has been submitted and is awaiting confirmation from the admin.
        You will be notified once it is confirmed.
      </p>
      <button
        onClick={onBack}
        className="text-sm text-primary hover:underline font-medium"
      >
        ← Back to Contributions
      </button>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function Contributions() {
  const { toast } = useToast();

  // Data
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [monthlyAmountKobo, setMonthlyAmountKobo] = useState(500000);
  const [bankDetails, setBankDetails] = useState({ bankName: '', accountNumber: '', accountName: '' });

  // State machine: 'list' | 'form' | 'bank' | 'pending'
  const [view, setView] = useState('list');
  const [selectedContribution, setSelectedContribution] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState(null);
  const [paymentNote, setPaymentNote] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Current month/year
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const fetchData = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.get('/api/contributions'),
      api.get('/api/contributions/monthly-amount'),
    ])
      .then(([contribRes, amtRes]) => {
        setContributions(contribRes.data.contributions || []);
        setMonthlyAmountKobo(amtRes.data.amountKobo || 500000);
      })
      .catch(() => toast({ message: 'Failed to load contributions', type: 'error' }))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Fetch bank details once on mount
  useEffect(() => {
    api.get('/api/contributions/bank-details')
      .then((res) => setBankDetails(res.data))
      .catch(() => {});
  }, []);

  const handleMakePayment = (contribution) => {
    setSelectedContribution(contribution);
    setView('form');
  };

  const handleFormProceed = ({ amountKobo, paymentNote: note }) => {
    setPaymentAmount(amountKobo);
    setPaymentNote(note);
    setView('bank');
  };

  const handleConfirmPayment = async () => {
    setSubmitting(true);
    try {
      await api.post('/api/contributions/submit-payment', {
        amountKobo: paymentAmount,
        month: selectedContribution?.month || currentMonth,
        year: selectedContribution?.year || currentYear,
        paymentNote,
      });
      setView('pending');
    } catch (err) {
      toast({ message: err.response?.data?.error || err.response?.data?.message || 'Failed to submit payment', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleBackToList = () => {
    setView('list');
    setSelectedContribution(null);
    setPaymentAmount(null);
    setPaymentNote(null);
    fetchData();
  };

  return (
    <PageTransition>
      <AppLayout title="Contributions">
        <div className="space-y-6">
          {view === 'list' && (
            <ContributionList
              contributions={contributions}
              loading={loading}
              onMakePayment={handleMakePayment}
              currentMonth={currentMonth}
              currentYear={currentYear}
            />
          )}
          {view === 'form' && (
            <PaymentForm
              monthlyAmountKobo={monthlyAmountKobo}
              currentMonth={currentMonth}
              currentYear={currentYear}
              onProceed={handleFormProceed}
              onBack={() => setView('list')}
            />
          )}
          {view === 'bank' && (
            <BankDetails
              bankDetails={bankDetails}
              amountKobo={paymentAmount}
              onConfirm={handleConfirmPayment}
              onBack={() => setView('form')}
              submitting={submitting}
            />
          )}
          {view === 'pending' && (
            <PendingConfirmation onBack={handleBackToList} />
          )}
        </div>
      </AppLayout>
    </PageTransition>
  );
}
