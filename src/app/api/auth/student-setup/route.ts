// src/app/api/auth/student-setup/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendWelcomeOnce, notifyTutorNewStudent } from '@/lib/email/transactional';
import { logActivity } from '@/lib/analytics/activity';
import { assessSignup } from '@/lib/auth/signup-risk';
import { recordRisk } from '@/lib/auth/signup-guard';
import { verifyNewAccount } from '@/lib/auth/verify-new-account';
import { resolveJoinTarget } from '@/lib/auth/join-target';

// Use service role for this operation
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { userId, email, name, joinToken } = await request.json();

    console.log('🔍 Student Setup Request:', { userId, joinToken, email, name });

    if (!userId || !joinToken) {
      console.error('❌ Missing required fields:', { userId, hasToken: Boolean(joinToken) });
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // `userId` and `email` arrive in the request body, so without this check
    // anyone could attach an arbitrary account to a tutor and make us email
    // them — which would also route straight around the spam scoring below,
    // since that scores whatever name and email the body claims.
    const proof = await verifyNewAccount(userId, email);
    if (!proof.ok) {
      console.warn('🚫 Rejected student-setup:', { userId, reason: proof.reason });
      return NextResponse.json({ error: 'Unable to complete signup' }, { status: 403 });
    }

    // 1. Resolve WHICH tutor from the join token.
    //
    // This route used to take a `tutorId` straight from the request body and
    // only check that such a tutor existed — the `inviteCode` was read and
    // never verified. So any account could be attached to any tutor by id,
    // and the invite code was decorative. The token is now the only input,
    // and the tutor is derived from it server-side.
    const target = await resolveJoinTarget(joinToken);

    if (!target) {
      console.error('❌ No tutor for join token');
      return NextResponse.json({ error: 'Tutor not found' }, { status: 404 });
    }

    const tutorId = target.tutorId;
    const tutor = { id: target.tutorId, email: target.email, name: target.name, tutor_plan: target.tutorPlan };

    console.log('✅ Tutor found:', tutor.email);

    // Tutors can take on unlimited students — no per-tutor student cap.

    // 2. Update user record (don't upsert - just update existing auth user)
    console.log('📝 Updating student profile...');
    
    // Auto-assign: a student who signs up through a tutor's referral link is
    // attributed to that tutor immediately (no manual approval). This also drives
    // commission attribution. Brand-new signups are never bound elsewhere yet.
    const { error: updateError } = await supabase
      .from('users')
      .update({
        name,
        role: 'USER',
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateError) {
      console.error('❌ User update error:', updateError);

      // If update fails, try insert (new user)
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email,
          name,
          role: 'USER',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (insertError) {
        console.error('❌ User insert error:', insertError);
        return NextResponse.json({ 
          error: 'Failed to create student profile' 
        }, { status: 500 });
      }
    }

    console.log('✅ Student profile created/updated');

    // First-touch: tag the acquisition source as "tutor-invite" and set the
    // commission-earning tutor — both only if not already set, so the first
    // teacher wins. A student can connect to more teachers later without changing
    // either. The connection itself is the tutor_students row below.
    const { data: srcRow } = await supabase
      .from('users')
      .select('signup_source, referred_by_tutor_id')
      .eq('id', userId)
      .maybeSingle();
    const firstTouch: Record<string, unknown> = {};
    if (!srcRow?.signup_source) firstTouch.signup_source = 'tutor-invite';
    if (!srcRow?.referred_by_tutor_id) firstTouch.referred_by_tutor_id = tutorId;
    if (Object.keys(firstTouch).length > 0) {
      await supabase.from('users').update(firstTouch).eq('id', userId);
    }

    // Funnel: record the granular signup event (server-side so it's reliable even
    // if the client emitter never runs).
    await logActivity(userId, 'signup_completed', { metadata: { via: 'tutor-invite' } });

    // 3. Spam gate, then the tutor-student relationship.
    //
    // Score the name and email we were just given rather than re-reading the
    // row: this runs seconds after signup, and the payload is what the person
    // actually typed. A clean signup auto-connects exactly as before; a risky
    // one lands as 'pending' for the tutor to accept or decline; a blocked one
    // gets an account but never reaches a tutor.
    const risk = assessSignup({ email, name });
    if (risk.verdict !== 'allow') {
      console.warn('⚠️ Risky student signup:', { userId, score: risk.score, reasons: risk.reasons });
      await recordRisk(userId, risk);
    }
    if (risk.verdict === 'block') {
      // The account exists (Supabase already created it), but it gets no tutor
      // and sends no mail. Deliberately reported as success so a bot learns
      // nothing about which field tripped the check.
      return NextResponse.json({ success: true });
    }

    console.log('📝 Creating tutor-student relationship...');

    const { error: relationError } = await supabase
      .from('tutor_students')
      .upsert({
        tutor_id: tutorId,
        student_id: userId,
        status: risk.verdict === 'allow' ? 'active' : 'pending',
        assigned_at: new Date().toISOString(),
      }, {
        onConflict: 'tutor_id,student_id'
      });

    if (relationError) {
      console.error('⚠️ Relation error (may be okay):', relationError.message);
      // Don't fail if it's a duplicate - student is already assigned
    } else {
      console.log('✅ Tutor-student relationship created');
    }

    console.log('🎉 Student setup complete!');

    // Welcome the new student, and tell the tutor they have a request. A
    // flagged signup stays silent — it's visible in the tutor's Students tab,
    // but a suspected bot shouldn't be able to make us email a real tutor.
    await sendWelcomeOnce(userId);
    if (!relationError && risk.verdict === 'allow') await notifyTutorNewStudent(tutorId, name);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('💥 Student setup error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}