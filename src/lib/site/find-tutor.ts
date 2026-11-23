// Where a student goes to find a tutor: the website directory, opened on the
// "help me choose" questions (?match=1). Their placement level, when we know
// it, is passed along so that question is already answered.
//
// One helper so the dashboard, the sidebar and the join-code card can't drift
// apart again — two of them pointed at francolink.net/teachers, which 404s.

import { siteUrl } from "@/lib/site/hosts";

const CEFR = new Set(["A1", "A2", "B1", "B2", "C1", "C2"]);

export function findTutorUrl(level?: string | null): string {
  const p = new URLSearchParams({ match: "1" });
  const lv = (level || "").toUpperCase();
  if (CEFR.has(lv)) p.set("level", lv);
  return siteUrl(`/tutors?${p.toString()}`);
}
