"use client";

import { useEffect } from "react";
import Image from "next/image";
import { X } from "lucide-react";
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-6 animate-in fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative flex w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-2 top-2 z-10 inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-slate-600 shadow hover:bg-slate-100"
        >
          <X className="h-3.5 w-3.5" />
        </button>

        {/* Square thumbnail on the left */}
        {item.image_url ? (
          <div className="relative h-40 w-40 shrink-0 bg-gradient-to-br from-slate-100 to-slate-200">
            <Image
              src={item.image_url}
              alt={item.term}
              fill
              sizes="160px"
              className="object-cover"
              priority
            />
          </div>
        ) : null}

        {/* Content on the right */}
        <div className="flex min-w-0 flex-1 flex-col justify-between p-4">
          <div>
            <div className="flex items-start gap-2 pr-6">
              <div className="min-w-0 flex-1">
                <h2 className="text-2xl font-bold leading-tight text-slate-900">
                  {item.term}
                </h2>
                {item.gender ? (
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-slate-600">
                    {item.gender}
                  </span>
                ) : null}
              </div>
              <SpeakButton
                text={item.tts_text || item.term}
                size="md"
                className={`shrink-0 ${theme?.softBg ?? "bg-primary-50"} hover:opacity-90`}
              />
            </div>
            {item.pronunciation ? (
              <div className="mt-0.5 text-xs text-slate-500">{item.pronunciation}</div>
            ) : null}
            {item.part_of_speech ? (
              <div className="mt-1.5 inline-block rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-700">
                {item.part_of_speech}
              </div>
            ) : null}
            {item.translation ? (
              <div className="mt-2">
                <RevealTranslation text={item.translation} size="sm" />
              </div>
            ) : null}
          </div>

          {item.example ? (
            <div className="mt-3 rounded-lg bg-slate-50 p-2.5 text-sm">
              <div className="flex items-start gap-1">
                <p className="flex-1 text-slate-800">{item.example}</p>
                <SpeakButton text={item.example} size="sm" />
              </div>
              {item.example_translation ? (
                <div className="mt-1">
                  <RevealTranslation text={item.example_translation} />
                </div>
              ) : null}
            </div>
          ) : null}

          {item.note ? (
            <div className="mt-2 text-xs italic text-slate-400">{item.note}</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
