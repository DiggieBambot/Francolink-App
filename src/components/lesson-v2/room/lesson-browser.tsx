"use client";

import { useEffect } from "react";
import { X, BookOpen } from "lucide-react";

/**
 * In-room lesson browser: embeds the real /library catalogue in an iframe so the
 * tutor browses categories + pictures, and picks a lesson. The catalogue cards
 * postMessage the chosen slug back here (see PickLink), which we hand to onPick.
 */
export function LessonBrowser({
  onPick,
  onClose,
}: {
  onPick: (slug: string, title: string) => void;
  onClose: () => void;
}) {
  useEffect(() => {
    function handle(e: MessageEvent) {
      if (e.origin !== window.location.origin) return;
      const d = e.data as { type?: string; slug?: string; title?: string };
      if (d?.type === "francolink:pick-lesson" && d.slug) {
        onPick(d.slug, d.title || "this lesson");
      }
    }
    window.addEventListener("message", handle);
    return () => window.removeEventListener("message", handle);
  }, [onPick]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex h-[88vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b px-4 py-2.5">
          <BookOpen className="h-5 w-5 text-primary-600" />
          <h2 className="text-sm font-bold text-slate-900">Browse the lesson library</h2>
          <span className="hidden text-xs text-slate-400 sm:inline">— click any lesson to open it for both of you</span>
          <button
            onClick={onClose}
            className="ml-auto rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <iframe
          src="/library?pick=1"
          title="Lesson library"
          className="flex-1 w-full border-0"
        />
      </div>
    </div>
  );
}
