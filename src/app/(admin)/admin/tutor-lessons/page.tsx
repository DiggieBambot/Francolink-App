// Admin review queue for tutor lessons converted from Google Docs.

import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { CheckCircle2, Clock, AlertTriangle, XCircle, FileText } from "lucide-react";
import { BulkPublishButton } from "./bulk-publish-button";

type Status = "draft" | "review" | "published" | "rejected";

type Row = {
  id: string;
  slug: string;
  title: string;
  level: string;
  language: string;
  status: Status;
  topic_tags: string[];
  duration_minutes: number | null;
  conversion_notes: string | null;
  source_doc_id: string | null;
  created_at: string;
};

const STATUS_META: Record<Status, { label: string; cls: string; Icon: typeof Clock }> = {
  review:    { label: "Review",    cls: "bg-amber-100 text-amber-900",   Icon: Clock },
  draft:     { label: "Draft",     cls: "bg-slate-100 text-slate-700",   Icon: FileText },
  published: { label: "Published", cls: "bg-emerald-100 text-emerald-900", Icon: CheckCircle2 },
  rejected:  { label: "Rejected",  cls: "bg-rose-100 text-rose-900",     Icon: XCircle },
};

export default async function AdminTutorLessonsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: Status }>;
}) {
  const { status = "review" } = await searchParams;
  const supabase = await createClient();

  const { data: lessons, error } = await supabase
    .from("tutor_lessons")
    .select("id, slug, title, level, language, status, topic_tags, duration_minutes, conversion_notes, source_doc_id, created_at")
    .eq("status", status)
    .order("created_at", { ascending: false })
    .limit(200);

  const { data: counts } = await supabase
    .from("tutor_lessons")
    .select("status");

  const tally: Record<Status, number> = { draft: 0, review: 0, published: 0, rejected: 0 };
  for (const r of counts || []) tally[r.status as Status] = (tally[r.status as Status] || 0) + 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tutor Lessons</h1>
          <p className="text-sm text-muted-foreground">
            Lessons converted from Google Docs, awaiting human review before publishing.
          </p>
        </div>
        {status === "review" && (tally.review || 0) > 0 ? (
          <BulkPublishButton count={tally.review} />
        ) : null}
      </div>

      <div className="flex gap-2 border-b">
        {(Object.keys(STATUS_META) as Status[]).map((s) => {
          const m = STATUS_META[s];
          const active = s === status;
          return (
            <Link
              key={s}
              href={`/admin/tutor-lessons?status=${s}`}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                active
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <m.Icon className="w-4 h-4" />
              {m.label}
              <span className="text-xs bg-muted px-1.5 py-0.5 rounded">{tally[s] || 0}</span>
            </Link>
          );
        })}
      </div>

      {error ? (
        <div className="rounded border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
          <p className="font-medium">Could not load lessons.</p>
          <p className="mt-1">{error.message}</p>
          {error.code === "PGRST205" ? (
            <p className="mt-2">
              The <code>tutor_lessons</code> table doesn&apos;t exist yet. Apply{" "}
              <code>supabase/migrations/20260601_tutor_lessons.sql</code> in the Supabase dashboard.
            </p>
          ) : null}
        </div>
      ) : null}

      {!error && (lessons?.length ?? 0) === 0 ? (
        <div className="rounded border border-dashed p-12 text-center text-muted-foreground">
          No lessons in <strong>{STATUS_META[status].label}</strong>.
        </div>
      ) : null}

      {(lessons || []).length > 0 ? (
        <div className="overflow-hidden rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Level</th>
                <th className="px-4 py-3">Tags</th>
                <th className="px-4 py-3">Duration</th>
                <th className="px-4 py-3">Notes</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {(lessons || []).map((l: Row) => (
                <tr key={l.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="font-medium">{l.title}</div>
                    <div className="text-xs text-muted-foreground">{l.slug}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-block rounded bg-muted px-2 py-0.5 text-xs font-semibold">
                      {l.level}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(l.topic_tags || []).slice(0, 3).map((t) => (
                        <span key={t} className="rounded bg-muted px-1.5 py-0.5 text-xs">{t}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {l.duration_minutes ? `${l.duration_minutes} min` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {l.conversion_notes ? (
                      <span title={l.conversion_notes} className="flex items-center gap-1 text-amber-700">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span className="text-xs">issues</span>
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(l.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/tutor-lessons/${l.id}`}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      Review →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
