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

import { escapeHtml, APP_URL } from "@/lib/email/shell";
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
//
// The speak sequence has its own layout, livelier than the shared emailShell:
// a header band in the language's colours, Léon (a PNG: Gmail and Outlook
// strip SVG) with a speech bubble in the target language, a short chat demo,
// fact chips and a big button. Everything is tables and inline styles so it
// survives every mail client.

export interface RenderedEmail { subject: string; html: string; text: string; }

const LEON_URL = `${APP_URL}/student/ai-tutor`;
const UPGRADE_URL = `${APP_URL}/upgrade-plus`;
const TUTORS_URL = `${SITE_URL}/tutors`;

type LangCode = "fr" | "es" | "en";

const LANG_CODE: Record<string, LangCode> = { french: "fr", spanish: "es", english: "en" };
const FLAG: Record<LangCode, string> = { fr: "🇫🇷", es: "🇪🇸", en: "🇬🇧" };

/** Léon's colours per language (matches the app's leonPalette). */
const PAL: Record<LangCode, { body: string; dark: string; bg: string; ink: string }> = {
  fr: { body: "#2F6FD6", dark: "#1C3F8A", bg: "#EAF1FD", ink: "#FFFFFF" },
  es: { body: "#F5BE1E", dark: "#8A6400", bg: "#FFF8E1", ink: "#3B2A00" },
  en: { body: "#D7263D", dark: "#8E1424", bg: "#FDECEE", ink: "#FFFFFF" },
};

type Line = [string, string]; // [in the target language, translation]
interface Demo { who: "Léon" | "Tutor"; ask: string; you: string; tip: string }

/** What Léon says in the bubble, and the little exchanges, per language. */
const BANK: Record<LangCode, {
  bubble: Record<SpeakStepKey, Line>;
  intro: Demo; cafe: Demo; lesson: Demo;
}> = {
  fr: {
    bubble: {
      L1: ["Bonjour ! Moi, c'est Léon. Et toi ?", "Hi! I'm Léon. And you?"],
      L2: ["Cinq phrases aujourd'hui ? On y va !", "Five sentences today? Let's go!"],
      T1: ["Prêt pour un vrai cours ?", "Ready for a real lesson?"],
      T2: ["Choisis ton prof !", "Pick your tutor!"],
      F1: ["On parle un peu ?", "Shall we talk a little?"],
    },
    intro: { who: "Léon", ask: "Tu viens d'où ?", you: "Je viens du Québec.", tip: "Parfait ! Now say how long you've lived there." },
    cafe: { who: "Léon", ask: "Qu'est-ce que tu prends ?", you: "Un café, s'il vous plaît.", tip: "Très bien ! Now order for a friend too." },
    lesson: { who: "Tutor", ask: "Qu'est-ce que tu as fait ce week-end ?", you: "Je suis allé au marché.", tip: "Nice past tense. Now say who you went with." },
  },
  es: {
    bubble: {
      L1: ["¡Hola! Soy Léon. ¿Y tú?", "Hi! I'm Léon. And you?"],
      L2: ["¿Cinco frases hoy? ¡Vamos!", "Five sentences today? Let's go!"],
      T1: ["¿Listo para una clase de verdad?", "Ready for a real lesson?"],
      T2: ["¡Elige a tu profe!", "Pick your tutor!"],
      F1: ["¿Hablamos un poco?", "Shall we talk a little?"],
    },
    intro: { who: "Léon", ask: "¿De dónde eres?", you: "Soy de México.", tip: "¡Perfecto! Now say how long you've lived there." },
    cafe: { who: "Léon", ask: "¿Qué vas a tomar?", you: "Un café, por favor.", tip: "¡Muy bien! Now order for a friend too." },
    lesson: { who: "Tutor", ask: "¿Qué hiciste el fin de semana?", you: "Fui al mercado.", tip: "Nice past tense. Now say who you went with." },
  },
  en: {
    bubble: {
      L1: ["Hello! I'm Léon. And you?", "Bonjour ! Moi, c'est Léon. Et toi ?"],
      L2: ["Five sentences today? Let's go!", "Cinq phrases aujourd'hui ? On y va !"],
      T1: ["Ready for a real lesson?", "Prêt pour un vrai cours ?"],
      T2: ["Pick your tutor!", "Choisis ton prof !"],
      F1: ["Shall we talk a little?", "On parle un peu ?"],
    },
    intro: { who: "Léon", ask: "Where are you from?", you: "I'm from London.", tip: "Great! Now say how long you've lived there." },
    cafe: { who: "Léon", ask: "What can I get you?", you: "A coffee, please.", tip: "Well done! Now order for a friend too." },
    lesson: { who: "Tutor", ask: "What did you do at the weekend?", you: "I went to the market.", tip: "Nice past tense. Now say who you went with." },
  },
};

interface Look {
  lang: LangCode;
  langName: string;
  bubble: Line;
  demo: Demo;
  chips: string[];
}

function chatRow(tag: string, tagBg: string, text: string, bubbleBg: string, bubbleInk: string, align: "left" | "right"): string {
  const bubble = `<table role="presentation" cellpadding="0" cellspacing="0" align="${align}"><tr><td style="background:${bubbleBg};color:${bubbleInk};border-radius:${align === "left" ? "4px 16px 16px 16px" : "16px 4px 16px 16px"};padding:10px 14px;font-size:15px;font-weight:600;line-height:1.4;">${text}</td></tr></table>`;
  const label = `<div style="font-size:10px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:${tagBg};margin:0 0 4px 0;text-align:${align};">${tag}</div>`;
  return `<tr><td style="padding:0 0 10px 0;">${label}${bubble}</td></tr>`;
}

function speakShell(look: Look, firstName: string, paras: string[], ctaText: string, ctaHref: string, unsubscribeUrl?: string): string {
  const p = PAL[look.lang];
  const leonImg = `${SITE_URL}/email/leon-${look.lang}.png`;
  const d = look.demo;
  const askBg = d.who === "Léon" ? p.body : "#0F2744";
  const askInk = d.who === "Léon" ? p.ink : "#FFFFFF";
  const unsub = unsubscribeUrl
    ? `<br/><a href="${unsubscribeUrl}" style="color:#94a3b8;">Unsubscribe from these emails</a>`
    : "";

  return `<!doctype html>
<html><head><meta name="viewport" content="width=device-width,initial-scale=1"/><meta name="color-scheme" content="light"/></head>
<body style="margin:0;padding:0;background:${p.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1a1a1a;line-height:1.55;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${p.bg};padding:28px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:22px;overflow:hidden;box-shadow:0 10px 30px rgba(15,39,68,0.10);">
        <!-- Header band -->
        <tr><td style="background:${p.body};padding:16px 24px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
            <td style="font-weight:900;font-size:20px;letter-spacing:-0.02em;color:${p.ink};">francolink.</td>
            <td align="right"><span style="display:inline-block;background:rgba(255,255,255,0.22);color:${p.ink};font-size:12px;font-weight:700;padding:5px 12px;border-radius:999px;">${FLAG[look.lang]}&nbsp; ${escapeHtml(look.langName)} speaking practice</span></td>
          </tr></table>
        </td></tr>

        <!-- Léon + speech bubble -->
        <tr><td style="background:${p.bg};padding:24px 24px 20px 24px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
            <td width="132" valign="middle" style="width:132px;">
              <img src="${leonImg}" width="120" height="120" alt="Léon, FrancoLink's chameleon tutor" style="display:block;width:120px;height:120px;border:0;border-radius:60px;"/>
            </td>
            <td valign="middle">
              <table role="presentation" cellpadding="0" cellspacing="0" style="background:#ffffff;border:2px solid ${p.body};border-radius:18px 18px 18px 4px;"><tr><td style="padding:14px 16px;">
                <div style="font-size:20px;font-weight:800;color:#0F2744;line-height:1.25;">${escapeHtml(look.bubble[0])}</div>
                <div style="font-size:13px;color:#64748b;margin-top:4px;">${escapeHtml(look.bubble[1])}</div>
              </td></tr></table>
            </td>
          </tr></table>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:26px 28px 8px 28px;">
          <p style="margin:0 0 14px 0;font-size:17px;font-weight:700;color:#0F2744;">Hi ${firstName},</p>
          ${paras.map((t) => `<p style="margin:0 0 14px 0;font-size:16px;color:#334155;">${t}</p>`).join("")}
        </td></tr>

        <!-- Chat demo -->
        <tr><td style="padding:6px 28px 4px 28px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:18px;"><tr><td style="padding:16px 16px 6px 16px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              ${chatRow(d.who, askBg, escapeHtml(d.ask), askBg, askInk, "left")}
              ${chatRow("You", "#0F2744", escapeHtml(d.you), "#0F2744", "#FFFFFF", "right")}
              <tr><td style="padding:2px 0 10px 0;"><div style="background:#ECFDF5;color:#047857;border-radius:12px;padding:9px 12px;font-size:14px;font-weight:600;">✓ ${escapeHtml(d.tip)}</div></td></tr>
            </table>
          </td></tr></table>
        </td></tr>

        <!-- Fact chips -->
        <tr><td style="padding:14px 28px 4px 28px;">
          ${look.chips.map((c) => `<span style="display:inline-block;background:${p.bg};color:${p.dark};font-size:13px;font-weight:700;padding:6px 12px;border-radius:999px;margin:0 6px 8px 0;">${escapeHtml(c)}</span>`).join("")}
        </td></tr>

        <!-- Button -->
        <tr><td align="center" style="padding:18px 28px 8px 28px;">
          <a href="${ctaHref}" style="display:block;background:#F48C17;color:#1F1300;text-decoration:none;font-weight:800;font-size:17px;padding:16px 24px;border-radius:14px;text-align:center;">${escapeHtml(ctaText)} &rarr;</a>
        </td></tr>

        <!-- Sign-off -->
        <tr><td style="padding:18px 28px 26px 28px;">
          <p style="margin:0;font-size:15px;color:#334155;">À bientôt,<br/><b style="color:#0F2744;">Léon and the FrancoLink team</b></p>
        </td></tr>
      </table>
      <p style="font-size:12px;color:#94a3b8;margin:16px 0 0 0;">
        FrancoLink · <a href="${APP_URL}" style="color:#94a3b8;">app.francolink.net</a>${unsub}
      </p>
    </td></tr>
  </table>
</body></html>`;
}

function build(
  look: Look,
  firstName: string,
  subject: string,
  paras: string[],
  ctaText: string,
  ctaHref: string,
  unsubscribeUrl?: string
): RenderedEmail {
  const plain = (h: string) =>
    h.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">");
  const d = look.demo;
  const text =
    `Hi ${plain(firstName)},\n\n${paras.map(plain).join("\n\n")}\n\n` +
    `${d.who}: ${d.ask}\nYou: ${d.you}\n✓ ${d.tip}\n\n${ctaText}: ${ctaHref}\n\nÀ bientôt,\nLéon and the FrancoLink team` +
    (unsubscribeUrl ? `\n\nUnsubscribe: ${unsubscribeUrl}` : "");
  return { subject, html: speakShell(look, firstName, paras, ctaText, ctaHref, unsubscribeUrl), text };
}

export function renderSpeak(
  step: SpeakStepKey,
  s: Pick<SpeakSignals, "firstName" | "lang" | "plan">,
  unsubscribeUrl?: string
): RenderedEmail {
  const name = escapeHtml(s.firstName);
  const lang = escapeHtml(s.lang);
  const code: LangCode = LANG_CODE[s.lang.trim().toLowerCase()] ?? "fr";
  const bank = BANK[code];
  const minutes = s.plan === "PREMIUM_PLUS" ? 45 : 15;
  const look = (demo: Demo, chips: string[]): Look => ({ lang: code, langName: s.lang, bubble: bank.bubble[step], demo, chips });

  switch (step) {
    case "L1":
      return build(
        look(bank.intro, [`${minutes} min a day`, "He answers out loud", "Corrects you as you go"]),
        name,
        `Léon is ready for your first ${minutes} minutes of ${s.lang}`,
        [
          `Your plan includes speaking practice with Léon, FrancoLink's AI tutor. You talk out loud, he answers out loud, and he corrects you as you go.`,
          `A good first session: tell him your name, where you live and why you're learning ${lang}. Press the microphone and say hello. It goes something like this:`,
        ],
        "Talk to Léon",
        LEON_URL,
        unsubscribeUrl
      );
    case "L2":
      return build(
        look(bank.cafe, ["Role-play any situation", "Short recap at the end", `${minutes} min back every day`]),
        name,
        `Say five sentences in ${s.lang} today`,
        [
          `Five sentences out loud is a good day of practice, and Léon can help you find them.`,
          `Ask him to practise one situation with you: ordering a coffee, introducing yourself at work, asking for directions. He plays the other person:`,
        ],
        "Start a session",
        LEON_URL,
        unsubscribeUrl
      );
    case "T1":
      return build(
        look(bank.lesson, ["50 minutes, one to one", "You do most of the talking", "3 lessons from $24"]),
        name,
        `What a 50-minute ${s.lang} lesson with a tutor is like`,
        [
          `A live lesson on FrancoLink is 50 minutes, one to one, on video with a tutor. Your tutor picks a topic that's useful to you and corrects you while you talk:`,
          `To try it, there's a starter pack: 3 lessons for $24 with a Community tutor, or $54 with a Professional tutor. It's a one-off purchase, not a subscription.`,
        ],
        "Find a tutor",
        TUTORS_URL,
        unsubscribeUrl
      );
    case "T2":
      return build(
        look(bank.lesson, ["Vetted by a live teaching demo", "From $8 a lesson (yearly)", "Book from their calendar"]),
        name,
        `Choose your ${s.lang} tutor by their teaching demo`,
        [
          `Every FrancoLink tutor passes a live teaching demo before they take students. Their profile shows what they teach, who they teach and when they're free.`,
          `Community tutors start from $10 a lesson ($8 on a yearly plan). Professional tutors start from $25 ($20 yearly). Not sure? The 3-lesson starter pack lets you try first.`,
        ],
        "Browse tutors",
        TUTORS_URL,
        unsubscribeUrl
      );
    case "F1":
      return build(
        look(bank.intro, ["Premium: 15 min a day", "Premium+: 45 min a day", "Any topic, at your level"]),
        name,
        `Practise speaking ${s.lang} out loud, every day`,
        [
          `Lessons and vocabulary take you a long way, but speaking is what makes ${lang} feel usable. The hard part is finding someone to practise with every day.`,
          `That's what Léon is for. You speak, he answers, and he corrects you as you go. He comes with Premium (15 minutes a day, 3 hours a month), or Premium+ for 45 minutes a day.`,
        ],
        "See Premium",
        UPGRADE_URL,
        unsubscribeUrl
      );
  }
}

export const SPEAK_STEPS: SpeakStepKey[] = ["L1", "L2", "T1", "T2", "F1"];
