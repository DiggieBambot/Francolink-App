// Create an outreach report. Any growth agent (ADMIN or COMMUNITY_MANAGER)
// can log their own outreach; manager_id is always taken from the session,
// never from the request body, so one manager can't write rows as another.
import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { generateTrackingCode, buildTrackedUrl, OUTREACH_PLATFORMS } from "@/lib/outreach";

export const dynamic = "force-dynamic";

const VALID_PLATFORMS = new Set(OUTREACH_PLATFORMS.map((p) => p.value as string));

function serviceClient() {
  return createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

async function requireAgent() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized", status: 401 } as const;
  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
  const role = (profile?.role || "").toUpperCase();
  if (role !== "ADMIN" && role !== "COMMUNITY_MANAGER") {
    return { error: "Forbidden", status: 403 } as const;
  }
  return { ok: true as const, userId: user.id, role };
}

export async function POST(req: Request) {
  const auth = await requireAgent();
  if (!("ok" in auth)) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json().catch(() => ({}));
  const platform = String(body?.platform || "").toLowerCase();
  const targetName = String(body?.target_name || "").trim();
  const destinationPath = String(body?.destination_path || "/").trim() || "/";
  const linkDropped = String(body?.link_dropped || "").trim() || null;
  const notes = String(body?.notes || "").trim() || null;

  if (!VALID_PLATFORMS.has(platform)) {
    return NextResponse.json({ error: "Pick a valid platform." }, { status: 400 });
  }
  if (!targetName) {
    return NextResponse.json({ error: "Target community/handle is required." }, { status: 400 });
  }

  const supabase = serviceClient();

  // Retry on the (vanishingly unlikely) unique-code collision.
  for (let attempt = 0; attempt < 5; attempt++) {
    const trackingCode = generateTrackingCode();
    const { data, error } = await supabase
      .from("outreach_reports")
      .insert({
        manager_id: auth.userId,
        platform,
        target_name: targetName,
        destination_path: destinationPath,
        tracking_code: trackingCode,
        link_dropped: linkDropped,
        notes,
      })
      .select("id, tracking_code, platform, destination_path")
      .single();

    if (!error && data) {
      return NextResponse.json({
        ok: true,
        id: data.id,
        tracking_code: data.tracking_code,
        tracked_url: buildTrackedUrl({
          destinationPath: data.destination_path,
          platform: data.platform,
          trackingCode: data.tracking_code,
        }),
      });
    }
    // 23505 = unique_violation on tracking_code — try a new code.
    if (error && error.code !== "23505") {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Could not allocate a tracking code, try again." }, { status: 500 });
}
