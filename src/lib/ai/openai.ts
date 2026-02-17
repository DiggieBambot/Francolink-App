// src/lib/ai/openai.ts

import OpenAI from 'openai';

// Initialize OpenAI client
export function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }
  
  return new OpenAI({
    apiKey,
  });
}

// Token counting (approximate)
export function estimateTokens(text: string): number {
  // Rough estimate: 1 token ≈ 4 characters
  return Math.ceil(text.length / 4);
}

// Calculate cost
export function calculateCost(inputTokens: number, outputTokens: number): number {
  const inputCost = (inputTokens / 1_000_000) * 2.50;  // $2.50 per 1M tokens
  const outputCost = (outputTokens / 1_000_000) * 10.00; // $10 per 1M tokens
  return inputCost + outputCost;
}