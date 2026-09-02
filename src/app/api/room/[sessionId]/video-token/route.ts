// A join token for the lesson room's video call.
//
// The token IS the access control. Daily rooms are created private, so a
// leaked room URL gets nobody in on its own — the only way to join is a token
// minted here, and this route mints one only for somebody we can see in
// lesson_room_participants for that session.
//
// Mirrors the membership check in /room/[id]/page.tsx deliberately, including
// its fallback for sessions created before the participants table existed. If
// the two ever disagree, someone can open the room and not join the call, or
// the reverse — both are worse than one duplicated query.
//
// Membership is NOT sufficient on its own. Video is only for lessons taught by
// a listed FrancoLink tutor — someone we interviewed, approved and put in the
// directory. Anyone with a TUTOR account can open a room today (there are
// hundreds, most of them teaching students they brought themselves), and every
// minute of video is a real cost on our Daily account against a lesson we take
// no money for. So the gate is on the SESSION'S TUTOR being listed, not on who
// is asking: a student must get video in a listed tutor's room, and neither
// side gets it anywhere else.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { DailyNotConfigured, ensureRoom, meetingToken } from "@/lib/video/daily";

export const runtime = "nodejs";

function service() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  }

  const db = service();

  const { data: session } = await db
    .from("tutor_lesson_sessions")
    .select("id, tutor_id, student_id")
    .eq("id", sessionId)
    .maybeSingle();

  if (!session) {
    return NextResponse.json({ error: "No such room." }, { status: 404 });
  }

  const isTutor = session.tutor_id === user.id;

  const { data: membership } = await db
    .from("lesson_room_participants")
    .select("user_id")
    .eq("session_id", sessionId)
    .eq("user_id", user.id)
    .maybeSingle();

  // The student_id branch is the same deliberate fallback the room page makes,
  // for sessions created before participants were recorded.
  const allowed = isTutor || Boolean(membership) || session.student_id === user.id;

  if (!allowed) {
    return NextResponse.json({ error: "That isn't your room." }, { status: 403 });
  }

  // Is the tutor running this room an official FrancoLink tutor?
  const { data: listing } = await db
    .from("tutor_public_profiles")
    .select("is_public, approval_status, accepts_bookings")
    .eq("user_id", session.tutor_id)
    .maybeSingle();

  const listed =
    Boolean(listing) &&
    listing!.approval_status === "approved" &&
    listing!.is_public === true &&
    listing!.accepts_bookings === true;

  if (!listed) {
    // Deliberately a soft answer, not a hard failure: the room still works.
    // Chat, whiteboard, lesson content and homework are all there, and an
    // independent tutor teaching their own student loses nothing they had
    // yesterday. `unavailable` is what the panel renders as an explanation
    // rather than an error, because there is nothing for them to retry.
    return NextResponse.json(
      {
        error:
          "Live video is for lessons with FrancoLink tutors. Apply to join and it turns on.",
        unavailable: true,
      },
      { status: 403 }
    );
  }

  const { data: profile } = await db
    .from("users")
    .select("name")
    .eq("id", user.id)
    .maybeSingle();

  try {
    const [roomUrl, token] = await Promise.all([
      ensureRoom(sessionId),
      meetingToken({
        sessionId,
        userId: user.id,
        userName: profile?.name || (isTutor ? "Tutor" : "Student"),
        isTutor,
      }),
    ]);

    return NextResponse.json({ roomUrl, token });
  } catch (err) {
    if (err instanceof DailyNotConfigured) {
      // Not an error the student caused, and not one they can act on. The room
      // still works without video — chat, whiteboard and the lesson are all
      // there — so this is a 503 the panel renders as "video unavailable"
      // rather than something that breaks the lesson.
      return NextResponse.json(
        { error: "Video isn't configured yet.", unconfigured: true },
        { status: 503 }
      );
    }
    console.error("[room/video-token] failed", err);
    return NextResponse.json(
      { error: "Couldn't start video. Try rejoining." },
      { status: 502 }
    );
  }
}
