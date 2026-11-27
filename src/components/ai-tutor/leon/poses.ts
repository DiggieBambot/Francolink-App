// Léon's named poses and gestures.
//
// A pose is a set of joint targets. A gesture is a pose that changes over
// time (a wave, a nod), with a fade in and out so it blends over whatever he
// was doing. The engine eases every joint toward the blended targets with
// springs, so nothing here has to worry about smoothness.
//
// Arm angles (see rig.ts): raise 0 = hanging, 90 = out to the side,
// 180 = straight up, negative = across the belly. The forearm's angle is
// raise + bend, so bend > 0 swings it further up/out, < 0 back down/in.

import type { Expression } from "./mouth";
import type { PartialPose } from "./rig";

const TAU = Math.PI * 2;
/** A single smooth bump over 0→1. */
const bump = (u: number) => Math.sin(Math.PI * Math.max(0, Math.min(1, u)));

export const POSES = {
  rest: {},
  /** Leaning toward the student, attentive. */
  leanIn: { bodyRot: -3, headScale: 0.05, headY: 2, headX: -1.5, headRot: -6, armLRaise: -26, armRRaise: -26 },
  /** Hand on chin, head tipped, eyes up. */
  chinThink: { armRRaise: -60, armRBend: -102, armLRaise: -30, armLBend: -40, headRot: 7, headY: -0.5, brow: -1.2, tail: -10 },
  /** One hand open, palm up, offering an idea. */
  explain: { armRRaise: 60, armRBend: 70, armLRaise: -6, armLBend: -40 },
  /** Arm straight out, finger pointing. */
  point: { armRRaise: 92, armRBend: -4, fingerR: 1, headRot: 4, gazeX: 2.5 },
  /** Both hands open toward the student. */
  present: { armLRaise: 52, armLBend: 62, armRRaise: 52, armRBend: 62 },
  /** Both arms up. */
  celebrate: { armLRaise: 135, armLBend: 25, armRRaise: 135, armRBend: 25, brow: -1.5, blush: 0.8 },
  /** Palms up, shoulders up, head tipped. */
  shrug: { armLRaise: 38, armLBend: 92, armRRaise: 38, armRBend: 92, bodyY: -1.5, headRot: 8, brow: -2 },
  /** Finger raised, glasses slid down: "ah-ah, careful". */
  correct: { armRRaise: 128, armRBend: 36, fingerR: 1, headRot: -5, specsY: 3.6, gazeY: -2.2, brow: 1.4 },
} satisfies Record<string, PartialPose>;

export type PoseName = keyof typeof POSES;

export interface Gesture {
  /** Seconds. Infinity holds until replaced (used for mood stances). */
  duration: number;
  fadeIn: number;
  fadeOut: number;
  /** Targets at `t` seconds in (`u` = t / duration, 0 when held). */
  pose: (t: number, u: number) => PartialPose;
  /** Face to make while doing it, when he isn't talking. */
  expression?: Expression;
}

export const GESTURES = {
  wave: {
    duration: 1.9,
    fadeIn: 0.25,
    fadeOut: 0.4,
    expression: "smile",
    pose: (t) => ({
      armRRaise: 115,
      armRBend: 40 + 28 * Math.sin(t * TAU * 2.3),
      headRot: -5,
      headY: -0.5,
      blush: 0.6,
      tail: 8,
    }),
  },
  explain: {
    duration: 1.8,
    fadeIn: 0.3,
    fadeOut: 0.45,
    pose: (t, u) => ({
      ...POSES.explain,
      armRBend: 70 + 8 * Math.sin(t * 5.5) - 14 * bump(u * 2),
      headRot: 3,
    }),
  },
  point: {
    duration: 1.7,
    fadeIn: 0.22,
    fadeOut: 0.45,
    pose: (t, u) => ({
      ...POSES.point,
      // a little jab forward at the start, then hold
      armRBend: -6 - 12 * bump(u * 4),
      bodyRot: 1.5,
    }),
  },
  present: {
    duration: 1.6,
    fadeIn: 0.3,
    fadeOut: 0.45,
    pose: (t) => ({ ...POSES.present, armLBend: 62 + 6 * Math.sin(t * 4), armRBend: 62 + 6 * Math.sin(t * 4 + 1) }),
  },
  chinThink: {
    duration: 2.6,
    fadeIn: 0.35,
    fadeOut: 0.45,
    expression: "hmm",
    pose: (t) => ({ ...POSES.chinThink, armRBend: -102 + 7 * Math.abs(Math.sin(t * 3.4)), gazeX: -2.5, gazeY: -3 }),
  },
  celebrate: {
    duration: 1.8,
    fadeIn: 0.15,
    fadeOut: 0.4,
    expression: "grin",
    pose: (t) => ({
      ...POSES.celebrate,
      armLBend: 25 + 18 * Math.sin(t * 11),
      armRBend: 25 + 18 * Math.sin(t * 11 + Math.PI),
      bodyY: -5 * Math.abs(Math.sin(t * 7)),
      squash: 0.04 * Math.sin(t * 14),
      headRot: 5 * Math.sin(t * 7),
      tail: 12 * Math.sin(t * 7),
    }),
  },
  nod: {
    duration: 0.9,
    fadeIn: 0.08,
    fadeOut: 0.2,
    pose: (t, u) => ({ headY: 2.6 * Math.max(0, Math.sin(u * TAU * 2)), headRot: -2 * bump(u) }),
  },
  shrug: {
    duration: 1.5,
    fadeIn: 0.25,
    fadeOut: 0.45,
    expression: "pursed",
    pose: (t, u) => ({ ...POSES.shrug, bodyY: -1.5 - 1.5 * bump(u * 1.5) }),
  },
  leanIn: {
    duration: 1.6,
    fadeIn: 0.4,
    fadeOut: 0.6,
    expression: "soft",
    pose: () => POSES.leanIn,
  },
  wag: {
    duration: 1.6,
    fadeIn: 0.18,
    fadeOut: 0.5,
    expression: "hmm",
    pose: (t) => ({ ...POSES.correct, armRBend: 36 + 14 * Math.sin(t * TAU * 2.6), headRot: -5 + 2 * Math.sin(t * TAU * 1.3) }),
  },
  beat: {
    duration: 0.55,
    fadeIn: 0.08,
    fadeOut: 0.25,
    pose: (t, u) => ({ armRRaise: 50, armRBend: 58 - 30 * bump(u * 1.6), headY: 1.2 * bump(u * 1.6) }),
  },
  bow: {
    duration: 1.6,
    fadeIn: 0.3,
    fadeOut: 0.4,
    expression: "smile",
    pose: (t, u) => ({ bodyRot: -2, headY: 4 * bump(u), headRot: -4 * bump(u), armRRaise: -45, armRBend: -40, armLRaise: 20, armLBend: -30 }),
  },
} satisfies Record<string, Gesture>;

export type GestureName = keyof typeof GESTURES;
export const GESTURE_NAMES = Object.keys(GESTURES) as GestureName[];

export const POSE_NAMES = Object.keys(POSES) as PoseName[];
