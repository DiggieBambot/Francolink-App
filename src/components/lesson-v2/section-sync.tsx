"use client";

import { useEffect } from "react";
import { useLessonRoom } from "./lesson-room-context";

/**
 * Mount-once inside a LessonRoomProvider. Watches `currentSectionIdx` and
 * smooth-scrolls the page to that section element. The tutor broadcasts the
 * value via Next-step controls; both sides follow it.
 */
export function SectionSync() {
  const room = useLessonRoom();
  useEffect(() => {
    if (!room || room.currentSectionIdx == null) return;
    const el = document.getElementById(`section-${room.currentSectionIdx}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [room?.currentSectionIdx]);
  return null;
}
