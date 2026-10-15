// Where live-class chat attachments live, and the one check that decides
// whether a URL is one of them. Only files the server has inspected and rebuilt
// (lib/storage/sanitize-upload.ts) ever reach the public folder this checks. Shared by the server routes (before saving a
// message) and the browser (before rendering one that arrived by realtime
// broadcast, which never passes through our server).

/** Where cleaned, published attachments live (public). */
export const ROOM_CHAT_BUCKET = "assets";
/** Where uploads wait to be inspected (private; see 20261005 migration). */
export const ROOM_CHAT_INCOMING_BUCKET = "room-chat-incoming";
export const ROOM_CHAT_MAX_BYTES = 10 * 1024 * 1024; // 10 MB

/**
 * Types the picker offers and the upload route will take a claim of. A first
 * filter only: what a file IS gets decided from its bytes after upload.
 */
export const ROOM_CHAT_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "application/pdf": "pdf",
  "audio/mpeg": "mp3",
  "audio/mp4": "m4a",
  "audio/webm": "webm",
  "audio/wav": "wav",
  "text/plain": "txt",
};

export function roomChatFolder(sessionId: string): string {
  return `room-chat/${sessionId}/`;
}

/**
 * True only for a file we stored for THIS room: our Supabase project, the
 * public bucket, this room's folder, a plain file name. Anything else -- a
 * tracking pixel, a `javascript:` link, another room's file -- is refused.
 */
export function isRoomChatUrl(url: unknown, sessionId: string): url is string {
  if (typeof url !== "string") return false;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return false;
  const prefix = `${base.replace(/\/$/, "")}/storage/v1/object/public/${ROOM_CHAT_BUCKET}/${roomChatFolder(sessionId)}`;
  if (!url.startsWith(prefix)) return false;
  return /^[0-9a-f-]{36}\.[a-z0-9]{2,4}$/.test(url.slice(prefix.length));
}
