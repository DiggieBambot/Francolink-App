// src/app/api/auth/tutor-setup/route.ts

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // We use the service role key to bypass RLS for initial setup if needed
    // But since we're using createClient() which uses cookie auth, 
    // we rely on the fact that the user is authenticated from the signup step
    
    const { userId, email, name, plan } = await request.json();

    if (!userId || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Generate a unique invite code in app code (no DB function dependency).
    let inviteCode = '';
    for (let attempt = 0; attempt < 10; attempt++) {
      const candidate = Math.random().toString(36).slice(2, 10).toUpperCase(); // 8 chars
      const { data: clash } = await supabase
        .from('users')
        .select('id')
        .eq('tutor_invite_code', candidate)
        .maybeSingle();
      if (!clash) {
        inviteCode = candidate;
        break;
      }
    }
    if (!inviteCode) {
      throw new Error('Failed to generate a unique invite code');
    }

    // Fetch plan limits
    const { data: planDetails } = await supabase
      .from('tutor_plans')
      .select('student_limit, session_limit')
      .eq('key', plan)
      .single();

    // Create/Update user record
    // We update because Supabase Auth might have already created a basic record
    const { error: updateError } = await supabase
      .from('users')
      .upsert({
        id: userId,
        email,
        name,
        role: 'TUTOR',
        tutor_plan: plan,
        tutor_invite_code: inviteCode,
        student_limit: planDetails?.student_limit || 5,
        monthly_session_limit: planDetails?.session_limit || 10,
        created_at: new Date().toISOString(),
      });

    if (updateError) {
      console.error('User update error:', updateError);
      throw new Error('Failed to create tutor profile');
    }

    return NextResponse.json({ success: true, inviteCode });

  } catch (error) {
    console.error('Tutor setup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}