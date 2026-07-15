// src/app/api/auth/tutor-setup/route.ts

import { createClient as createServiceRoleClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { sendWelcomeOnce } from '@/lib/email/transactional';

export async function POST(request: NextRequest) {
  try {
    // Use the service-role client so the tutor role is written reliably even
    // when email confirmation is on and the user has no session yet at this
    // point (cookie-auth would be blocked by RLS and silently leave role=null,
    // which is what made new tutors land on the student dashboard).
    const supabase = createServiceRoleClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );

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

    // Fetch plan limits (tutor_plans may be empty — fall back to defaults).
    const { data: planDetails } = await supabase
      .from('tutor_plans')
      .select('student_limit')
      .eq('key', plan)
      .maybeSingle();

    // Create/Update user record. We upsert because Supabase Auth may have
    // already created a basic record.
    // NB: the users table has no `monthly_session_limit` column.
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
        commission_balance: 0,
        created_at: new Date().toISOString(),
      });

    if (updateError) {
      console.error('User update error:', updateError);
      throw new Error('Failed to create tutor profile: ' + updateError.message);
    }

    await sendWelcomeOnce(userId);

    return NextResponse.json({ success: true, inviteCode });

  } catch (error) {
    console.error('Tutor setup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}