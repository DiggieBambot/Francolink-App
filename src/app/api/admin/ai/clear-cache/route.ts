// src/app/api/admin/ai/clear-cache/route.ts

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { clearAIConfigCache } from '@/lib/ai/client';

export async function POST() {
  try {
    const supabase = await createClient();

    // Verify admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userData?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Clear the cache
    clearAIConfigCache();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Cache clear error:', error);
    return NextResponse.json({ error: 'Failed to clear cache' }, { status: 500 });
  }
}