"use client";

// Professor Léon, FrancoLink's AI tutor: a cartoon chameleon professor.
//
// The library, file by file:
//   art.tsx           the SVG drawing (skin, outfit per language, face)
//   rig.ts            named joints, rest pose, pose → SVG transforms
//   poses.ts          named poses and gestures (wave, point, nod, shrug…)
//   engine.ts         the per-frame loop: stance + gestures + idle life +
//                     lip sync, eased with springs, written straight to the DOM
//   mouth.ts          the parametric mouth and the viseme (mouth shape) table
//   speech-track.ts   text → timed visemes and word timings (FR, EN, ES)
//   voice.ts          audio analyser → loudness and spectral bands
//   spring.ts         spring / easing helpers
//   speech-bubble.tsx the comic speech bubble with word-by-word highlight

import { useEffect, useId, useRef } from "react";
import { LeonArt } from "./art";
import { runLeon, stillPose, type EngineInputs, type LeonCue } from "./engine";
import { EXPRESSIONS, visemeParams, type MouthParams, type Viseme } from "./mouth";
import { leonPalette } from "./palette";
import { POSES, type PoseName } from "./poses";
import { REST_POSE, type Pose } from "./rig";
import type { SpeechClip } from "./speech-track";
import type { LeonMood } from "./types";
import type { VoiceBands } from "./voice";

export type { LeonMood } from "./types";
export type { LeonCue } from "./engine";
export type { GestureName, PoseName } from "./poses";
export type { Viseme } from "./mouth";
export type { SpeechClip } from "./speech-track";
export type { VoiceBands } from "./voice";
export { LEON_MOODS } from "./types";
export { GESTURE_NAMES, POSE_NAMES } from "./poses";
export { buildSpeechTrack } from "./speech-track";
export { bandBuffers, readVoiceBands, silentBands } from "./voice";
export { VISEMES } from "./mouth";
export { leonPalette, leonGreeting, type LeonPalette } from "./palette";
export { LeonSpeechBubble } from "./speech-bubble";

const STILL_FACE: Record<LeonMood, MouthParams> = {
  idle: EXPRESSIONS.smile,
  listening: EXPRESSIONS.soft,
  thinking: EXPRESSIONS.hmm,
  speaking: { ...EXPRESSIONS.ooh, round: 0.5, wide: 7 },
  correcting: EXPRESSIONS.hmm,
  celebrating: EXPRESSIONS.grin,
};

export function Leon({
  language = "fr",
  mood = "idle",
  size = 40,
  still = false,
  background = true,
  className,
  voiceLevel,
  voiceBands,
  micLevel,
  speech,
  cue,
  greet,
  pose,
  viseme,
}: {
  language?: string;
  mood?: LeonMood;
  size?: number;
  /** Freeze all animation (older message avatars in the thread). */
  still?: boolean;
  /** Draw the tinted circle behind Léon (and clip him to it). */
  background?: boolean;
  className?: string;
  /** Live loudness of Léon's own voice (0–1), for lip sync while speaking. */
  voiceLevel?: React.MutableRefObject<number>;
  /** Live spectral bands of his voice, so mouth shapes follow the sound. */
  voiceBands?: React.MutableRefObject<VoiceBands>;
  /** Live loudness of the student's mic (0–1), so he nods along while listening. */
  micLevel?: React.MutableRefObject<number>;
  /** The sentence he's saying right now: drives text-based lip sync. */
  speech?: SpeechClip | null;
  /** Play a named gesture; change `id` to replay it. */
  cue?: LeonCue | null;
  /** Wave hello when first shown (defaults on for big, animated Léons). */
  greet?: boolean;
  /** Still only: hold a named pose (for previews). */
  pose?: PoseName;
  /** Still only: show a mouth shape (for previews). */
  viseme?: Viseme;
}) {
  const uid = useId().replace(/:/g, "");
  const svgRef = useRef<SVGSVGElement>(null);

  // The engine reads the latest props through a ref every frame, so prop
  // changes never restart it and never cause a render per frame.
  const inputs = useRef<EngineInputs>({ mood, language });
  useEffect(() => {
    inputs.current = {
      mood,
      language,
      voice: voiceLevel,
      bands: voiceBands,
      mic: micLevel,
      speech,
      cue,
      greet: greet ?? size >= 100,
    };
  });
  useEffect(() => {
    const el = svgRef.current;
    if (!el || still) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    return runLeon(el, inputs, { reduce });
  }, [still]);

  // React renders only the first frame. Animated: always the rest pose, so a
  // re-render (mood change) never fights the engine. Still: the mood's pose.
  let startPose: Pose = REST_POSE;
  let startMouth: MouthParams = EXPRESSIONS.smile;
  if (still) {
    startPose = pose ? { ...REST_POSE, ...POSES[pose] } : stillPose(mood);
    startMouth = viseme ? visemeParams(viseme, 1.2) : STILL_FACE[mood];
  }

  const p = leonPalette(language);
  const vars = {
    "--leon-body": p.body,
    "--leon-dark": p.dark,
    "--leon-light": p.light,
  } as React.CSSProperties;

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 120 120"
      width={size}
      height={size}
      className={`leon ${className ?? ""}`}
      data-mood={mood}
      data-still={still}
      style={vars}
      role="img"
      aria-label={`Professor Léon, ${mood}`}
    >
      <LeonArt uid={uid} language={language} mood={mood} pose={startPose} mouth={startMouth} background={background} />
    </svg>
  );
}
