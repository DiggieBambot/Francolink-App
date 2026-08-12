// Thin OpenAI wrapper for the lesson worker: JSON-only calls with per-call cost
// accounting, so a run can report what it actually spent.

import { getOpenAIClient } from "@/lib/ai/openai";
import { costOf } from "@/lib/ai/pricing";

export interface AiResult<T> {
  data: T;
  costUsd: number;
}

export async function askJson<T>(
  model: string,
  system: string,
  user: string,
  opts: { temperature?: number; maxTokens?: number } = {}
): Promise<AiResult<T>> {
  const openai = getOpenAIClient();

  const res = await openai.chat.completions.create({
    model,
    response_format: { type: "json_object" },
    temperature: opts.temperature ?? 0.4,
    max_tokens: opts.maxTokens,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });

  const raw = res.choices[0]?.message?.content;
  if (!raw) throw new Error("Model returned an empty response.");

  let data: T;
  try {
    data = JSON.parse(raw) as T;
  } catch {
    throw new Error(`Model returned invalid JSON: ${raw.slice(0, 200)}`);
  }

  const usage = res.usage;
  const costUsd = costOf(
    model,
    usage?.prompt_tokens ?? 0,
    usage?.completion_tokens ?? 0
  );

  return { data, costUsd };
}
