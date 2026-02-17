// src/app/api/admin/config/branding/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Verify admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const config = await request.json();

    // Update each setting
    const updates = Object.entries(config).map(([key, value]) => ({
      key,
      value: String(value),
      updated_at: new Date().toISOString()
    }));

    for (const update of updates) {
      await supabase
        .from('app_settings')
        .update({ value: update.value, updated_at: update.updated_at })
        .eq('key', update.key);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving branding:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}