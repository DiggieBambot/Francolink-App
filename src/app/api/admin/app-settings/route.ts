import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

async function verifyAdmin(supabase: any) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
  return profile?.role === 'ADMIN' ? user : null;
}

export async function GET() {
  try {
    const supabase = await createClient();
    const user = await verifyAdmin(supabase);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { data: settings, error } = await supabase.from('app_settings').select('*').order('category');
    if (error) throw error;
    return NextResponse.json({ settings });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await verifyAdmin(supabase);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { settings } = body as { settings: Record<string, string> };

    const getCategoryFromKey = (key: string): string => {
      if (key.includes('::')) return key.split('::')[0];
      if (key.startsWith('app_')) return 'branding';
      if (key.startsWith('theme_')) return 'theme';
      if (key.startsWith('pwa_')) return 'pwa';
      if (key.startsWith('api_')) return 'api_keys';
      if (key.startsWith('pricing_')) return 'pricing';
      return 'general';
    };

    const upserts = Object.entries(settings).map(([rawKey, value]) => {
      const hasCategory = rawKey.includes('::');
      const category = getCategoryFromKey(rawKey);
      const key = hasCategory ? rawKey.split('::')[1] : rawKey;
      return { key, value: String(value), category, updated_at: new Date().toISOString() };
    });

    const { error } = await supabase.from('app_settings')
      .upsert(upserts, { onConflict: 'category,key' });
    if (error) return NextResponse.json({ error: 'Failed to save' }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
