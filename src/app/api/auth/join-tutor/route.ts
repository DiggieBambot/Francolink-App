// src/app/api/auth/join-tutor/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { notifyTutorNewStudent } from '@/lib/email/transactional';
import { joinStatusFor } from '@/lib/auth/signup-guard';
import { resolveJoinTarget } from '@/lib/auth/join-target';

// Use service role client for database operations
const supabaseService = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST: Join a tutor with invite code (for existing logged-in students)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'You must be logged in to join a tutor' },
        { status: 401 }
      );
    }

    const { code } = await request.json();

    if (!code) {
      return NextResponse.json(
        { error: 'Invite code is required' },
        { status: 400 }
      );
    }

    // The token is an invite code we issued or a public directory slug;
    // resolveJoinTarget owns that decision so this route and the signup route
    // can never disagree about who a link points to.
    const tutor = await resolveJoinTarget(String(code));

    if (!tutor) {
      console.error('❌ Tutor not found for join token');
      return NextResponse.json(
        { error: 'Invalid invite code. Please check and try again.' },
        { status: 404 }
      );
    }

    console.log('✅ Found tutor:', tutor.email);

    // Check if student already has a tutor
    const { data: student, error: studentError } = await supabaseService
      .from('users')
      .select('referred_by_tutor_id')
      .eq('id', user.id)
      .single();

    if (studentError) {
      console.error('❌ Error fetching student:', studentError);
      return NextResponse.json(
        { error: 'Failed to fetch student data' },
        { status: 500 }
      );
    }

    // A student may have multiple teachers. Connections live in tutor_students;
    // if they're already connected to THIS tutor, just say so (idempotent).
    const { data: existingLink } = await supabaseService
      .from('tutor_students')
      .select('student_id')
      .eq('tutor_id', tutor.tutorId)
      .eq('student_id', user.id)
      .maybeSingle();
    if (existingLink) {
      return NextResponse.json(
        { error: `You're already connected with ${tutor.name || 'this tutor'}.` },
        { status: 400 }
      );
    }

    // Commission attribution is first-touch: the first teacher a student connects
    // to keeps it. Only set referred_by_tutor_id if it isn't set yet; adding more
    // teachers later never changes it.
    if (!student?.referred_by_tutor_id) {
      const { error: attrError } = await supabaseService
        .from('users')
        .update({ referred_by_tutor_id: tutor.tutorId, updated_at: new Date().toISOString() })
        .eq('id', user.id);
      if (attrError) {
        console.error('❌ Error attributing student to tutor:', attrError);
        return NextResponse.json({ error: 'Failed to join tutor' }, { status: 500 });
      }
    }

    // Spam gate. A clean account connects straight away, as before. Anything
    // that scores as risky lands as 'pending' — the tutor sees it under
    // Students and decides — and an outright block never reaches them at all.
    const gate = await joinStatusFor(user.id);
    if (gate.blocked) {
      console.warn('🚫 Blocked join from risky account:', user.id, gate.risk.reasons);
      return NextResponse.json(
        { error: "We couldn't complete this request. Please contact support@francolink.net." },
        { status: 403 }
      );
    }

    // The connection itself (this is what puts the student in the tutor's list).
    const { error: relError } = await supabaseService
      .from('tutor_students')
      .upsert({
        tutor_id: tutor.tutorId,
        student_id: user.id,
        status: gate.status,
        assigned_at: new Date().toISOString()
      }, {
        onConflict: 'tutor_id,student_id'
      });

    if (relError) {
      console.error('❌ Error creating relationship:', relError);
      return NextResponse.json(
        { error: 'Failed to join tutor' },
        { status: 500 }
      );
    }

    console.log('✅ Student auto-assigned to tutor');

    // Tell the tutor a student just joined. Risky accounts stay silent: the
    // request is visible in their Students tab, but a suspected bot shouldn't
    // be able to make our system email a real tutor on demand.
    const { data: meRow } = await supabaseService.from('users').select('name').eq('id', user.id).maybeSingle();
    if (gate.status === 'active') {
      await notifyTutorNewStudent(tutor.tutorId, meRow?.name);
    }

    return NextResponse.json({
      success: true,
      pending: gate.status === 'pending',
      message: gate.status === 'pending'
        ? `Your request was sent to ${tutor.name || 'your tutor'}. They'll confirm you shortly.`
        : `You're connected with ${tutor.name || 'your tutor'}.`,
      tutor: {
        id: tutor.tutorId,
        name: tutor.name,
        email: tutor.email
      }
    });

  } catch (error) {
    console.error('💥 Join tutor error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET: Handle redirect from join page for logged-in users
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Try to join the tutor
  const response = await POST(
    new NextRequest(request.url, {
      method: 'POST',
      body: JSON.stringify({ code })
    })
  );

  // Redirect to dashboard regardless of outcome
  return NextResponse.redirect(new URL('/dashboard', request.url));
}