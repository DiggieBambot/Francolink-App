import Link from "next/link";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { ExternalLink, Megaphone, Plus, Download } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { buildTrackedUrl, PLATFORM_LABEL } from "@/lib/outreach";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  created_at: string;
  platform: string;
  target_name: string;
  link_dropped: string | null;
  destination_path: string;
  tracking_code: string;
  notes: string | null;
  users: { name: string | null; email: string | null } | null;
};

function serviceClient() {
  return createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

export default async function AdminOutreachPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("users").select("role").eq("id", user!.id).single();
  const isAdmin = (profile?.role || "").toUpperCase() === "ADMIN";

  const svc = serviceClient();
  let query = svc
    .from("outreach_reports")
    .select("id, created_at, platform, target_name, link_dropped, destination_path, tracking_code, notes, users:manager_id(name, email)")
    .order("created_at", { ascending: false })
    .limit(500);
  // A community manager only ever sees their own rows.
  if (!isAdmin) query = query.eq("manager_id", user!.id);

  const { data, error } = await query;
  // Supabase types the manager_id join as an array; it's one-to-one.
  const rows = (data || []) as unknown as Row[];

  // Conversions are MEASURED: first-touch utm_content on a signup == tracking code.
  const codes = rows.map((r) => r.tracking_code);
  const conversions = new Map<string, number>();
  if (codes.length) {
    const { data: converted } = await svc.from("users").select("utm_content").in("utm_content", codes);
    for (const u of (converted || []) as Array<{ utm_content: string | null }>) {
      if (!u.utm_content) continue;
      conversions.set(u.utm_content, (conversions.get(u.utm_content) || 0) + 1);
    }
  }

  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const thisWeek = rows.filter((r) => new Date(r.created_at).getTime() >= weekAgo).length;
  const totalSignups = [...conversions.values()].reduce((a, b) => a + b, 0);

  const stats = [
    { label: "Total outreach", value: rows.length },
    { label: "Last 7 days", value: thisWeek },
    { label: "Signups attributed", value: totalSignups },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase text-primary">
            <Megaphone className="h-3.5 w-3.5" />
            Outreach
          </div>
          <h1 className="text-2xl font-bold">{isAdmin ? "Outreach Reports" : "My Outreach"}</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            {isAdmin
              ? "Every logged outreach action, with signups attributed automatically from the tracking link."
              : "Everything you've logged, and how many signups each link has brought in."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href="/api/admin/outreach/export"
            className="inline-flex items-center gap-2 rounded border px-4 py-2 text-sm font-semibold hover:bg-muted"
          >
            <Download className="h-4 w-4" /> Export CSV
          </a>
          <Link
            href="/admin/outreach/new"
            className="inline-flex items-center gap-2 rounded bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-800"
          >
            <Plus className="h-4 w-4" /> Log outreach
          </Link>
        </div>
      </div>

      {error ? (
        <div className="rounded border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-medium">The outreach table isn&apos;t available yet.</p>
          <p className="mt-1">
            Apply <code>supabase/migrations/20260722_outreach_reports.sql</code> in Supabase, then refresh.
          </p>
          <p className="mt-1 text-xs">{error.message}</p>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg border bg-card p-4">
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      {rows.length ? (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="whitespace-nowrap px-4 py-3">Date</th>
                {isAdmin ? <th className="whitespace-nowrap px-4 py-3">Manager</th> : null}
                <th className="whitespace-nowrap px-4 py-3">Platform</th>
                <th className="px-4 py-3">Target community</th>
                <th className="whitespace-nowrap px-4 py-3">Links</th>
                <th className="whitespace-nowrap px-4 py-3 text-right">Signups</th>
                <th className="px-4 py-3">Notes</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const signups = conversions.get(r.tracking_code) || 0;
                return (
                  <tr key={r.id} className="border-b last:border-0 align-top">
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString()}
                    </td>
                    {isAdmin ? (
                      <td className="whitespace-nowrap px-4 py-3">{r.users?.name || r.users?.email || "—"}</td>
                    ) : null}
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className="rounded bg-muted px-2 py-0.5 text-xs font-semibold">
                        {PLATFORM_LABEL[r.platform] || r.platform}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium">{r.target_name}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="flex flex-col gap-1">
                        {r.link_dropped ? (
                          <a
                            href={r.link_dropped}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-primary hover:underline"
                          >
                            Comment <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground">DM — no link</span>
                        )}
                        <a
                          href={buildTrackedUrl({
                            destinationPath: r.destination_path,
                            platform: r.platform,
                            trackingCode: r.tracking_code,
                          })}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground hover:text-foreground"
                        >
                          {r.tracking_code} <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-bold ${
                          signups > 0 ? "bg-green-100 text-green-800" : "text-muted-foreground"
                        }`}
                      >
                        {signups}
                      </span>
                    </td>
                    <td className="max-w-md px-4 py-3 text-muted-foreground">{r.notes || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded border border-dashed p-10 text-center text-muted-foreground">
          Nothing logged yet.{" "}
          <Link href="/admin/outreach/new" className="font-medium text-primary hover:underline">
            Log the first outreach →
          </Link>
        </div>
      )}
    </div>
  );
}
