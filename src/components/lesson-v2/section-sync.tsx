"use client";

import { useEffect, useRef } from "react";
import { useLessonRoom } from "./lesson-room-context";
import { useSoundEngine } from "@/hooks/use-sound-engine";

/**
 * Mount-once inside a LessonRoomProvider. Watches `currentSectionIdx` and
 * smooth-scrolls the page to that section element. The tutor broadcasts the
 * value via Next-step controls; both sides follow it.
 */
export function SectionSync() {
  const room = useLessonRoom();
  const { play } = useSoundEngine();
  const initialMount = useRef(true);
  useEffect(() => {
    if (!room || room.currentSectionIdx == null) return;
    const el = document.getElementById(`section-${room.currentSectionIdx}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    if (initialMount.current) { initialMount.current = false; return; }
    play("phase_change");
  }, [room?.currentSectionIdx, play]);
  return null;
}
