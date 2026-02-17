// src/app/api/tutor/sessions/route.ts

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is tutor
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userData?.role !== 'TUTOR' && userData?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get request data
    const { studentId, lessonId } = await request.json();

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID required' }, { status: 400 });
    }

    // Check if tutor has this student assigned
    const { data: assignment } = await supabase
      .from('tutor_students')
      .select('id')
      .eq('tutor_id', user.id)
      .eq('student_id', studentId)
      .eq('status', 'active')
      .single();

    if (!assignment) {
      return NextResponse.json({ error: 'Student not assigned to you' }, { status: 403 });
    }

    // Create live session
    const { data: session, error: sessionError } = await supabase
      .from('live_sessions')
      .insert({
        tutor_id: user.id,
        student_id: studentId,
        lesson_id: lessonId,
        status: 'waiting',
        current_page: 1,
        scroll_position: 0,
      })
      .select()
      .single();

    if (sessionError) {
      console.error('Session creation error:', sessionError);
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      message: 'Session created successfully',
    });

  } catch (error) {
    console.error('Session API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get tutor's sessions
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let query = supabase
      .from('live_sessions')
      .select(`
        *,
        student:users!student_id(id, name, email, avatar_url),
        lesson:lesson_drafts(id, content, original_file_name)
      `)
      .eq('tutor_id', user.id)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: sessions, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ sessions });

  } catch (error) {
    console.error('Get sessions error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}