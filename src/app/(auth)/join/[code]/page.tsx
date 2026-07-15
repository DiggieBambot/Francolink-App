// src/app/(auth)/join/[code]/page.tsx

import { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { StudentJoinForm } from './student-join-form';
import { Check, Star, User, AlertCircle } from 'lucide-react';

interface PageProps {
  params: Promise<{ code: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  return {
    title: 'Join Class | FrancoLink',
    description: 'Join your tutor on FrancoLink',
  };
}

export default async function JoinPage({ params }: PageProps) {
  const { code } = await params;

  // Verify service key exists
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY');
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center p-8 text-red-500">
          Configuration Error: Service Key Missing
        </div>
      </div>
    );
  }

  // Use Service Role Client to fetch tutor (Bypasses RLS)
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Try to find tutor
  const { data: tutor, error } = await adminClient
    .from('users')
    .select('id, name, avatar_url, tutor_plan, email')
    .eq('tutor_invite_code', code)
    .maybeSingle();  // Use maybeSingle to avoid error when not found

  if (error) {
    console.error('[join] tutor lookup failed:', error.message);
  }

  // If no tutor found, show error page
  if (!tutor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md w-full p-8 bg-card border border-border rounded-xl shadow-lg text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Invalid Invite Link</h1>
          <p className="text-muted-foreground mb-6">
            We couldn't find a tutor with this invite code. The link may be incorrect or expired.
          </p>
          <p className="text-sm text-muted-foreground bg-muted p-2 rounded mb-6 font-mono">
            Code: {code}
          </p>
          <a href="/" className="px-6 py-2 bg-foreground text-background rounded-lg font-medium hover:opacity-90 transition-opacity inline-block">
            Go Home
          </a>
        </div>
      </div>
    );
  }

  // Check if user is already logged in
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (user) {
    // If logged in, redirect to assignment API
    redirect(`/api/auth/join-tutor?code=${code}`);
  }

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Left Side - Tutor Info */}
      <div className="w-full md:w-1/2 bg-primary p-12 text-white flex flex-col justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-primary-700/20 pattern-grid-lg opacity-20"></div>
        <div className="max-w-md mx-auto relative z-10">
          <div className="mb-10">
            <div className="w-24 h-24 rounded-full bg-white/20 border-4 border-white/30 flex items-center justify-center text-4xl font-bold mb-6 overflow-hidden shadow-xl">
              {tutor.avatar_url ? (
                <img src={tutor.avatar_url} alt={tutor.name} className="w-full h-full object-cover" />
              ) : (
                <span>{tutor.name?.[0]?.toUpperCase() || 'T'}</span>
              )}
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
              Join {tutor.name || 'Your Tutor'}'s <br/>French Class
            </h1>
            <p className="text-primary-100 text-lg leading-relaxed">
              Start your journey to fluency with personalized lessons, live sessions, and interactive tools.
            </p>
          </div>

          <div className="space-y-5">
            <div className="flex items-center gap-4 bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/10">
              <div className="p-2 bg-white text-primary rounded-lg shadow-sm">
                <Check className="w-5 h-5" />
              </div>
              <span className="font-medium">Access assigned lessons & homework</span>
            </div>
            <div className="flex items-center gap-4 bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/10">
              <div className="p-2 bg-white text-primary rounded-lg shadow-sm">
                <Star className="w-5 h-5" />
              </div>
              <span className="font-medium">Join live whiteboard sessions</span>
            </div>
            <div className="flex items-center gap-4 bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/10">
              <div className="p-2 bg-white text-primary rounded-lg shadow-sm">
                <User className="w-5 h-5" />
              </div>
              <span className="font-medium">Track your progress automatically</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Signup Form */}
      <div className="w-full md:w-1/2 p-8 md:p-12 flex items-center justify-center bg-background">
        <div className="w-full max-w-md space-y-8">
          <div>
            <h2 className="text-3xl font-bold text-foreground">Create Student Account</h2>
            <p className="text-muted-foreground mt-2">
              Sign up to join {tutor.name || 'your tutor'}'s class. It's free for students.
            </p>
          </div>
          
          <StudentJoinForm tutorId={tutor.id} inviteCode={code} />
        </div>
      </div>
    </div>
  );
}