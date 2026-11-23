// The per-frame animation loop. Once a frame it:
//   1. picks a base stance from Léon's mood, with idle life on top
//      (breathing, sway, tail, look-around, blinks)
//   2. blends in any gestures that are playing (wave, point, nod…)
//   3. works out the mouth: text visemes, the audio analyser, or both
//   4. eases every joint and lip number toward its target with springs
//   5. writes SVG attributes directly (never React state)

import { REST_POSE, JOINT_NAMES, JOINTS, rigAttributes, type Pose, type PartialPose, type RigPart } from "./rig";
import { GESTURES, POSES, type Gesture, type GestureName } from "./poses";
import {
  EXPRESSIONS,
  MOUTH_KEYS,
  mouthGeometry,
  visemeParams,
  type Expression,
  type MouthParams,
  type Viseme,
} from "./mouth";
import { buildSpeechTrack, clipTime, keyIndexAt, type SpeechClip, type SpeechTrack } from "./speech-track";
import { bandsToMouth, type VoiceBands } from "./voice";
import { SPRINGS, clamp, lerp, smoothstep, stepSpring, wander, type SpringState } from "./spring";
import type { LeonMood } from "./types";

export interface LeonCue {
  gesture: GestureName;
  /** Change this to play the same gesture again. */
  id: number;
}

export interface EngineInputs {
  mood: LeonMood;
  language: string;
  voice?: React.MutableRefObject<number>;
  bands?: React.MutableRefObject<VoiceBands>;
  mic?: React.MutableRefObject<number>;
  speech?: SpeechClip | null;
  cue?: LeonCue | null;
  /** Wave hello when first shown. */
  greet?: boolean;
}

interface Layer {
  g: Gesture;
  name: GestureName;
  start: number;
  killedAt?: number;
  killedWeight?: number;
}

const HEAD_ONLY: GestureName[] = ["nod"];
const TALK_GESTURES: GestureName[] = ["explain", "point", "present", "beat", "explain", "present"];

/** Mood → resting face when not talking. */
const MOOD_FACE: Record<LeonMood, Expression> = {
  idle: "smile",
  listening: "soft",
  thinking: "hmm",
  speaking: "smile",
  correcting: "hmm",
  celebrating: "grin",
};

/** Mood → where the eyes rest (px), before darting around. */
const MOOD_GAZE: Record<LeonMood, [number, number, number]> = {
  // x, y, how far they roam
  idle: [0, 0, 3],
  listening: [0.5, 0.8, 0.8],
  thinking: [-2.5, -3.2, 1.2],
  speaking: [0, 0.6, 1],
  correcting: [1, -2, 0.6],
  celebrating: [0, 0, 0],
};

/** The pose a still (non-animated) Léon holds for a mood. */
export function stillPose(mood: LeonMood): Pose {
  return { ...REST_POSE, ...stance(mood, 0, 0) };
}

/** Base stance per mood, with slow idle life. */
function stance(mood: LeonMood, t: number, mic: number): PartialPose {
  const sway = {
    headRot: 2.4 * wander(t * 0.8, 1),
    headY: 0.7 * wander(t * 1.2, 2),
    bodyRot: 1 * wander(t * 0.6, 3),
    tail: 7 * wander(t * 0.7, 4),
  };
  switch (mood) {
    case "listening":
      return {
        ...POSES.leanIn,
        headRot: POSES.leanIn.headRot + 1.2 * wander(t, 5),
        tail: sway.tail * 0.6,
        pupil: 1.05 + mic * 0.35,
      };
    case "thinking":
      return {
        ...POSES.chinThink,
        armRBend: POSES.chinThink.armRBend + 7 * Math.abs(Math.sin(t * 3.4)),
        headRot: POSES.chinThink.headRot + 1.5 * wander(t, 6),
        tail: -10 + 6 * Math.sin(t * 1.4),
      };
    case "speaking":
      return {
        ...sway,
        armRRaise: 6 + 4 * wander(t, 7),
        armRBend: -20,
        armLRaise: -4,
        armLBend: -30 + 4 * wander(t, 8),
      };
    case "correcting":
      return {
        armRRaise: 70,
        armRBend: 62,
        fingerR: 1,
        specsY: 3.6,
        brow: 1.2,
        headRot: -4 + sway.headRot * 0.4,
        tail: sway.tail,
      };
    case "celebrating":
      return (GESTURES.celebrate as Gesture).pose(t, 0);
    default:
      return {
        ...sway,
        armLRaise: -10 + 3 * wander(t * 0.9, 9),
        armRRaise: -10 + 3 * wander(t * 0.8, 10),
      };
  }
}

function layerWeight(l: Layer, now: number): number {
  const t = now - l.start;
  let w = smoothstep(t / l.g.fadeIn);
  if (Number.isFinite(l.g.duration)) w *= smoothstep((l.g.duration - t) / l.g.fadeOut);
  if (l.killedAt !== undefined) w = Math.min(w, (l.killedWeight ?? 1) * (1 - smoothstep((now - l.killedAt) / l.g.fadeOut)));
  return w;
}

/**
 * Start animating `svg`. `inputs.current` is read every frame, so the caller
 * updates it from props without restarting. Returns a stop function.
 */
export function runLeon(
  svg: SVGSVGElement,
  inputs: { current: EngineInputs },
  opts: { reduce: boolean }
): () => void {
  const amp = opts.reduce ? 0.3 : 1;

  // ── elements ──
  const parts = {} as Record<RigPart, Element[]>;
  const q = (sel: string) => Array.from(svg.querySelectorAll(sel));
  const partNames = Object.keys(rigAttributes(REST_POSE)) as RigPart[];
  for (const p of partNames) parts[p] = q(`[data-j="${p}"]`);
  const lips = q('[data-m="lips"]');
  const teeth = q('[data-m="teeth"]');
  const tongue = q('[data-m="tongue"]');
  const lastWritten = new Map<Element, string>();
  const write = (els: Element[], attr: string, value: string) => {
    for (const el of els) {
      if (lastWritten.get(el) === attr + value) continue;
      el.setAttribute(attr, value);
      lastWritten.set(el, attr + value);
    }
  };

  // ── state ──
  const joints = Object.fromEntries(
    JOINT_NAMES.map((j) => [j, { x: REST_POSE[j], v: 0 } as SpringState])
  ) as Record<keyof Pose, SpringState>;
  const mouth = Object.fromEntries(
    MOUTH_KEYS.map((k) => [k, { x: EXPRESSIONS.smile[k], v: 0 } as SpringState])
  ) as Record<keyof MouthParams, SpringState>;

  let raf = 0;
  let last = performance.now();
  const born = last / 1000;
  let layers: Layer[] = [];
  let lastMood: LeonMood | null = null;
  let lastCueId: number | null = null;
  let greeted = false;

  // speech
  let clipKey = "";
  let track: SpeechTrack | null = null;
  let trackDuration: number | null = null;
  let keyHint = 0;
  let onsetOffset = 0;
  let onsetFound = false;
  let plannedGestures: { at: number; name: GestureName }[] = [];
  let talkGestureIdx = Math.floor(Math.random() * TALK_GESTURES.length);
  let lastStressKey = -1;

  // voice meter
  let meterWorks = false;
  let env = 0;
  let peak = 0.05;
  let micEnv = 0;
  let micPeak = 0.05;
  let lastNodAt = -10;
  let beat = 0; // decaying head-bob impulse
  let browKick = 0;

  // eyes
  let look = { x: 0, y: 0 };
  let nextLook = 0;
  let blinkUntil = 0;
  let nextBlink = born + 1 + Math.random() * 2;
  let doubleBlinkAt = 0;
  let nextFidget = born + 6 + Math.random() * 6;

  // fake speech rhythm (no transcript, no meter)
  let fakeSyllable = 0;
  const FAKE_SHAPES: Viseme[] = ["A", "E", "O", "C", "A", "I", "MBP", "E", "U", "A"];

  const play = (name: GestureName, now: number) => {
    const g: Gesture = GESTURES[name];
    const headOnly = HEAD_ONLY.includes(name);
    for (const l of layers) {
      if (l.killedAt !== undefined) continue;
      if (HEAD_ONLY.includes(l.name) !== headOnly) continue;
      l.killedWeight = layerWeight(l, now);
      l.killedAt = now;
    }
    layers.push({ g, name, start: now });
  };

  const onMoodEnter = (mood: LeonMood, now: number) => {
    if (mood === "correcting") play("wag", now);
    else if (mood === "celebrating") play("celebrate", now);
    else if (mood === "listening") play("nod", now);
  };

  const onNewClip = (clip: SpeechClip) => {
    onsetFound = false;
    onsetOffset = 0;
    keyHint = 0;
    lastStressKey = -1;
    plannedGestures = [];
    track = clip.text ? buildSpeechTrack(clip.text, inputs.current.language, clip.duration) : null;
    trackDuration = clip.duration;
    if (!track) return;
    const mood = inputs.current.mood;
    if (mood === "correcting" || mood === "celebrating") return;
    const dur = track.duration;
    const text = clip.text.trim();
    // One gesture to open the sentence, a second in long ones, and a shrug
    // or open palms on a question.
    let first: GestureName = TALK_GESTURES[talkGestureIdx++ % TALK_GESTURES.length];
    if (/!$/.test(text)) first = "beat";
    plannedGestures.push({ at: 0.12, name: first });
    if (/\?$/.test(text)) plannedGestures.push({ at: Math.max(0.6, dur * 0.55), name: Math.random() < 0.5 ? "shrug" : "present" });
    else if (dur > 3.2) plannedGestures.push({ at: dur * 0.55, name: TALK_GESTURES[talkGestureIdx++ % TALK_GESTURES.length] });
  };

  const tick = (nowMs: number) => {
    const dt = Math.min(0.05, Math.max(0.001, (nowMs - last) / 1000));
    last = nowMs;
    const now = nowMs / 1000;
    const inp = inputs.current;
    const mood = inp.mood;

    // ── events ──
    if (mood !== lastMood) {
      if (lastMood !== null) onMoodEnter(mood, now);
      lastMood = mood;
    }
    if (inp.cue && inp.cue.id !== lastCueId) {
      play(inp.cue.gesture, now);
      lastCueId = inp.cue.id;
    }
    if (inp.greet && !greeted && now - born > 0.35) {
      greeted = true;
      if (mood === "idle" || mood === "thinking") play("wave", now);
    }

    // ── speech clip ──
    const clip = inp.speech ?? null;
    const key = clip ? `${clip.startedAt}|${clip.text}` : "";
    if (key !== clipKey) {
      clipKey = key;
      if (clip) onNewClip(clip);
      else {
        track = null;
        plannedGestures = [];
      }
    } else if (clip && clip.text && clip.duration !== trackDuration) {
      track = buildSpeechTrack(clip.text, inp.language, clip.duration);
      trackDuration = clip.duration;
    }
    const ct = clip ? clipTime(clip) : 0;
    while (plannedGestures.length && ct >= plannedGestures[0].at) {
      play(plannedGestures.shift()!.name, now);
    }

    // ── voice meter (his voice) ──
    const rawVoice = inp.voice?.current ?? 0;
    const talking = mood === "speaking" || !!clip;
    if (talking && rawVoice > 0.02) meterWorks = true;
    peak = Math.max(rawVoice, peak * Math.pow(0.55, dt), 0.03);
    const envTarget = rawVoice < 0.006 ? 0 : Math.min(1, rawVoice / peak);
    env += (envTarget - env) * (envTarget > env ? 0.65 : 0.35);
    if (meterWorks && clip && !onsetFound && rawVoice > 0.04) {
      onsetFound = true;
      onsetOffset = clamp(ct - 0.06, -0.1, 0.6);
    }

    // ── mic (student) ──
    const rawMic = mood === "listening" ? inp.mic?.current ?? 0 : 0;
    micPeak = Math.max(rawMic, micPeak * Math.pow(0.5, dt), 0.05);
    const micTarget = rawMic < 0.03 ? 0 : Math.min(1, rawMic / micPeak);
    micEnv += (micTarget - micEnv) * 0.3;
    if (mood === "listening" && micEnv > 0.7 && now - lastNodAt > 1.3) {
      lastNodAt = now;
      play("nod", now);
    }

    // ── beats: emphasis while talking ──
    if (talking && meterWorks && env > 0.7 && now - lastNodAt > 0.28) {
      lastNodAt = now;
      beat = 1;
      browKick = 1;
    }
    beat *= Math.pow(0.015, dt);
    browKick *= Math.pow(0.03, dt);

    // ── body target ──
    const target: Pose = { ...REST_POSE, ...stance(mood, now, micEnv) };
    let expression: Expression = MOOD_FACE[mood];
    let exprWeight = 0;
    layers = layers.filter((l) => {
      const age = now - l.start;
      if (l.killedAt !== undefined && now - l.killedAt > l.g.fadeOut) return false;
      return !(Number.isFinite(l.g.duration) && age > l.g.duration);
    });
    for (const l of layers) {
      const w = layerWeight(l, now);
      if (w <= 0) continue;
      const age = now - l.start;
      const u = Number.isFinite(l.g.duration) ? age / l.g.duration : 0;
      const gp = l.g.pose(age, u);
      const additive = HEAD_ONLY.includes(l.name);
      for (const k in gp) {
        const j = k as keyof Pose;
        const v = gp[j]!;
        target[j] = additive ? target[j] + v * w : lerp(target[j], v, w);
      }
      if (l.g.expression && w > exprWeight && w > 0.4) {
        expression = l.g.expression;
        exprWeight = w;
      }
    }
    // breathing and talking emphasis on top
    target.squash += 0.014 * Math.sin(now * 1.7);
    target.headY += 1.4 * beat;
    target.headRot += 1.5 * beat;
    target.brow -= 1.6 * browKick;

    // ── eyes ──
    const [gx, gy, roam] = MOOD_GAZE[mood];
    if (now > nextLook) {
      const prev = look;
      look = { x: gx + (Math.random() * 2 - 1) * roam, y: gy + (Math.random() * 2 - 1) * roam * 0.6 };
      nextLook = now + 0.7 + Math.random() * (mood === "idle" ? 2.6 : 1.7);
      // a big glance often comes with a blink
      if (Math.hypot(look.x - prev.x, look.y - prev.y) > 2.5 && Math.random() < 0.5) blinkUntil = now + 0.11;
    }
    target.gazeX += look.x;
    target.gazeY += look.y;
    // the head follows the eyes a little
    target.headRot += look.x * 0.6;
    target.headX += look.x * 0.25;

    if (now > nextBlink) {
      blinkUntil = now + 0.11;
      if (Math.random() < 0.2) doubleBlinkAt = now + 0.24;
      nextBlink = now + 2.2 + Math.random() * 3.8;
    }
    if (doubleBlinkAt && now > doubleBlinkAt) {
      blinkUntil = now + 0.1;
      doubleBlinkAt = 0;
    }
    const squint = mood === "thinking" ? 0.22 : mood === "correcting" ? 0.18 : mood === "listening" ? 0.06 : 0;
    target.lid = now < blinkUntil ? 1 : squint;

    // idle fidgets: a glance away, a tail flick, a little nod
    if (mood === "idle" && now > nextFidget && layers.length === 0) {
      nextFidget = now + 6 + Math.random() * 7;
      const r = Math.random();
      if (r < 0.35) play("nod", now);
      else if (r < 0.6) {
        look = { x: (Math.random() < 0.5 ? -1 : 1) * 3.2, y: -1 };
        nextLook = now + 1.2;
      } else joints.tail.v += 120;
    }

    // ── reduced motion: keep the face, calm the body ──
    if (amp < 1) {
      for (const j of ["bodyX", "bodyY", "bodyRot", "squash", "headX", "headY", "headRot", "headScale", "tail"] as const) {
        target[j] = REST_POSE[j] + (target[j] - REST_POSE[j]) * amp;
      }
      target.bodyY = Math.max(target.bodyY, -1);
    }

    // ── springs → rig ──
    const pose = {} as Pose;
    for (const j of JOINT_NAMES) {
      stepSpring(joints[j], target[j], JOINTS[j].spring, dt);
      pose[j] = joints[j].x;
    }
    const attrs = rigAttributes(pose);
    for (const p of partNames) write(parts[p], attrs[p].attr, attrs[p].value);

    // ── mouth ──
    let m: MouthParams = EXPRESSIONS[expression];
    let viseme: string = expression;
    const smile = 1.2;
    if (talking) {
      if (track && clip) {
        if (meterWorks && !onsetFound && ct < 0.8) {
          // audio hasn't started yet: hold still
          m = visemeParams("rest", smile);
          viseme = "rest";
        } else {
          // Lips lead the sound slightly, like real speech.
          const t = ct - onsetOffset + 0.04;
          keyHint = keyIndexAt(track, t, keyHint);
          const k = track.keys[keyHint];
          m = visemeParams(k.v, smile);
          viseme = k.v;
          if (k.stress) {
            m = { ...m, jaw: m.jaw * 1.15 };
            if (keyHint !== lastStressKey && !meterWorks) {
              lastStressKey = keyHint;
              beat = Math.max(beat, 0.6);
            }
          }
          if (meterWorks) {
            // The transcript gives the shape, the audio how wide it opens.
            // If the transcript guessed a pause but the voice is still going,
            // trust the voice: open the mouth from the sound itself.
            const guessedShut = k.v === "rest" || (k.v === "MBP" && t - k.t > 0.1);
            if (guessedShut && env > 0.12) {
              m = inp.bands?.current && inp.bands.current.level > 0 ? bandsToMouth(inp.bands.current, env, smile) : visemeParams(env > 0.5 ? "A" : "E", smile);
              viseme = "audio";
            } else if (env < 0.05 && k.v !== "MBP") {
              m = { ...m, jaw: m.jaw * 0.15, teeth: m.teeth * 0.5 };
            } else m = { ...m, jaw: m.jaw * lerp(0.6, 1.2, env) };
          }
        }
      } else if (meterWorks && inp.bands?.current && inp.bands.current.level > 0) {
        m = bandsToMouth(inp.bands.current, env, smile);
        viseme = "audio";
      } else if (meterWorks) {
        m = { ...visemeParams(env > 0.6 ? "A" : env > 0.3 ? "E" : env > 0.1 ? "C" : "rest", smile) };
        viseme = "audio";
      } else {
        // No transcript and no meter: a natural-looking syllable rhythm.
        const syl = Math.sin(now * Math.PI * 4.4);
        const phrase = 0.6 + 0.4 * Math.sin(now * 1.9) * Math.sin(now * 0.73 + 1);
        const open = Math.sin(now * 0.9) > -0.8 ? Math.abs(syl) * phrase : 0;
        const idx = Math.floor(now * 4.4);
        if (idx !== fakeSyllable) fakeSyllable = idx;
        const v = open < 0.15 ? "MBP" : FAKE_SHAPES[fakeSyllable % FAKE_SHAPES.length];
        m = visemeParams(v, smile);
        m = { ...m, jaw: m.jaw * (0.4 + 0.6 * open) };
        viseme = v;
      }
    }
    if (svg.dataset.viseme !== viseme) svg.dataset.viseme = viseme;
    for (const k of MOUTH_KEYS) stepSpring(mouth[k], m[k], SPRINGS.lip, dt);
    const geo = mouthGeometry({
      jaw: mouth.jaw.x,
      wide: mouth.wide.x,
      round: mouth.round.x,
      smile: mouth.smile.x,
      teeth: mouth.teeth.x,
      tongue: mouth.tongue.x,
      skew: mouth.skew.x,
    });
    write(lips, "d", geo.d);
    for (const el of teeth) {
      write([el], "y", geo.teeth.y.toFixed(2));
      write([el], "height", geo.teeth.h.toFixed(2));
      write([el], "x", geo.teeth.x.toFixed(2));
      write([el], "width", geo.teeth.w.toFixed(2));
    }
    for (const el of tongue) {
      write([el], "cy", geo.tongue.cy.toFixed(2));
      write([el], "rx", geo.tongue.rx.toFixed(2));
      write([el], "ry", geo.tongue.ry.toFixed(2));
    }

    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(raf);
}
