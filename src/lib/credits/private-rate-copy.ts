// Words for the private-rate page, in English and French.
//
// Two kinds:
//
//   RATE_COPY    the page's furniture -- buttons, labels, the price card's
//                fixed lines. Lives in code, not editable.
//   PageContent  what the page SAYS -- welcome, steps, room, FAQ. Editable
//                per pack from /admin/pricing/private-rate/<pack>, stored in
//                starter_packs.page_copy (20261004_private_pack_page_copy.sql).
//                DEFAULT_CONTENT below is what a pack shows until edited.
//
// Content may say {lessons} and {days}; they are filled from the pack, so the
// words stay true when the pack changes.
//
// The default FAQ states rules the app enforces, not marketing lines: 12 hours
// is FREE_CANCELLATION_HOURS in /api/booking/cancel, "the day before" is the
// 24h reminder in lib/booking/notify.ts, and half a lesson for 25 minutes is
// the credit cost in lib/booking/confirm.ts. Edits in admin can say anything;
// the defaults should not.

export type RateLang = "en" | "fr";
export const RATE_LANGS: RateLang[] = ["en", "fr"];

export const rateLang = (v: string | undefined): RateLang =>
  v === "fr" ? "fr" : "en";

// ---------------------------------------------------------------------------
// Fixed labels
// ---------------------------------------------------------------------------
export interface RateCopy {
  title: string;
  switchTo: string;
  yearsTeaching: (n: number) => string;
  reviews: (n: number) => string;
  seeProfile: string;
  howTitle: string;
  roomTitle: string;
  priceTitle: string;
  yourTutor: string;
  bookNow: string;
  faqTitle: string;
  // Price card
  lessons: (n: number) => string;
  aLesson: string;
  youSave: (amount: string) => string;
  useWithin: (days: number) => string;
  noSubscription: string;
  buy: (n: number) => string;
  createAccount: string;
  redirecting: string;
  haveAccount: string;
  logIn: string;
  checkoutError: string;
}

export const RATE_COPY: Record<RateLang, RateCopy> = {
  en: {
    title: "Your lesson rate",
    switchTo: "Français",
    yearsTeaching: (n) => `${n} years teaching`,
    reviews: (n) => `${n} review${n === 1 ? "" : "s"}`,
    seeProfile: "See full profile",
    howTitle: "How it works",
    roomTitle: "Where lessons happen",
    priceTitle: "Your rate",
    yourTutor: "Your tutor",
    bookNow: "Pick a lesson time",
    faqTitle: "Questions",
    lessons: (n) => `${n} lessons`,
    aLesson: "a lesson",
    youSave: (amount) => `You save ${amount} on the regular price`,
    useWithin: (days) => `Use them within ${days} days`,
    noSubscription: "No subscription. Buy the next block when you need it",
    buy: (n) => `Buy ${n} lessons`,
    createAccount: "Create an account to buy",
    redirecting: "Taking you to checkout…",
    haveAccount: "Already have an account?",
    logIn: "Log in",
    checkoutError: "Couldn't start checkout.",
  },
  fr: {
    title: "Votre tarif de cours",
    switchTo: "English",
    yearsTeaching: (n) => `${n} ans d'enseignement`,
    reviews: (n) => `${n} avis`,
    seeProfile: "Voir le profil complet",
    howTitle: "Comment ça marche",
    roomTitle: "Où ont lieu les cours",
    priceTitle: "Votre tarif",
    yourTutor: "Votre professeur",
    bookNow: "Choisir un horaire",
    faqTitle: "Questions",
    lessons: (n) => `${n} cours`,
    aLesson: "le cours",
    youSave: (amount) => `Vous économisez ${amount} sur le prix normal`,
    useWithin: (days) => `À utiliser sous ${days} jours`,
    noSubscription:
      "Sans abonnement. Achetez le bloc suivant quand vous en avez besoin",
    buy: (n) => `Acheter ${n} cours`,
    createAccount: "Créer un compte pour acheter",
    redirecting: "Redirection vers le paiement…",
    haveAccount: "Vous avez déjà un compte ?",
    logIn: "Se connecter",
    checkoutError: "Impossible de lancer le paiement.",
  },
};

// ---------------------------------------------------------------------------
// Editable content
// ---------------------------------------------------------------------------
export interface PageContent {
  welcome: string;
  welcomeBody: string;
  steps: { title: string; body: string }[];
  roomBody: string;
  roomPoints: string[];
  /** The price card's first line. */
  lessonLength: string;
  faq: { q: string; a: string }[];
}

/** Shape stored in starter_packs.page_copy. Missing language = defaults. */
export type StoredContent = Partial<Record<RateLang, PageContent>>;

export const DEFAULT_CONTENT: Record<RateLang, PageContent> = {
  en: {
    welcome: "Welcome to FrancoLink",
    welcomeBody:
      "Same teacher, same lessons, same rate. Your lessons now happen on FrancoLink, where you pick your own times and everything for the lesson is in one place.",
    steps: [
      {
        title: "Create your account",
        body: "Free, and takes a minute. Use any email you like.",
      },
      {
        title: "Buy your {lessons} lessons",
        body: "One payment by card. No subscription.",
      },
      {
        title: "Pick your times",
        body: "Choose any open slot in your tutor's calendar, whenever suits you. Times are shown in your own timezone.",
      },
      {
        title: "Join from your email",
        body: "You get a confirmation with the link, and a reminder the day before. Click it at lesson time. Nothing to install.",
      },
    ],
    roomBody:
      "In FrancoLink's own lesson room, right in your browser. No Zoom, no Skype, no app to download.",
    roomPoints: [
      "Video call built in",
      "The lesson on screen beside the video, for both of you",
      "Your tutor highlights what matters as you go",
    ],
    lessonLength: "{lessons} lessons of 50–60 minutes",
    faq: [
      {
        q: "How long do I have to use my lessons?",
        a: "{days} days from when you buy them. Plan for about two or three lessons a week.",
      },
      {
        q: "Can I cancel or move a lesson?",
        a: "Yes. Cancel up to 12 hours before and the lesson goes back on your balance to book again. Inside 12 hours, the lesson counts.",
      },
      {
        q: "What do I need?",
        a: "A computer, tablet or phone with a camera and microphone, and an up-to-date browser such as Chrome, Safari, Edge or Firefox.",
      },
      {
        q: "Can I book shorter lessons?",
        a: "Yes. A 25-minute lesson uses half a lesson from your balance, so you can book twice as many short ones.",
      },
      {
        q: "What happens when my {lessons} lessons run out?",
        a: "Come back to this same link and buy the next {lessons} at the same price.",
      },
    ],
  },
  fr: {
    welcome: "Bienvenue sur FrancoLink",
    welcomeBody:
      "Le même professeur, les mêmes cours, le même tarif. Vos cours ont désormais lieu sur FrancoLink : vous choisissez vos horaires et tout ce qu'il faut pour le cours est au même endroit.",
    steps: [
      {
        title: "Créez votre compte",
        body: "Gratuit, en une minute. Avec l'adresse e-mail de votre choix.",
      },
      {
        title: "Achetez vos {lessons} cours",
        body: "Un seul paiement par carte. Sans abonnement.",
      },
      {
        title: "Choisissez vos horaires",
        body: "Réservez n'importe quel créneau libre dans le calendrier de votre professeur, quand cela vous convient. Les horaires s'affichent dans votre fuseau horaire.",
      },
      {
        title: "Rejoignez le cours depuis votre e-mail",
        body: "Vous recevez une confirmation avec le lien, puis un rappel la veille. Cliquez dessus à l'heure du cours. Rien à installer.",
      },
    ],
    roomBody:
      "Dans la salle de cours de FrancoLink, directement dans votre navigateur. Pas de Zoom, pas de Skype, aucune application à télécharger.",
    roomPoints: [
      "Appel vidéo intégré",
      "Le cours à l'écran à côté de la vidéo, pour vous deux",
      "Votre professeur surligne l'essentiel au fil du cours",
    ],
    lessonLength: "{lessons} cours de 50 à 60 minutes",
    faq: [
      {
        q: "Combien de temps ai-je pour utiliser mes cours ?",
        a: "{days} jours à partir de l'achat. Prévoyez environ deux ou trois cours par semaine.",
      },
      {
        q: "Puis-je annuler ou déplacer un cours ?",
        a: "Oui. Annulez jusqu'à 12 heures avant et le cours revient sur votre solde pour être réservé à nouveau. À moins de 12 heures, le cours est dû.",
      },
      {
        q: "De quoi ai-je besoin ?",
        a: "Un ordinateur, une tablette ou un téléphone avec caméra et micro, et un navigateur à jour comme Chrome, Safari, Edge ou Firefox.",
      },
      {
        q: "Puis-je réserver des cours plus courts ?",
        a: "Oui. Un cours de 25 minutes utilise un demi-cours de votre solde : vous pouvez donc réserver deux fois plus de cours courts.",
      },
      {
        q: "Que se passe-t-il quand mes {lessons} cours sont terminés ?",
        a: "Revenez sur ce même lien et achetez les {lessons} suivants au même prix.",
      },
    ],
  },
};

/** What admin edits: stored content, or the defaults where there is none. */
export function rawContent(stored: unknown, lang: RateLang): PageContent {
  const s = (stored ?? {}) as StoredContent;
  return s[lang] ?? DEFAULT_CONTENT[lang];
}

/**
 * What the page shows: placeholders filled, and empty entries dropped -- so
 * clearing a question in admin removes it, and clearing a heading falls back
 * to the default rather than leaving a hole.
 */
export function resolveContent(
  stored: unknown,
  lang: RateLang,
  vars: { lessons: number; days: number },
): PageContent {
  const raw = rawContent(stored, lang);
  const def = DEFAULT_CONTENT[lang];
  const fill = (s: string) =>
    s
      .replaceAll("{lessons}", String(vars.lessons))
      .replaceAll("{days}", String(vars.days));
  const text = (v: string | undefined, fallback: string) =>
    fill(v?.trim() ? v : fallback);

  return {
    welcome: text(raw.welcome, def.welcome),
    welcomeBody: text(raw.welcomeBody, def.welcomeBody),
    steps: (raw.steps ?? [])
      .filter((s) => s.title?.trim())
      .map((s) => ({ title: fill(s.title), body: fill(s.body ?? "") })),
    roomBody: text(raw.roomBody, def.roomBody),
    roomPoints: (raw.roomPoints ?? []).filter((p) => p?.trim()).map(fill),
    lessonLength: text(raw.lessonLength, def.lessonLength),
    faq: (raw.faq ?? [])
      .filter((f) => f.q?.trim() && f.a?.trim())
      .map((f) => ({ q: fill(f.q), a: fill(f.a) })),
  };
}
