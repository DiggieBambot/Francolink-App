// Live session room — both tutor and student visit /room/[id] and see the
// same lesson with their role-locked view. Realtime presence + tutor highlights.

import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { LessonRoom } from "@/components/lesson-v2/lesson-room";
import type { Lesson } from "@/lib/lessons/types";

export const dynamic = "force-dynamic";

function service() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export default async function RoomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/room/${id}`);

  // Read the session with the service client so a student opening a shared link
  // can load it (the link is the access key — Google-Meet style). RLS would
  // otherwise hide an open classroom from a not-yet-member student.
  const svc = service();
  const { data: session, error: sessionErr } = await svc
    .from("tutor_lesson_sessions")
    .select("id, tutor_id, student_id, tutor_lesson_id, status, title")
    .eq("id", id)
    .single();
  if (sessionErr || !session) notFound();

  // Role is decided by "did you create this room?". Everyone else who has the
  // link joins as the student. No pre-approval needed.
  const isTutor = session.tutor_id === user.id;
  const currentRole: "tutor" | "student" = isTutor ? "tutor" : "student";

  // Current lesson (may be null — either party picks one in-room).
  let lesson: Lesson | null = null;
  if (session.tutor_lesson_id) {
    const { data: row } = await supabase
      .from("tutor_lessons")
      .select("content")
      .eq("id", session.tutor_lesson_id)
      .maybeSingle();
    lesson = (row?.content as Lesson) ?? null;
  }

  // Lightweight published-lesson list for the in-room picker (with thumbnail).
  const { data: lessonList } = await supabase
    .from("tutor_lessons")
    .select("id, slug, title, level, duration_minutes, topic_tags, hero_image:content->>hero_image_url")
    .eq("status", "published")
    .order("level")
    .order("title");

  // Load persisted highlights so a refresh restores them (service: a joined
  // student isn't an RLS "member" of an open classroom).
  const { data: highlights } = await svc
    .from("tutor_lesson_highlights")
    .select("anchor_id, text")
    .eq("session_id", id);

  // Chat history: keep the last 30 days for this room, restore it on entry, and
  // sweep anything older (service so a link-joined student loads it too).
  const cutoff = new Date(Date.now() - 30 * 86400_000).toISOString();
  void svc.from("tutor_lesson_messages").delete().eq("session_id", id).lt("created_at", cutoff);
  const { data: msgRows } = await svc
    .from("tutor_lesson_messages")
    .select("id, sender_id, sender_name, sender_role, text, created_at")
    .eq("session_id", id)
    .gte("created_at", cutoff)
    .order("created_at", { ascending: true })
    .limit(500);
  const initialChat = (msgRows || []).map((m) => ({
    id: m.id as string,
    from: (m.sender_id as string) || "",
    name: (m.sender_name as string) || "Someone",
    role: (m.sender_role === "tutor" ? "tutor" : "student") as "tutor" | "student",
    text: m.text as string,
    at: new Date(m.created_at as string).getTime(),
  }));

  // Display name for presence.
  const { data: profile } = await supabase
    .from("users")
    .select("name, email")
    .eq("id", user.id)
    .maybeSingle();
  const name = profile?.name || profile?.email?.split("@")[0] || "User";

  return (
    <LessonRoom
      initialLesson={lesson}
      initialLessonId={session.tutor_lesson_id}
      lessonList={lessonList || []}
      sessionId={id}
      currentUserId={user.id}
      currentRole={currentRole}
      currentName={name}
      initialHighlights={highlights || []}
      initialChat={initialChat}
    />
  );
}
