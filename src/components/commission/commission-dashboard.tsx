// src/components/commission/commission-dashboard.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  Wallet,
  TrendingUp,
  Users,
  Percent,
  ArrowUpRight,
  Download,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Share2,
  UserPlus,
  Receipt,
} from 'lucide-react';

interface CommissionData {
  ledger: any[];
  summary: {
    total_earned: number;
    available_balance: number;
    referred_students: number;
    paying_students: number;
    this_month: number;
  };
  settings: {
    enabled: boolean;
    rate: number;
    minPayoutAmount: number;
  };
}

export function CommissionDashboard() {
  const [data, setData] = useState<CommissionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'history'>('overview');
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawError, setWithdrawError] = useState('');
  const [withdrawSuccess, setWithdrawSuccess] = useState('');

  useEffect(() => {
    fetchCommissionData();
  }, []);

  const fetchCommissionData = async () => {
    try {
      const response = await fetch('/api/commissions');
      const result = await response.json();

      if (response.ok) {
        setData(result);
      }
    } catch (error) {
      console.error('Error fetching commissions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);

    if (isNaN(amount) || amount <= 0) {
      setWithdrawError('Please enter a valid amount');
      return;
    }

    setIsWithdrawing(true);
    setWithdrawError('');
    setWithdrawSuccess('');

    try {
      const response = await fetch('/api/commissions/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });

      const result = await response.json();

      if (response.ok) {
        setWithdrawAmount('');
        setWithdrawSuccess(`Withdrawal request for $${amount.toFixed(2)} submitted successfully!`);
        fetchCommissionData();
      } else {
        setWithdrawError(result.error);
      }
    } catch (error) {
      setWithdrawError('Failed to process withdrawal request');
    } finally {
      setIsWithdrawing(false);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white py-16 text-center">
        <p className="text-gray-500">Couldn&apos;t load your earnings. Try refreshing the page.</p>
      </div>
    );
  }

  const { summary, settings } = data;

  if (!settings.enabled) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
        <AlertCircle className="mx-auto mb-4 h-12 w-12 text-amber-600" />
        <h3 className="mb-2 text-lg font-semibold text-amber-900">Commissions are paused</h3>
        <p className="text-amber-700">
          The commission program is currently disabled by the administrator. Contact support for details.
        </p>
      </div>
    );
  }

  const conversionRate = summary.referred_students > 0
    ? Math.round((summary.paying_students / summary.referred_students) * 100)
    : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-bold text-primary md:text-3xl">Earnings</h1>
        <p className="text-gray-500">
          Earn <span className="font-semibold text-secondary-600">{(settings.rate * 100).toFixed(0)}%</span> lifetime commission on every student subscription you refer.
        </p>
      </div>

      {/* Hero balance card */}
      <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-primary-600 p-6 text-white shadow-lg sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-primary-100">
              <Wallet className="h-4 w-4" />
              Available balance
            </div>
            <p className="mt-2 font-heading text-4xl font-bold tracking-tight sm:text-5xl">
              {formatCurrency(summary.available_balance)}
            </p>
            <p className="mt-2 text-sm text-primary-100">
              {formatCurrency(summary.total_earned)} earned all-time &middot; {formatCurrency(summary.this_month)} this month
            </p>
          </div>
          {summary.available_balance >= settings.minPayoutAmount ? (
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Ready to withdraw
            </span>
          ) : (
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-primary-100 backdrop-blur-sm">
              {formatCurrency(Math.max(0, settings.minPayoutAmount - summary.available_balance))} more to unlock withdrawal
            </span>
          )}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={<TrendingUp className="h-4.5 w-4.5" />}
          label="This month"
          value={formatCurrency(summary.this_month)}
          accent="text-secondary-600"
          iconWrap="bg-secondary-50 text-secondary-600"
        />
        <StatCard
          icon={<Users className="h-4.5 w-4.5" />}
          label="Referred students"
          value={String(summary.referred_students)}
          sub={`${summary.paying_students} paying`}
          iconWrap="bg-primary-50 text-primary"
        />
        <StatCard
          icon={<Percent className="h-4.5 w-4.5" />}
          label="Conversion rate"
          value={`${conversionRate}%`}
          sub="referred → paying"
          iconWrap="bg-purple-50 text-purple-600"
        />
        <StatCard
          icon={<Sparkles className="h-4.5 w-4.5" />}
          label="Commission rate"
          value={`${(settings.rate * 100).toFixed(0)}%`}
          sub="lifetime, recurring"
          iconWrap="bg-emerald-50 text-emerald-600"
        />
      </div>

      {/* Withdrawal */}
      {summary.available_balance >= settings.minPayoutAmount ? (
        <div className="rounded-2xl border border-secondary-100 bg-secondary-50/60 p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-white p-3 text-secondary-600 shadow-sm">
              <Download className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">Request a withdrawal</h3>
              <p className="mt-1 text-sm text-gray-600">
                {formatCurrency(summary.available_balance)} available &middot; minimum {formatCurrency(settings.minPayoutAmount)}
              </p>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <div className="relative max-w-xs flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-medium text-gray-400">$</span>
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="0.00"
                    min={settings.minPayoutAmount}
                    max={summary.available_balance}
                    step="0.01"
                    className="w-full rounded-xl border border-gray-200 py-2.5 pl-7 pr-4 focus:border-secondary-400 focus:outline-none focus:ring-2 focus:ring-secondary-200"
                  />
                </div>
                <button
                  onClick={handleWithdraw}
                  disabled={isWithdrawing}
                  className="rounded-xl bg-secondary-600 px-6 py-2.5 font-semibold text-white transition-colors hover:bg-secondary-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isWithdrawing ? 'Processing…' : 'Request withdrawal'}
                </button>
              </div>

              {withdrawError && (
                <div className="mt-3 flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {withdrawError}
                </div>
              )}
              {withdrawSuccess && (
                <div className="mt-3 flex items-center gap-2 text-sm text-secondary-700">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  {withdrawSuccess}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : summary.available_balance > 0 ? (
        <div className="rounded-2xl border border-primary-100 bg-primary-50/60 p-5">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 shrink-0 text-primary" />
            <p className="text-sm text-primary-900">
              <span className="font-semibold">Almost there —</span>{' '}
              {formatCurrency(settings.minPayoutAmount - summary.available_balance)} more unlocks your first withdrawal.
            </p>
          </div>
        </div>
      ) : null}

      {/* Tabs */}
      <div className="flex gap-6 border-b border-gray-100">
        {[
          { id: 'overview' as const, label: 'How it works' },
          { id: 'history' as const, label: 'Transaction history' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`-mb-px border-b-2 px-1 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'border-secondary-500 text-primary'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="grid gap-4 sm:grid-cols-2">
          <StepCard
            step={1}
            icon={<Share2 className="h-5 w-5" />}
            title="Share your link"
            body="Send your unique invite link to potential students."
          />
          <StepCard
            step={2}
            icon={<UserPlus className="h-5 w-5" />}
            title="Students sign up"
            body="When they create an account through your link, they're linked to you as their tutor."
          />
          <StepCard
            step={3}
            icon={<Sparkles className="h-5 w-5" />}
            title="Earn commissions"
            body={`Get ${(settings.rate * 100).toFixed(0)}% of every subscription payment they make — for as long as they stay subscribed.`}
          />
          <StepCard
            step={4}
            icon={<Download className="h-5 w-5" />}
            title="Withdraw earnings"
            body={`Request a payout any time you're above ${formatCurrency(settings.minPayoutAmount)}.`}
            accent
          />
        </div>
      )}

      {activeTab === 'history' && (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
          {data.ledger.length === 0 ? (
            <div className="py-16 text-center">
              <Receipt className="mx-auto mb-4 h-12 w-12 text-gray-200" />
              <h3 className="mb-1 font-medium text-gray-900">No transactions yet</h3>
              <p className="text-sm text-gray-500">Your commission earnings will show up here as students subscribe.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50/80">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Student</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Payment</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Rate</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Commission</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.ledger.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50/60">
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">{formatDate(entry.created_at)}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {entry.student?.name || entry.student?.email || 'Unknown'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{formatCurrency(entry.gross_amount)}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{(entry.commission_rate * 100).toFixed(0)}%</td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-secondary-600">
                        +{formatCurrency(entry.commission_amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
  accent,
  iconWrap,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  accent?: string;
  iconWrap: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5">
      <div className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl ${iconWrap}`}>{icon}</div>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</p>
      <p className={`mt-1 text-xl font-bold text-gray-900 ${accent || ''}`}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

function StepCard({
  step,
  icon,
  title,
  body,
  accent,
}: {
  step: number;
  icon: React.ReactNode;
  title: string;
  body: string;
  accent?: boolean;
}) {
  return (
    <div className="flex gap-4 rounded-2xl border border-gray-100 bg-white p-5">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold ${
          accent ? 'bg-secondary-50 text-secondary-600' : 'bg-primary-50 text-primary'
        }`}
      >
        {icon}
      </div>
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-300">STEP {step}</span>
        </div>
        <h4 className="font-semibold text-gray-900">{title}</h4>
        <p className="mt-1 text-sm text-gray-500">{body}</p>
      </div>
    </div>
  );
}
