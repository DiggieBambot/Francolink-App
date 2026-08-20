// Profile photo for a tutor's public listing on francolink.net.
//
// Two callers are allowed: the tutor uploading their own photo, and an admin
// uploading on their behalf (most tutors won't do this themselves, so the
// admin path is how the directory actually gets populated).
//
// Follows the same bucket/patterns as /api/profile/avatar. This is a separate
// object from users.avatar_url on purpose: the in-app avatar and the public
// marketing photo are different pictures with different expectations.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

const BUCKET = "assets";
const FOLDER = "tutor-photos";
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

function extFor(mime: string): string {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "jpg";
}

/** Resolves who this upload is for, or an error response. */
async function resolveTarget(
  supabase: Awaited<ReturnType<typeof createClient>>,
  requestedUserId: string | null
): Promise<{ targetId: string } | { error: NextResponse }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const { data: me } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  const role = (me?.role || "").toUpperCase();

  // No explicit target: the caller is uploading their own photo.
  if (!requestedUserId || requestedUserId === user.id) {
    if (role !== "TUTOR" && role !== "ADMIN") {
      return { error: NextResponse.json({ error: "Tutors only" }, { status: 403 }) };
    }
    return { targetId: user.id };
  }

  // Explicit target: admins only.
  if (role !== "ADMIN") {
    return { error: NextResponse.json({ error: "Admins only" }, { status: 403 }) };
  }
  const { data: target } = await supabase
    .from("users")
    .select("id, role")
    .eq("id", requestedUserId)
    .maybeSingle();
  const targetRole = (target?.role || "").toUpperCase();
  if (!target || (targetRole !== "TUTOR" && targetRole !== "ADMIN")) {
    return {
      error: NextResponse.json(
        { error: "That user can't be listed as a tutor" },
        { status: 400 }
      ),
    };
  }
  return { targetId: target.id };
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const requestedUserId = form.get("user_id");
  const resolved = await resolveTarget(
    supabase,
    typeof requestedUserId === "string" ? requestedUserId : null
  );
  if ("error" in resolved) return resolved.error;

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file field required" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "Use a JPEG, PNG or WebP image." },
      { status: 415 }
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Keep the image under 5 MB." }, { status: 413 });
  }

  const path = `${FOLDER}/${resolved.targetId}.${extFor(file.type)}`;
  const buf = Buffer.from(await file.arrayBuffer());

  // The write goes through the service client: `assets` has no INSERT policy
  // for `authenticated`, and the path is keyed to the *target* user, which a
  // per-caller policy couldn't express for the admin-uploads-for-a-tutor case.
  // resolveTarget above is what authorizes this.
  const storage = createServiceClient().storage.from(BUCKET);

  const { error: upErr } = await storage.upload(path, buf, {
    contentType: file.type,
    upsert: true,
  });
  if (upErr) {
    console.error("[site/tutor-photo] upload failed", upErr);
    return NextResponse.json({ error: `Upload failed: ${upErr.message}` }, { status: 500 });
  }

  const { data: pub } = storage.getPublicUrl(path);
  // Cache-buster so a re-upload shows immediately in the editor.
  const url = `${pub.publicUrl}?t=${Date.now()}`;

  // The photo is only persisted when the profile itself is saved — this
  // endpoint just puts the file somewhere and hands back the URL.
  return NextResponse.json({ url });
}
