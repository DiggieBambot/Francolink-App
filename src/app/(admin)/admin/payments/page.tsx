// src/app/(admin)/admin/payments/page.tsx

import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import {
  CreditCard,
  DollarSign,
  TrendingUp,
  Users,
  Crown,
  Sparkles,
  Calendar,
  ExternalLink,
  AlertCircle,
} from "lucide-react";

export default async function AdminPaymentsPage() {
  const supabase = await createClient();

  // Get subscription stats
  const { data: users } = await supabase
    .from("users")
    .select("subscription_plan, subscription_period, is_founding_member, subscription_started_at, stripe_customer_id");

  const stats = {
    totalPaid: 0,
    premium: 0,
    premiumPlus: 0,
    monthly: 0,
    yearly: 0,
    foundingMembers: 0,
    mrr: 0,
  };

  const recentSubscribers: any[] = [];

  users?.forEach((user) => {
    if (user.subscription_plan === "PREMIUM") {
      stats.premium++;
      stats.totalPaid++;
      if (user.subscription_period === "monthly") {
        stats.monthly++;
        stats.mrr += 7.99;
      } else if (user.subscription_period === "yearly") {
        stats.yearly++;
        stats.mrr += 79.99 / 12;
      }
    } else if (user.subscription_plan === "PREMIUM_PLUS") {
      stats.premiumPlus++;
      stats.totalPaid++;
      if (user.subscription_period === "monthly") {
        stats.monthly++;
        stats.mrr += 14.99;
      } else if (user.subscription_period === "yearly") {
        stats.yearly++;
        stats.mrr += 149.99 / 12;
      }
    }
    if (user.is_founding_member) {
      stats.foundingMembers++;
    }
  });

  // Get recent subscribers
  const { data: recentSubs } = await supabase
    .from("users")
    .select("id, email, name, subscription_plan, subscription_period, subscription_started_at, is_founding_member, stripe_customer_id")
    .neq("subscription_plan", "FREE")
    .order("subscription_started_at", { ascending: false })
    .limit(10);

  const formatDate = (date: string | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
        <p className="text-gray-500 mt-1">
          Monitor subscriptions and revenue
        </p>
      </div>

      {/* Stripe Connection Status */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-amber-800">Stripe Integration</h3>
            <p className="text-sm text-amber-700 mt-1">
              Configure Stripe API keys in{" "}
              <Link href="/admin/settings" className="underline font-medium">
                Settings
              </Link>{" "}
              to enable payments. Then enable the "Stripe Enabled" feature flag.
            </p>
            <a
              href="https://dashboard.stripe.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-amber-800 font-medium mt-2 hover:underline"
            >
              Open Stripe Dashboard
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-xl">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Monthly Recurring</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(stats.mrr)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-100 rounded-xl">
              <Users className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Paid Users</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalPaid}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-xl">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Conversion Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {users && users.length > 0
                  ? `${Math.round((stats.totalPaid / users.length) * 100)}%`
                  : "0%"}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-100 rounded-xl">
              <Crown className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Founding Members</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.foundingMembers}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Plan Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* By Plan */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Subscribers by Plan
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Crown className="w-5 h-5 text-indigo-600" />
                </div>
                <span className="font-medium text-gray-900">Premium</span>
              </div>
              <div className="text-right">
                <span className="text-xl font-bold text-gray-900">
                  {stats.premium}
                </span>
                <span className="text-gray-500 ml-2">users</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                </div>
                <span className="font-medium text-gray-900">Premium+</span>
              </div>
              <div className="text-right">
                <span className="text-xl font-bold text-gray-900">
                  {stats.premiumPlus}
                </span>
                <span className="text-gray-500 ml-2">users</span>
              </div>
            </div>
          </div>
        </div>

        {/* By Billing Period */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Billing Period
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <span className="font-medium text-gray-900">Monthly</span>
              </div>
              <div className="text-right">
                <span className="text-xl font-bold text-gray-900">
                  {stats.monthly}
                </span>
                <span className="text-gray-500 ml-2">subscriptions</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Calendar className="w-5 h-5 text-green-600" />
                </div>
                <span className="font-medium text-gray-900">Yearly</span>
              </div>
              <div className="text-right">
                <span className="text-xl font-bold text-gray-900">
                  {stats.yearly}
                </span>
                <span className="text-gray-500 ml-2">subscriptions</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Subscribers */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            Recent Subscribers
          </h2>
        </div>

        {recentSubs && recentSubs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-900">
                    User
                  </th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-900">
                    Plan
                  </th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-900">
                    Period
                  </th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-900">
                    Started
                  </th>
                  <th className="text-right px-6 py-3 text-sm font-semibold text-gray-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentSubs.map((sub) => (
                  <tr key={sub.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">
                          {sub.name || "No name"}
                        </p>
                        <p className="text-sm text-gray-500">{sub.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {sub.subscription_plan === "PREMIUM_PLUS" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                          <Sparkles className="w-3 h-3" />
                          Premium+
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                          <Crown className="w-3 h-3" />
                          Premium
                        </span>
                      )}
                      {sub.is_founding_member && (
                        <span className="ml-2 text-xs text-amber-600 font-medium">
                          🏆 Founder
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-900 capitalize">
                        {sub.subscription_period || "N/A"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-500">
                        {formatDate(sub.subscription_started_at)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/users/${sub.id}`}
                          className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                        >
                          View
                        </Link>
                        {sub.stripe_customer_id && (
                          <a
                            href={`https://dashboard.stripe.com/customers/${sub.stripe_customer_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-12 text-center">
            <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No subscribers yet</p>
            <p className="text-sm text-gray-400 mt-1">
              Subscribers will appear here once you start accepting payments
            </p>
          </div>
        )}
      </div>
    </div>
  );
}