// TikTok Pixel events from the browser. Safe to call anywhere: a no-op when
// the pixel is off or blocked. See components/site/tiktok-pixel.tsx.

export const TIKTOK_PIXEL_ID = process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID || "";

type Ttq = {
  page: () => void;
  track: (event: string, props?: Record<string, unknown>, opts?: { event_id?: string }) => void;
  identify: (data: Record<string, string>) => void;
};

declare global {
  interface Window { ttq?: Ttq }
}

/**
 * Calls ttq, or queues the call if the base code has not run yet. A page's
 * own effects run before the afterInteractive pixel script, so an event fired
 * on load would otherwise be dropped. The base code keeps an existing array
 * (`w[t]=w[t]||[]`) and replays [method, ...args] entries once it loads.
 */
function call(method: keyof Ttq, ...args: unknown[]): void {
  const w = window as unknown as { ttq?: unknown };
  const t = w.ttq as Record<string, unknown> | unknown[] | undefined;
  if (t && typeof (t as Record<string, unknown>)[method] === "function") {
    (t as Record<string, (...a: unknown[]) => void>)[method](...args);
    return;
  }
  const queue = (Array.isArray(t) ? t : (w.ttq = [])) as unknown[];
  queue.push([method, ...args]);
}

export const WORKBOOK_CONTENT = {
  content_id: "workbook_fpp",
  content_type: "product",
  content_name: "Le Français Pas à Pas",
};

export function ttqTrack(
  event: string,
  props?: Record<string, unknown>,
  eventId?: string
): void {
  if (!TIKTOK_PIXEL_ID || typeof window === "undefined") return;
  try {
    call("track", event, props, eventId ? { event_id: eventId } : undefined);
  } catch {
    /* never let tracking break the page */
  }
}

/**
 * Advanced matching: TikTok matches a SHA-256 of the email, never the address
 * itself. Hashed here in the browser, so the plain address never leaves.
 */
export async function ttqIdentifyEmail(email: string): Promise<void> {
  if (!TIKTOK_PIXEL_ID || typeof window === "undefined" || !window.crypto?.subtle) return;
  try {
    const bytes = new TextEncoder().encode(email.trim().toLowerCase());
    const digest = await window.crypto.subtle.digest("SHA-256", bytes);
    const hex = Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    call("identify", { email: hex });
  } catch {
    /* ignore */
  }
}
