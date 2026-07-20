import { createHash } from "crypto";

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function stripHtml(value: string): string {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
}

export function compactText(value: string, maxChars: number): string {
  const text = value.replace(/\s+/g, " ").trim();
  return text.length <= maxChars ? text : `${text.slice(0, maxChars - 1).trim()}…`;
}

export function parseJsonObject<T>(raw: string): T {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
  return JSON.parse(cleaned) as T;
}

export async function fetchWithTimeout(url: string, init: RequestInit = {}, timeoutMs = 12000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        "user-agent": "FrancoLink Daily News/1.0",
        ...(init.headers || {}),
      },
    });
  } finally {
    clearTimeout(timer);
  }
}

export async function withRetries<T>(fn: () => Promise<T>, attempts = 2): Promise<T> {
  let last: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      last = error;
      if (i < attempts - 1) await new Promise((resolve) => setTimeout(resolve, 400 * (i + 1)));
    }
  }
  throw last;
}
