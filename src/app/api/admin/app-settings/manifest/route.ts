import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';

async function verifyAdmin(supabase: any) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
  return profile?.role === 'ADMIN' ? user : null;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await verifyAdmin(supabase);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();

    const manifest = {
      name: body.name || 'FrancoLink - Language Learning',
      short_name: body.short_name || 'FrancoLink',
      description: body.description || 'Learn languages with AI-powered lessons',
      start_url: body.start_url || '/dashboard',
      display: body.display || 'standalone',
      background_color: body.background_color || '#ffffff',
      theme_color: body.theme_color || '#1e3a5f',
      orientation: body.orientation || 'portrait-primary',
      scope: '/',
      icons: [
        { src: body.icon_192 || '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
        { src: body.icon_512 || '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
      ],
      screenshots: [],
      categories: ['education', 'language'],
      lang: 'en',
      dir: 'ltr',
    };

    await writeFile(join(process.cwd(), 'public', 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf-8');
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to regenerate manifest' }, { status: 500 });
  }
}
