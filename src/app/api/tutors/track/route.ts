// POST /api/tutors/track  { kind, slug?, ref?, utm? }
//
// Records one step of the tutor marketplace journey (directory view, profile
// view, booking click, favourite) into tutor_profile_events. Open to anonymous
// visitors on purpose -- most of the journey happens before anyone signs up --
// so it guards itself instead:
//   * a random first-party cookie (fl_vid) identifies the browser, so a
//     refresh doesn't count as a second view
//   * directory and profile views count once per visitor per day
//   * bots and requests with no user agent are ignored
//   * a visitor can record at most 60 events an hour
//   * a tutor looking at their own profile, and demo accounts, are not counted
// It always answers 204 so the page never learns or cares what was recorded.
import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { isDemoEmail } from "@/lib/demo";

export const runtime = "nodejs";

const KINDS = new Set([
  "directory_view",
  "profile_view",
  "slot_selected",
  "favorite_added",
  "favorite_removed",
  "message_started",
]);
const DAILY_ONCE = new Set(["directory_view", "profile_view"]);
const BOT_UA = /bot|crawl|spider|slurp|preview|headless|lighthouse|facebookexternalhit|embedly|bingpreview|curl|wget|python|axios/i;
const VID_COOKIE = "fl_vid";

function svc() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

/** utm_source if present, else the referring site's host, else "direct". */
function sourceOf(ref: unknown, utm: unknown, ownHost: string): string {
  if (typeof utm === "string" && utm.trim()) return utm.trim().toLowerCase().slice(0, 60);
  if (typeof ref === "string" && ref) {
    try {
      const host = new URL(ref).hostname.replace(/^www\./, "");
      // Moving between our own pages isn't a source.
      if (host && !host.endsWith(ownHost.replace(/^www\./, "").split(":")[0])) return host.slice(0, 60);
    } catch {
      /* not a URL */
    }
  }
  return "direct";
}

export async function POST(req: NextRequest) {
  const done = (vid?: string) => {
    const res = new NextResponse(null, { status: 204 });
    if (vid) {
      res.cookies.set(VID_COOKIE, vid, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 365,
        path: "/",
      });
    }
    return res;
  };

  const ua = req.headers.get("user-agent") || "";
  if (!ua || BOT_UA.test(ua)) return done();

  let body: { kind?: string; slug?: string; ref?: string; utm?: string } = {};
  try {
    body = await req.json();
  } catch {
    return done();
  }
  const kind = body.kind || "";
  if (!KINDS.has(kind)) return done();

  const existing = req.cookies.get(VID_COOKIE)?.value;
  const visitorId = existing && /^[a-f0-9-]{36}$/.test(existing) ? existing : crypto.randomUUID();
  const newVid = visitorId !== existing ? visitorId : undefined;

  const db = svc();

  // Every kind but directory_view is about one listed tutor.
  let tutorId: string | null = null;
  if (kind !== "directory_view") {
    const slug = typeof body.slug === "string" ? body.slug.slice(0, 120) : "";
    if (!slug) return done(newVid);
    const { data: profile } = await db
      .from("tutor_public_profiles")
      .select("user_id")
      .eq("slug", slug)
      .maybeSingle();
    if (!profile) return done(newVid);
    tutorId = profile.user_id as string;
  }

  // Signed in? Only on the app host -- the website has no session cookie.
  let userId: string | null = null;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      if (isDemoEmail(user.email)) return done(newVid);
      if (tutorId && user.id === tutorId) return done(newVid);
      userId = user.id;
    }
  } catch {
    /* anonymous */
  }

  const hourAgo = new Date(Date.now() - 3600_000).toISOString();
  const { count: recent } = await db
    .from("tutor_profile_events")
    .select("id", { count: "exact", head: true })
    .eq("visitor_id", visitorId)
    .gte("created_at", hourAgo);
  if ((recent ?? 0) >= 60) return done(newVid);

  if (DAILY_ONCE.has(kind)) {
    const dayAgo = new Date(Date.now() - 86400_000).toISOString();
    let q = db
      .from("tutor_profile_events")
      .select("id", { count: "exact", head: true })
      .eq("visitor_id", visitorId)
      .eq("kind", kind)
      .gte("created_at", dayAgo);
    q = tutorId ? q.eq("tutor_id", tutorId) : q.is("tutor_id", null);
    const { count } = await q;
    if ((count ?? 0) > 0) return done(newVid);
  }

  const { error } = await db.from("tutor_profile_events").insert({
    tutor_id: tutorId,
    kind,
    visitor_id: visitorId,
    user_id: userId,
    source: sourceOf(body.ref, body.utm, req.headers.get("host") || ""),
  });
  if (error) console.error("[tutors/track] insert failed", error.message);

  return done(newVid);
}
