// src/lib/ai/client.ts

import OpenAI from 'openai';
import { createClient } from '@/lib/supabase/server';

export type AIProvider = 'openai' | 'anthropic';

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
  limits: {
    freeMinutesPerDay: number;
    premiumMinutesPerDay: number;
    premiumPlusMinutesPerDay: number;
  };
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
    const supabase = await createClient();

    // Fetch all AI settings
    const { data: settings, error } = await supabase
      .from('app_settings')
      .select('key, value, value_type')
      .eq('category', 'ai');

    if (error) {
      console.error('Failed to fetch AI settings:', error);
      // Fall back to environment variables
      return getEnvConfig();
    }

    // Parse settings into config object
    const settingsMap = new Map<string, string>();
    settings?.forEach(s => settingsMap.set(s.key, s.value));

    const config: AIConfig = {
      provider: (settingsMap.get('ai_provider') || 'openai') as AIProvider,
      openai: {
        apiKey: settingsMap.get('openai_api_key') || process.env.OPENAI_API_KEY || '',
        defaultModel: settingsMap.get('openai_default_model') || 'gpt-4o',
        tutorModel: settingsMap.get('openai_tutor_model') || 'gpt-4o',
        ttsModel: settingsMap.get('openai_tts_model') || 'tts-1',
        ttsVoice: settingsMap.get('openai_tts_voice') || 'alloy',
      },
      anthropic: {
        apiKey: settingsMap.get('anthropic_api_key') || process.env.ANTHROPIC_API_KEY || '',
        defaultModel: settingsMap.get('anthropic_default_model') || 'claude-3-5-sonnet-20241022',
      },
      features: {
        tutorEnabled: settingsMap.get('ai_tutor_enabled') === 'true',
        contentProcessingEnabled: settingsMap.get('ai_content_processing_enabled') !== 'false',
      },
      limits: {
        freeMinutesPerDay: parseInt(settingsMap.get('free_ai_minutes_per_day') || '0', 10),
        premiumMinutesPerDay: parseInt(settingsMap.get('premium_ai_minutes_per_day') || '30', 10),
        premiumPlusMinutesPerDay: parseInt(settingsMap.get('premium_plus_ai_minutes_per_day') || '120', 10),
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
 * Fallback to environment variables
 */
function getEnvConfig(): AIConfig {
  return {
    provider: 'openai',
    openai: {
      apiKey: process.env.OPENAI_API_KEY || '',
      defaultModel: 'gpt-4o',
      tutorModel: 'gpt-4o',
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
      freeMinutesPerDay: 0,
      premiumMinutesPerDay: 30,
      premiumPlusMinutesPerDay: 120,
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