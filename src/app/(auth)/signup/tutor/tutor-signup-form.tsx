// src/app/(auth)/signup/tutor/tutor-signup-form.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, AlertCircle, Check } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface Plan {
  key: string;
  name: string;
  price_monthly: number;
}

interface Props {
  selectedPlan: string;
  plans: Plan[];
}

export function TutorSignupForm({ selectedPlan, plans }: Props) {
  const router = useRouter();
  const supabase = createClient();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    plan: selectedPlan,
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // 1. Sign up user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            role: 'TUTOR', // Explicitly set role metadata
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Signup failed');

      // 2. Create user record with role & plan
      const response = await fetch('/api/auth/tutor-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: authData.user.id,
          email: formData.email,
          name: formData.fullName,
          plan: formData.plan,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Setup failed');
      }

      // 3. Handle Plan Logic
      const planDetails = plans.find(p => p.key === formData.plan);
      
      if (planDetails && planDetails.price_monthly > 0) {
        router.push(`/tutor/setup/payment?plan=${formData.plan}`);
      } else {
        router.push('/tutor');
      }

    } catch (err) {
      console.error('Signup error:', err);
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-8 shadow-lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-700 dark:text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            Full Name
          </label>
          <input
            type="text"
            required
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-secondary focus:border-transparent outline-none transition-all"
            placeholder="Marie Dubois"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            Email Address
          </label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-secondary focus:border-transparent outline-none transition-all"
            placeholder="marie@example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            Password
          </label>
          <input
            type="password"
            required
            minLength={8}
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-secondary focus:border-transparent outline-none transition-all"
            placeholder="••••••••"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
            Selected Plan
          </label>
          <div className="grid grid-cols-1 gap-3">
            {plans.map((plan) => (
              <div
                key={plan.key}
                onClick={() => setFormData({ ...formData, plan: plan.key })}
                className={`p-4 border rounded-lg cursor-pointer flex items-center justify-between transition-all ${
                  formData.plan === plan.key
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 ring-1 ring-secondary'
                    : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                }`}
              >
                <div>
                  <div className={`font-semibold ${
                    formData.plan === plan.key 
                      ? 'text-primary dark:text-primary-300' 
                      : 'text-zinc-900 dark:text-zinc-100'
                  }`}>
                    {plan.name}
                  </div>
                  <div className={`text-sm ${
                    formData.plan === plan.key 
                      ? 'text-primary dark:text-primary-400' 
                      : 'text-zinc-500 dark:text-zinc-400'
                  }`}>
                    {plan.price_monthly === 0 ? 'Free' : `$${plan.price_monthly}/month`}
                  </div>
                </div>
                {formData.plan === plan.key && (
                  <div className="bg-primary rounded-full p-1">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 bg-primary hover:bg-primary-800 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 shadow-sm"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Creating Account...</span>
            </>
          ) : (
            'Create Tutor Account'
          )}
        </button>

        <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
          Already have an account?{' '}
          <Link href="/login" className="text-primary dark:text-primary-400 hover:underline font-medium">
            Log in
          </Link>
        </p>
      </form>
    </div>
  );
}