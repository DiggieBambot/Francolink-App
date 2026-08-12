"use client";

// The lesson worker's control surface.
//
// The client owns the drain loop: it POSTs to /step repeatedly until the run
// reports finished. That keeps each request short, gives live progress for
// free, and means closing the tab pauses the run rather than corrupting it —
// reopening the page and hitting Resume picks up exactly where it stopped.

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, Check, Loader2, Play, RotateCcw, Square, X } from "lucide-react";

interface Run {
  id: string;
  status: "queued" | "running" | "done" | "failed" | "cancelled";
  scope: Record<string, unknown>;
  options: Record<string, unknown>;
  total_items: number;
  done_items: number;
  failed_items: number;
  applied_count: number;
  cost_usd: number;
  created_at: string;
}

interface Item {
  id: string;
  slug: string;
  title: string;
  level: string | null;
  kind: string;
  status: string;
  defects: { code: string; severity: string; message: string }[];
  findings: { severity: string; issue: string }[];
  repairs: { section_index: number; kind: string; reason: string }[];
  applied: boolean;
  cost_usd: number;
  error: string | null;
}

const ACTIVE = new Set(["queued", "running"]);

export function LessonWorkerConsole({
  initialRuns,
  levelOptions,
}: {
  initialRuns: Run[];
  levelOptions: string[];
}) {
  const [runs, setRuns] = useState<Run[]>(initialRuns);
  const [activeRun, setActiveRun] = useState<Run | null>(
    initialRuns.find((r) => ACTIVE.has(r.status)) ?? null
  );
  const [items, setItems] = useState<Item[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [levels, setLevels] = useState<string[]>([]);
  const [onlyStale, setOnlyStale] = useState(true);
  const [autoApply, setAutoApply] = useState(true);
  const [applyFindings, setApplyFindings] = useState(false);
  const [skipCritique, setSkipCritique] = useState(false);
  const [includeMissing, setIncludeMissing] = useState(false);

  // Guards the drain loop against double-starting (StrictMode, fast clicks).
  const draining = useRef(false);

  const loadItems = useCallback(async (runId: string) => {
    const res = await fetch(`/api/admin/lesson-worker/${runId}`);
    if (!res.ok) return;
    const json = await res.json();
    setActiveRun(json.run);
    setItems(json.items ?? []);
  }, []);

  const drain = useCallback(
    async (runId: string) => {
      if (draining.current) return;
      draining.current = true;
      try {
        for (;;) {
          const res = await fetch(`/api/admin/lesson-worker/${runId}/step`, { method: "POST" });
          if (!res.ok) {
            const json = await res.json().catch(() => ({}));
            setError(json.error ?? "The worker stopped unexpectedly.");
            break;
          }
          const json = await res.json();
          setActiveRun(json.run);
          await loadItems(runId);
          if (json.finished) break;
        }
      } finally {
        draining.current = false;
        setBusy(false);
        const res = await fetch("/api/admin/lesson-worker");
        if (res.ok) setRuns((await res.json()).runs ?? []);
      }
    },
    [loadItems]
  );

  // Resume a run that was left mid-flight by a closed tab.
  useEffect(() => {
    if (activeRun && ACTIVE.has(activeRun.status)) {
      void loadItems(activeRun.id);
    }
    // Intentionally only on mount — resuming is an explicit button afterwards.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function start() {
    setBusy(true);
    setError(null);
    setItems([]);

    const res = await fetch("/api/admin/lesson-worker", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language: "fr",
        levels,
        only_stale: onlyStale,
        auto_apply: autoApply,
        apply_findings: applyFindings,
        skip_critique: skipCritique,
        include_missing: includeMissing,
        critique_model: "gpt-4o",
        repair_model: "gpt-4o-mini",
      }),
    });

    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? "Could not start the run.");
      setBusy(false);
      return;
    }

    setActiveRun(json.run);
    void drain(json.run.id);
  }

  async function cancel() {
    if (!activeRun) return;
    await fetch(`/api/admin/lesson-worker/${activeRun.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "cancel" }),
    });
  }

  async function revertRun(runId: string) {
    if (!confirm("Undo every content edit this run made? Lessons return to their pre-run state.")) return;
    setBusy(true);
    const res = await fetch("/api/admin/lesson-worker/revert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ runId }),
    });
    const json = await res.json();
    setBusy(false);
    if (!res.ok) setError(json.error ?? "Revert failed.");
    else alert(`Reverted ${json.reverted} lesson${json.reverted === 1 ? "" : "s"}.`);
  }

  const pct = activeRun?.total_items
    ? Math.round(((activeRun.done_items + activeRun.failed_items) / activeRun.total_items) * 100)
    : 0;
  const running = activeRun ? ACTIVE.has(activeRun.status) : false;

  return (
    <div className="space-y-6">
      {/* ── controls ─────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border bg-card p-5">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-muted-foreground">
          New run
        </h2>

        <div className="mb-4">
          <span className="mb-2 block text-sm font-medium">Levels</span>
          <div className="flex flex-wrap gap-2">
            {levelOptions.map((lv) => {
              const on = levels.includes(lv);
              return (
                <button
                  key={lv}
                  type="button"
                  onClick={() => setLevels(on ? levels.filter((l) => l !== lv) : [...levels, lv])}
                  className={`rounded-full border px-3 py-1 text-sm transition ${
                    on ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted"
                  }`}
                >
                  {lv}
                </button>
              );
            })}
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">
            {levels.length === 0 ? "No levels selected — the run covers every level." : `${levels.length} selected.`}
          </p>
        </div>

        <div className="mb-4 grid gap-2 sm:grid-cols-2">
          <Toggle checked={autoApply} onChange={setAutoApply} label="Auto-apply repairs"
            hint="Write fixes straight to the lesson. Every write is logged and revertible." />
          <Toggle checked={onlyStale} onChange={setOnlyStale} label="Skip unchanged lessons"
            hint="Only lessons edited since their last AI pass. Keeps a repeat sweep cheap." />
          <Toggle checked={applyFindings} onChange={setApplyFindings} label="Act on editorial findings"
            hint="Also rewrite sections the reviewer flagged for style or level, not just schema defects." />
          <Toggle checked={skipCritique} onChange={setSkipCritique} label="Skip AI review"
            hint="Schema defects only. Roughly ten times cheaper, catches less." />
          <Toggle checked={includeMissing} onChange={setIncludeMissing} label="Write missing lessons"
            hint="Fill numbering gaps in a syllabus series. New lessons always land in review, never published." />
        </div>

        {applyFindings && (
          <p className="mb-4 flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-400">
            <AlertTriangle className="mt-px h-4 w-4 shrink-0" />
            Editorial findings are the model&apos;s judgement, not a provable defect. With
            auto-apply on, it will rewrite sections that were arguably fine. Worth a
            spot-check on one level before running the whole catalogue.
          </p>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={start}
            disabled={busy || running}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            Start run
          </button>
          {running && (
            <button
              type="button"
              onClick={cancel}
              className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-muted"
            >
              <Square className="h-4 w-4" />
              Cancel
            </button>
          )}
          {activeRun && !running && activeRun.done_items + activeRun.failed_items < activeRun.total_items && (
            <button
              type="button"
              onClick={() => { setBusy(true); void drain(activeRun.id); }}
              className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-muted"
            >
              <Play className="h-4 w-4" />
              Resume
            </button>
          )}
        </div>

        {error && (
          <p className="mt-3 flex items-center gap-2 text-sm text-destructive">
            <X className="h-4 w-4" /> {error}
          </p>
        )}
      </div>

      {/* ── progress ─────────────────────────────────────────────────────── */}
      {activeRun && (
        <div className="rounded-2xl border bg-card p-5">
          <div className="mb-3 flex items-center justify-between gap-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              {activeRun.status === "running" ? "Running" : activeRun.status}
            </h2>
            <span className="text-sm tabular-nums text-muted-foreground">
              {activeRun.done_items + activeRun.failed_items} / {activeRun.total_items}
            </span>
          </div>

          <div className="mb-4 h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
          </div>

          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat value={activeRun.applied_count} label="lessons edited" />
            <Stat value={activeRun.failed_items} label="failed" />
            <Stat value={items.reduce((n, i) => n + (i.defects?.length ?? 0), 0)} label="defects found" />
            <Stat value={`$${Number(activeRun.cost_usd).toFixed(2)}`} label="spent" />
          </div>

          {activeRun.applied_count > 0 && (
            <button
              type="button"
              onClick={() => revertRun(activeRun.id)}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold hover:bg-muted disabled:opacity-50"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Undo this run
            </button>
          )}
        </div>
      )}

      {/* ── per-lesson results ───────────────────────────────────────────── */}
      {items.length > 0 && (
        <div className="overflow-hidden rounded-2xl border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 font-semibold">Lesson</th>
                <th className="px-4 py-2.5 font-semibold">Defects</th>
                <th className="px-4 py-2.5 font-semibold">Repaired</th>
                <th className="px-4 py-2.5 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => {
                const errors = (it.defects ?? []).filter((d) => d.severity === "error").length;
                const warns = (it.defects ?? []).length - errors;
                const fixed = (it.repairs ?? []).filter(
                  (r) => !r.reason.startsWith("rejected") && !r.reason.startsWith("failed")
                );
                return (
                  <tr key={it.id} className="border-b last:border-0 align-top">
                    <td className="px-4 py-2.5">
                      <div className="font-medium">{it.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {it.slug} {it.level ? `· ${it.level}` : ""} {it.kind === "create" ? "· new" : ""}
                      </div>
                      {it.error && <div className="mt-1 text-xs text-destructive">{it.error}</div>}
                    </td>
                    <td className="px-4 py-2.5 tabular-nums">
                      {errors > 0 && <span className="text-destructive">{errors} error{errors === 1 ? "" : "s"}</span>}
                      {errors > 0 && warns > 0 && <span className="text-muted-foreground"> · </span>}
                      {warns > 0 && <span className="text-muted-foreground">{warns} warn</span>}
                      {errors + warns === 0 && it.status === "done" && (
                        <span className="text-muted-foreground">clean</span>
                      )}
                      {(it.findings ?? []).length > 0 && (
                        <div className="mt-1 text-xs text-muted-foreground">
                          {it.findings.length} review note{it.findings.length === 1 ? "" : "s"}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      {fixed.length > 0 ? (
                        <div className="space-y-0.5">
                          {fixed.map((r, i) => (
                            <div key={i} className="text-xs">
                              <span className="font-medium">§{r.section_index}</span>{" "}
                              <span className="text-muted-foreground">{r.kind}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      <StatusPill status={it.status} applied={it.applied} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── history ──────────────────────────────────────────────────────── */}
      {runs.length > 0 && (
        <div className="rounded-2xl border bg-card p-5">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Recent runs
          </h2>
          <ul className="space-y-1.5">
            {runs.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-4 text-sm">
                <button
                  type="button"
                  onClick={() => { setActiveRun(r); void loadItems(r.id); }}
                  className="truncate text-left hover:underline"
                >
                  {new Date(r.created_at).toLocaleString()} · {r.status}
                </button>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  {r.applied_count} edited · ${Number(r.cost_usd).toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border p-3 hover:bg-muted/50">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 accent-[hsl(var(--primary))]"
      />
      <span>
        <span className="block text-sm font-medium">{label}</span>
        <span className="block text-xs text-muted-foreground">{hint}</span>
      </span>
    </label>
  );
}

function Stat({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="rounded-xl border p-3">
      <div className="text-xl font-bold tabular-nums">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function StatusPill({ status, applied }: { status: string; applied: boolean }) {
  if (status === "done" && applied) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
        <Check className="h-3 w-3" /> applied
      </span>
    );
  }
  if (status === "failed") {
    return <span className="rounded-full bg-destructive/15 px-2 py-0.5 text-xs font-medium text-destructive">failed</span>;
  }
  if (status === "running") {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" /> working
      </span>
    );
  }
  return <span className="text-xs text-muted-foreground">{status}</span>;
}
