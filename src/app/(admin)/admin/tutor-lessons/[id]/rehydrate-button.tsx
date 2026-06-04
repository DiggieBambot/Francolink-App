"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ImageIcon, RotateCw } from "lucide-react";

interface Props {
  lessonId: string;
}

export function RehydrateImagesButton({ lessonId }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState<null | "hydrate" | "reconvert">(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function hit(path: string, kind: "hydrate" | "reconvert") {
    setBusy(kind);
    setMsg(null);
    try {
      const res = await fetch(path, { method: "POST" });
      const body = await res.json();
      if (!res.ok) {
        setMsg(`✗ ${body.error || `HTTP ${res.status}`}`);
      } else {
        if (kind === "hydrate") {
          const s = body.stats || {};
          setMsg(
            `✓ Hydrated ${s.vocab || 0} vocab, ${s.prompts || 0} prompts, ${s.dialogues || 0} dialogues. ${s.misses || 0} misses.`
          );
        } else {
          setMsg(`✓ Re-converted: ${body.sections} sections${body.issues ? `, ${body.issues} issues` : ""}`);
        }
        router.refresh();
      }
    } catch (err) {
      setMsg(`✗ ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => hit(`/api/admin/tutor-lessons/${lessonId}/rehydrate-images`, "hydrate")}
          disabled={!!busy}
          className="inline-flex items-center gap-1 rounded border px-2.5 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          {busy === "hydrate" ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
          {busy === "hydrate" ? "Hydrating…" : "Re-hydrate images"}
        </button>
        <button
          type="button"
          onClick={() => hit(`/api/admin/tutor-lessons/${lessonId}/reconvert`, "reconvert")}
          disabled={!!busy}
          className="inline-flex items-center gap-1 rounded border border-emerald-300 bg-emerald-50 px-2.5 py-1.5 text-sm font-medium text-emerald-800 hover:bg-emerald-100 disabled:opacity-50"
          title="Re-fetch the source doc and re-run Gemini with the current prompt. Costs 1 Gemini call."
        >
          {busy === "reconvert" ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCw className="w-4 h-4" />}
          {busy === "reconvert" ? "Re-converting…" : "Re-convert from source"}
        </button>
      </div>
      {msg ? <span className="text-xs text-slate-500">{msg}</span> : null}
    </div>
  );
}
