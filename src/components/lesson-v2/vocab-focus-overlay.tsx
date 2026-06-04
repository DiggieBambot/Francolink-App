"use client";

import { useEffect } from "react";
import Image from "next/image";
import { X, ImageOff } from "lucide-react";
import { SpeakButton } from "./speak-button";
import { RevealTranslation } from "./reveal-translation";
import type { VocabItem } from "@/lib/lessons/types";
import type { LevelTheme } from "@/lib/lessons/level-theme";

interface Props {
  item: VocabItem | null;
  onClose: () => void;
  theme?: LevelTheme;
}

export function VocabFocusOverlay({ item, onClose, theme }: Props) {
  // ESC to close.
  useEffect(() => {
    if (!item) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [item, onClose]);

  // Prevent background scroll while open.
  useEffect(() => {
    if (!item) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [item]);

  if (!item) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate-600 shadow hover:bg-slate-100"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="relative aspect-square w-full bg-gradient-to-br from-slate-100 to-slate-200 sm:aspect-[4/3]">
          {item.image_url ? (
            <Image
              src={item.image_url}
              alt={item.term}
              fill
              sizes="(max-width: 640px) 100vw, 600px"
              className="object-cover"
              priority
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-slate-500">
              <ImageOff className="h-10 w-10" />
              <span className="text-sm font-medium">No image yet</span>
              <span className="text-xs text-slate-400">
                Use &ldquo;Re-hydrate images&rdquo; on the lesson admin page to fetch one.
              </span>
            </div>
          )}
        </div>

        <div className="p-6">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <h2 className="text-4xl font-bold leading-tight text-slate-900">
                  {item.term}
                </h2>
                {item.gender ? (
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold uppercase text-slate-600">
                    {item.gender}
                  </span>
                ) : null}
              </div>
              {item.pronunciation ? (
                <div className="mt-1 text-base text-slate-500">{item.pronunciation}</div>
              ) : null}
              {item.part_of_speech ? (
                <div className="mt-2 inline-block rounded bg-blue-50 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-blue-700">
                  {item.part_of_speech}
                </div>
              ) : null}
            </div>
            <SpeakButton
              text={item.term}
              size="lg"
              className={`shrink-0 ${theme?.softBg ?? "bg-emerald-50"} hover:opacity-90`}
            />
          </div>

          {item.translation ? (
            <div className="mt-4 border-t pt-3">
              <RevealTranslation text={item.translation} size="sm" />
            </div>
          ) : null}

          {item.example ? (
            <div className="mt-4 rounded-xl bg-slate-50 p-4">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Example
              </div>
              <div className="mt-1 flex items-start gap-2">
                <p className="flex-1 text-lg text-slate-900">{item.example}</p>
                <SpeakButton text={item.example} size="md" />
              </div>
              {item.example_translation ? (
                <div className="mt-2">
                  <RevealTranslation text={item.example_translation} />
                </div>
              ) : null}
            </div>
          ) : null}

          {item.note ? (
            <div className="mt-3 text-sm italic text-slate-500">{item.note}</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
