"use client";

// Records a page-level tutor marketplace step (directory or profile view) once
// the page has actually loaded in a browser -- server renders, ISR and link
// prefetches never count.
import { useEffect } from "react";
import { trackTutorEvent, type TutorEventKind } from "@/lib/analytics/tutor-track";

export function TrackTutorEvent({ kind, slug }: { kind: TutorEventKind; slug?: string }) {
  useEffect(() => {
    trackTutorEvent(kind, slug);
  }, [kind, slug]);
  return null;
}
