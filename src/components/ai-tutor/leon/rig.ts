// Léon's skeleton: the named joints the animation drives, their resting
// values, which spring each one rides on, and how a pose turns into SVG
// transform attributes.
//
// Arms are described anatomically and mirrored for the right side:
//   raise  > 0 lifts the arm out and up (0 = hanging straight down, 90 = out
//          to the side, 180 = straight up; < 0 swings it across the belly)
//   bend   is added to raise for the forearm: > 0 swings it further up/out,
//          < 0 folds it back down/in
// so a pose reads the same for either arm.

import { SPRINGS, type SpringConfig } from "./spring";

export const JOINTS = {
  // body (pivot: feet on the branch)
  bodyX: { rest: 0, spring: SPRINGS.body },
  bodyY: { rest: 0, spring: SPRINGS.body }, // hop / crouch, px (negative = up)
  bodyRot: { rest: 0, spring: SPRINGS.body }, // lean, deg
  squash: { rest: 0, spring: SPRINGS.body }, // vertical stretch, 0.05 = 5 % taller
  // head (pivot: neck)
  headX: { rest: 0, spring: SPRINGS.head },
  headY: { rest: 0, spring: SPRINGS.head },
  headRot: { rest: 0, spring: SPRINGS.head },
  headScale: { rest: 0, spring: SPRINGS.head }, // lean toward camera, 0.04 = 4 % bigger
  // arms
  // hands resting folded on the belly
  armLRaise: { rest: -14, spring: SPRINGS.arm },
  armLBend: { rest: -60, spring: SPRINGS.arm },
  armRRaise: { rest: -14, spring: SPRINGS.arm },
  armRBend: { rest: -60, spring: SPRINGS.arm },
  fingerL: { rest: 0, spring: SPRINGS.face }, // pointing finger out, 0–1
  fingerR: { rest: 0, spring: SPRINGS.face },
  // tail
  tail: { rest: 0, spring: SPRINGS.tail },
  // face
  specsY: { rest: 0, spring: SPRINGS.face }, // glasses slide down the nose, px
  specsRot: { rest: 0, spring: SPRINGS.face },
  brow: { rest: 0, spring: SPRINGS.face }, // brow bar lift, px (negative = raised)
  gazeX: { rest: 0, spring: SPRINGS.eye },
  gazeY: { rest: 0, spring: SPRINGS.eye },
  pupil: { rest: 1, spring: SPRINGS.face },
  lid: { rest: 0, spring: SPRINGS.lid }, // 0 open, 1 shut
  blush: { rest: 0.35, spring: SPRINGS.face },
} satisfies Record<string, { rest: number; spring: SpringConfig }>;

export type Joint = keyof typeof JOINTS;
export type Pose = Record<Joint, number>;
export type PartialPose = Partial<Pose>;

export const JOINT_NAMES = Object.keys(JOINTS) as Joint[];

export const REST_POSE: Pose = Object.fromEntries(JOINT_NAMES.map((j) => [j, JOINTS[j].rest])) as Pose;

// Pivot points in the 120×120 viewBox.
export const PIVOT = {
  feet: [56, 104],
  neck: [56, 74],
  tail: [78, 90],
  shoulderL: [39, 79],
  shoulderR: [77, 79],
  specs: [56, 43],
} as const;

/** Eye centres and the white of the eye's radius. */
export const EYES = [
  { cx: 36, cy: 43 },
  { cx: 76, cy: 43 },
] as const;
export const EYE_R = 10;

/** Upper arm and forearm lengths. */
export const UPPER_ARM = 12;
export const FOREARM = 11;

const f = (n: number) => (Math.abs(n) < 0.005 ? "0" : n.toFixed(2));

/** The elements the engine moves, keyed by their `data-j` attribute. */
export type RigPart =
  | "char"
  | "head"
  | "tail"
  | "armL"
  | "foreL"
  | "armR"
  | "foreR"
  | "fingerL"
  | "fingerR"
  | "specs"
  | "brows"
  | "gaze0"
  | "gaze1"
  | "lid0"
  | "lid1"
  | "pupil0"
  | "pupil1"
  | "blush";

/**
 * Turn a pose into the SVG attribute each rig part needs. Used both for the
 * first render (so a still Léon stands correctly) and every animation frame.
 */
export function rigAttributes(p: Pose): Record<RigPart, { attr: string; value: string }> {
  const [fx, fy] = PIVOT.feet;
  const [nx, ny] = PIVOT.neck;
  const [tx, ty] = PIVOT.tail;
  const [sx, sy] = PIVOT.specs;
  const tr = (s: string) => ({ attr: "transform", value: s });
  const op = (n: number) => ({ attr: "opacity", value: f(Math.max(0, Math.min(1, n))) });
  const gaze = tr(`translate(${f(p.gazeX)} ${f(p.gazeY)})`);
  // Lids close from the top of each eye; pupils dilate about their centres.
  const lidS = f(Math.max(0.001, Math.min(1, p.lid)));
  const lid = (i: 0 | 1) => {
    const { cy } = EYES[i];
    return tr(`translate(0 ${cy - EYE_R}) scale(1 ${lidS}) translate(0 ${-(cy - EYE_R)})`);
  };
  const pupil = (i: 0 | 1) => {
    const { cx, cy } = EYES[i];
    return tr(`translate(${cx} ${cy}) scale(${f(p.pupil)}) translate(${-cx} ${-cy})`);
  };
  return {
    char: tr(
      `translate(${f(p.bodyX)} ${f(p.bodyY)}) rotate(${f(p.bodyRot)} ${fx} ${fy}) translate(${fx} ${fy}) scale(${f(1 - p.squash * 0.5)} ${f(1 + p.squash)}) translate(${-fx} ${-fy})`
    ),
    head: tr(
      `translate(${f(p.headX)} ${f(p.headY)}) rotate(${f(p.headRot)} ${nx} ${ny}) translate(${nx} ${ny}) scale(${f(1 + p.headScale)}) translate(${-nx} ${-ny})`
    ),
    tail: tr(`rotate(${f(p.tail)} ${tx} ${ty})`),
    armL: tr(`translate(${PIVOT.shoulderL[0]} ${PIVOT.shoulderL[1]}) rotate(${f(p.armLRaise)})`),
    foreL: tr(`translate(0 ${UPPER_ARM}) rotate(${f(p.armLBend)})`),
    armR: tr(`translate(${PIVOT.shoulderR[0]} ${PIVOT.shoulderR[1]}) rotate(${f(-p.armRRaise)})`),
    foreR: tr(`translate(0 ${UPPER_ARM}) rotate(${f(-p.armRBend)})`),
    fingerL: op(p.fingerL),
    fingerR: op(p.fingerR),
    specs: tr(`translate(0 ${f(p.specsY)}) rotate(${f(p.specsRot)} ${sx} ${sy})`),
    brows: tr(`translate(0 ${f(p.brow)})`),
    gaze0: gaze,
    gaze1: gaze,
    lid0: lid(0),
    lid1: lid(1),
    pupil0: pupil(0),
    pupil1: pupil(1),
    blush: op(p.blush),
  };
}
