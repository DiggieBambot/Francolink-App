// src/app/api/auth/join-tutor/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { notifyTutorNewStudent } from '@/lib/email/transactional';

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

    // Clean up the code
    const cleanCode = code.trim().toLowerCase();

    console.log('🔍 Looking for tutor with code:', cleanCode);

    // Find tutor by invite code
    const { data: tutor, error: tutorError } = await supabaseService
      .from('users')
      .select('id, name, email, tutor_plan')
      .eq('tutor_invite_code', cleanCode)
      .single();

    if (tutorError || !tutor) {
      console.error('❌ Tutor not found:', tutorError);
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

    // Already connected to THIS tutor
    if (student?.referred_by_tutor_id === tutor.id) {
      return NextResponse.json(
        { error: `You're already connected with ${tutor.name || 'this tutor'}.` },
        { status: 400 }
      );
    }

    // Connected to a DIFFERENT tutor
    if (student?.referred_by_tutor_id) {
      return NextResponse.json(
        { error: 'You already have a tutor assigned. Please contact support to change tutors.' },
        { status: 400 }
      );
    }

    // Create a PENDING join request. We do NOT set referred_by_tutor_id yet —
    // that happens when the tutor accepts. The relationship row marks the request;
    // "pending" = row exists but the student's referred_by_tutor_id is not this tutor.
    const { error: relError } = await supabaseService
      .from('tutor_students')
      .upsert({
        tutor_id: tutor.id,
        student_id: user.id,
        status: 'active',
        assigned_at: new Date().toISOString()
      }, {
        onConflict: 'tutor_id,student_id'
      });

    if (relError) {
      console.error('❌ Error creating join request:', relError);
      return NextResponse.json(
        { error: 'Failed to send join request' },
        { status: 500 }
      );
    }

    console.log('✅ Join request created (pending tutor approval)');

    // Tell the tutor a student wants to join.
    const { data: meRow } = await supabaseService.from('users').select('name').eq('id', user.id).maybeSingle();
    await notifyTutorNewStudent(tutor.id, meRow?.name);

    return NextResponse.json({
      success: true,
      pending: true,
      message: `Request sent to ${tutor.name || 'your tutor'}. You'll be connected once they accept.`,
      tutor: {
        id: tutor.id,
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