"use client";

import { useEffect, useRef, useState } from "react";
import { Folder, Loader2, Sparkles, AlertTriangle, CheckCircle2, XCircle, FileText } from "lucide-react";

interface DriveDoc {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  folderPath?: string;
}

const MIME_LABEL: Record<string, { label: string; supported: boolean }> = {
  "application/vnd.google-apps.document": { label: "Google Doc", supported: true },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": { label: "Word (.docx)", supported: true },
  "application/vnd.oasis.opendocument.text": { label: ".odt", supported: false },
};

function mimeInfo(mt: string) {
  return MIME_LABEL[mt] || { label: mt, supported: false };
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
  logs: Array<{ at: number; level: "info" | "ok" | "skip" | "fail"; msg: string }>;
}

export function ImportFromDriveClient() {
  const [folder, setFolder] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanErr, setScanErr] = useState<string | null>(null);
  const [docs, setDocs] = useState<DriveDoc[] | null>(null);
  const [overwrite, setOverwrite] = useState(false);
  const [job, setJob] = useState<Job | null>(null);
  const [starting, setStarting] = useState(false);
  const pollRef = useRef<number | null>(null);

  // Poll the job status while running.
  useEffect(() => {
    if (!job || job.status !== "running") {
      if (pollRef.current) {
        window.clearInterval(pollRef.current);
        pollRef.current = null;
      }
      return;
    }
    const tick = async () => {
      try {
        const res = await fetch(`/api/admin/drive/import?jobId=${job.id}`);
        if (!res.ok) return;
        const next = (await res.json()) as Job;
        setJob(next);
      } catch {}
    };
    pollRef.current = window.setInterval(tick, 2500);
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
  }, [job?.id, job?.status]);

  async function scan() {
    setScanErr(null);
    setDocs(null);
    setScanning(true);
    try {
      const res = await fetch("/api/admin/drive/scan", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ folder }),
      });
      const body = await res.json();
      if (!res.ok) {
        setScanErr(body.error || `HTTP ${res.status}`);
      } else {
        setDocs(body.docs);
      }
    } catch (err) {
      setScanErr(err instanceof Error ? err.message : String(err));
    } finally {
      setScanning(false);
    }
  }

  async function startImport() {
    if (!docs?.length) return;
    const supported = docs.filter((d) => mimeInfo(d.mimeType).supported);
    if (!supported.length) {
      setScanErr("No supported files in the folder.");
      return;
    }
    setStarting(true);
    try {
      const res = await fetch("/api/admin/drive/import", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          items: supported.map((d) => ({ docId: d.id, mimeType: d.mimeType, name: d.name })),
          overwrite,
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        setScanErr(body.error || `HTTP ${res.status}`);
      } else {
        setJob({
          id: body.jobId,
          startedAt: Date.now(),
          total: body.total,
          ok: 0,
          skipped: 0,
          failed: 0,
          inProgress: 0,
          status: "running",
          logs: [],
        });
      }
    } finally {
      setStarting(false);
    }
  }

  const progressPct = job ? Math.round(((job.ok + job.skipped + job.failed) / job.total) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Step 1: Folder input */}
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
          <Folder className="h-4 w-4" /> Step 1 · Drive folder
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            value={folder}
            onChange={(e) => setFolder(e.target.value)}
            placeholder="https://drive.google.com/drive/folders/…"
            className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={scan}
            disabled={scanning || !folder.trim()}
            className="inline-flex items-center justify-center gap-1 rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-40"
          >
            {scanning ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Scan folder
          </button>
        </div>
        {scanErr ? (
          <div className="mt-3 flex items-start gap-2 rounded border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>{scanErr}</div>
          </div>
        ) : null}
      </div>

      {/* Step 2: Preview + start */}
      {docs ? (
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <FileText className="h-4 w-4" /> Step 2 · {docs.length} document{docs.length === 1 ? "" : "s"} found
            </div>
            <label className="inline-flex items-center gap-2 text-xs text-slate-600">
              <input
                type="checkbox"
                checked={overwrite}
                onChange={(e) => setOverwrite(e.target.checked)}
              />
              Overwrite existing slugs
            </label>
          </div>
          {docs.length === 0 ? (
            <p className="text-sm text-slate-500">No supported lesson files in this folder.</p>
          ) : (
            <>
              {(() => {
                const breakdown: Record<string, number> = {};
                for (const d of docs) breakdown[d.mimeType] = (breakdown[d.mimeType] || 0) + 1;
                const supportedCount = docs.filter((d) => mimeInfo(d.mimeType).supported).length;
                return (
                  <div className="mb-3 flex flex-wrap gap-2 text-xs">
                    {Object.entries(breakdown).map(([mt, c]) => {
                      const info = mimeInfo(mt);
                      return (
                        <span
                          key={mt}
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ${
                            info.supported
                              ? "bg-emerald-50 text-emerald-800"
                              : "bg-amber-50 text-amber-800"
                          }`}
                        >
                          {info.label}: {c}
                          {!info.supported ? " (skipped)" : ""}
                        </span>
                      );
                    })}
                    <span className="text-slate-500">→ {supportedCount} will import</span>
                  </div>
                );
              })()}
              <div className="max-h-64 overflow-y-auto rounded border bg-slate-50/50 p-2 text-xs">
                <ul className="divide-y divide-slate-200">
                  {docs.slice(0, 80).map((d) => {
                    const info = mimeInfo(d.mimeType);
                    return (
                      <li key={d.id} className="flex items-center gap-2 py-1.5">
                        <FileText className={`h-3.5 w-3.5 ${info.supported ? "text-slate-400" : "text-amber-500"}`} />
                        <span className="min-w-0 flex-1 truncate">
                          {d.folderPath ? (
                            <span className="text-slate-400">{d.folderPath} / </span>
                          ) : null}
                          <span className={info.supported ? "" : "text-slate-400 line-through"}>
                            {d.name}
                          </span>
                        </span>
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">
                          {info.label}
                        </span>
                      </li>
                    );
                  })}
                  {docs.length > 80 ? (
                    <li className="py-1.5 text-slate-400">… and {docs.length - 80} more</li>
                  ) : null}
                </ul>
              </div>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={startImport}
                  disabled={starting || (job?.status === "running")}
                  className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-40"
                >
                  {starting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {job?.status === "running" ? "Import running…" : `Import ${docs.filter((d) => mimeInfo(d.mimeType).supported).length} lessons`}
                </button>
              </div>
            </>
          )}
        </div>
      ) : null}

      {/* Step 3: Job progress */}
      {job ? (
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-semibold text-slate-700">
              Step 3 · {job.status === "running" ? "Importing…" : "Done"}
            </div>
            <div className="flex gap-3 text-xs">
              <span className="inline-flex items-center gap-1 text-emerald-700">
                <CheckCircle2 className="h-3 w-3" /> {job.ok} ok
              </span>
              <span className="text-slate-500">
                {job.skipped} skipped
              </span>
              <span className="inline-flex items-center gap-1 text-rose-700">
                <XCircle className="h-3 w-3" /> {job.failed} failed
              </span>
              {job.status === "running" && job.inProgress > 0 ? (
                <span className="inline-flex items-center gap-1 text-slate-600">
                  <Loader2 className="h-3 w-3 animate-spin" /> {job.inProgress} in flight
                </span>
              ) : null}
            </div>
          </div>
          <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full bg-emerald-500 transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="max-h-64 overflow-y-auto rounded border bg-slate-900/95 p-3 font-mono text-[11px] text-slate-100">
            {job.logs.length === 0 ? (
              <div className="text-slate-400">Starting…</div>
            ) : (
              job.logs.map((l, i) => (
                <div
                  key={i}
                  className={
                    l.level === "ok"
                      ? "text-emerald-300"
                      : l.level === "skip"
                        ? "text-amber-300"
                        : l.level === "fail"
                          ? "text-rose-300"
                          : "text-slate-300"
                  }
                >
                  {l.msg}
                </div>
              ))
            )}
          </div>
          {job.status === "done" ? (
            <div className="mt-3 text-xs text-slate-600">
              Review imported lessons at{" "}
              <a href="/admin/tutor-lessons" className="text-emerald-700 underline">
                Admin → Tutor Lessons
              </a>
              .
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
