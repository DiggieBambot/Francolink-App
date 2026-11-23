// Léon's mouth is one shape drawn from a handful of numbers, not a stack of
// pictures. Lip sync and expressions set target numbers, springs carry the
// numbers there, and the path is redrawn each frame, so the lips morph
// smoothly from "m" to "a" to "o" instead of cross-fading between drawings.

export interface MouthParams {
  /** How far the lips part, viewBox px (0 = closed). */
  jaw: number;
  /** Half the mouth's width, px. */
  wide: number;
  /** 0 = flat lens shape, 1 = round "o". */
  round: number;
  /** Corners lifted, px (negative = frown). */
  smile: number;
  /** Top teeth showing, 0–1. */
  teeth: number;
  /** Tongue raised toward the teeth, 0–1 ("l", "th"). */
  tongue: number;
  /** Lopsided: one corner up, one down (-1…1). */
  skew: number;
}

export const MOUTH_KEYS: (keyof MouthParams)[] = ["jaw", "wide", "round", "smile", "teeth", "tongue", "skew"];

/**
 * Mouth shapes for speech. Close enough for a cartoon, and the set every
 * hand-animated lip sync uses (closed M/B/P, F/V, A, E, I, O, U, plus a few
 * consonant shapes and rest).
 */
export type Viseme = "rest" | "MBP" | "FV" | "L" | "C" | "SH" | "A" | "E" | "I" | "O" | "U";

export const VISEMES: Viseme[] = ["rest", "MBP", "FV", "L", "C", "SH", "A", "E", "I", "O", "U"];

type Shape = Omit<MouthParams, "smile" | "skew">;

export const VISEME_SHAPES: Record<Viseme, Shape> = {
  rest: { jaw: 0, wide: 10, round: 0.2, teeth: 0, tongue: 0 },
  MBP: { jaw: 0, wide: 9, round: 0.35, teeth: 0, tongue: 0 },
  FV: { jaw: 2.4, wide: 10, round: 0.1, teeth: 1, tongue: 0 },
  L: { jaw: 5.2, wide: 9.5, round: 0.25, teeth: 0.7, tongue: 1 },
  C: { jaw: 3.2, wide: 10.5, round: 0.15, teeth: 0.9, tongue: 0.2 },
  SH: { jaw: 4.6, wide: 7.2, round: 0.8, teeth: 0.8, tongue: 0.2 },
  A: { jaw: 11, wide: 11, round: 0.35, teeth: 0.25, tongue: 0.25 },
  E: { jaw: 6.5, wide: 12.5, round: 0.1, teeth: 0.6, tongue: 0.2 },
  I: { jaw: 4.2, wide: 13, round: 0.05, teeth: 0.85, tongue: 0.1 },
  O: { jaw: 9, wide: 7.8, round: 0.95, teeth: 0, tongue: 0.15 },
  U: { jaw: 4.6, wide: 5.6, round: 1, teeth: 0, tongue: 0 },
};

/** Resting expressions per mood (when he isn't talking). */
export const EXPRESSIONS = {
  smile: { jaw: 0, wide: 13, round: 0.1, smile: 4.5, teeth: 0, tongue: 0, skew: 0 },
  soft: { jaw: 0, wide: 7.5, round: 0.2, smile: 2.4, teeth: 0, tongue: 0, skew: 0 },
  hmm: { jaw: 0, wide: 8, round: 0.3, smile: 0.4, teeth: 0, tongue: 0, skew: 0.8 },
  grin: { jaw: 10, wide: 14.5, round: 0.15, smile: 5, teeth: 0.4, tongue: 0.4, skew: 0 },
  pursed: { jaw: 0.8, wide: 5, round: 0.9, smile: -0.5, teeth: 0, tongue: 0, skew: -0.3 },
  ooh: { jaw: 5, wide: 5, round: 1, smile: 0.5, teeth: 0, tongue: 0, skew: 0 },
} satisfies Record<string, MouthParams>;

export type Expression = keyof typeof EXPRESSIONS;

export const MOUTH_CENTER = { x: 56, y: 62.5 };

export interface MouthGeometry {
  /** Outline of the lips (filled dark inside, stroked as the lip line). */
  d: string;
  /** Top teeth: a white band under the upper lip. */
  teeth: { y: number; h: number; x: number; w: number };
  /** Tongue ellipse. */
  tongue: { cx: number; cy: number; rx: number; ry: number };
}

const n = (x: number) => x.toFixed(2);

/** Build the lip outline and the teeth/tongue boxes from mouth numbers. */
export function mouthGeometry(m: MouthParams): MouthGeometry {
  const { x: cx, y: cy } = MOUTH_CENTER;
  const jaw = Math.max(0, m.jaw);
  const w = Math.max(3, m.wide);
  const round = Math.max(0, Math.min(1, m.round));
  // Corners: lifted by the smile, tipped by skew, pulled up a bit as the jaw
  // drops so an open mouth doesn't look like it's falling off the face.
  const lift = m.smile - jaw * 0.08;
  const ly = cy - lift + m.skew * 1.6;
  const ry = cy - lift - m.skew * 1.6;
  const lx = cx - w;
  const rx = cx + w;
  // Control points: near the corners for a round mouth, toward the middle for
  // a flatter lens shape.
  const a = 0.5 - round * 0.48;
  const k = 0.95 + round * 0.4;
  const topY = cy - jaw * 0.32 * k;
  const botY = cy + jaw * 0.98 * k;
  const d =
    `M${n(lx)} ${n(ly)}` +
    `C${n(lx + w * a)} ${n(topY)} ${n(rx - w * a)} ${n(topY)} ${n(rx)} ${n(ry)}` +
    `C${n(rx - w * a)} ${n(botY)} ${n(lx + w * a)} ${n(botY)} ${n(lx)} ${n(ly)}Z`;
  // The lips' inner top edge sits near 3/4 of the way to the control point.
  const innerTop = (Math.min(ly, ry) + 3 * topY) / 4;
  const innerBot = (Math.max(ly, ry) + 3 * botY) / 4;
  const open = Math.max(0, innerBot - innerTop);
  const th = Math.min(open, 2.8) * Math.max(0, Math.min(1, m.teeth));
  const tongueUp = Math.max(0, Math.min(1, m.tongue));
  const tr = Math.min(open * 0.42, 3.2);
  return {
    d,
    teeth: { x: cx - w, w: w * 2, y: innerTop - 1.5, h: th + 1.5 },
    tongue: {
      cx,
      cy: innerBot - tr * 0.6 - tongueUp * Math.max(0, open - tr * 2) * 0.7,
      rx: w * 0.55,
      ry: tr,
    },
  };
}

export function visemeParams(v: Viseme, smile: number): MouthParams {
  return { ...VISEME_SHAPES[v], smile, skew: 0 };
}
