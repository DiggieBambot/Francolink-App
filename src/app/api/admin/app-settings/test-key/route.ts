import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

    const { key, value } = await request.json();
    if (!key || !value) return NextResponse.json({ error: 'Key and value required' }, { status: 400 });

    let valid = false;
    let message = '';

    if (key === 'api_openai_key') {
      const res = await fetch('https://api.openai.com/v1/models', { headers: { Authorization: `Bearer ${value}` } });
      valid = res.status === 200;
      message = valid ? 'OpenAI key is valid' : 'OpenAI key is invalid';
    } else if (key === 'api_stripe_secret_key') {
      const res = await fetch('https://api.stripe.com/v1/balance', { headers: { Authorization: `Bearer ${value}` } });
      valid = res.status === 200;
      message = valid ? 'Stripe key is valid' : 'Stripe key is invalid';
    } else if (key === 'api_resend_key') {
      const res = await fetch('https://api.resend.com/domains', { headers: { Authorization: `Bearer ${value}` } });
      valid = res.status === 200;
      message = valid ? 'Resend key is valid' : 'Resend key is invalid';
    } else {
      return NextResponse.json({ error: 'No test available for this key' }, { status: 400 });
    }

    return NextResponse.json({ valid, message });
  } catch {
    return NextResponse.json({ error: 'Test failed' }, { status: 500 });
  }
}
