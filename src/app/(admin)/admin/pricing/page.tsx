// src/app/(admin)/admin/pricing/page.tsx

import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { DollarSign, Users, Percent, Settings } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Pricing Management | Admin',
  description: 'Manage tutor plans and commission settings',
};

export default async function PricingPage() {
  const supabase = await createClient();

  // Fetch tutor plans
  const { data: tutorPlans } = await supabase
    .from('tutor_plans')
    .select('*')
    .order('sort_order');

  // Fetch commission settings
  const { data: commissionSettings } = await supabase
    .from('commission_settings')
    .select('*')
    .limit(1)
    .single();

  // Count tutors per plan
  const { data: tutorCounts } = await supabase
    .from('users')
    .select('tutor_plan')
    .eq('role', 'TUTOR');

  const planDistribution = tutorCounts?.reduce((acc, user) => {
    const plan = user.tutor_plan || 'FREE';
    acc[plan] = (acc[plan] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Pricing Management</h1>
        <p className="text-muted-foreground mt-1">
          Configure tutor subscription plans and commission rates
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="p-4 bg-card border border-border rounded-lg">
          <div className="flex items-center gap-3">
            <DollarSign className="w-5 h-5 text-green-600" />
            <div>
              <div className="text-2xl font-bold text-foreground">
                {tutorPlans?.filter(p => p.is_active).length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Active Plans</div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-card border border-border rounded-lg">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-blue-600" />
            <div>
              <div className="text-2xl font-bold text-foreground">
                {tutorCounts?.length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Total Tutors</div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-card border border-border rounded-lg">
          <div className="flex items-center gap-3">
            <Percent className="w-5 h-5 text-purple-600" />
            <div>
              <div className="text-2xl font-bold text-foreground">
                {commissionSettings?.commission_rate || 0}%
              </div>
              <div className="text-sm text-muted-foreground">Commission Rate</div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-card border border-border rounded-lg">
          <div className="flex items-center gap-3">
            <DollarSign className="w-5 h-5 text-yellow-600" />
            <div>
              <div className="text-2xl font-bold text-foreground">
                ${commissionSettings?.minimum_payout || 0}
              </div>
              <div className="text-sm text-muted-foreground">Min Payout</div>
            </div>
          </div>
        </div>
      </div>
{/* --- NEW CARD: Dynamic Pricing --- */}
<Link
  href="/admin/pricing/dynamic"
  className="p-6 bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 rounded-lg hover:shadow-md transition-all relative overflow-hidden"
>
  <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg">
    NEW
  </div>
  
  <div className="flex items-start justify-between mb-4">
    <div className="p-3 bg-indigo-100 rounded-lg">
      <DollarSign className="w-6 h-6 text-indigo-600" />
    </div>
  </div>
  
  <h2 className="text-xl font-semibold text-foreground mb-2">
    Dynamic Pricing & Sales
  </h2>
  <p className="text-sm text-muted-foreground mb-4">
    Manage global sales, promo codes, and marketing banners.
  </p>

  <div className="space-y-2">
    <div className="flex items-center gap-2 text-sm text-indigo-700 font-medium">
      <span>✨ Activate Holiday Sales</span>
    </div>
    <div className="flex items-center gap-2 text-sm text-indigo-700 font-medium">
      <span>🏷️ Manage Coupons</span>
    </div>
  </div>
</Link>

      {/* Navigation Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Tutor Plans Card */}
        <Link
          href="/admin/pricing/tutor-plans"
          className="p-6 bg-card border border-border rounded-lg hover:border-foreground/20 hover:shadow-md transition-all"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-sm text-muted-foreground">
              {tutorPlans?.length || 0} plans
            </span>
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Tutor Subscription Plans
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Configure pricing tiers, student limits, and features for tutors
          </p>

          {/* Plan breakdown */}
          {tutorPlans && tutorPlans.length > 0 && (
            <div className="space-y-2">
              {tutorPlans.map(plan => (
                <div key={plan.id} className="flex items-center justify-between text-sm">
                  <span className="text-foreground font-medium">{plan.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">
                      {planDistribution?.[plan.key] || 0} tutors
                    </span>
                    <span className="text-foreground font-semibold">
                      ${plan.price_monthly}/mo
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Link>

        {/* Commission Settings Card */}
        <Link
          href="/admin/pricing/commission"
          className="p-6 bg-card border border-border rounded-lg hover:border-foreground/20 hover:shadow-md transition-all"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Percent className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <span className={`text-sm px-2 py-1 rounded-full ${
              commissionSettings?.is_active
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
            }`}>
              {commissionSettings?.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Commission Settings
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Configure referral commission rates and payout rules
          </p>

          {commissionSettings && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Commission Rate</span>
                <span className="text-foreground font-semibold">
                  {commissionSettings.commission_rate}%
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Minimum Payout</span>
                <span className="text-foreground font-semibold">
                  ${commissionSettings.minimum_payout}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Payout Frequency</span>
                <span className="text-foreground font-semibold capitalize">
                  {commissionSettings.payout_frequency}
                </span>
              </div>
            </div>
          )}
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="p-4 bg-muted rounded-lg">
        <h3 className="font-semibold text-foreground mb-3">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/pricing/tutor-plans/new"
            className="px-4 py-2 bg-foreground text-background rounded-lg text-sm hover:bg-foreground/90 transition-colors"
          >
            + Add Tutor Plan
          </Link>
          <Link
            href="/admin/commissions"
            className="px-4 py-2 border border-border bg-background rounded-lg text-sm hover:bg-muted transition-colors"
          >
            View Commissions
          </Link>
          <Link
            href="/admin/tutors"
            className="px-4 py-2 border border-border bg-background rounded-lg text-sm hover:bg-muted transition-colors"
          >
            View All Tutors
          </Link>
        </div>
      </div>
    </div>
  );
}