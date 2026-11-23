// Encryption for Google refresh tokens at rest.
//
// A refresh token is a long-lived key to someone's whole calendar. The table
// is already service-role only, but a database dump or a leaked backup should
// still not hand those keys out, so they are sealed with AES-256-GCM using a
// key that lives only in the server environment.
//
// GOOGLE_TOKEN_ENCRYPTION_KEY: 32 random bytes, base64. Generate with
//   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
// Rotating it disconnects every tutor (they reconnect with one click).

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

function key(): Buffer {
  const raw = process.env.GOOGLE_TOKEN_ENCRYPTION_KEY;
  if (!raw) throw new Error("GOOGLE_TOKEN_ENCRYPTION_KEY is not set");
  const k = Buffer.from(raw, "base64");
  if (k.length !== 32) throw new Error("GOOGLE_TOKEN_ENCRYPTION_KEY must be 32 bytes, base64");
  return k;
}

export function seal(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, enc].map((b) => b.toString("base64url")).join(".");
}

export function open(sealed: string): string {
  const [iv, tag, enc] = sealed.split(".").map((p) => Buffer.from(p, "base64url"));
  const decipher = createDecipheriv("aes-256-gcm", key(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8");
}
