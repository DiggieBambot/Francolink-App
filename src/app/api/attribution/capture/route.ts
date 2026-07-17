// POST /api/attribution/capture — persist the first-touch attribution cookie
// onto the signed-in user's row, once (only if their source isn't set yet).

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

// Bucket raw utm/referrer into a coarse acquisition channel.
function classify(a: { utm_source?: string; utm_medium?: string; referrer_host?: string }): string {
  const src = (a.utm_source || "").toLowerCase();
  const med = (a.utm_medium || "").toLowerCase();
  const ref = (a.referrer_host || "").toLowerCase();

  if (med.includes("cpc") || med.includes("paid") || med.includes("ppc") || src.includes("ads")) return "paid";
  if (/facebook|instagram|tiktok|twitter|x\.com|t\.co|linkedin|youtube|reddit|pinterest/.test(src + " " + ref) || med.includes("social")) return "social";
  if (med.includes("referral") || (ref && !/google|bing|duckduckgo|yahoo/.test(ref))) return "referral";
  if (/google|bing|duckduckgo|yahoo/.test(ref) || med.includes("organic")) return "organic";
  if (!ref && !src) return "direct";
  return "other";
}

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ skipped: true, reason: "no-user" });

  const svc = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  // Only capture once — first signup source wins.
  const { data: me } = await svc.from("users").select("signup_source").eq("id", user.id).maybeSingle();
  if (me?.signup_source) return NextResponse.json({ skipped: true, reason: "already-set" });

  const raw = (await cookies()).get("fl_attrib")?.value;
  let a: Record<string, string> = {};
  if (raw) { try { a = JSON.parse(decodeURIComponent(raw)); } catch {} }

  await svc
    .from("users")
    .update({
      signup_source: classify(a),
      utm_source: a.utm_source || null,
      utm_medium: a.utm_medium || null,
      utm_campaign: a.utm_campaign || null,
      utm_term: a.utm_term || null,
      utm_content: a.utm_content || null,
      landing_path: a.landing || null,
      referrer_host: a.referrer_host || null,
    })
    .eq("id", user.id);

  return NextResponse.json({ ok: true });
}
