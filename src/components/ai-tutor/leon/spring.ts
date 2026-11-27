// Tiny animation maths for Léon: springs, easing and blending.
//
// Every joint follows its target through a damped spring, so poses ease and
// overshoot a little instead of snapping, and a new target mid-motion carries
// the joint's current velocity into the next move (the "blend").

export interface SpringConfig {
  /** How hard the spring pulls toward the target. Higher = snappier. */
  stiffness: number;
  /** How quickly motion dies out. ~2·√stiffness is critically damped. */
  damping: number;
}

export interface SpringState {
  x: number;
  v: number;
}

/** Spring presets, from heavy (body) to quick (eyes, lips). */
export const SPRINGS = {
  /** Torso, hop: weighty, settles without wobble. */
  body: { stiffness: 90, damping: 16 },
  /** Head turns and tilts: smooth with a hint of follow-through. */
  head: { stiffness: 140, damping: 17 },
  /** Shoulders and elbows: lively, overshoots a touch like a real gesture. */
  arm: { stiffness: 170, damping: 15 },
  /** The tail lags behind everything else. */
  tail: { stiffness: 40, damping: 7 },
  /** Eye darts (saccades) are fast. */
  eye: { stiffness: 600, damping: 45 },
  /** Lids snap shut and open. */
  lid: { stiffness: 1400, damping: 60 },
  /** Lips: fast enough for syllables, smooth enough to read as speech. */
  lip: { stiffness: 900, damping: 48 },
  /** Glasses sliding, brows. */
  face: { stiffness: 220, damping: 20 },
} satisfies Record<string, SpringConfig>;

/**
 * Advance a spring by `dt` seconds toward `target`. Sub-stepped so a slow
 * frame (a dropped tab, a hitch) can't make a stiff spring explode.
 */
export function stepSpring(s: SpringState, target: number, cfg: SpringConfig, dt: number): void {
  const steps = Math.max(1, Math.ceil(dt / (1 / 120)));
  const h = dt / steps;
  for (let i = 0; i < steps; i++) {
    const a = cfg.stiffness * (target - s.x) - cfg.damping * s.v;
    s.v += a * h;
    s.x += s.v * h;
  }
}

export const clamp = (x: number, lo = 0, hi = 1) => (x < lo ? lo : x > hi ? hi : x);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** Smooth 0→1 ramp. */
export const smoothstep = (t: number) => {
  const c = clamp(t);
  return c * c * (3 - 2 * c);
};
export const easeInOutSine = (t: number) => -(Math.cos(Math.PI * clamp(t)) - 1) / 2;
export const easeOutBack = (t: number) => {
  const c1 = 1.4;
  const c = clamp(t) - 1;
  return 1 + (c1 + 1) * c * c * c + c1 * c * c;
};

/** A cheap, smooth wander in [-1, 1], different per `seed` (layered sines). */
export function wander(t: number, seed: number): number {
  return (
    0.55 * Math.sin(t * 0.61 + seed * 1.7) +
    0.3 * Math.sin(t * 1.37 + seed * 4.1) +
    0.15 * Math.sin(t * 2.71 + seed * 2.3)
  );
}
