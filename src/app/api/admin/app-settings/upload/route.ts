import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

async function verifyAdmin(supabase: any) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
  return profile?.role === 'ADMIN' ? user : null;
}

const BUCKET = 'assets'; // ← your bucket name

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await verifyAdmin(supabase);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string;

    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });
    if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 });

    const ext = file.name.split('.').pop() || 'png';
    const bytes = await file.arrayBuffer();
    const buffer = new Uint8Array(bytes);

    const pathMap: Record<string, string> = {
      logo:         `branding/logo.${ext}`,
      favicon:      `branding/favicon.${ext}`,
      pwa_icon_192: 'pwa/icon-192.png',
      pwa_icon_512: 'pwa/icon-512.png',
    };
    const filePath = pathMap[type] || `branding/${type}-${Date.now()}.${ext}`;

    // 1. Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, buffer, { contentType: file.type, upsert: true });

    if (uploadError) return NextResponse.json({ error: 'Upload failed: ' + uploadError.message }, { status: 500 });

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
    const storageUrl = urlData.publicUrl;

    // 2. For PWA icons — also write to public/icons/ so manifest path works
    let publicUrl = storageUrl;

    if (type === 'pwa_icon_192' || type === 'pwa_icon_512') {
      const localFile = type === 'pwa_icon_192' ? 'icon-192.png' : 'icon-512.png';
      const localPath = join(process.cwd(), 'public', 'icons', localFile);
      await mkdir(join(process.cwd(), 'public', 'icons'), { recursive: true });
      await writeFile(localPath, buffer);
      publicUrl = `/icons/${localFile}`;
    }

    // 3. Save URL to app_settings
    const keyMap: Record<string, string> = {
      logo:         'app_logo_url',
      favicon:      'app_favicon_url',
      pwa_icon_192: 'pwa_icon_192',
      pwa_icon_512: 'pwa_icon_512',
    };

    if (keyMap[type]) {
      await supabase.from('app_settings').upsert({
        key: keyMap[type],
        value: publicUrl,
        category: type.startsWith('pwa') ? 'pwa' : 'branding',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'key' });
    }

    return NextResponse.json({ url: publicUrl });
  } catch (err) {
    console.error('Upload error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
