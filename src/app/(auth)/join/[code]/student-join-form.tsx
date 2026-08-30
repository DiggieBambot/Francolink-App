// src/app/(auth)/join/[code]/student-join-form.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useTurnstile } from '@/components/auth/turnstile';

interface Props {
  /**
   * The token from the URL — an invite code we issued, or a public directory
   * slug. Deliberately opaque to this component: the server resolves it to a
   * tutor. We never send a tutor id, because a client-supplied id is something
   * the API would have to trust.
   */
  joinToken: string;
}

export function StudentJoinForm({ joinToken }: Props) {
  const router = useRouter();
  const supabase = createClient();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const captcha = useTurnstile();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (captcha.enabled && !captcha.token) {
      setError('Please complete the human check below.');
      setIsLoading(false);
      return;
    }

    try {
      // 1. Sign up user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          captchaToken: captcha.token ?? undefined,
          data: {
            full_name: formData.name,
            role: 'USER', // Students are regular users
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Signup failed');

      // 2. Link to tutor via API (secure service role operation)
      const response = await fetch('/api/auth/student-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: authData.user.id,
          email: formData.email,
          name: formData.name,
          joinToken,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Setup failed');
      }

      // 3. Redirect to dashboard
      router.push('/dashboard');

    } catch (err) {
      console.error('Join error:', err);
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-700 dark:text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Full Name
        </label>
        <input
          type="text"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-4 py-2 border border-input rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
          placeholder="Pierre Dupont"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Email Address
        </label>
        <input
          type="email"
          required
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="w-full px-4 py-2 border border-input rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
          placeholder="pierre@example.com"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Password
        </label>
        <input
          type="password"
          required
          minLength={8}
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          className="w-full px-4 py-2 border border-input rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
          placeholder="••••••••"
        />
      </div>

        {captcha.widget}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Creating Account...</span>
          </>
        ) : (
          'Create Account & Join Class'
        )}
      </button>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href={`/login?redirect=/api/auth/join-tutor?code=${encodeURIComponent(joinToken)}`} className="text-primary hover:underline">
          Log in here
        </Link>
      </p>
    </form>
  );
}