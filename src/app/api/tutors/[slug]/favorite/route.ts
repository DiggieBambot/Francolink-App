// Favourite / unfavourite a tutor.
//
// POST adds, DELETE removes, both idempotent — the button is optimistic, so a
// double-click or a retry must not be an error the student ever sees.
//
// The tutor is addressed by public slug rather than id: the slug is what the
// directory and the profile page already have, and it keeps a raw user id out
// of the client.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

async function resolve(slug: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: NextResponse.json(
      { error: "Sign in to save a tutor.", needsLogin: true },
      { status: 401 }
    ) };
  }

  // Only a listed tutor can be favourited. Anything else is either a stale
  // link or someone guessing slugs.
  const { data: profile } = await supabase
    .from("tutor_public_profiles")
    .select("user_id")
    .eq("slug", slug)
    .eq("is_public", true)
    .eq("approval_status", "approved")
    .maybeSingle();

  if (!profile) {
    return { error: NextResponse.json({ error: "No such tutor." }, { status: 404 }) };
  }

  return { supabase, user, tutorId: profile.user_id as string };
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const r = await resolve(slug);
  if (r.error) return r.error;

  if (r.tutorId === r.user.id) {
    return NextResponse.json(
      { error: "You can't save yourself." },
      { status: 400 }
    );
  }

  const { error } = await r.supabase
    .from("tutor_favorites")
    .upsert(
      { student_id: r.user.id, tutor_id: r.tutorId },
      { onConflict: "student_id,tutor_id", ignoreDuplicates: true }
    );

  if (error) {
    console.error("[tutors/favorite] insert failed", error);
    return NextResponse.json({ error: "Couldn't save that tutor." }, { status: 500 });
  }

  return NextResponse.json({ favorited: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const r = await resolve(slug);
  if (r.error) return r.error;

  const { error } = await r.supabase
    .from("tutor_favorites")
    .delete()
    .eq("student_id", r.user.id)
    .eq("tutor_id", r.tutorId);

  if (error) {
    console.error("[tutors/favorite] delete failed", error);
    return NextResponse.json({ error: "Couldn't remove that tutor." }, { status: 500 });
  }

  return NextResponse.json({ favorited: false });
}
