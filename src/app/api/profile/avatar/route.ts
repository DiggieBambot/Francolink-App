// src/app/api/profile/avatar/route.ts
//
// POST   multipart/form-data { file } → uploads, updates users.avatar_url, returns { url }
// DELETE                              → clears users.avatar_url, deletes prior file if any

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

const BUCKET = "assets";
const FOLDER = "avatars";
const MAX_BYTES = 4 * 1024 * 1024; // 4 MB
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

function extFor(mime: string): string {
  if (mime === "image/png") return "png";
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/webp") return "webp";
  if (mime === "image/gif") return "gif";
  return "png";
}

function storagePathFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  // public URL looks like: <base>/storage/v1/object/public/assets/avatars/<id>.<ext>
  const marker = `/object/public/${BUCKET}/`;
  const i = url.indexOf(marker);
  if (i < 0) return null;
  return url.slice(i + marker.length);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file field required" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: `Unsupported type: ${file.type}` }, { status: 415 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: `Max ${Math.round(MAX_BYTES / 1024 / 1024)} MB` }, { status: 413 });
  }

  // Delete prior avatar so we don't leak storage on multiple uploads.
  const { data: prior } = await supabase
    .from("users")
    .select("avatar_url")
    .eq("id", user.id)
    .single();
  const priorPath = storagePathFromUrl(prior?.avatar_url);

  const path = `${FOLDER}/${user.id}.${extFor(file.type)}`;
  const buf = Buffer.from(await file.arrayBuffer());

  // Service client for the same reason as the tutor-photo route: `assets` has
  // no INSERT policy for `authenticated`. The user is authorized above and the
  // path is keyed to their own id.
  const storage = createServiceClient().storage.from(BUCKET);

  const { error: upErr } = await storage.upload(path, buf, {
    contentType: file.type,
    upsert: true,
  });
  if (upErr) {
    return NextResponse.json({ error: `Upload failed: ${upErr.message}` }, { status: 500 });
  }

  // If the prior file used a different extension, remove the stale object.
  if (priorPath && priorPath !== path) {
    await storage.remove([priorPath]);
  }

  const { data: pub } = storage.getPublicUrl(path);
  // Append a cache-buster so the UI shows the new image immediately.
  const url = `${pub.publicUrl}?t=${Date.now()}`;

  const { error: dbErr } = await supabase
    .from("users")
    .update({ avatar_url: url })
    .eq("id", user.id);
  if (dbErr) {
    return NextResponse.json({ error: `DB update failed: ${dbErr.message}` }, { status: 500 });
  }

  return NextResponse.json({ url });
}

export async function DELETE() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: prior } = await supabase
    .from("users")
    .select("avatar_url")
    .eq("id", user.id)
    .single();
  const priorPath = storagePathFromUrl(prior?.avatar_url);

  const { error: dbErr } = await supabase
    .from("users")
    .update({ avatar_url: null })
    .eq("id", user.id);
  if (dbErr) {
    return NextResponse.json({ error: `DB update failed: ${dbErr.message}` }, { status: 500 });
  }

  if (priorPath) {
    // Best-effort cleanup; the row is already cleared either way.
    await createServiceClient().storage.from(BUCKET).remove([priorPath]);
  }
  return NextResponse.json({ ok: true });
}
