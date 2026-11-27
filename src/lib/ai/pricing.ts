// src/lib/ai/pricing.ts
//
// One rate table for every OpenAI call the app makes, so cost accounting cannot
// drift between the lesson worker and the AI tutor. Previously the worker was
// the only thing that measured what it spent; the tutor — the feature whose
// unit economics actually decide whether a subscription tier is solvent — spent
// money silently.
//
// Rates are USD per 1M tokens and DO go out of date. Check them against
// https://openai.com/api/pricing before drawing conclusions from a cost report.

export const PRICING: Record<string, { in: number; out: number }> = {
  "gpt-4o-mini": { in: 0.15, out: 0.6 },
  "gpt-4o": { in: 2.5, out: 10 },
  "gpt-4.1": { in: 2.0, out: 8 },
  "gpt-4.1-mini": { in: 0.4, out: 1.6 },
};

/** Fallback rate for an unrecognised model — the cheapest, so cost is never overstated as a surprise. */
const FALLBACK = PRICING["gpt-4o-mini"];

// ── Audio ───────────────────────────────────────────────────────────────────
// Also USD and also go out of date — check https://openai.com/api/pricing.

/** gpt-4o-mini-tts: text in per 1M tokens, plus roughly this much per minute of speech out. */
const TTS_TEXT_IN_PER_M = 0.6;
const TTS_PER_MINUTE = 0.015;
/** Typical speech rate at speed 1.0, in characters per second. */
const SPOKEN_CHARS_PER_SECOND = 14;

/** gpt-4o-transcribe: per 1M audio-in, text-in and text-out tokens, or per minute when only duration is known. */
const STT_AUDIO_IN_PER_M = 6;
const STT_TEXT_IN_PER_M = 2.5;
const STT_TEXT_OUT_PER_M = 10;
const STT_PER_MINUTE = 0.006;

/**
 * Estimated cost and length of speaking `chars` characters at `speed`. The
 * speech API reports no usage, so the length is estimated from the text.
 */
export function ttsCost(chars: number, speed = 1): { costUsd: number; seconds: number } {
  const seconds = chars / SPOKEN_CHARS_PER_SECOND / Math.max(speed, 0.25);
  const costUsd = (seconds / 60) * TTS_PER_MINUTE + (chars / 4 / 1_000_000) * TTS_TEXT_IN_PER_M;
  return { costUsd, seconds };
}

/** Cost of a transcription, from the usage the API returned or else the audio length. */
export function transcribeCost(
  usage:
    | {
        type: "tokens";
        input_tokens: number;
        output_tokens: number;
        input_token_details?: { audio_tokens?: number; text_tokens?: number };
      }
    | { type: "duration"; seconds: number }
    | undefined,
  fallbackSeconds: number
): { costUsd: number; seconds: number | null; tokensIn: number | null; tokensOut: number | null } {
  if (usage?.type === "tokens") {
    const audio = usage.input_token_details?.audio_tokens ?? usage.input_tokens;
    const text = usage.input_token_details?.text_tokens ?? 0;
    return {
      costUsd:
        (audio / 1_000_000) * STT_AUDIO_IN_PER_M +
        (text / 1_000_000) * STT_TEXT_IN_PER_M +
        (usage.output_tokens / 1_000_000) * STT_TEXT_OUT_PER_M,
      seconds: null,
      tokensIn: usage.input_tokens,
      tokensOut: usage.output_tokens,
    };
  }
  const seconds = usage?.type === "duration" ? usage.seconds : fallbackSeconds;
  return { costUsd: (seconds / 60) * STT_PER_MINUTE, seconds, tokensIn: null, tokensOut: null };
}

/** USD cost of a single call. */
export function costOf(
  model: string,
  promptTokens: number,
  completionTokens: number
): number {
  const rate = PRICING[model] ?? FALLBACK;
  return (promptTokens / 1_000_000) * rate.in + (completionTokens / 1_000_000) * rate.out;
}
