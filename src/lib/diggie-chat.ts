// Single loader for the DiggieChat widget (DiggieStack's AI chatbot).
//
// The widget is an IIFE served from <baseUrl>/widget/chat.js. It reads
// window.DiggieChat for config at execution time, then augments that same
// object with its public API (open/close/mount/...) and fires
// "diggiechat:ready". So config must be in place before the tag runs, and the
// API is only usable after ready — both of which this module handles.
//
// Loading is idempotent: every caller shares one script tag and one promise.

export interface DiggieChatApi {
  open(): void;
  close(): void;
  toggle(): void;
  isOpen(): boolean;
  unreadCount(): number;
  mount(container: HTMLElement): void;
  unmount(): void;
  isMounted(): boolean;
  onUnread(fn: (n: number) => void): () => void;
}

declare global {
  interface Window {
    DiggieChat?: Partial<DiggieChatApi> & { siteId?: string; baseUrl?: string };
  }
}

export const DIGGIECHAT_SITE_ID = process.env.NEXT_PUBLIC_DIGGIECHAT_SITE_ID;
export const DIGGIECHAT_BASE_URL =
  process.env.NEXT_PUBLIC_DIGGIECHAT_BASE_URL || "https://diggiestack.com";

let loadPromise: Promise<DiggieChatApi> | null = null;

export function loadDiggieChat(): Promise<DiggieChatApi> {
  if (loadPromise) return loadPromise;

  loadPromise = new Promise<DiggieChatApi>((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("DiggieChat can only load in the browser"));
      return;
    }
    if (!DIGGIECHAT_SITE_ID) {
      reject(new Error("NEXT_PUBLIC_DIGGIECHAT_SITE_ID is not set"));
      return;
    }

    // Already loaded by an earlier call in another component tree.
    if (typeof window.DiggieChat?.mount === "function") {
      resolve(window.DiggieChat as DiggieChatApi);
      return;
    }

    window.DiggieChat = {
      ...window.DiggieChat,
      siteId: DIGGIECHAT_SITE_ID,
      baseUrl: DIGGIECHAT_BASE_URL,
    };

    window.addEventListener(
      "diggiechat:ready",
      () => resolve(window.DiggieChat as DiggieChatApi),
      { once: true }
    );

    const s = document.createElement("script");
    s.src = `${DIGGIECHAT_BASE_URL}/widget/chat.js`;
    s.async = true;
    s.onerror = () => {
      loadPromise = null; // let a later mount retry
      reject(new Error("Failed to load DiggieChat widget"));
    };
    document.body.appendChild(s);
  });

  return loadPromise;
}
