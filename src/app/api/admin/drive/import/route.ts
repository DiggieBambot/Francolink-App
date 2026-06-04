// Bulk-import Google Doc IDs into tutor_lessons.
// POST kicks off a background job; GET polls its status.

import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { fetchDocText, geminiConvert, repairWordOrder, validateLesson, GOOGLE_DOC_MIME } from "@/lib/lessons/convert";
import { hydrateImages } from "@/lib/lessons/hydrate-images";
import type { Lesson } from "@/lib/lessons/types";

interface JobLog {
  at: number;
  level: "info" | "ok" | "skip" | "fail";
  msg: string;
}

interface Job {
  id: string;
  startedAt: number;
  endedAt?: number;
  total: number;
  ok: number;
  skipped: number;
  failed: number;
  inProgress: number;
  status: "running" | "done" | "cancelled";
  logs: JobLog[];
}

// In-memory job registry. Survives until server restart; fine for single-instance dev.
const jobs = new Map<string, Job>();
// OpenAI conversion (~60s/lesson) is the bottleneck, so run several in parallel.
// That also naturally spaces out Drive downloads, avoiding the anti-abuse trigger.
// OpenAI tier-1 limits (500 RPM / 200K TPM) comfortably allow this.
const CONCURRENCY = 4;
const PER_DOC_DELAY_MS = 300;
const LOG_KEEP = 100;

function pushLog(job: Job, level: JobLog["level"], msg: string) {
  job.logs.push({ at: Date.now(), level, msg });
  if (job.logs.length > LOG_KEEP) job.logs.splice(0, job.logs.length - LOG_KEEP);
}

async function assertAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized", status: 401 } as const;
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "ADMIN") return { error: "Forbidden", status: 403 } as const;
  return { ok: true as const, userId: user.id };
}

async function convertAndUpsert(
  docId: string,
  mimeType: string,
  userId: string,
  overwrite: boolean
) {
  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const docText = await fetchDocText(docId, mimeType);
  const lesson: Lesson = await geminiConvert(docText);
  repairWordOrder(lesson);

  const { data: existing } = await supabase
    .from("tutor_lessons")
    .select("id, slug")
    .eq("slug", lesson.slug)
    .maybeSingle();
  if (existing && !overwrite) {
    return { mode: "skip" as const, slug: lesson.slug };
  }

  // Hydrate images (best-effort; ignore failures so lesson still imports).
  try {
    await hydrateImages(lesson);
  } catch {}

  const issues = validateLesson(lesson);
  const row = {
    slug: lesson.slug,
    title: lesson.title,
    language: lesson.language || "fr",
    level: lesson.level,
    duration_minutes: lesson.duration_minutes || null,
    topic_tags: Array.isArray(lesson.topic_tags) ? lesson.topic_tags : [],
    source_doc_id: docId,
    source_url: `https://docs.google.com/document/d/${docId}/edit`,
    status: "review",
    content: lesson,
    conversion_notes: issues.length ? issues.join("; ") : null,
    created_by: userId,
  };

  if (existing) {
    const { error } = await supabase.from("tutor_lessons").update(row).eq("id", existing.id);
    if (error) throw new Error(`update failed: ${error.message}`);
    return { mode: "update" as const, slug: lesson.slug };
  }
  const { error } = await supabase.from("tutor_lessons").insert(row);
  if (error) throw new Error(`insert failed: ${error.message}`);
  return { mode: "insert" as const, slug: lesson.slug };
}

interface ImportTarget {
  docId: string;
  mimeType: string;
  name?: string;
}

async function runJob(job: Job, items: ImportTarget[], userId: string, overwrite: boolean) {
  let cursor = 0;
  let quotaHit = false;
  async function worker() {
    while (true) {
      if (quotaHit) return; // stop the whole job once daily quota is exhausted
      const i = cursor++;
      if (i >= items.length) return;
      const it = items[i];
      job.inProgress++;
      try {
        const res = await convertAndUpsert(it.docId, it.mimeType, userId, overwrite);
        if (res.mode === "skip") {
          job.skipped++;
          pushLog(job, "skip", `[${i + 1}/${items.length}] skipped ${it.name || it.docId} → ${res.slug} (exists)`);
        } else {
          job.ok++;
          pushLog(job, "ok", `[${i + 1}/${items.length}] ${res.mode} ${it.name || it.docId} → ${res.slug}`);
        }
      } catch (err) {
        // Daily Gemini quota exhausted → stop, don't burn the rest on doomed calls.
        if (err instanceof Error && err.name === "QuotaExhaustedError") {
          quotaHit = true;
          pushLog(job, "fail", `[${i + 1}/${items.length}] ⛔ Gemini daily quota exhausted — stopping. Re-run tomorrow (or enable billing). Already-imported lessons are saved.`);
          job.inProgress--;
          return;
        }
        job.failed++;
        pushLog(job, "fail", `[${i + 1}/${items.length}] ✗ ${it.name || it.docId}: ${err instanceof Error ? err.message.slice(0, 200) : err}`);
      } finally {
        if (!quotaHit) job.inProgress--;
        // Throttle between requests to avoid Drive's anti-abuse trigger.
        if (!quotaHit && cursor < items.length) await new Promise((r) => setTimeout(r, PER_DOC_DELAY_MS));
      }
    }
  }
  const workers = Array.from({ length: CONCURRENCY }, () => worker());
  await Promise.all(workers);
  job.endedAt = Date.now();
  job.status = "done";
  pushLog(job, "info", `Done. ok=${job.ok} skipped=${job.skipped} failed=${job.failed}`);
}

export async function POST(req: NextRequest) {
  const auth = await assertAdmin();
  if (!("ok" in auth)) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = (await req.json().catch(() => ({}))) as {
    items?: Array<{ docId: string; mimeType: string; name?: string }>;
    docIds?: string[]; // backward compat: assume Google Docs if no mime
    overwrite?: boolean;
  };
  const items: ImportTarget[] = Array.isArray(body.items)
    ? body.items.filter((x) => x && typeof x.docId === "string")
    : Array.isArray(body.docIds)
      ? body.docIds.map((id) => ({ docId: id, mimeType: GOOGLE_DOC_MIME }))
      : [];
  if (!items.length) return NextResponse.json({ error: "No items provided" }, { status: 400 });

  const job: Job = {
    id: randomUUID(),
    startedAt: Date.now(),
    total: items.length,
    ok: 0,
    skipped: 0,
    failed: 0,
    inProgress: 0,
    status: "running",
    logs: [{ at: Date.now(), level: "info", msg: `Starting bulk import of ${items.length} docs · concurrency=${CONCURRENCY} · overwrite=${!!body.overwrite}` }],
  };
  jobs.set(job.id, job);

  // Fire-and-forget. Don't await.
  void runJob(job, items, auth.userId, !!body.overwrite).catch((err) => {
    job.status = "done";
    job.endedAt = Date.now();
    pushLog(job, "fail", `runJob crashed: ${err instanceof Error ? err.message : err}`);
  });

  return NextResponse.json({ jobId: job.id, total: job.total });
}

export async function GET(req: NextRequest) {
  const auth = await assertAdmin();
  if (!("ok" in auth)) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const jobId = req.nextUrl.searchParams.get("jobId");
  if (!jobId) return NextResponse.json({ error: "jobId required" }, { status: 400 });
  const job = jobs.get(jobId);
  if (!job) return NextResponse.json({ error: "unknown jobId" }, { status: 404 });
  return NextResponse.json(job);
}
