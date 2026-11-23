// Reading Léon's voice from a Web Audio analyser: loudness plus the rough
// spectral shape, so the mouth can tell an "ooh" (energy low down) from an
// "ee" (energy high up) from an "s" (hiss), not just loud from quiet.

import { clamp } from "./spring";
import type { MouthParams } from "./mouth";

export interface VoiceBands {
  /** Overall loudness, 0–1. */
  level: number;
  /** Share of energy per band (they sum to ~1 while there is sound). */
  low: number; // ~80–600 Hz: voicing, rounded vowels
  mid: number; // ~600–1800 Hz: open vowels (a)
  high: number; // ~1800–4500 Hz: spread vowels (e, i)
  hiss: number; // ~4500–10000 Hz: s, f, sh
}

export const silentBands = (): VoiceBands => ({ level: 0, low: 0, mid: 0, high: 0, hiss: 0 });

const BANDS: [keyof Omit<VoiceBands, "level">, number, number][] = [
  ["low", 80, 600],
  ["mid", 600, 1800],
  ["high", 1800, 4500],
  ["hiss", 4500, 10000],
];

/** Buffers for `readVoiceBands`, sized to the analyser. */
export function bandBuffers(analyser: AnalyserNode) {
  return { time: new Uint8Array(analyser.fftSize), freq: new Uint8Array(analyser.frequencyBinCount) };
}

/** Measure one frame of the analyser into `out`. */
export function readVoiceBands(
  analyser: AnalyserNode,
  buf: ReturnType<typeof bandBuffers>,
  out: VoiceBands
): VoiceBands {
  analyser.getByteTimeDomainData(buf.time);
  let sum = 0;
  for (const v of buf.time) sum += ((v - 128) / 128) ** 2;
  out.level = Math.min(1, Math.sqrt(sum / buf.time.length) * 5);

  analyser.getByteFrequencyData(buf.freq);
  const binHz = analyser.context.sampleRate / analyser.fftSize;
  let total = 0;
  const e: Record<string, number> = {};
  for (const [name, lo, hi] of BANDS) {
    const a = Math.max(1, Math.floor(lo / binHz));
    const b = Math.min(buf.freq.length - 1, Math.ceil(hi / binHz));
    let s = 0;
    for (let i = a; i <= b; i++) {
      const x = buf.freq[i] / 255;
      s += x * x;
    }
    e[name] = s / Math.max(1, b - a + 1);
    total += e[name];
  }
  for (const [name] of BANDS) out[name] = total > 1e-4 ? e[name] / total : 0;
  return out;
}

/**
 * Mouth numbers from the sound alone (used when there's no transcript, e.g.
 * Léon's "Mm-hm"). `env` is loudness relative to the recent peak, 0–1.
 */
export function bandsToMouth(b: VoiceBands, env: number, smile: number): MouthParams {
  const round = clamp((b.low - b.high) * 1.8 - b.hiss);
  const spread = clamp(b.high * 2.2);
  const open = env * (0.55 + b.mid * 1.2);
  return {
    jaw: env < 0.08 ? 0 : 0.8 + 7.5 * clamp(open),
    wide: 9 - 4 * round + 2.5 * spread,
    round,
    smile,
    teeth: clamp(b.hiss * 3 + spread * 0.4),
    tongue: 0.2,
    skew: 0,
  };
}
