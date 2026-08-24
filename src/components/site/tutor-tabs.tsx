"use client";

import { useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export interface TutorTab {
  id: string;
  label: string;
  /** Rendered on the server and handed over as part of the RSC payload. */
  content: React.ReactNode;
  /** Shown next to the label — a count of quals, subjects, reviews… */
  badge?: number;
}

/**
 * The profile's long-form content, one panel at a time.
 *
 * A tutor profile has four things a visitor might have come for — who they
 * are, what they're qualified in, what they teach, and what students said —
 * and stacking all four made the page long enough that the booking panel fell
 * off the bottom. Tabs keep every one of them a single click away.
 *
 * Only tabs with something in them are passed in, so a tutor with no
 * qualifications yet never shows an empty "Certifications" tab.
 */
export function TutorTabs({ tabs }: { tabs: TutorTab[] }) {
  const [active, setActive] = useState(tabs[0]?.id);
  const baseId = useId();
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  if (tabs.length === 0) return null;

  // Left/right arrows move between tabs, as a tablist is expected to.
  function onKeyDown(e: React.KeyboardEvent) {
    const i = tabs.findIndex((t) => t.id === active);
    const next =
      e.key === "ArrowRight"
        ? (i + 1) % tabs.length
        : e.key === "ArrowLeft"
          ? (i - 1 + tabs.length) % tabs.length
          : null;
    if (next === null) return;
    e.preventDefault();
    setActive(tabs[next].id);
    refs.current[tabs[next].id]?.focus();
  }

  return (
    <div className="rounded-2xl bg-white border border-gray-100 shadow-soft overflow-hidden">
      <div
        role="tablist"
        aria-label="About this tutor"
        onKeyDown={onKeyDown}
        className="flex gap-1 px-2 sm:px-4 pt-2 border-b border-gray-100 overflow-x-auto"
      >
        {tabs.map((tab) => {
          const selected = tab.id === active;
          return (
            <button
              key={tab.id}
              ref={(el) => {
                refs.current[tab.id] = el;
              }}
              type="button"
              role="tab"
              id={`${baseId}-tab-${tab.id}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${tab.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(tab.id)}
              className={cn(
                "shrink-0 px-4 py-3 -mb-px border-b-2 font-heading font-bold text-sm transition-colors inline-flex items-center gap-2",
                selected
                  ? "border-secondary text-primary"
                  : "border-transparent text-gray-500 hover:text-primary"
              )}
            >
              {tab.label}
              {tab.badge != null && (
                <span
                  className={cn(
                    "px-1.5 py-0.5 rounded-md text-[11px] font-bold",
                    selected
                      ? "bg-secondary-50 text-secondary-700"
                      : "bg-gray-100 text-gray-500"
                  )}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`${baseId}-panel-${tab.id}`}
          aria-labelledby={`${baseId}-tab-${tab.id}`}
          hidden={tab.id !== active}
          className="p-6 sm:p-8"
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
}
