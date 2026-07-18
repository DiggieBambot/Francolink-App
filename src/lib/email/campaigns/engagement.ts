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

// ── Tutor track ──────────────────────────────────────────────────────────────
// Behavioural (time-sensitive) types + rotating value themes.
export type TutorMessageType =
  | "requests" | "winback_tutor" | "assign"                       // behavioural
  | "whats_new" | "commission" | "materials_free" | "features" | "teaching_easy"; // value

/** Rotating value themes — cycled so tutors get varied content each send. */
export const TUTOR_VALUE_THEMES: TutorMessageType[] = [
  "whats_new", "commission", "materials_free", "features", "teaching_easy",
];

export interface TutorSignals {
  firstName: string;
  daysSinceSeen: number;
  studentCount: number;
  pendingRequests: number;
  daysSinceLastAssign: number; // Infinity if never assigned homework
}

export interface TutorExtras {
  newLessonCount?: number;
  newLessonSamples?: string[];
}

// Behaviour takes priority; otherwise send the rotated value theme.
export function pickTutorMessage(s: TutorSignals, rotationTheme: TutorMessageType): TutorMessageType | null {
  if (s.pendingRequests > 0) return "requests";
  if (s.daysSinceSeen >= 10) return "winback_tutor";
  if (s.studentCount > 0 && s.daysSinceLastAssign >= 14) return "assign";
  if (s.daysSinceSeen < 1) return null;              // active today — skip
  return rotationTheme;
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

export function renderTutor(type: TutorMessageType, s: TutorSignals, unsubscribeUrl?: string, extras: TutorExtras = {}): RenderedEmail {
  const name = escapeHtml(s.firstName);
  const students = `${APP_URL}/tutor/students`;
  const library = `${APP_URL}/library`;

  switch (type) {
    // ── Behavioural ──────────────────────────────────────────────────────────
    case "requests":
      return build(
        name,
        `${s.pendingRequests} student${s.pendingRequests === 1 ? "" : "s"} waiting to join your class`,
        [
          `You have <b>${s.pendingRequests} pending request${s.pendingRequests === 1 ? "" : "s"}</b> from student${s.pendingRequests === 1 ? "" : "s"} who want to learn with you.`,
          `Accept them from your Students tab and you can start sending lessons and homework right away.`,
        ],
        "Review requests", students, unsubscribeUrl
      );
    case "winback_tutor":
      return build(
        name,
        `Your students are ready when you are`,
        [
          `It's been a little while! Your students learn best with regular live sessions.`,
          `Hop back in, open your classroom, and run a quick lesson — even 15 minutes keeps them moving.`,
        ],
        "Open my classroom", `${APP_URL}/tutor`, unsubscribeUrl
      );
    case "assign":
      return build(
        name,
        `Keep your students practising between lessons`,
        [
          `A few homework questions after a lesson really cement what your students learn — and it's two clicks.`,
          `Open any library lesson, hit <b>Send homework</b>, pick your students, and their answers come back to your Homework tab for feedback.`,
        ],
        "Send homework", library, unsubscribeUrl
      );

    // ── Value themes ─────────────────────────────────────────────────────────
    case "whats_new": {
      const n = extras.newLessonCount || 0;
      const samples = (extras.newLessonSamples || []).slice(0, 3);
      const sampleLine = samples.length ? ` including <b>${samples.map(escapeHtml).join("</b>, <b>")}</b>` : "";
      return build(
        name,
        `🆕 ${n} new lesson${n === 1 ? "" : "s"} added to your library`,
        [
          `We just added <b>${n} fresh lesson${n === 1 ? "" : "s"}</b>${sampleLine} — all ready to teach, no prep.`,
          `Pick one for your next session, or send it to a student as homework. New materials land regularly, so there's always something to keep your classes fresh.`,
        ],
        "Browse new lessons", library, unsubscribeUrl
      );
    }
    case "commission":
      return build(
        name,
        `Turn your students into recurring income 💸`,
        [
          `Every student you bring to FrancoLink who upgrades earns you <b>10% commission every month</b> — recurring, on top of your teaching.`,
          `Share your invite link, build your class, and watch it add up. Your link is in the Students tab.`,
        ],
        "Get my invite link", students, unsubscribeUrl
      );
    case "materials_free":
      return build(
        name,
        `Ready-made lessons — free for you to teach with`,
        [
          `Every lesson in our library is <b>free for you to use</b>: structured, CEFR-aligned, with tutor notes, examples and answers built in.`,
          `No slides to make, no worksheets to hunt down. Open a lesson and teach — we've done the prep.`,
        ],
        "Explore the library", library, unsubscribeUrl
      );
    case "features":
      return build(
        name,
        `Everything you need to run your class, in one place`,
        [
          `Your teaching toolkit keeps growing: a <b>live classroom link</b> to share like a meeting, <b>send-homework</b> with feedback, and automatic <b>progress tracking</b> for every student.`,
          `It all works together — teach live, assign practice, see who's keeping up, right from your dashboard.`,
        ],
        "See my dashboard", `${APP_URL}/tutor`, unsubscribeUrl
      );
    case "teaching_easy":
    default:
      return build(
        name,
        `Teach more, prep less`,
        [
          `Planning eats a tutor's time. Our materials do the heavy lifting — pick a lesson, share your classroom link, teach live, then send homework in two clicks.`,
          `Your students progress and stay motivated; you focus on the teaching, not the busywork.`,
        ],
        "Start a lesson", library, unsubscribeUrl
      );
  }
}
