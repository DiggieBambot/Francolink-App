// src/components/commission/commission-dashboard.tsx
'use client';

import { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  CreditCard,
  ArrowUpRight,
  Download,
  AlertCircle,
  CheckCircle
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
        body: JSON.stringify({ amount })
      });

      const result = await response.json();

      if (response.ok) {
        setWithdrawAmount('');
        setWithdrawSuccess(`Withdrawal request for $${amount.toFixed(2)} submitted successfully!`);
        fetchCommissionData(); // Refresh data
      } else {
        setWithdrawError(result.error);
      }
    } catch (error) {
      setWithdrawError('Failed to process withdrawal request');
    } finally {
      setIsWithdrawing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Failed to load commission data</p>
      </div>
    );
  }

  const { summary, settings } = data;

  if (!settings.enabled) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 text-center">
        <AlertCircle className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-yellow-900 mb-2">
          Commission System Currently Disabled
        </h3>
        <p className="text-yellow-700">
          The commission system is currently disabled by the administrator.
          Please contact support for more information.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Commissions</h1>
        <p className="text-gray-500 mt-1">
          Earn {(settings.rate * 100).toFixed(0)}% lifetime commission on student subscriptions
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Total Earned</span>
            <DollarSign className="w-5 h-5 text-secondary-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(summary.total_earned)}
          </p>
          <p className="text-sm text-secondary-600 mt-1 flex items-center gap-1">
            <ArrowUpRight className="w-4 h-4" />
            {formatCurrency(summary.this_month)} this month
          </p>
        </div>

        <div className="bg-gradient-to-br from-primary to-primary-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-primary-100">Available Balance</span>
            <CreditCard className="w-5 h-5 text-primary-100" />
          </div>
          <p className="text-3xl font-bold">
            {formatCurrency(summary.available_balance)}
          </p>
          <p className="text-sm text-primary-100 mt-1">
            Ready to withdraw
          </p>
        </div>

        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Paying Students</span>
            <TrendingUp className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {summary.paying_students}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            of {summary.referred_students} referred
          </p>
        </div>

        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Commission Rate</span>
            <Users className="w-5 h-5 text-primary" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {(settings.rate * 100).toFixed(0)}%
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Lifetime recurring
          </p>
        </div>
      </div>

      {/* Withdrawal Section */}
      {summary.available_balance >= settings.minPayoutAmount && (
        <div className="bg-gradient-to-r from-secondary-50 to-emerald-50 border border-secondary-200 rounded-xl p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-secondary-100 rounded-xl">
              <Download className="w-6 h-6 text-secondary-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-secondary-900 mb-1">
                Request Withdrawal
              </h3>
              <p className="text-sm text-secondary-700 mb-4">
                You have {formatCurrency(summary.available_balance)} available for withdrawal.
                Minimum: {formatCurrency(settings.minPayoutAmount)}
              </p>
              
              <div className="flex gap-3">
                <div className="relative flex-1 max-w-xs">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="0.00"
                    min={settings.minPayoutAmount}
                    max={summary.available_balance}
                    step="0.01"
                    className="w-full pl-8 pr-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500"
                  />
                </div>
                <button
                  onClick={handleWithdraw}
                  disabled={isWithdrawing}
                  className="px-6 py-2 bg-secondary-600 text-white rounded-lg hover:bg-secondary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {isWithdrawing ? 'Processing...' : 'Request Withdrawal'}
                </button>
              </div>
              
              {withdrawError && (
                <div className="mt-3 flex items-center gap-2 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {withdrawError}
                </div>
              )}
              
              {withdrawSuccess && (
                <div className="mt-3 flex items-center gap-2 text-secondary-700 text-sm">
                  <CheckCircle className="w-4 h-4" />
                  {withdrawSuccess}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {summary.available_balance > 0 && summary.available_balance < settings.minPayoutAmount && (
        <div className="bg-primary-50 border border-primary-200 rounded-xl p-4 mb-8">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <h4 className="font-medium text-primary-900">Almost there!</h4>
              <p className="text-sm text-primary mt-1">
                You need {formatCurrency(settings.minPayoutAmount - summary.available_balance)} more 
                to reach the minimum withdrawal amount of {formatCurrency(settings.minPayoutAmount)}.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'history', label: 'Transaction History' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 -mb-px ${
              activeTab === tab.id
                ? 'text-primary border-primary'
                : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="bg-white rounded-xl border p-6">
          <h3 className="font-semibold text-gray-900 mb-4">How It Works</h3>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-primary-100 text-primary rounded-full flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Share Your Link</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Share your unique invite link with potential students
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-primary-100 text-primary rounded-full flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Students Sign Up</h4>
                <p className="text-sm text-gray-600 mt-1">
                  When they create an account, they're linked to you as their tutor
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-primary-100 text-primary rounded-full flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Earn Commissions</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Get {(settings.rate * 100).toFixed(0)}% of every subscription payment they make - forever!
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-secondary-100 text-secondary-600 rounded-full flex items-center justify-center font-bold">
                4
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Withdraw Earnings</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Request a withdrawal once you reach {formatCurrency(settings.minPayoutAmount)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="bg-white rounded-xl border overflow-hidden">
          {data.ledger.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="font-medium text-gray-900 mb-1">No transactions yet</h3>
              <p className="text-gray-500 text-sm">
                Your commission earnings will appear here
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rate</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Commission</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.ledger.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {formatDate(entry.created_at)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {entry.student?.name || entry.student?.email || 'Unknown'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {formatCurrency(entry.gross_amount)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {(entry.commission_rate * 100).toFixed(0)}%
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-secondary-600">
                      +{formatCurrency(entry.commission_amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}