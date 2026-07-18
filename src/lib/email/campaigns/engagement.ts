// Ongoing engagement campaign (separate from the one-time learning-tips drip).
// Runs a few times a week and picks the MOST RELEVANT nudge per user from their
// activity signals, rather than sending everyone the same thing.

import { emailShell, escapeHtml, APP_URL } from "@/lib/email/shell";

export const CAMPAIGN = "engagement";

export type MessageType = "homework" | "winback" | "nudge" | "streak" | "discover";

export interface UserSignals {
  firstName: string;
  lang: string;              // display language name, e.g. "French"
  daysSinceSeen: number;     // Infinity if never seen
  streak: number;
  hasPendingHomework: boolean;
}

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

/** Choose the single best message for a user, or null to skip this run. */
export function pickMessage(s: UserSignals): MessageType | null {
  if (s.hasPendingHomework) return "homework";
  if (s.daysSinceSeen < 1) return null;            // active today — don't nag
  if (s.daysSinceSeen >= 7) return "winback";
  if (s.daysSinceSeen >= 2) return "nudge";
  if (s.streak >= 2) return "streak";
  return "discover";
}

function build(firstName: string, subject: string, paras: string[], ctaText: string, ctaHref: string, unsubscribeUrl?: string): RenderedEmail {
  const bodyHtml = paras.map((p) => `<p style="margin:0 0 16px 0;font-size:16px;">${p}</p>`).join("");
  const text = `Hi ${firstName},\n\n${paras.map((p) => p.replace(/<[^>]+>/g, "")).join("\n\n")}\n\n${ctaText}: ${ctaHref}`;
  return { subject, html: emailShell({ firstName, bodyHtml, ctaHref, ctaText, unsubscribeUrl }), text };
}

export function render(type: MessageType, s: UserSignals, unsubscribeUrl?: string): RenderedEmail {
  const name = escapeHtml(s.firstName);
  const lang = escapeHtml(s.lang);
  const dash = `${APP_URL}/dashboard`;

  switch (type) {
    case "homework":
      return build(
        name,
        `${name}, you have homework waiting ✍️`,
        [
          `Your tutor sent you homework — a few quick questions to lock in what you learned.`,
          `It only takes a few minutes, and your tutor sees your answers and replies with feedback. Nice way to show up between lessons.`,
        ],
        "Do my homework",
        `${APP_URL}/student/homework`,
        unsubscribeUrl
      );
    case "winback":
      return build(
        name,
        `We miss you — pick your ${lang} back up in 5 minutes`,
        [
          `It's been a little while! The hardest part of learning ${lang} is just showing up — and you already started.`,
          `Jump back in with one short lesson today. Five minutes is enough to get the momentum going again.`,
        ],
        `Resume my ${s.lang}`,
        dash,
        unsubscribeUrl
      );
    case "nudge":
      return build(
        name,
        `A 5-minute ${lang} lesson for today?`,
        [
          `Little and often beats long and rare. One short lesson today keeps your ${lang} moving forward.`,
          `Pick something that looks fun — a conversation, food, travel — and give it five minutes.`,
        ],
        "Start a lesson",
        dash,
        unsubscribeUrl
      );
    case "streak":
      return build(
        name,
        `Keep your ${s.streak}-day streak alive 🔥`,
        [
          `You're on a <b>${s.streak}-day streak</b> — that's exactly how fluency is built. Don't let it slip today!`,
          `One quick lesson keeps the fire going. You've got this.`,
        ],
        "Keep my streak",
        dash,
        unsubscribeUrl
      );
    case "discover":
    default:
      return build(
        name,
        `Something new to try in ${lang} today`,
        [
          `Ready for something fresh? There are new ${lang} lessons across conversation, travel, business and more.`,
          `Browse the library and pick one that catches your eye — then practise it live with your tutor.`,
        ],
        "Explore lessons",
        `${APP_URL}/library`,
        unsubscribeUrl
      );
  }
}
