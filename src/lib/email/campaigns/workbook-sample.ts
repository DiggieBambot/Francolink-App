// The free-sample sequence for Le Français Pas à Pas.
//
// Four emails to someone who asked for Partie 0 and has not bought:
//
//   0  at once     the sample itself
//   1  +2 days     one real lesson from the book (être or avoir in the past)
//   2  +2 days     what is in the other parts, and the price
//   3  +3 days     the last one about the book: the guarantee
//   4  +4 days     not the book: a free account and the 90-second level test,
//                  so a lead who won't pay $27 still starts speaking with us
//
// It stops early the moment they buy (the cron checks orders) or unsubscribe.
// No fake deadlines: the sales page's launch price has ended, and an urgency
// line that is not true is worse than none.

import { emailShell } from "@/lib/email/shell";
import { appUrl, siteUrl } from "@/lib/site/hosts";
import { signLinkToken } from "@/lib/email/link-token";

export const CAMPAIGN = "workbook-sample";

/** Leads have no account, so they unsubscribe by lead id, not user id. */
export function leadUnsubscribeUrl(leadId: string): string {
  const t = signLinkToken(leadId, CAMPAIGN);
  return siteUrl(
    `/api/workbook/leads/unsubscribe?l=${encodeURIComponent(leadId)}&t=${encodeURIComponent(t)}`
  );
}

export interface SampleArgs {
  firstName: string;
  unsubscribeUrl?: string;
}

export interface SampleStep {
  /** Days after the previous email before this one is due. */
  afterDays: number;
  render(a: SampleArgs): { subject: string; html: string; text: string };
}

const P = (s: string) => `<p style="margin:0 0 16px 0;font-size:16px;">${s}</p>`;

/** The interactive sample: Partie 0 in the browser, with audio. */
function sampleUrl(): string {
  return siteUrl("/francais-pas-a-pas/sample");
}

function samplePdfUrl(): string {
  return siteUrl("/api/workbook/sample");
}

function salesUrl(content: string): string {
  return siteUrl(
    `/francais-pas-a-pas?utm_source=email&utm_medium=sequence&utm_campaign=${CAMPAIGN}&utm_content=${content}`
  );
}

function wrap(
  a: SampleArgs,
  subject: string,
  paras: string[],
  textParas: string[],
  cta: { href: string; text: string }
) {
  const html = emailShell({
    firstName: a.firstName,
    bodyHtml: paras.map(P).join("\n"),
    ctaHref: cta.href,
    ctaText: cta.text,
    unsubscribeUrl: a.unsubscribeUrl,
    unsubscribeLabel: "Unsubscribe from these emails",
  });
  const text = [
    `Hi ${a.firstName},`,
    "",
    ...textParas.flatMap((p) => [p, ""]),
    `${cta.text}: ${cta.href}`,
    "",
    "— The Francolink Team",
    ...(a.unsubscribeUrl ? ["", `Unsubscribe: ${a.unsubscribeUrl}`] : []),
  ].join("\n");
  return { subject, html, text };
}

export const STEPS: SampleStep[] = [
  {
    afterDays: 0,
    render: (a) =>
      wrap(
        a,
        "Your free chapter: Partie 0 of Le Français Pas à Pas",
        [
          "Here is the sample you asked for: <strong>Partie 0</strong> of <em>Le Français Pas à Pas</em>, exactly as it is in the interactive ebook. It opens in your browser, on your phone too.",
          "Tap any of the twenty survival phrases to <strong>hear it</strong>, play the three dialogues at natural speed and then slowly, and try the exercise: it <strong>marks your answers</strong> as you go.",
          `Prefer paper? Here is the <a href="${samplePdfUrl()}" style="color:#0f2744;">same chapter as a PDF</a>.`,
          "Over the next week I'll send you three more short emails, including one real grammar lesson from later in the book. You can unsubscribe any time with the link at the bottom.",
        ],
        [
          "Here is the sample you asked for: Partie 0 of Le Français Pas à Pas, exactly as it is in the interactive ebook. It opens in your browser.",
          "Tap any phrase to hear it, play the three dialogues at natural speed and slowly, and try the exercise: it marks your answers.",
          `The same chapter as a PDF: ${samplePdfUrl()}`,
          "Over the next week I'll send three more short emails, including one real grammar lesson from later in the book.",
        ],
        { href: sampleUrl(), text: "Open Partie 0 with audio" }
      ),
  },
  {
    afterDays: 2,
    render: (a) =>
      wrap(
        a,
        "Why « je suis allé » but « j'ai mangé »?",
        [
          "Almost every learner asks this, and most are told to memorise a list. Here is the reason instead, the way the workbook gives it.",
          "The passé composé is built from a helper verb plus the past participle. Most verbs use <strong>avoir</strong>: <em>j'ai mangé, tu as fini, elle a pris</em>.",
          "A small group uses <strong>être</strong>: verbs that describe <strong>moving from one place to another</strong> or <strong>a change of state</strong>. <em>Aller, venir, arriver, partir, entrer, sortir, monter, descendre, naître, mourir, devenir, rester</em>, and a few more. You go somewhere: <em>je suis allé</em>. You are born: <em>il est né</em>.",
          "Every reflexive verb uses être too: <em>je me suis levé</em>. And with être the participle agrees with the subject, the way an adjective would: <em>elle est allée</em>, <em>nous sommes partis</em>.",
          "That is one rule out of 45. Each one in the book gets the same treatment: the reason, a real dialogue that uses it, an exercise built on the mistake people actually make, and an answer key that explains.",
        ],
        [
          "Almost every learner asks this. Here is the reason instead of a list.",
          "The passé composé is a helper verb plus the past participle. Most verbs use avoir: j'ai mangé, tu as fini, elle a pris.",
          "A small group uses être: verbs of moving from one place to another or a change of state. Aller, venir, arriver, partir, entrer, sortir, monter, descendre, naître, mourir, devenir, rester. You go somewhere: je suis allé. You are born: il est né.",
          "Every reflexive verb uses être too: je me suis levé. With être the participle agrees with the subject: elle est allée, nous sommes partis.",
          "That is one rule out of 45. Each one in the book gets the reason, a dialogue, an exercise on the real mistake, and an answer key that explains.",
        ],
        { href: salesUrl("lesson"), text: "See all 45 rules" }
      ),
  },
  {
    afterDays: 2,
    render: (a) =>
      wrap(
        a,
        "What comes after Partie 0",
        [
          "Partie 0 gets you talking. The rest of <em>Le Français Pas à Pas</em> is the grammar that lets you build your own sentences instead of reciting someone else's:",
          "<strong>Partie 1</strong> Sounds and foundations: liaison, nasal vowels, être, avoir, questions, negation.<br/><strong>Partie 2</strong> Everyday actions: the three verb groups, the near future, adjectives, the imperative.<br/><strong>Partie 3</strong> Pronouns: le, la, lui, leur, y and en, qui, que, où, dont.<br/><strong>Partie 4</strong> The past: imparfait, passé composé, plus-que-parfait, and how to choose.<br/><strong>Partie 5</strong> The conditional, reported speech and the subjunctive.",
          "You get the PDF to keep, and an interactive ebook that marks your exercises as you go. It's <strong>$27</strong>, one payment, which is less than two lessons with a tutor.",
        ],
        [
          "Partie 0 gets you talking. The rest of the book is the grammar that lets you build your own sentences:",
          "Partie 1 Sounds and foundations: liaison, nasal vowels, être, avoir, questions, negation.\nPartie 2 Everyday actions: the three verb groups, the near future, adjectives, the imperative.\nPartie 3 Pronouns: le, la, lui, leur, y and en, qui, que, où, dont.\nPartie 4 The past: imparfait, passé composé, plus-que-parfait, and how to choose.\nPartie 5 The conditional, reported speech and the subjunctive.",
          "You get the PDF to keep and an interactive ebook that marks your exercises. $27, one payment.",
        ],
        { href: salesUrl("parts"), text: "Get the full workbook" }
      ),
  },
  {
    afterDays: 3,
    render: (a) =>
      wrap(
        a,
        "Last email about the workbook",
        [
          "This is my last email about the workbook, so I'll keep it short.",
          "If you've worked through Partie 0 and want the rest, <em>Le Français Pas à Pas</em> is $27, and it comes with a <strong>14-day money-back guarantee</strong>: if it isn't for you, reply to your receipt and we refund you. No form, and you keep the PDF.",
          "If now isn't the time, that's fine too. Keep the sample. It's yours.",
        ],
        [
          "This is my last email about the workbook.",
          "If you want the rest of the book, it's $27 with a 14-day money-back guarantee: reply to your receipt and we refund you, and you keep the PDF.",
          "If now isn't the time, that's fine. Keep the sample.",
        ],
        { href: salesUrl("last"), text: "Get the full workbook" }
      ),
  },
  {
    afterDays: 4,
    render: (a) =>
      wrap(
        a,
        "Where are you, really? 90 seconds to find out",
        [
          "Partie 0 is only the start, and you don't need the book to keep going.",
          "FrancoLink has a free <strong>90-second level test</strong>. It places you from A1 to C2, and then the free plan gives you a <strong>short lesson every day</strong> at that level, built around speaking, not memorising lists.",
          "When you want to practise out loud, you can book a live tutor, or practise with Léon, our AI tutor, on Premium.",
          "That's the last email in this series. Bonne continuation !",
        ],
        [
          "Partie 0 is only the start, and you don't need the book to keep going.",
          "FrancoLink has a free 90-second level test. It places you from A1 to C2, and the free plan then gives you a short lesson every day at that level, built around speaking.",
          "When you want to practise out loud, book a live tutor, or practise with Léon, our AI tutor, on Premium.",
          "That's the last email in this series. Bonne continuation !",
        ],
        {
          href: appUrl(`/signup?utm_source=email&utm_medium=sequence&utm_campaign=${CAMPAIGN}&utm_content=level_test`),
          text: "Take the free level test",
        }
      ),
  },
];
