// Lesson email: booked, cancelled, and the reminders in between.
//
// Split out of transactional.ts because these four share one awkward
// requirement the account emails don't have — every one of them states a TIME,
// and the time has to be right for the person reading it. A tutor in Lyon and
// a student in Montreal get different sentences about the same lesson, so the
// formatting is a parameter here rather than an assumption.
//
// Renderers are pure so the preview route can show them without sending.

import { emailShell, escapeHtml, APP_URL } from "@/lib/email/shell";
import type { RenderedEmail } from "@/lib/email/transactional";

export interface LessonEmailFacts {
  /** Already formatted in the RECIPIENT's timezone. */
  whenLong: string;
  /** Short form for subject lines: "Tue 2 Sep, 14:00". */
  whenShort: string;
  /** The other participant's display name. */
  otherName: string;
  durationMinutes: number;
  /** Where the lesson happens — the room URL. */
  joinUrl: string;
}

function factsBlock(f: LessonEmailFacts): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f8fafc;border-radius:10px;padding:16px;margin:0 0 20px 0;">
    <tr><td style="font-size:15px;color:#0f2744;line-height:1.7;">
      <b>${escapeHtml(f.whenLong)}</b><br/>
      ${f.durationMinutes} minutes with ${escapeHtml(f.otherName)}
    </td></tr>
  </table>`;
}

/* ------------------------------------------------------------- booked ---- */

export function renderLessonBooked(
  firstName: string,
  f: LessonEmailFacts,
  audience: "tutor" | "student"
): RenderedEmail {
  const lead =
    audience === "tutor"
      ? `<b>${escapeHtml(f.otherName)}</b> booked a lesson with you.`
      : `Your lesson with <b>${escapeHtml(f.otherName)}</b> is confirmed.`;

  const bodyHtml =
    `<p style="margin:0 0 16px 0;font-size:16px;">${lead}</p>
     ${factsBlock(f)}
     <p style="margin:0 0 16px 0;font-size:16px;">The invite is attached — open it to drop this lesson into your calendar. Your calendar app will then remind you itself.</p>
     <p style="margin:0 0 16px 0;font-size:15px;color:#475569;">Plans change: either of you can cancel free up to 12 hours before.</p>`;

  const text =
    `${audience === "tutor" ? `${f.otherName} booked a lesson with you.` : `Your lesson with ${f.otherName} is confirmed.`}\n\n` +
    `${f.whenLong} — ${f.durationMinutes} minutes.\n\nJoin here: ${f.joinUrl}\n\n` +
    `Free cancellation up to 12 hours before.`;

  return {
    subject: `Lesson confirmed — ${f.whenShort}`,
    html: emailShell({ firstName, bodyHtml, ctaHref: f.joinUrl, ctaText: "Open the lesson room" }),
    text,
  };
}

/* ---------------------------------------------------------- cancelled ---- */

export function renderLessonCancelled(
  firstName: string,
  f: LessonEmailFacts,
  audience: "tutor" | "student",
  /** Did the person reading this cancel it themselves? */
  byRecipient: boolean,
  /** Wording for what happened to the money — the route already decided. */
  outcome: string
): RenderedEmail {
  const lead = byRecipient
    ? `You cancelled your lesson with <b>${escapeHtml(f.otherName)}</b>.`
    : `<b>${escapeHtml(f.otherName)}</b> cancelled your lesson.`;

  const next =
    audience === "student"
      ? `<p style="margin:0 0 16px 0;font-size:16px;">Pick another time whenever you're ready.</p>`
      : `<p style="margin:0 0 16px 0;font-size:16px;">The slot is back in your availability.</p>`;

  const bodyHtml =
    `<p style="margin:0 0 16px 0;font-size:16px;">${lead}</p>
     ${factsBlock(f)}
     <p style="margin:0 0 16px 0;font-size:15px;color:#475569;">${escapeHtml(outcome)}</p>
     ${next}`;

  const ctaHref = audience === "student" ? `${APP_URL}/book` : `${APP_URL}/tutor/availability`;

  return {
    subject: `Lesson cancelled — ${f.whenShort}`,
    html: emailShell({
      firstName,
      bodyHtml,
      ctaHref,
      ctaText: audience === "student" ? "Book another lesson" : "Check my availability",
    }),
    text:
      `${byRecipient ? "You cancelled" : `${f.otherName} cancelled`} the lesson on ${f.whenLong}.\n\n` +
      `${outcome}\n\n${ctaHref}`,
  };
}

/* ----------------------------------------------------------- reminder ---- */

/**
 * The day-before nudge. There is no email for the 15-minute reminder — nobody
 * reads mail in the two minutes before a lesson, so that one is push only.
 */
export function renderLessonReminder(
  firstName: string,
  f: LessonEmailFacts,
  audience: "tutor" | "student"
): RenderedEmail {
  const bodyHtml =
    `<p style="margin:0 0 16px 0;font-size:16px;">A quick reminder — you have a lesson tomorrow.</p>
     ${factsBlock(f)}
     ${
       audience === "student"
         ? `<p style="margin:0 0 16px 0;font-size:16px;">Bring a question or two; it's the fastest way to spend the time well.</p>`
         : `<p style="margin:0 0 16px 0;font-size:16px;">Your student's notes and past homework are in the room.</p>`
     }
     <p style="margin:0 0 16px 0;font-size:15px;color:#475569;">Can't make it? Cancelling now is still free — inside 12 hours it isn't.</p>`;

  return {
    subject: `Tomorrow: your lesson at ${f.whenShort}`,
    html: emailShell({ firstName, bodyHtml, ctaHref: f.joinUrl, ctaText: "Open the lesson room" }),
    text: `Reminder: you have a lesson with ${f.otherName} on ${f.whenLong}. Join here: ${f.joinUrl}`,
  };
}
