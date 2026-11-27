// "Speak" sequence: a short run of student emails about the two ways to
// practise speaking on FrancoLink, live lessons with a tutor and Léon (the AI
// tutor). Approved 2026-11-26.
//
// It does not run on its own schedule. The engagement cron (hourly, 10am local
// on Tue/Thu/Sun) asks nextSpeakStep() for each student and, when a step is
// due, sends it in place of that run's general nudge. So these emails share the
// engagement caps (3 a week, 36h apart) and never add to a student's volume.
//
// Tracks, in order, per plan:
//   Premium / Premium+ : L1 → L2 → T1 → T2   (at most 4 emails)
//   Free               : T1 → T2 → F1        (at most 3 emails)
// A step is dropped for good once its goal is met: Léon steps once the student
// has started a Léon session, tutor steps once they have booked a lesson or
// bought a lesson plan or credits. Students with an active tutor connection
// skip the tutor steps, because the engagement cron already sends them the
// "book your first lesson with <tutor>" nudge.
//
// Copy rules (site-brief.md): no free trial, no free AI, tutors are "vetted by
// a live teaching demo", no invented stats, no em dashes, "practise" as verb.

import { emailShell, escapeHtml, APP_URL } from "@/lib/email/shell";
import { SITE_URL } from "@/lib/site/hosts";

export const SPEAK_CAMPAIGN = "speak";

export type SpeakStepKey = "L1" | "L2" | "T1" | "T2" | "F1";

/** Ledger step numbers in email_campaign_sends (campaign 'speak'). */
export const SPEAK_STEP_NUMBER: Record<SpeakStepKey, number> = { L1: 1, L2: 2, T1: 3, T2: 4, F1: 5 };

const DAY = 86400_000;

/** Free students start only once the learning-tips drip (day 0 to 20) is over. */
export const FREE_START_DAY = 21;
/** Premium students start two days after signup at the earliest. */
export const PREMIUM_START_DAY = 2;

/** Minimum days since the previous speak email before this step can go. */
const GAP_DAYS: Record<SpeakStepKey, number> = { L1: 0, L2: 4, T1: 5, T2: 5, F1: 5 };

export type SpeakPlan = "FREE" | "PREMIUM" | "PREMIUM_PLUS";

export interface SpeakSignals {
  firstName: string;
  /** Display name of the language being learned, e.g. "French". */
  lang: string;
  plan: SpeakPlan;
  accountAgeDays: number;
  /** Has started at least one Léon session. */
  usedLeon: boolean;
  /** Has a real booking, an active lesson plan, or lesson credits. */
  hasLiveLessons: boolean;
  /** Has an active tutor connection (gets the first_lesson nudge instead). */
  hasTutorLink: boolean;
  /** Speak steps already sent, with the time each went out. */
  sent: Partial<Record<SpeakStepKey, number>>;
}

function trackFor(plan: SpeakPlan): SpeakStepKey[] {
  return plan === "FREE" ? ["T1", "T2", "F1"] : ["L1", "L2", "T1", "T2"];
}

/** Is this step still worth sending to this student at all? */
function applies(step: SpeakStepKey, s: SpeakSignals): boolean {
  switch (step) {
    case "L1": return s.plan !== "FREE" && !s.usedLeon;
    case "L2": return s.plan !== "FREE" && !s.usedLeon && s.sent.L1 != null;
    case "T1": return !s.hasLiveLessons && !s.hasTutorLink;
    case "T2": return !s.hasLiveLessons && !s.hasTutorLink && s.sent.T1 != null;
    case "F1": return s.plan === "FREE";
  }
}

/**
 * The step to send this run, or null (nothing due yet, or sequence finished).
 * Pure: the cron supplies the signals and `now`.
 */
export function nextSpeakStep(s: SpeakSignals, now: number): SpeakStepKey | null {
  const startDay = s.plan === "FREE" ? FREE_START_DAY : PREMIUM_START_DAY;
  if (s.accountAgeDays < startDay) return null;

  const times = Object.values(s.sent).filter((t): t is number => t != null);
  const last = times.length ? Math.max(...times) : null;

  for (const step of trackFor(s.plan)) {
    if (s.sent[step] != null) continue;
    if (!applies(step, s)) continue;
    if (last != null && now - last < GAP_DAYS[step] * DAY) return null; // wait
    return step;
  }
  return null;
}

// ── Rendering ────────────────────────────────────────────────────────────────

export interface RenderedEmail { subject: string; html: string; text: string; }

const LEON_URL = `${APP_URL}/student/ai-tutor`;
const UPGRADE_URL = `${APP_URL}/upgrade-plus`;
const TUTORS_URL = `${SITE_URL}/tutors`;

function build(
  firstName: string,
  subject: string,
  paras: string[],
  ctaText: string,
  ctaHref: string,
  unsubscribeUrl?: string
): RenderedEmail {
  const bodyHtml = paras.map((p) => `<p style="margin:0 0 16px 0;font-size:16px;">${p}</p>`).join("");
  const plain = (h: string) =>
    h.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">");
  const text =
    `Hi ${plain(firstName)},\n\n${paras.map(plain).join("\n\n")}\n\n${ctaText}: ${ctaHref}` +
    (unsubscribeUrl ? `\n\nUnsubscribe: ${unsubscribeUrl}` : "");
  return {
    subject,
    html: emailShell({ firstName, bodyHtml, ctaHref, ctaText, unsubscribeUrl, unsubscribeLabel: "Unsubscribe from these emails" }),
    text,
  };
}

export function renderSpeak(
  step: SpeakStepKey,
  s: Pick<SpeakSignals, "firstName" | "lang" | "plan">,
  unsubscribeUrl?: string
): RenderedEmail {
  const name = escapeHtml(s.firstName);
  const lang = escapeHtml(s.lang);
  const minutes = s.plan === "PREMIUM_PLUS" ? 45 : 15;

  switch (step) {
    case "L1":
      return build(
        name,
        `Léon is ready for your first ${minutes} minutes of ${s.lang}`,
        [
          `Your plan includes speaking practice with Léon, FrancoLink's AI tutor. You talk out loud, he answers out loud, and he corrects you as you go.`,
          `You have ${minutes} minutes a day with him. A good first session: tell him your name, where you live and why you're learning ${lang}. He keeps the conversation at your level.`,
          `There's no wrong way to start. Press the microphone and say hello.`,
        ],
        "Talk to Léon",
        LEON_URL,
        unsubscribeUrl
      );
    case "L2":
      return build(
        name,
        `Say five sentences in ${s.lang} today`,
        [
          `Five sentences out loud is a good day of practice, and Léon can help you find them.`,
          `Open a session and ask him to practise one situation with you: ordering a coffee, introducing yourself at work, asking for directions. He plays the other person, and at the end he gives you a short recap of what to work on.`,
          `Your ${minutes} minutes come back every day, so today's are waiting for you.`,
        ],
        "Start a session",
        LEON_URL,
        unsubscribeUrl
      );
    case "T1":
      return build(
        name,
        `What a 50-minute ${s.lang} lesson with a tutor is like`,
        [
          `A live lesson on FrancoLink is 50 minutes, one to one, on video with a tutor. For most of it, you're the one speaking.`,
          `Your tutor works out your level, picks a topic that's useful to you and corrects you while you talk, so you hear the right version straight away.`,
          `To try it, there's a starter pack: 3 lessons for $24 with a Community tutor, or $54 with a Professional tutor. It's a one-off purchase, not a subscription.`,
        ],
        "Find a tutor",
        TUTORS_URL,
        unsubscribeUrl
      );
    case "T2":
      return build(
        name,
        `Choose your ${s.lang} tutor by their teaching demo`,
        [
          `Every FrancoLink tutor is vetted by a live teaching demo before they take students. Their profile shows what they teach, who they teach and when they're free.`,
          `Community tutors start from $10 a lesson ($8 on a yearly plan). Professional tutors start from $25 a lesson ($20 on a yearly plan). Not sure which suits you? The 3-lesson starter pack lets you try before you choose a plan.`,
          `When you find someone you like, pick a time from their calendar and book it there.`,
        ],
        "Browse tutors",
        TUTORS_URL,
        unsubscribeUrl
      );
    case "F1":
      return build(
        name,
        `Practise speaking ${s.lang} out loud, every day`,
        [
          `Lessons and vocabulary take you a long way, but speaking is what makes ${lang} feel usable. The hard part is finding someone to practise with every day.`,
          `That's what Léon is for. He's FrancoLink's AI tutor: you speak, he answers, and he corrects you as you go, at your level and on any topic you like.`,
          `Léon comes with Premium, which gives you 15 minutes a day with him (3 hours a month). Premium+ gives you 45 minutes a day.`,
        ],
        "See Premium",
        UPGRADE_URL,
        unsubscribeUrl
      );
  }
}

export const SPEAK_STEPS: SpeakStepKey[] = ["L1", "L2", "T1", "T2", "F1"];
