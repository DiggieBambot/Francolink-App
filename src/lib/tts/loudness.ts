// Per-clip loudness normalisation for Léon's voice.
//
// Every sentence is synthesised on its own, and gpt-4o-mini-tts is an
// expressive model: one sentence comes back noticeably louder than the next,
// and "Mm-hm…" is almost whispered. Measuring each clip and playing it at a
// gain that brings its speech to one target level keeps the volume steady
// across sentences and turns. A limiter after the gain catches any peaks.

/** Speech level everything is brought to: RMS of the voiced parts, ≈ -19 dBFS. */
export const TARGET_RMS = 0.112;
const MIN_GAIN = 0.35;
const MAX_GAIN = 4;
/** Windows quieter than this (≈ -45 dBFS) are pauses, not speech. */
const GATE_RMS = 0.0056;

/**
 * The gain that brings `samples` to the target speech level. Measured over
 * 20 ms windows, ignoring silence, so pauses and leading silence do not make
 * a clip look quiet.
 */
export function normalisingGain(samples: Float32Array, sampleRate: number): number {
  const win = Math.max(1, Math.round(sampleRate * 0.02));
  let voicedPower = 0;
  let voicedWindows = 0;
  let peak = 0;
  for (let start = 0; start < samples.length; start += win) {
    const end = Math.min(samples.length, start + win);
    let sum = 0;
    for (let i = start; i < end; i++) {
      const x = samples[i];
      sum += x * x;
      const a = x < 0 ? -x : x;
      if (a > peak) peak = a;
    }
    const power = sum / (end - start);
    if (power >= GATE_RMS * GATE_RMS) {
      voicedPower += power;
      voicedWindows++;
    }
  }
  if (!voicedWindows || peak === 0) return 1;
  const rms = Math.sqrt(voicedPower / voicedWindows);
  let gain = TARGET_RMS / rms;
  // Don't push peaks far past full scale; the limiter only has to shave.
  gain = Math.min(gain, 2 / peak);
  return Math.min(MAX_GAIN, Math.max(MIN_GAIN, gain));
}

let decoder: BaseAudioContext | null = null;

function decodeContext(): BaseAudioContext | null {
  if (decoder) return decoder;
  if (typeof window === "undefined") return null;
  const Offline =
    window.OfflineAudioContext ||
    (window as unknown as { webkitOfflineAudioContext?: typeof OfflineAudioContext }).webkitOfflineAudioContext;
  if (!Offline) return null;
  try {
    // Never rendered, only used to decode, so it needs no user gesture.
    decoder = new Offline(1, 1, 44100);
  } catch {
    decoder = null;
  }
  return decoder;
}

function decode(ctx: BaseAudioContext, data: ArrayBuffer): Promise<AudioBuffer> {
  // Older Safari only has the callback form.
  return new Promise((resolve, reject) => {
    const p = ctx.decodeAudioData(data, resolve, reject);
    if (p && typeof p.then === "function") p.then(resolve, reject);
  });
}

const measured = new WeakMap<Blob, Promise<number>>();

/** Gain for an encoded clip; 1 when it cannot be measured. Cached per clip. */
export function measureClipGain(blob: Blob): Promise<number> {
  let p = measured.get(blob);
  if (!p) {
    p = (async () => {
      const ctx = decodeContext();
      if (!ctx) return 1;
      try {
        const buf = await decode(ctx, await blob.arrayBuffer());
        return normalisingGain(buf.getChannelData(0), buf.sampleRate);
      } catch {
        return 1;
      }
    })();
    measured.set(blob, p);
  }
  return p;
}
