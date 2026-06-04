// CEFR-level theme palettes. Each level gets a distinct accent color used on
// the hero pill, gradient tint, stepper highlight, and section badges.
// Full Tailwind class strings are baked in so the JIT compiler picks them up
// (dynamic strings like `bg-${color}-500` would be tree-shaken).

export type Cefr = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export interface LevelTheme {
  /** Hero level pill background. */
  pill: string;
  /** Solid accent background (e.g. section number badges, active stepper). */
  accentBg: string;
  /** Accent text color. */
  accentText: string;
  /** Ring used for current step in the stepper. */
  ringActive: string;
  /** Color used in the hero bottom gradient tint. */
  gradient: string;
  /** Soft tint background (e.g. step label uppercase tag). */
  softBg: string;
  /** Soft tint text. */
  softText: string;
  /** Border accent (e.g. focused card outline). */
  borderAccent: string;
  /** Thick top stripe used on every section card so the level color is constant. */
  topStripe: string;
  /** Display label. */
  label: string;
  /** One-liner about the level (used in tooltip if you want). */
  caption: string;
}

const THEMES: Record<Cefr, LevelTheme> = {
  A1: {
    pill: "bg-emerald-500 text-white",
    accentBg: "bg-emerald-600",
    accentText: "text-emerald-700",
    ringActive: "ring-emerald-400",
    gradient: "from-emerald-900/75",
    softBg: "bg-emerald-50",
    softText: "text-emerald-800",
    borderAccent: "border-emerald-300",
    label: "A1",
    caption: "Beginner — basic phrases and everyday expressions.",
    topStripe: "bg-emerald-400",
  },
  A2: {
    pill: "bg-sky-500 text-white",
    accentBg: "bg-sky-600",
    accentText: "text-sky-700",
    ringActive: "ring-sky-400",
    gradient: "from-sky-900/75",
    softBg: "bg-sky-50",
    softText: "text-sky-800",
    borderAccent: "border-sky-300",
    label: "A2",
    caption: "Elementary — simple, direct exchanges on familiar topics.",
    topStripe: "bg-sky-400",
  },
  B1: {
    pill: "bg-indigo-500 text-white",
    accentBg: "bg-indigo-600",
    accentText: "text-indigo-700",
    ringActive: "ring-indigo-400",
    gradient: "from-indigo-900/75",
    softBg: "bg-indigo-50",
    softText: "text-indigo-800",
    borderAccent: "border-indigo-300",
    label: "B1",
    caption: "Intermediate — main points of clear input on familiar matters.",
    topStripe: "bg-indigo-400",
  },
  B2: {
    pill: "bg-violet-500 text-white",
    accentBg: "bg-violet-600",
    accentText: "text-violet-700",
    ringActive: "ring-violet-400",
    gradient: "from-violet-900/75",
    softBg: "bg-violet-50",
    softText: "text-violet-800",
    borderAccent: "border-violet-300",
    label: "B2",
    caption: "Upper intermediate — fluent interaction with native speakers.",
    topStripe: "bg-violet-400",
  },
  C1: {
    pill: "bg-amber-500 text-white",
    accentBg: "bg-amber-600",
    accentText: "text-amber-700",
    ringActive: "ring-amber-400",
    gradient: "from-amber-900/75",
    softBg: "bg-amber-50",
    softText: "text-amber-800",
    borderAccent: "border-amber-300",
    label: "C1",
    caption: "Advanced — express ideas fluently and spontaneously.",
    topStripe: "bg-amber-400",
  },
  C2: {
    pill: "bg-rose-500 text-white",
    accentBg: "bg-rose-600",
    accentText: "text-rose-700",
    ringActive: "ring-rose-400",
    gradient: "from-rose-900/75",
    softBg: "bg-rose-50",
    softText: "text-rose-800",
    borderAccent: "border-rose-300",
    label: "C2",
    caption: "Proficient — understand virtually everything heard or read.",
    topStripe: "bg-rose-400",
  },
};

const FALLBACK = THEMES.A2;

export function getLevelTheme(level: string | undefined | null): LevelTheme {
  if (!level) return FALLBACK;
  const norm = level.trim().toUpperCase() as Cefr;
  return THEMES[norm] || FALLBACK;
}
