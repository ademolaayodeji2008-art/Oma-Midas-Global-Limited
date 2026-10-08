/**
 * LoanRequest.jsx — Loan request form with eligibility check, calculator, and repayment plan.
 */

import React, { useEffect, useState } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import LoanCalculator from '../../components/forms/LoanCalculator';
import RepaymentPlanBuilder from '../../components/forms/RepaymentPlanBuilder';
import PageTransition from '../../components/layout/PageTransition';
import api from '../../lib/api';
import { useToast } from '../../components/ui/Toast';
import { useNavigate } from 'react-router-dom';
import { useCycle } from '../../hooks/useCycle';

export default function LoanRequest() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { cycle } = useCycle();

  const [eligibility, setEligibility] = useState(null);
  const [eligLoading, setEligLoading] = useState(true);
  const [loanData, setLoanData] = useState(null);
  const [schedule, setSchedule] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get('/api/loans/eligibility')
      .then((res) => setEligibility(res.data))
      .catch(() => setEligibility({ eligible: false, reasons: ['Could not check eligibility.'] }))
      .finally(() => setEligLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!loanData?.amountKobo || loanData.amountKobo <= 0) {
      toast({ message: 'Enter a loan amount first.', type: 'warning' });
      return;
    }
    if (!schedule || schedule.length === 0) {
      toast({ message: 'Please complete your repayment plan.', type: 'warning' });
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/api/loans', {
        amountKobo: loanData.amountKobo,
        repaymentSchedule: schedule,
      });
      toast({ message: 'Loan request submitted successfully!', type: 'success' });
      navigate('/member/loan-repayment');
    } catch (err) {
      toast({ message: err.response?.data?.message || 'Loan request failed.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageTransition>
      <AppLayout title="Loan Request">
        <div className="space-y-6 max-w-2xl">
          {/* Eligibility banner */}
          <Card>
            {eligLoading ? (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <span className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full" />
                Checking eligibility…
              </div>
            ) : eligibility?.eligible ? (
              <div className="flex items-start gap-3">
                <span className="text-2xl" aria-hidden="true">✅</span>
                <div>
                  <p className="font-semibold text-success">You are eligible for a loan!</p>
                  {eligibility.maxAmountKobo && (
                    <p className="text-sm text-gray-500 mt-1">
                      Maximum loan: <strong>₦{(eligibility.maxAmountKobo / 100).toLocaleString()}</strong>
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-2xl" aria-hidden="true">⚠️</span>
                  <p className="font-semibold text-warning">You are not eligible for a loan at this time.</p>
                </div>
                {eligibility?.reasons?.length > 0 && (
                  <ul className="list-disc list-inside text-sm text-gray-500 space-y-1">
                    {eligibility.reasons.map((r, i) => <li key={i}>{r}</li>)}
                  </ul>
                )}
              </div>
            )}
          </Card>

          {eligibility?.eligible && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Calculator */}
              <LoanCalculator
                onChange={(data) => setLoanData(data)}
                feePercentage={30}
              />

              {/* Repayment plan */}
              {loanData?.amountKobo > 0 && (
                <Card>
                  <h3 className="font-heading font-bold text-primary mb-4">Repayment Plan</h3>
                  <RepaymentPlanBuilder
                    totalRepayableKobo={loanData.totalRepayableKobo}
                    cycleEndDate={cycle?.endDate}
                    onChange={setSchedule}
                  />
                </Card>
              )}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={submitting}
                disabled={!schedule}
                className="w-full"
              >
                Submit Loan Request
              </Button>
            </form>
          )}
        </div>
      </AppLayout>
    </PageTransition>
  );
}
