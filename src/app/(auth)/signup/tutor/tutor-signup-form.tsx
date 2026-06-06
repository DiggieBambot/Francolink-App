// src/app/(auth)/signup/tutor/tutor-signup-form.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, AlertCircle, Check, GraduationCap, ArrowLeft, User, Mail, Lock } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Card, Input, Button } from '@/components/ui';
import { GoogleButton } from '@/components/auth/google-button';

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
    <Card className="w-full max-w-md">
      <div className="mb-7 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary-100 text-secondary-700">
          <GraduationCap className="h-6 w-6" />
        </div>
        <h1 className="font-heading text-2xl font-bold text-primary">Sign up as a Tutor</h1>
        <p className="mt-1 text-gray-600">Teach, bring your students, and earn commission</p>
      </div>

      <GoogleButton label="Sign up with Google" />

      <div className="my-6 flex items-center">
        <div className="flex-1 border-t border-gray-200" />
        <span className="px-4 text-sm text-gray-500">or</span>
        <div className="flex-1 border-t border-gray-200" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-error-light p-3 text-sm text-error">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="relative">
          <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <Input type="text" required value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} className="pl-10" placeholder="Your name" />
        </div>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <Input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="pl-10" placeholder="Email address" />
        </div>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <Input type="password" required minLength={8} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="pl-10" placeholder="Password (min. 8 characters)" />
        </div>

        {plans.length > 0 ? (
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Choose your plan</label>
            <div className="grid grid-cols-1 gap-2.5">
              {plans.map((plan) => {
                const active = formData.plan === plan.key;
                return (
                  <button
                    type="button"
                    key={plan.key}
                    onClick={() => setFormData({ ...formData, plan: plan.key })}
                    className={`flex items-center justify-between rounded-xl border-2 p-4 text-left transition-all ${
                      active ? "border-secondary bg-secondary-50" : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <div>
                      <div className={`font-heading font-bold ${active ? "text-secondary-700" : "text-primary"}`}>{plan.name}</div>
                      <div className={`text-sm ${active ? "text-secondary-700" : "text-gray-500"}`}>
                        {plan.price_monthly === 0 ? "Free" : `$${plan.price_monthly}/month`}
                      </div>
                    </div>
                    {active && (
                      <span className="rounded-full bg-secondary p-1">
                        <Check className="h-3 w-3 text-white" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating account...</>) : "Create tutor account"}
        </Button>

        <p className="text-center text-xs text-gray-500">
          By signing up, you agree to our{" "}
          <Link href="/terms" className="text-secondary hover:underline">Terms</Link> and{" "}
          <Link href="/privacy" className="text-secondary hover:underline">Privacy Policy</Link>
        </p>
      </form>

      <p className="mt-6 text-center text-gray-600">
        Already have an account?{" "}
        <Link href="/login/tutor" className="font-semibold text-secondary hover:underline">Log in</Link>
      </p>
      <p className="mt-3 text-center">
        <Link href="/signup" className="inline-flex items-center gap-1 text-xs font-medium text-gray-400 hover:text-gray-600">
          <ArrowLeft className="h-3 w-3" /> Want to learn instead? Sign up as a student
        </Link>
      </p>
    </Card>
  );
}