// CSV export of outreach reports. Admins export everything; a community
// manager exports only their own rows (scoped server-side, not by a param).
import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { toCsv, buildTrackedUrl, PLATFORM_LABEL } from "@/lib/outreach";

export const dynamic = "force-dynamic";

function serviceClient() {
  return createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

type Row = {
  created_at: string;
  platform: string;
  target_name: string;
  link_dropped: string | null;
  destination_path: string;
  tracking_code: string;
  notes: string | null;
  users: { name: string | null; email: string | null } | null;
};

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
  const role = (profile?.role || "").toUpperCase();
  if (role !== "ADMIN" && role !== "COMMUNITY_MANAGER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const svc = serviceClient();
  let query = svc
    .from("outreach_reports")
    .select("created_at, platform, target_name, link_dropped, destination_path, tracking_code, notes, users:manager_id(name, email)")
    .order("created_at", { ascending: false });
  if (role !== "ADMIN") query = query.eq("manager_id", user.id);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Supabase types the manager_id join as an array; it's one-to-one.
  const rows = (data || []) as unknown as Row[];

  // Conversions: signups whose first-touch utm_content matches a tracking code.
  const codes = rows.map((r) => r.tracking_code);
  const conversions = new Map<string, number>();
  if (codes.length) {
    const { data: converted } = await svc
      .from("users")
      .select("utm_content")
      .in("utm_content", codes);
    for (const u of (converted || []) as Array<{ utm_content: string | null }>) {
      if (!u.utm_content) continue;
      conversions.set(u.utm_content, (conversions.get(u.utm_content) || 0) + 1);
    }
  }

  const csv = toCsv(
    rows.map((r) => ({
      date: new Date(r.created_at).toISOString().slice(0, 10),
      manager: r.users?.name || r.users?.email || "",
      platform: PLATFORM_LABEL[r.platform] || r.platform,
      target_community: r.target_name,
      link_dropped: r.link_dropped || "",
      tracked_link: buildTrackedUrl({
        destinationPath: r.destination_path,
        platform: r.platform,
        trackingCode: r.tracking_code,
      }),
      tracking_code: r.tracking_code,
      signups_from_this: conversions.get(r.tracking_code) || 0,
      notes: r.notes || "",
    })),
    ["date", "manager", "platform", "target_community", "link_dropped", "tracked_link", "tracking_code", "signups_from_this", "notes"]
  );

  const filename = `outreach-${new Date().toISOString().slice(0, 10)}.csv`;
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
