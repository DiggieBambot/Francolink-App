// "Your tutor started a live class" — the single place that fires a live-class
// invite, so every entry point (start-room API, /tutor/sessions/new) sends the
// same in-app row + Web Push with the same type and deeplink.
//
// The student side reads it back through GET /api/student/live-invite, which
// keys off `type = 'live_invite'` and the `/room/<id>` url written here.

import { createClient } from "@supabase/supabase-js";
import { notifyUser } from "./create";
import { LIVE_INVITE_TYPE } from "./live-invite-type";

export { LIVE_INVITE_TYPE };

function svc() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

/**
 * Notify a student that their tutor just opened a live classroom.
 * Never throws — an invite that fails to notify still leaves a working room.
 */
export async function sendLiveClassInvite(opts: {
  tutorId: string;
  studentId: string;
  roomId: string;
  lessonTitle?: string | null;
}): Promise<void> {
  const { tutorId, studentId, roomId, lessonTitle } = opts;
  // The open-classroom sentinel stores student_id === tutor_id (no student yet).
  if (!studentId || !roomId || studentId === tutorId) return;

  try {
    const { data: tutor } = await svc()
      .from("users")
      .select("name, email")
      .eq("id", tutorId)
      .maybeSingle();

    const tutorName = tutor?.name || tutor?.email?.split("@")[0] || "Your tutor";

    await notifyUser({
      userId: studentId,
      type: LIVE_INVITE_TYPE,
      title: `${tutorName} started a live class`,
      body: lessonTitle
        ? `Tap to join — ${lessonTitle}`
        : "Tap to join the classroom now.",
      url: `/room/${roomId}`,
    });
  } catch (e) {
    console.error("[live-invite] failed:", (e as Error).message);
  }
}
