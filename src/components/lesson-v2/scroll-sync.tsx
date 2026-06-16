"use client";

import { useEffect, useRef } from "react";
import { useLessonRoom } from "./lesson-room-context";

/**
 * Mount-once inside a LessonRoomProvider. The tutor drives the shared view:
 * as the tutor scrolls, the topmost visible section and the fraction scrolled
 * within it are broadcast; the student's window follows to the same spot.
 *
 * Anchoring on a section element (rather than a raw scrollY) keeps the views
 * aligned even though the two panels have different heights — the tutor sees
 * teacher notes and answer keys the student does not.
 */
export function ScrollSync() {
  const room = useLessonRoom();
  const role = room?.currentRole;
  const broadcastScroll = room?.broadcastScroll;
  const incoming = room?.incomingScroll;

  // Tutor: report scroll position (throttled via rAF).
  const ticking = useRef(false);
  useEffect(() => {
    if (role !== "tutor" || !broadcastScroll) return;

    const report = () => {
      ticking.current = false;
      const sections = Array.from(
        document.querySelectorAll<HTMLElement>("[data-section-idx]")
      );
      if (sections.length === 0) return;
      // Anchor line ~ 25% down the viewport.
      const anchorY = window.innerHeight * 0.25;
      let chosen = sections[0];
      for (const el of sections) {
        if (el.getBoundingClientRect().top <= anchorY) chosen = el;
        else break;
      }
      const idx = Number(chosen.dataset.sectionIdx || "0");
      const rect = chosen.getBoundingClientRect();
      const frac = rect.height > 0 ? Math.min(1, Math.max(0, (anchorY - rect.top) / rect.height)) : 0;
      broadcastScroll(idx, frac);
    };

    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(report);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [role, broadcastScroll]);

  // Student: follow the tutor's broadcast position.
  const lastApplied = useRef(0);
  useEffect(() => {
    if (role === "tutor" || !incoming || incoming.at === lastApplied.current) return;
    lastApplied.current = incoming.at;
    const el = document.querySelector<HTMLElement>(
      `[data-section-idx="${incoming.idx}"]`
    );
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const anchorY = window.innerHeight * 0.25;
    // Current document top of the section + how far into it the tutor is.
    const sectionTop = rect.top + window.scrollY;
    const target = sectionTop + incoming.frac * rect.height - anchorY;
    window.scrollTo({ top: Math.max(0, target), behavior: "smooth" });
  }, [role, incoming]);

  return null;
}
