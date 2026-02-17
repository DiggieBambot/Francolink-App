// src/app/api/sessions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

// GET: Fetch all sessions for the current tutor
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let query = supabase
      .from('tutor_sessions')
      .select(`
        *,
        lessons (
          id,
          title,
          pdf_url
        )
      `)
      .eq('tutor_id', user.id)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ sessions: data });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}

// POST: Create a new session
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, lesson_id, scheduled_at, student_ids } = body;

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    // Create the session
    const { data: session, error: sessionError } = await supabase
      .from('tutor_sessions')
      .insert({
        tutor_id: user.id,
        title,
        lesson_id: lesson_id || null,
        scheduled_at: scheduled_at || null,
        status: 'scheduled'
      })
      .select()
      .single();

    if (sessionError) throw sessionError;

    // Add participants if provided
    if (student_ids && student_ids.length > 0) {
      const participants = student_ids.map((student_id: string) => ({
        session_id: session.id,
        student_id
      }));

      const { error: participantError } = await supabase
        .from('session_participants')
        .insert(participants);

      if (participantError) {
        console.error('Error adding participants:', participantError);
      }
    }

    return NextResponse.json({ session }, { status: 201 });
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}