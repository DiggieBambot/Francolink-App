// src/app/api/lessons/complete/route.ts

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

    // Get lesson ID from request
    const { lessonId } = await request.json();

    if (!lessonId) {
      return NextResponse.json({ error: 'Lesson ID required' }, { status: 400 });
    }

    // Get lesson details
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select('id, xp_reward')
      .eq('id', lessonId)
      .single();

    if (lessonError || !lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }

    // Check if already completed
    const { data: existingProgress } = await supabase
      .from('user_progress')
      .select('id')
      .eq('user_id', user.id)
      .eq('lesson_id', lessonId)
      .single();

    if (existingProgress) {
      return NextResponse.json({ 
        success: true, 
        message: 'Already completed',
        xpAwarded: 0 
      });
    }

    // Record progress
    const { error: progressError } = await supabase
      .from('user_progress')
      .insert({
        user_id: user.id,
        lesson_id: lessonId,
        completed_at: new Date().toISOString(),
        xp_earned: lesson.xp_reward,
      });

    if (progressError) {
      console.error('Progress error:', progressError);
      // Continue anyway to award XP
    }

    // Update user XP
    const { error: xpError } = await supabase.rpc('increment_user_xp', {
      p_user_id: user.id,
      p_xp_amount: lesson.xp_reward,
    });

    if (xpError) {
      console.error('XP error:', xpError);
      // Try manual update
      const { data: userData } = await supabase
        .from('users')
        .select('total_xp')
        .eq('id', user.id)
        .single();

      if (userData) {
        await supabase
          .from('users')
          .update({ 
            total_xp: (userData.total_xp || 0) + lesson.xp_reward,
            last_activity_date: new Date().toISOString().split('T')[0],
          })
          .eq('id', user.id);
      }
    }

    // Update streak
    await supabase.rpc('update_user_streak', {
      p_user_id: user.id,
    });

    // Increment lessons_today counter
    const today = new Date().toISOString().split('T')[0];
    const { data: currentUser } = await supabase
      .from('users')
      .select('lessons_today, lessons_reset_date')
      .eq('id', user.id)
      .single();

    if (currentUser) {
      const lessonsToday = currentUser.lessons_reset_date === today 
        ? (currentUser.lessons_today || 0) + 1 
        : 1;

      await supabase
        .from('users')
        .update({
          lessons_today: lessonsToday,
          lessons_reset_date: today,
        })
        .eq('id', user.id);
    }

    return NextResponse.json({
      success: true,
      xpAwarded: lesson.xp_reward,
      message: `Congratulations! You earned ${lesson.xp_reward} XP!`,
    });

  } catch (error) {
    console.error('Complete lesson error:', error);
    return NextResponse.json(
      { error: 'Failed to complete lesson' },
      { status: 500 }
    );
  }
}