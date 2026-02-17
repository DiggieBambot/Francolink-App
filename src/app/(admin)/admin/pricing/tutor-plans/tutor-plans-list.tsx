// src/app/(admin)/admin/pricing/tutor-plans/tutor-plans-list.tsx

'use client';

import { useState } from 'react';
import { Edit, Eye, EyeOff, Check, X, Infinity } from 'lucide-react';

interface TutorPlan {
  id: string;
  key: string;
  name: string;
  description: string;
  price_monthly: number;
  price_yearly: number | null;
  stripe_price_id_monthly: string | null;
  stripe_price_id_yearly: string | null;
  student_limit: number | null;
  session_limit: number | null;
  content_tier: string;
  features: any;
  is_active: boolean;
  sort_order: number;
}

interface TutorPlansListProps {
  initialPlans: TutorPlan[];
}

export function TutorPlansList({ initialPlans }: TutorPlansListProps) {
  const [plans, setPlans] = useState(initialPlans);
  const [editingPlan, setEditingPlan] = useState<TutorPlan | null>(null);

  const handleToggleActive = async (planId: string, currentActive: boolean) => {
    try {
      const response = await fetch('/api/admin/pricing/tutor-plans', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: planId,
          is_active: !currentActive,
        }),
      });

      if (response.ok) {
        setPlans(plans.map(p => 
          p.id === planId ? { ...p, is_active: !currentActive } : p
        ));
      }
    } catch (error) {
      console.error('Toggle active error:', error);
    }
  };

  return (
    <div className="space-y-4">
      {plans.map(plan => (
        <div
          key={plan.id}
          className="p-6 bg-card border border-border rounded-lg"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-xl font-semibold text-foreground">
                  {plan.name}
                </h3>
                {plan.is_active ? (
                  <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded-full">
                    Active
                  </span>
                ) : (
                  <span className="px-2 py-1 bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 text-xs rounded-full">
                    Inactive
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{plan.description}</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleToggleActive(plan.id, plan.is_active)}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
                title={plan.is_active ? 'Deactivate' : 'Activate'}
              >
                {plan.is_active ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={() => setEditingPlan(plan)}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
                title="Edit"
              >
                <Edit className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Price */}
            <div>
              <div className="text-xs text-muted-foreground mb-1">Monthly Price</div>
              <div className="text-2xl font-bold text-foreground">
                ${plan.price_monthly}
                <span className="text-sm font-normal text-muted-foreground">/mo</span>
              </div>
              {plan.price_yearly && (
                <div className="text-xs text-muted-foreground mt-1">
                  ${plan.price_yearly}/year
                </div>
              )}
            </div>

            {/* Student Limit */}
            <div>
              <div className="text-xs text-muted-foreground mb-1">Student Limit</div>
              <div className="text-2xl font-bold text-foreground flex items-center gap-2">
                {plan.student_limit || (
                  <>
                    <Infinity className="w-6 h-6" />
                    <span className="text-sm">Unlimited</span>
                  </>
                )}
              </div>
            </div>

            {/* Session Limit */}
            <div>
              <div className="text-xs text-muted-foreground mb-1">Monthly Sessions</div>
              <div className="text-2xl font-bold text-foreground flex items-center gap-2">
                {plan.session_limit || (
                  <>
                    <Infinity className="w-6 h-6" />
                    <span className="text-sm">Unlimited</span>
                  </>
                )}
              </div>
            </div>

            {/* Content Tier */}
            <div>
              <div className="text-xs text-muted-foreground mb-1">Content Access</div>
              <div className="text-lg font-semibold text-foreground capitalize">
                {plan.content_tier}
              </div>
              <div className="text-xs text-muted-foreground">
                {plan.content_tier === 'basic' && 'A1-B1'}
                {plan.content_tier === 'full' && 'A1-C1'}
                {plan.content_tier === 'premium' && 'All Levels'}
              </div>
            </div>
          </div>

          {/* Stripe IDs */}
          {(plan.stripe_price_id_monthly || plan.stripe_price_id_yearly) && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="text-xs text-muted-foreground mb-2">Stripe Configuration</div>
              <div className="grid gap-2 sm:grid-cols-2 text-xs">
                {plan.stripe_price_id_monthly && (
                  <div>
                    <span className="text-muted-foreground">Monthly Price ID: </span>
                    <code className="bg-muted px-2 py-1 rounded">
                      {plan.stripe_price_id_monthly}
                    </code>
                  </div>
                )}
                {plan.stripe_price_id_yearly && (
                  <div>
                    <span className="text-muted-foreground">Yearly Price ID: </span>
                    <code className="bg-muted px-2 py-1 rounded">
                      {plan.stripe_price_id_yearly}
                    </code>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Features */}
          {plan.features && Object.keys(plan.features).length > 0 && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="text-xs text-muted-foreground mb-2">Features</div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(plan.features).map(([key, value]) => (
                  <span
                    key={key}
                    className="px-2 py-1 bg-muted text-xs rounded-full flex items-center gap-1"
                  >
                    {value === true ? (
                      <Check className="w-3 h-3 text-green-600" />
                    ) : value === false ? (
                      <X className="w-3 h-3 text-red-600" />
                    ) : null}
                    <span className="capitalize">{key.replace(/_/g, ' ')}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}

      {plans.length === 0 && (
        <div className="text-center py-12 bg-card border border-border rounded-lg">
          <p className="text-muted-foreground">No tutor plans configured</p>
        </div>
      )}
    </div>
  );
}