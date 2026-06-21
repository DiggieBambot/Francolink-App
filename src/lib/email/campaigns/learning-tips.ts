// src/lib/email/campaigns/learning-tips.ts
//
// "Learning tips" drip sequence. One email per step, spaced out by dayOffset
// (days since signup). Every tip teaches something genuinely useful AND ends
// with a soft, escalating nudge toward Premium — the last one is the hard ask.
//
// The daily cron (src/app/api/cron/learning-tips/route.ts) figures out which
// step is due for each learner and sends at most one per run.

import { emailShell, escapeHtml, APP_URL } from "@/lib/email/shell";

export const CAMPAIGN = "learning-tips";

/** Pretty language name from the users.learning_language code. */
const LANG_NAME: Record<string, string> = {
  fr: "French",
  es: "Spanish",
  de: "German",
  en: "English",
};

export function languageName(code?: string | null): string {
  return (code && LANG_NAME[code]) || "your target language";
}

export interface TipArgs {
  firstName: string;
  /** Pretty language name, e.g. "French". */
  lang: string;
  /** Absolute unsubscribe URL (omit for previews). */
  unsubscribeUrl?: string;
}

export interface RenderedTip {
  subject: string;
  text: string;
  html: string;
}

/** Internal: assemble a tip into subject/text/html with the shared shell. */
function build(args: {
  firstName: string;
  unsubscribeUrl?: string;
  subject: string;
  paras: string[];
  ctaHref: string;
  ctaText: string;
}): RenderedTip {
  const { firstName, unsubscribeUrl, subject, paras, ctaHref, ctaText } = args;

  const bodyHtml = paras
    .map((p) => `<p style="margin:0 0 14px 0;">${p}</p>`)
    .join("\n");

  // Plain-text twin: strip the <strong> tags we allow in paragraphs.
  const textBody = paras.map((p) => p.replace(/<\/?strong>/g, "")).join("\n\n");
  const text = `Hi ${firstName},

${textBody}

${ctaText}: ${ctaHref}

À bientôt,
— Njinu
Tutor at Francolink
${unsubscribeUrl ? `\nUnsubscribe from tips: ${unsubscribeUrl}` : ""}`;

  const html = emailShell({ firstName, bodyHtml, ctaHref, ctaText, unsubscribeUrl });
  return { subject, text, html };
}

export interface CampaignStep {
  step: number;
  /** Send once the user is at least this many days past signup. */
  dayOffset: number;
  render: (args: TipArgs) => RenderedTip;
}

// NOTE: lang is already escaped at the call site? No — escape here, since it
// comes from a fixed map it's safe, but escapeHtml keeps it defensive.
export const STEPS: CampaignStep[] = [
  {
    step: 1,
    dayOffset: 0,
    render: ({ firstName, lang, unsubscribeUrl }) =>
      build({
        firstName,
        unsubscribeUrl,
        subject: `Tip #1: the 15-minute rule for learning ${escapeHtml(lang)}`,
        paras: [
          `I'm Njinu, one of the tutors here. Over the next couple of weeks I'll send you a handful of short, practical tips for learning ${escapeHtml(lang)} — no fluff, just the things that actually move the needle.`,
          `Tip #1: <strong>15 focused minutes a day beats a 2-hour binge once a week.</strong> Your brain consolidates language while you sleep, so daily contact — even tiny — compounds far faster than the occasional marathon.`,
          `Pick a fixed moment (morning coffee, the commute, before bed) and do one short lesson. That's it. Want to start your streak right now?`,
        ],
        ctaHref: `${APP_URL}/dashboard`,
        ctaText: "Do today's lesson",
      }),
  },
  {
    step: 2,
    dayOffset: 3,
    render: ({ firstName, lang, unsubscribeUrl }) =>
      build({
        firstName,
        unsubscribeUrl,
        subject: `Tip #2: learn the words that do 80% of the work`,
        paras: [
          `Njinu again. Here's something most ${escapeHtml(lang)} courses get backwards.`,
          `Tip #2: <strong>The 1,000 most common words make up around 80% of everyday speech.</strong> You don't need a huge vocabulary to start understanding and being understood — you need the <em>right</em> small one first.`,
          `That's exactly why our lessons are sequenced by real frequency, so the first words you learn are the ones you'll actually hear and use. If you haven't taken the 90-second placement test yet, that's what tailors the order to you.`,
        ],
        ctaHref: `${APP_URL}/placement-test`,
        ctaText: "Take the placement test",
      }),
  },
  {
    step: 3,
    dayOffset: 6,
    render: ({ firstName, lang, unsubscribeUrl }) =>
      build({
        firstName,
        unsubscribeUrl,
        subject: `Tip #3: turn dead time into ${escapeHtml(lang)} time`,
        paras: [
          `Tip #3: <strong>Immersion doesn't require moving abroad.</strong> Switch your phone's language to ${escapeHtml(lang)}, follow a couple of creators in it, put on a playlist or podcast while you cook or commute.`,
          `You won't catch every word — that's fine. Passive exposure trains your ear for rhythm and the sounds of the language, so when you sit down to study, things start "clicking" instead of feeling foreign.`,
          `Pair 10 minutes of passive listening with one focused lesson and you've doubled your daily contact with almost no extra effort.`,
        ],
        ctaHref: `${APP_URL}/dashboard`,
        ctaText: "Continue learning",
      }),
  },
  {
    step: 4,
    dayOffset: 10,
    render: ({ firstName, lang, unsubscribeUrl }) =>
      build({
        firstName,
        unsubscribeUrl,
        subject: `Tip #4: speak from day one (yes, badly)`,
        paras: [
          `Tip #4: <strong>Output beats perfection.</strong> The single biggest thing separating people who get fluent from people who stall is that the fluent ones <em>start speaking early</em> — mistakes and all.`,
          `You don't need a conversation partner on call or the courage to corner a stranger. Francolink's AI conversation partner lets you practise speaking ${escapeHtml(lang)} any time, with zero embarrassment, and it nudges you when you slip.`,
          `Premium unlocks unlimited conversation practice plus access to live human tutors (people like me) when you want real feedback.`,
        ],
        ctaHref: `${APP_URL}/pricing`,
        ctaText: "See what Premium unlocks",
      }),
  },
  {
    step: 5,
    dayOffset: 14,
    render: ({ firstName, lang, unsubscribeUrl }) =>
      build({
        firstName,
        unsubscribeUrl,
        subject: `Tip #5: review beats cram (the forgetting curve)`,
        paras: [
          `Tip #5: <strong>You forget most of what you learn within days — unless you review at the right moment.</strong> This is the "forgetting curve", and spaced repetition is the fix: revisit a word just as you're about to forget it and it sticks for far longer.`,
          `The good news is you don't have to manage this yourself. Francolink schedules reviews of your weaker ${escapeHtml(lang)} words automatically, so the time you spend actually turns into long-term memory instead of leaking away.`,
          `Two weeks in — how's the streak holding up? Keep it going today.`,
        ],
        ctaHref: `${APP_URL}/dashboard`,
        ctaText: "Review today",
      }),
  },
  {
    step: 6,
    dayOffset: 20,
    render: ({ firstName, lang, unsubscribeUrl }) =>
      build({
        firstName,
        unsubscribeUrl,
        subject: `${escapeHtml(firstName)}, ready to go all the way to fluency?`,
        paras: [
          `You've had a couple of weeks with ${escapeHtml(lang)} and a fistful of tips from me. If any of it has stuck, here's my honest pitch.`,
          `<strong>Premium is built for the long game.</strong> It unlocks all four CEFR levels (A1 → B2), every lesson, unlimited AI conversation practice, and live tutors when you want a real person in your corner. It's the difference between dabbling and actually getting fluent.`,
          `If you've got a question about which plan fits your level or budget, just hit reply — I read every email. Otherwise, the plans are right here.`,
        ],
        ctaHref: `${APP_URL}/pricing`,
        ctaText: "Go Premium",
      }),
  },
];

/** Look up a step by its 1-based number. */
export function getStep(step: number): CampaignStep | undefined {
  return STEPS.find((s) => s.step === step);
}
