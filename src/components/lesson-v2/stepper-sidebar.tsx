"use client";

import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import type { Section } from "@/lib/lessons/types";
import type { LevelTheme } from "@/lib/lessons/level-theme";

interface StepperSidebarProps {
  sections: Section[];
  theme?: LevelTheme;
}

export function StepperSidebar({ sections, theme }: StepperSidebarProps) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [seenIdx, setSeenIdx] = useState<Set<number>>(new Set([0]));

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // Pick the topmost intersecting section.
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) {
          const idx = Number((visible[0].target as HTMLElement).dataset.idx);
          if (!Number.isNaN(idx)) {
            setActiveIdx(idx);
            setSeenIdx((prev) => {
              const next = new Set(prev);
              for (let i = 0; i <= idx; i++) next.add(i);
              return next;
            });
          }
        }
      },
      { rootMargin: "-30% 0px -50% 0px", threshold: 0 }
    );

    sections.forEach((_, i) => {
      const el = document.querySelector(`[data-section-idx="${i}"]`);
      if (el) {
        (el as HTMLElement).dataset.idx = String(i);
        observer.observe(el);
      }
    });
    return () => observer.disconnect();
  }, [sections]);

  const activeBg = theme?.softBg ?? "bg-primary-50";
  const activeText = theme?.softText ?? "text-primary-700";
  const activeCircle = theme?.accentBg ?? "bg-primary-500";
  const seenIcon = theme?.accentText ?? "text-primary-500";

  return (
    <nav className="space-y-0.5 text-sm">
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
        Lesson steps
      </div>
      {sections.map((s, i) => {
        const isActive = i === activeIdx;
        const isSeen = seenIdx.has(i) && !isActive;
        return (
          <a
            key={i}
            href={`#section-${i}`}
            className={`group flex items-center gap-2 rounded-lg px-2 py-2 transition ${
              isActive ? `${activeBg} ${activeText}` : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {isSeen ? (
              <CheckCircle2 className={`h-4 w-4 shrink-0 ${seenIcon}`} />
            ) : (
              <span
                className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold transition ${
                  isActive
                    ? `${activeCircle} text-white`
                    : "border border-slate-300 text-slate-500 group-hover:border-slate-400"
                }`}
              >
                {s.number}
              </span>
            )}
            <span className="truncate">{s.title || s.kind}</span>
          </a>
        );
      })}
    </nav>
  );
}
