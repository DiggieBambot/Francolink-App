// src/app/api/auth/join-tutor/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

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

    if (student?.referred_by_tutor_id) {
      return NextResponse.json(
        { error: 'You already have a tutor assigned. Please contact support to change tutors.' },
        { status: 400 }
      );
    }

    // Update student to link to tutor
    const { error: updateError } = await supabaseService
      .from('users')
      .update({ 
        referred_by_tutor_id: tutor.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('❌ Error updating student:', updateError);
      return NextResponse.json(
        { error: 'Failed to join tutor' },
        { status: 500 }
      );
    }

    // Create tutor-student relationship (if table exists)
    await supabaseService
      .from('tutor_students')
      .upsert({
        tutor_id: tutor.id,
        student_id: user.id,
        status: 'active',
        assigned_at: new Date().toISOString()
      }, {
        onConflict: 'tutor_id,student_id'
      });

    console.log('✅ Student successfully joined tutor');

    return NextResponse.json({ 
      success: true,
      message: `Successfully joined ${tutor.name || 'your tutor'}'s class!`,
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