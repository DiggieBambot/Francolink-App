// POST /api/space/[id]/chat/upload/finalize   { path, name, type }
//
// Step 2 of sending a file in class. Takes the quarantined upload, decides
// what it really is from its bytes, rebuilds or rejects it
// (lib/storage/sanitize-upload.ts), and publishes ONLY the cleaned copy. The
// quarantined original is deleted whatever the outcome.
//
// Returns { url, name, type } for the chat message, or { error } with a
// message fit to show the sender.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import {
  ROOM_CHAT_BUCKET,
  ROOM_CHAT_INCOMING_BUCKET,
  ROOM_CHAT_MAX_BYTES,
  roomChatFolder,
} from "@/lib/storage/room-chat";
import { RejectedFile, sanitizeUpload } from "@/lib/storage/sanitize-upload";

// sharp and pdf-lib are native/Node libraries.
export const runtime = "nodejs";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** A display name that cannot smuggle anything: no paths, no control chars. */
function safeName(name: unknown, ext: string): string {
  const base = String(name || "file")
    .split(/[\\/]/)
    .pop()!
    .replace(/[\u0000-\u001f\u007f<>:"|?*]/g, "")
    .replace(/\.[^.]*$/, "")
    .trim()
    .slice(0, 100);
  return `${base || "file"}.${ext}`;
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { path, name, type } = await req.json().catch(() => ({}));
  // Only a path this room's upload route could have issued.
  const [folder, object, ...rest] = typeof path === "string" ? path.split("/") : [];
  if (folder !== id || !object || !UUID.test(object) || rest.length) {
    return NextResponse.json({ error: "Upload not found." }, { status: 400 });
  }

  const service = createServiceClient();
  const incoming = service.storage.from(ROOM_CHAT_INCOMING_BUCKET);

  try {
    const { data: blob, error } = await incoming.download(path);
    if (error || !blob) {
      return NextResponse.json({ error: "Upload not found." }, { status: 404 });
    }
    if (blob.size > ROOM_CHAT_MAX_BYTES) {
      return NextResponse.json({ error: "Files can be up to 10 MB." }, { status: 413 });
    }

    let clean;
    try {
      clean = await sanitizeUpload(Buffer.from(await blob.arrayBuffer()), String(type || ""));
    } catch (e) {
      if (e instanceof RejectedFile) {
        console.warn("[chat/upload] rejected", id, user.id, e.message);
        return NextResponse.json({ error: e.message }, { status: 422 });
      }
      console.error("[chat/upload] inspection failed", id, e);
      return NextResponse.json({ error: "Couldn't check that file, so it wasn't sent." }, { status: 422 });
    }

    const finalPath = `${roomChatFolder(id)}${crypto.randomUUID()}.${clean.ext}`;
    const assets = service.storage.from(ROOM_CHAT_BUCKET);
    const { error: upErr } = await assets.upload(finalPath, clean.bytes, {
      contentType: clean.type,
      cacheControl: "31536000",
    });
    if (upErr) {
      return NextResponse.json({ error: "Couldn't upload that file." }, { status: 500 });
    }

    return NextResponse.json({
      url: assets.getPublicUrl(finalPath).data.publicUrl,
      name: safeName(name, clean.ext),
      // The base type only; the chat UI picks a renderer from it.
      type: clean.type.split(";")[0],
    });
  } finally {
    await incoming.remove([path]).catch(() => {});
  }
}
