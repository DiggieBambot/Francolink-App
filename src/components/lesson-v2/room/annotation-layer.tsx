"use client";

// Drawing on the material.
//
// Highlights already exist — a tutor can mark a phrase and the student sees it
// go yellow. What they could not do is the single commonest gesture in a
// language lesson: circle a conjugation table, underline the ending, put an
// arrow between two words. Those are not marks on a phrase; they are marks on
// a REGION, and a text-anchored highlight cannot express them.
//
// Two decisions shape the whole file.
//
// **Strokes are anchored to a section, not to the page.** The tutor is on a
// 1440px laptop and the student on a 390px phone, so a stroke recorded as page
// pixels — or even as a fraction of the scroll height — lands somewhere else on
// the other screen, and an arrow that points at the wrong word is worse than no
// arrow. Every point is stored as (sectionIdx, x, y) where x and y are
// fractions of that SECTION's box, so it lands on the same words at any width.
// Sections already carry data-section-idx for the scroll sync, so there is
// nothing new to maintain.
//
// **Strokes fade.** This is pointing, not annotating. A tutor circling a verb
// means "look here, now"; ten minutes later that circle is litter sitting on
// top of the next exercise. They die after LIFETIME_MS, which also means there
// is nothing to persist, nothing to clean up, and no way to ruin a lesson by
// forgetting to erase.

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/** A stroke's point, anchored inside one section. */
export interface AnchoredPoint {
  s: number;
  x: number;
  y: number;
}

export interface Stroke {
  id: string;
  points: AnchoredPoint[];
  role: "tutor" | "student";
  at: number;
}

/** How long a stroke stays on screen. */
const LIFETIME_MS = 9000;
/** Fade begins here, so a stroke does not simply vanish mid-sentence. */
const FADE_AFTER_MS = 6000;

function screenToAnchor(
  clientX: number,
  clientY: number
): AnchoredPoint | null {
  const el = document.elementFromPoint(clientX, clientY);
  const section = el?.closest?.("[data-section-idx]") as HTMLElement | null;
  if (!section) return null;
  const idx = Number(section.dataset.sectionIdx);
  if (!Number.isFinite(idx)) return null;
  const r = section.getBoundingClientRect();
  if (r.width === 0 || r.height === 0) return null;
  return {
    s: idx,
    x: (clientX - r.left) / r.width,
    y: (clientY - r.top) / r.height,
  };
}

/** Where an anchored point currently sits on THIS screen, or null if unmounted. */
function anchorToScreen(
  p: AnchoredPoint,
  host: HTMLElement
): { x: number; y: number } | null {
  const section = host.querySelector<HTMLElement>(`[data-section-idx="${p.s}"]`);
  if (!section) return null;
  const r = section.getBoundingClientRect();
  const h = host.getBoundingClientRect();
  return {
    x: r.left - h.left + p.x * r.width,
    y: r.top - h.top + p.y * r.height,
  };
}

function toPath(pts: { x: number; y: number }[]): string {
  if (pts.length === 0) return "";
  if (pts.length === 1) return `M${pts[0].x} ${pts[0].y} l0.1 0.1`;
  return pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x} ${p.y}`).join(" ");
}

export function AnnotationLayer({
  active,
  strokes,
  onStroke,
  role,
}: {
  /** Draw mode. When off the layer is inert and clicks reach the lesson. */
  active: boolean;
  strokes: Stroke[];
  onStroke: (points: AnchoredPoint[]) => void;
  role: "tutor" | "student";
}) {
  // A callback ref in STATE, not a useRef: the layer's geometry is needed
  // during render to place strokes, and a plain ref neither triggers the first
  // render after mount nor may be read while rendering.
  const [host, setHost] = useState<HTMLDivElement | null>(null);
  const [drawing, setDrawing] = useState<AnchoredPoint[] | null>(null);
  // Anchored points resolve against live layout, so anything that moves the
  // page — scrolling, resizing, an image finally loading — has to redraw. The
  // clock doubles as that trigger: strokes expire on age, so a re-render is
  // exactly what both needs.
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const redraw = () => setNow(Date.now());
    const scroller = host?.parentElement;
    window.addEventListener("resize", redraw);
    scroller?.addEventListener("scroll", redraw, { passive: true });
    // Strokes expire on their own, so the layer has to re-render to drop them
    // even when nothing else changes.
    const t = setInterval(redraw, 250);
    return () => {
      window.removeEventListener("resize", redraw);
      scroller?.removeEventListener("scroll", redraw);
      clearInterval(t);
    };
  }, [host]);

  const start = useCallback(
    (e: React.PointerEvent) => {
      if (!active) return;
      const p = screenToAnchor(e.clientX, e.clientY);
      if (!p) return;
      (e.target as Element).setPointerCapture?.(e.pointerId);
      setDrawing([p]);
    },
    [active]
  );

  const move = useCallback(
    (e: React.PointerEvent) => {
      if (!active || !drawing) return;
      const p = screenToAnchor(e.clientX, e.clientY);
      if (!p) return;
      // Thin the stream: a pointer fires far more often than a stroke needs,
      // and every extra point is bytes on the channel for a line nobody can
      // see the difference in.
      const last = drawing[drawing.length - 1];
      if (last && last.s === p.s && Math.hypot(p.x - last.x, p.y - last.y) < 0.004) {
        return;
      }
      setDrawing([...drawing, p]);
    },
    [active, drawing]
  );

  const end = useCallback(() => {
    if (drawing && drawing.length > 1) onStroke(drawing);
    setDrawing(null);
  }, [drawing, onStroke]);

  const live = strokes.filter((s) => now - s.at < LIFETIME_MS);

  return (
    <div
      ref={setHost}
      onPointerDown={start}
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={end}
      className={cn(
        "absolute inset-0 z-20",
        // Inert unless drawing — otherwise the layer would eat every click on
        // the lesson underneath, including every exercise input.
        active ? "cursor-crosshair touch-none" : "pointer-events-none"
      )}
    >
      <svg className="h-full w-full overflow-visible">
        {host
          ? [...live, ...(drawing ? [{ id: "live", points: drawing, role, at: now }] : [])].map(
              (stroke) => {
                const pts = stroke.points
                  .map((p) => anchorToScreen(p, host))
                  .filter((p): p is { x: number; y: number } => p !== null);
                if (pts.length === 0) return null;
                const age = now - stroke.at;
                const opacity =
                  age < FADE_AFTER_MS
                    ? 0.9
                    : Math.max(0, 0.9 * (1 - (age - FADE_AFTER_MS) / (LIFETIME_MS - FADE_AFTER_MS)));
                return (
                  <path
                    key={stroke.id}
                    d={toPath(pts)}
                    fill="none"
                    // Tutor and student get different colours for the same
                    // reason their highlights do — you must be able to tell
                    // whose mark you are looking at.
                    stroke={
                      stroke.role === "tutor" ? "var(--color-accent)" : "var(--color-primary-500)"
                    }
                    strokeWidth={3}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={opacity}
                    style={{ transition: "opacity 200ms linear" }}
                  />
                );
              }
            )
          : null}
      </svg>
    </div>
  );
}
