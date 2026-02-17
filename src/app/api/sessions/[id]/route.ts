import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

// GET: Fetch a single session
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } // Changed to Promise
) {
  try {
    const { id } = await params; // Await the id here
    const supabase = createServerClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: session, error } = await supabase
      .from('tutor_sessions')
      .select(`
        *,
        lessons (id, title, pdf_url),
        session_participants (
          student_id,
          joined_at,
          user_profiles:student_id (full_name, avatar_url)
        )
      `)
      .eq('id', id) // Use the awaited id
      .single();

    if (error) throw error;
    return NextResponse.json({ session });
  } catch (error) {
    console.error('Error fetching session:', error);
    return NextResponse.json({ error: 'Failed to fetch session' }, { status: 500 });
  }
}

// PATCH: Update a session
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } // Changed to Promise
) {
  try {
    const { id } = await params; // Await the id here
    const supabase = createServerClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { status, current_page, title, lesson_id } = body;

    const updates: Record<string, any> = {};
    if (status) {
      updates.status = status;
      if (status === 'active') updates.started_at = new Date().toISOString();
      if (status === 'completed') updates.ended_at = new Date().toISOString();
    }
    if (current_page !== undefined) updates.current_page = current_page;
    if (title) updates.title = title;
    if (lesson_id !== undefined) updates.lesson_id = lesson_id;

    const { data: session, error } = await supabase
      .from('tutor_sessions')
      .update(updates)
      .eq('id', id) // Use the awaited id
      .eq('tutor_id', user.id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ session });
  } catch (error) {
    console.error('Error updating session:', error);
    return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
  }
}

// DELETE: Delete a session
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } // Changed to Promise
) {
  try {
    const { id } = await params; // Await the id here
    const supabase = createServerClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { error } = await supabase
      .from('tutor_sessions')
      .delete()
      .eq('id', id) // Use the awaited id
      .eq('tutor_id', user.id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting session:', error);
    return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 });
  }
}