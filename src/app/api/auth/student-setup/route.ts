// src/app/api/auth/student-setup/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendWelcomeOnce, notifyTutorNewStudent } from '@/lib/email/transactional';

// Use service role for this operation
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { userId, email, name, tutorId, inviteCode } = await request.json();

    console.log('🔍 Student Setup Request:', {
      userId,
      tutorId,
      inviteCode,
      email,
      name
    });

    if (!userId || !tutorId) {
      console.error('❌ Missing required fields:', { userId, tutorId });
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Verify tutor exists - Use maybeSingle() instead of single()
    console.log('🔍 Looking up tutor with ID:', tutorId);
    
    const { data: tutors, error: tutorError } = await supabase
      .from('users')
      .select('id, email, name, student_limit, tutor_plan')
      .eq('id', tutorId)
      .limit(1);

    console.log('🔍 Tutor lookup result:', {
      found: tutors?.length,
      error: tutorError?.message
    });

    if (tutorError) {
      console.error('❌ Tutor lookup error:', tutorError);
      return NextResponse.json({ 
        error: 'Database error looking up tutor' 
      }, { status: 500 });
    }

    const tutor = tutors?.[0];

    if (!tutor) {
      console.error('❌ Tutor not found with ID:', tutorId);
      return NextResponse.json({ error: 'Tutor not found' }, { status: 404 });
    }

    console.log('✅ Tutor found:', tutor.email);

    // Check student limit
    if (tutor.student_limit) {
      const { count } = await supabase
        .from('tutor_students')
        .select('*', { count: 'exact', head: true })
        .eq('tutor_id', tutorId)
        .eq('status', 'active');

      console.log('🔍 Current student count:', count, 'Limit:', tutor.student_limit);

      if ((count || 0) >= tutor.student_limit) {
        return NextResponse.json({ 
          error: 'Tutor has reached their student limit. Please contact them.' 
        }, { status: 403 });
      }
    }

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
        referred_by_tutor_id: tutorId,
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
          referred_by_tutor_id: tutorId,
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

    // 3. Create tutor-student relationship
    console.log('📝 Creating tutor-student relationship...');
    
    const { error: relationError } = await supabase
      .from('tutor_students')
      .upsert({
        tutor_id: tutorId,
        student_id: userId,
        status: 'active',
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

    // Welcome the new student, and tell the tutor they have a request.
    await sendWelcomeOnce(userId);
    if (!relationError) await notifyTutorNewStudent(tutorId, name);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('💥 Student setup error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}