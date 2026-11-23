// src/lib/ai/usage-log.ts
//
// Records the cost of AI tutor calls that are not chat replies (voice,
// microphone, tap-to-translate, recaps) in ai_usage_events. Chat replies keep
// their own per-message accounting in ai_tutor_messages.
//
// Best-effort: a failed write is logged and swallowed. Accounting must never be
// the reason a student's request fails.

import { createClient as createServiceClient } from "@supabase/supabase-js";

export type AiUsageFeature = "tts" | "transcribe" | "translate" | "recap";

export interface AiUsageEvent {
  userId: string;
  feature: AiUsageFeature;
  model: string;
  costUsd: number;
  tokensIn?: number | null;
  tokensOut?: number | null;
  audioSeconds?: number | null;
}

export async function logAiUsage(event: AiUsageEvent): Promise<void> {
  try {
    const svc = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );
    const { error } = await svc.from("ai_usage_events").insert({
      user_id: event.userId,
      feature: event.feature,
      model: event.model,
      cost_usd: Number(event.costUsd.toFixed(6)),
      tokens_in: event.tokensIn ?? null,
      tokens_out: event.tokensOut ?? null,
      audio_seconds:
        event.audioSeconds == null ? null : Number(event.audioSeconds.toFixed(2)),
    });
    if (error) console.error("AI usage log failed:", error.message);
  } catch (err) {
    console.error("AI usage log failed:", err);
  }
}
