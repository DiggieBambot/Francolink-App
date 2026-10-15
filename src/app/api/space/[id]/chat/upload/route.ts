// POST /api/space/[id]/chat/upload   { name, type, size }
//
// Step 1 of sending a file in class: hands out a one-off signed URL to upload
// into QUARANTINE (a private bucket nobody can read). Step 2,
// ./finalize/route.ts, inspects the file and publishes a cleaned copy.
//
// The bytes go straight to storage rather than through this function: Vercel
// caps a function's request body at 4.5 MB.
//
// Same access rule as the chat route: signed in, and the room exists (the room
// link is the key).

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import {
  ROOM_CHAT_INCOMING_BUCKET,
  ROOM_CHAT_MAX_BYTES,
  ROOM_CHAT_TYPES,
} from "@/lib/storage/room-chat";

/** Quarantined uploads nobody finalized are swept after this long. */
const ABANDONED_MS = 60 * 60 * 1000;

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { type, size } = await req.json().catch(() => ({}));
  if (typeof type !== "string" || !ROOM_CHAT_TYPES[type]) {
    return NextResponse.json(
      { error: "Share an image, PDF, audio clip or text file." },
      { status: 415 }
    );
  }
  if (typeof size !== "number" || size <= 0 || size > ROOM_CHAT_MAX_BYTES) {
    return NextResponse.json({ error: "Files can be up to 10 MB." }, { status: 413 });
  }

  const service = createServiceClient();
  const { data: space } = await service
    .from("tutor_lesson_sessions")
    .select("id")
    .eq("id", id)
    .maybeSingle();
  if (!space) return NextResponse.json({ error: "Space not found" }, { status: 404 });

  const incoming = service.storage.from(ROOM_CHAT_INCOMING_BUCKET);

  // Opportunistic sweep of this room's abandoned uploads (a tab closed between
  // upload and finalize). They are unreadable anyway; this just frees space.
  void (async () => {
    const { data: stale } = await incoming.list(id, { limit: 100 });
    const cutoff = Date.now() - ABANDONED_MS;
    const old = (stale ?? [])
      .filter((f) => f.created_at && new Date(f.created_at).getTime() < cutoff)
      .map((f) => `${id}/${f.name}`);
    if (old.length) await incoming.remove(old);
  })().catch(() => {});

  // No extension: nothing about this object should suggest what it is until
  // the server has looked.
  const path = `${id}/${crypto.randomUUID()}`;
  const { data, error } = await incoming.createSignedUploadUrl(path);
  if (error || !data) {
    return NextResponse.json({ error: "Couldn't start the upload." }, { status: 500 });
  }
  return NextResponse.json({ path, token: data.token });
}
