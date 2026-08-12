// src/lib/ai/client.ts

import OpenAI from 'openai';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { PLANS } from '@/lib/config/subscription';

export type AIProvider = 'openai' | 'anthropic';

/**
 * Default model for the conversational tutor.
 *
 * Deliberately a mini model rather than `gpt-4o`: tutor turns are short,
 * conversational, and heavily steered by the system prompt, and the frontier
 * model costs roughly 6x per message for no gain a learner would notice. At the
 * Premium+ pool that difference is the gap between a healthy margin and a
 * marginal one. Overridable from Admin > Settings via `openai_tutor_model`.
 */
export const TUTOR_MODEL_DEFAULT = 'gpt-4.1-mini';

export interface AIConfig {
  provider: AIProvider;
  openai: {
    apiKey: string;
    defaultModel: string;
    tutorModel: string;
    ttsModel: string;
    ttsVoice: string;
  };
  anthropic: {
    apiKey: string;
    defaultModel: string;
  };
  features: {
    tutorEnabled: boolean;
    contentProcessingEnabled: boolean;
  };
  /**
   * Monthly AI tutor message pools per plan. These are exchanges, not minutes —
   * the usage counter increments once per student message.
   */
  limits: {
    freeMessagesPerMonth: number;
    premiumMessagesPerMonth: number;
    premiumPlusMessagesPerMonth: number;
  };
}

/**
 * Read app settings with the service-role key when it is available.
 *
 * The AI settings live in `app_settings`, which students generally cannot read
 * under RLS. Using the request-scoped client here would silently return zero
 * rows for exactly the users the settings are meant to govern, so the admin
 * toggles would never reach them.
 */
async function fetchAISettings(): Promise<
  { rows: { key: string; value: string }[] } | { error: unknown }
> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const supabase =
    url && serviceKey
      ? createSupabaseClient(url, serviceKey)
      : await createClient();

  const { data, error } = await supabase
    .from('app_settings')
    .select('key, value, value_type')
    .eq('category', 'ai');

  if (error) return { error };
  return { rows: (data ?? []) as { key: string; value: string }[] };
}

// Cache for AI config to avoid repeated DB calls
let configCache: AIConfig | null = null;
let configCacheTime: number = 0;
const CACHE_TTL = 60 * 1000; // 1 minute cache

/**
 * Get AI configuration from database or environment
 */
export async function getAIConfig(): Promise<AIConfig> {
  // Check cache
  if (configCache && Date.now() - configCacheTime < CACHE_TTL) {
    return configCache;
  }

  try {
    const result = await fetchAISettings();

    if ('error' in result) {
      console.error('Failed to fetch AI settings:', result.error);
      // Fall back to environment variables
      return getEnvConfig();
    }

    // Parse settings into config object
    const settingsMap = new Map<string, string>();
    result.rows.forEach(s => settingsMap.set(s.key, s.value));

    const config: AIConfig = {
      provider: (settingsMap.get('ai_provider') || 'openai') as AIProvider,
      openai: {
        apiKey: settingsMap.get('openai_api_key') || process.env.OPENAI_API_KEY || '',
        defaultModel: settingsMap.get('openai_default_model') || 'gpt-4o',
        tutorModel: settingsMap.get('openai_tutor_model') || TUTOR_MODEL_DEFAULT,
        ttsModel: settingsMap.get('openai_tts_model') || 'tts-1',
        ttsVoice: settingsMap.get('openai_tts_voice') || 'alloy',
      },
      anthropic: {
        apiKey: settingsMap.get('anthropic_api_key') || process.env.ANTHROPIC_API_KEY || '',
        defaultModel: settingsMap.get('anthropic_default_model') || 'claude-3-5-sonnet-20241022',
      },
      features: {
        // Fail open: an unseeded settings row must not disable the tutor.
        // Only an explicit "false" from the admin panel turns it off.
        tutorEnabled: settingsMap.get('ai_tutor_enabled') !== 'false',
        contentProcessingEnabled: settingsMap.get('ai_content_processing_enabled') !== 'false',
      },
      limits: {
        freeMessagesPerMonth: parseLimit(
          settingsMap.get('free_ai_messages_per_month'),
          PLANS.FREE.aiMessagesPerMonth
        ),
        premiumMessagesPerMonth: parseLimit(
          settingsMap.get('premium_ai_messages_per_month'),
          PLANS.PREMIUM.aiMessagesPerMonth
        ),
        premiumPlusMessagesPerMonth: parseLimit(
          settingsMap.get('premium_plus_ai_messages_per_month'),
          PLANS.PREMIUM_PLUS.aiMessagesPerMonth
        ),
      },
    };

    // Update cache
    configCache = config;
    configCacheTime = Date.now();

    return config;
  } catch (error) {
    console.error('Error loading AI config:', error);
    return getEnvConfig();
  }
}

/**
 * Parse a numeric limit, falling back to the plan default when the setting is
 * missing, blank, or not a number. `0` is a valid value (feature off).
 */
function parseLimit(raw: string | undefined, fallback: number): number {
  if (raw === undefined || raw === null || raw === '') return fallback;
  const parsed = parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

/**
 * Fallback to environment variables
 */
function getEnvConfig(): AIConfig {
  return {
    provider: 'openai',
    openai: {
      apiKey: process.env.OPENAI_API_KEY || '',
      defaultModel: 'gpt-4o',
      tutorModel: TUTOR_MODEL_DEFAULT,
      ttsModel: 'tts-1',
      ttsVoice: 'alloy',
    },
    anthropic: {
      apiKey: process.env.ANTHROPIC_API_KEY || '',
      defaultModel: 'claude-3-5-sonnet-20241022',
    },
    features: {
      tutorEnabled: true,
      contentProcessingEnabled: true,
    },
    limits: {
      freeMessagesPerMonth: PLANS.FREE.aiMessagesPerMonth,
      premiumMessagesPerMonth: PLANS.PREMIUM.aiMessagesPerMonth,
      premiumPlusMessagesPerMonth: PLANS.PREMIUM_PLUS.aiMessagesPerMonth,
    },
  };
}

/**
 * Clear the config cache (call after admin updates settings)
 */
export function clearAIConfigCache(): void {
  configCache = null;
  configCacheTime = 0;
}

/**
 * Get OpenAI client instance
 */
export async function getOpenAIClient(): Promise<OpenAI> {
  const config = await getAIConfig();

  if (!config.openai.apiKey) {
    throw new Error('OpenAI API key is not configured. Please set it in Admin > Settings.');
  }

  return new OpenAI({
    apiKey: config.openai.apiKey,
  });
}

/**
 * Token estimation (approximate)
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Calculate processing cost
 */
export function calculateCost(
  inputTokens: number,
  outputTokens: number,
  model: string = 'gpt-4o'
): number {
  // Pricing as of 2024 (update as needed)
  const pricing: Record<string, { input: number; output: number }> = {
    'gpt-4o': { input: 2.50, output: 10.00 },
    'gpt-4o-mini': { input: 0.15, output: 0.60 },
    'gpt-4-turbo': { input: 10.00, output: 30.00 },
    'claude-3-5-sonnet-20241022': { input: 3.00, output: 15.00 },
    'claude-3-haiku-20240307': { input: 0.25, output: 1.25 },
  };

  const modelPricing = pricing[model] || pricing['gpt-4o'];

  const inputCost = (inputTokens / 1_000_000) * modelPricing.input;
  const outputCost = (outputTokens / 1_000_000) * modelPricing.output;

  return inputCost + outputCost;
}

/**
 * Chat completion with unified config
 */
export async function chatCompletion(options: {
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
}): Promise<{
  content: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
}> {
  const config = await getAIConfig();
  const openai = await getOpenAIClient();

  const model = options.model || config.openai.defaultModel;

  const completion = await openai.chat.completions.create({
    model,
    messages: options.messages,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.maxTokens ?? 4096,
    response_format: options.jsonMode ? { type: 'json_object' } : undefined,
  });

  const content = completion.choices[0]?.message?.content || '';
  const inputTokens = completion.usage?.prompt_tokens || estimateTokens(
    options.messages.map(m => m.content).join('')
  );
  const outputTokens = completion.usage?.completion_tokens || estimateTokens(content);
  const cost = calculateCost(inputTokens, outputTokens, model);

  return {
    content,
    inputTokens,
    outputTokens,
    cost,
  };
}

/**
 * Text-to-Speech with unified config
 */
export async function textToSpeech(options: {
  text: string;
  voice?: string;
  model?: string;
}): Promise<Buffer> {
  const config = await getAIConfig();
  const openai = await getOpenAIClient();

  const response = await openai.audio.speech.create({
    model: options.model || config.openai.ttsModel,
    voice: (options.voice || config.openai.ttsVoice) as 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer',
    input: options.text,
  });

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Check if AI features are available
 */
export async function isAIAvailable(): Promise<{
  available: boolean;
  tutorEnabled: boolean;
  contentProcessingEnabled: boolean;
  error?: string;
}> {
  try {
    const config = await getAIConfig();

    if (!config.openai.apiKey && !config.anthropic.apiKey) {
      return {
        available: false,
        tutorEnabled: false,
        contentProcessingEnabled: false,
        error: 'No AI API keys configured',
      };
    }

    return {
      available: true,
      tutorEnabled: config.features.tutorEnabled,
      contentProcessingEnabled: config.features.contentProcessingEnabled,
    };
  } catch (error) {
    return {
      available: false,
      tutorEnabled: false,
      contentProcessingEnabled: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}