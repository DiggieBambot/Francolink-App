'use client';

import { useState } from 'react';
import { useSettingsSave, SaveBar } from '../use-settings-save';
import { Eye, EyeOff, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface Props {
  getSetting: (key: string) => string;
  rawSettings: any[];
}

function ApiKeyField({ label, description, keyName, value, onChange, placeholder, badge }: {
  label: string; description: string; keyName: string; value: string;
  onChange: (v: string) => void; placeholder: string; badge?: string;
}) {
  const [revealed, setRevealed] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'ok' | 'fail' | null>(null);

  const testKey = async () => {
    setTesting(true); setTestResult(null);
    try {
      const res = await fetch('/api/admin/app-settings/test-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: keyName, value }),
      });
      setTestResult(res.ok ? 'ok' : 'fail');
    } catch { setTestResult('fail'); }
    finally { setTesting(false); }
  };

  const canTest = ['api_openai_key', 'api_stripe_secret_key', 'api_resend_key'].includes(keyName);

  return (
    <div className="border rounded-xl p-5">
      <div className="flex items-start justify-between mb-1">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-gray-800">{label}</h3>
            {badge && <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium">{badge}</span>}
          </div>
          <p className="text-xs text-gray-400 mt-0.5">{description}</p>
        </div>
        {value && testResult === 'ok' && <span className="flex items-center gap-1 text-xs text-green-600 font-medium"><CheckCircle2 className="w-3.5 h-3.5" /> Valid</span>}
        {value && testResult === 'fail' && <span className="flex items-center gap-1 text-xs text-red-500 font-medium"><AlertTriangle className="w-3.5 h-3.5" /> Invalid</span>}
      </div>
      <div className="flex gap-2 mt-3">
        <div className="relative flex-1">
          <input type={revealed ? 'text' : 'password'} value={value} onChange={(e) => onChange(e.target.value)}
            className="w-full border rounded-lg px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
            placeholder={placeholder} autoComplete="off" />
          {value && <button type="button" onClick={() => setRevealed(!revealed)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            {revealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>}
        </div>
        {canTest && value && <button onClick={testKey} disabled={testing}
          className="px-4 py-2.5 border rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50">
          {testing ? 'Testing...' : 'Test'}
        </button>}
      </div>
    </div>
  );
}

export function ApiKeysTab({ getSetting }: Props) {
  const [openaiKey, setOpenaiKey] = useState(getSetting('api_openai_key') || '');
  const [stripePublic, setStripePublic] = useState(getSetting('api_stripe_public_key') || '');
  const [stripeSecret, setStripeSecret] = useState(getSetting('api_stripe_secret_key') || '');
  const [stripeWebhook, setStripeWebhook] = useState(getSetting('api_stripe_webhook_secret') || '');
  const [supabaseUrl, setSupabaseUrl] = useState(getSetting('api_supabase_url') || '');
  const [supabaseAnon, setSupabaseAnon] = useState(getSetting('api_supabase_anon_key') || '');
  const [supabaseService, setSupabaseService] = useState(getSetting('api_supabase_service_key') || '');
  const [resendKey, setResendKey] = useState(getSetting('api_resend_key') || '');
  const [vapidPublic, setVapidPublic] = useState(getSetting('api_vapid_public') || '');
  const [vapidPrivate, setVapidPrivate] = useState(getSetting('api_vapid_private') || '');

  const { save, saving, saved, error } = useSettingsSave();

  const handleSave = () => save({
    api_openai_key: openaiKey, api_stripe_public_key: stripePublic,
    api_stripe_secret_key: stripeSecret, api_stripe_webhook_secret: stripeWebhook,
    api_supabase_url: supabaseUrl, api_supabase_anon_key: supabaseAnon,
    api_supabase_service_key: supabaseService, api_resend_key: resendKey,
    api_vapid_public: vapidPublic, api_vapid_private: vapidPrivate,
  });

  return (
    <div className="space-y-8">
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-amber-800">Security Notice</p>
          <p className="text-sm text-amber-700 mt-0.5">Keys are stored in your database. For production, prefer environment variables in <code className="bg-amber-100 px-1 rounded">.env.local</code>.</p>
        </div>
      </div>

      <section className="bg-white border rounded-xl p-6">
        <h2 className="text-base font-semibold text-gray-800 mb-4">🤖 OpenAI</h2>
        <ApiKeyField label="OpenAI API Key" description="Used for AI Tutor chat and lesson generation"
          keyName="api_openai_key" value={openaiKey} onChange={setOpenaiKey} placeholder="sk-proj-..." badge="AI Tutor" />
      </section>

      <section className="bg-white border rounded-xl p-6">
        <h2 className="text-base font-semibold text-gray-800 mb-4">💳 Stripe</h2>
        <div className="space-y-4">
          <ApiKeyField label="Publishable Key" description="Frontend key — safe to expose"
            keyName="api_stripe_public_key" value={stripePublic} onChange={setStripePublic} placeholder="pk_live_..." />
          <ApiKeyField label="Secret Key" description="Backend key — never expose publicly"
            keyName="api_stripe_secret_key" value={stripeSecret} onChange={setStripeSecret} placeholder="sk_live_..." />
          <ApiKeyField label="Webhook Secret" description="Used to verify Stripe webhook events"
            keyName="api_stripe_webhook_secret" value={stripeWebhook} onChange={setStripeWebhook} placeholder="whsec_..." />
        </div>
      </section>

      <section className="bg-white border rounded-xl p-6">
        <h2 className="text-base font-semibold text-gray-800 mb-4">🗄️ Supabase</h2>
        <div className="space-y-4">
          <ApiKeyField label="Project URL" description="Your Supabase project URL"
            keyName="api_supabase_url" value={supabaseUrl} onChange={setSupabaseUrl} placeholder="https://xxxxx.supabase.co" />
          <ApiKeyField label="Anon Key" description="Public anonymous key for client-side requests"
            keyName="api_supabase_anon_key" value={supabaseAnon} onChange={setSupabaseAnon} placeholder="eyJhbGci..." />
          <ApiKeyField label="Service Role Key" description="Admin key — server-side only, never expose"
            keyName="api_supabase_service_key" value={supabaseService} onChange={setSupabaseService} placeholder="eyJhbGci..." />
        </div>
      </section>

      <section className="bg-white border rounded-xl p-6">
        <h2 className="text-base font-semibold text-gray-800 mb-4">📧 Email & Push</h2>
        <div className="space-y-4">
          <ApiKeyField label="Resend API Key" description="Transactional emails (welcome, password reset)"
            keyName="api_resend_key" value={resendKey} onChange={setResendKey} placeholder="re_..." />
          <div className="grid grid-cols-2 gap-4">
            <ApiKeyField label="VAPID Public Key" description="Web push notification public key"
              keyName="api_vapid_public" value={vapidPublic} onChange={setVapidPublic} placeholder="BExxxxxxxxx..." />
            <ApiKeyField label="VAPID Private Key" description="Web push notification private key"
              keyName="api_vapid_private" value={vapidPrivate} onChange={setVapidPrivate} placeholder="xxxxxxxxx..." />
          </div>
        </div>
      </section>

      <SaveBar saving={saving} saved={saved} error={error} onSave={handleSave} label="Save API Keys" />
    </div>
  );
}
