"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Long prose, cut off until asked for.
 *
 * The whole text is in the DOM from the first render — clamped, not removed —
 * so search engines and screen readers get the full biography whether or not
 * anyone presses the button. The button only appears when the content is
 * genuinely taller than the collapsed height, measured after mount.
 */
export function Collapsible({
  children,
  collapsedHeight = 208,
  moreLabel = "Read more",
  lessLabel = "Show less",
}: {
  children: React.ReactNode;
  collapsedHeight?: number;
  moreLabel?: string;
  lessLabel?: string;
}) {
  const inner = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [overflows, setOverflows] = useState(false);

  useEffect(() => {
    const el = inner.current;
    if (!el) return;
    const check = () => setOverflows(el.scrollHeight > collapsedHeight + 24);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [collapsedHeight]);

  return (
    <div>
      <div
        className="relative overflow-hidden transition-[max-height] duration-300"
        style={{ maxHeight: open || !overflows ? undefined : collapsedHeight }}
      >
        <div ref={inner}>{children}</div>
        {overflows && !open && (
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent pointer-events-none" />
        )}
      </div>

      {overflows && (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline underline-offset-4"
        >
          {open ? lessLabel : moreLabel}
          <ChevronDown
            className={cn("w-4 h-4 transition-transform", open && "rotate-180")}
          />
        </button>
      )}
    </div>
  );
}
