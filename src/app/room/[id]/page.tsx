// Live session room — both tutor and student visit /room/[id] and see the
// same lesson with their role-locked view. Realtime presence + tutor highlights.

import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { LessonRoom } from "@/components/lesson-v2/lesson-room";
import { MAX_GROUP_LEARNERS } from "@/lib/lessons/room-limits";
import { resolveClassWindow } from "@/lib/lessons/class-window";
import { roomKindFor, listingFor } from "@/lib/tutors/listing";
import { categoryForLesson, CATEGORIES } from "@/lib/lessons/categories";
import { getBookableSlots } from "@/lib/booking/availability";
import type { Lesson } from "@/lib/lessons/types";

export const dynamic = "force-dynamic";

/** Most rooms offered in the in-room switcher. */
const ROOM_SWITCHER_LIMIT = 8;

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
    .select("id, tutor_id, student_id, tutor_lesson_id, status, title, is_group")
    .eq("id", id)
    .single();
  if (sessionErr || !session) notFound();

  // The paired student (null for an open classroom whose sentinel stores
  // student_id === tutor_id). Drives the tutor's in-room Ring / Send-homework.
  const pairedStudentId =
    session.student_id && session.student_id !== session.tutor_id ? session.student_id : null;
  let pairedStudentName: string | null = null;
  if (pairedStudentId) {
    const { data: stu } = await svc
      .from("users")
      .select("name, email")
      .eq("id", pairedStudentId)
      .maybeSingle();
    // No first_name/last_name on users — asking for them 400s the whole
    // query, which is why this room has been saying "Waiting for the other
    // side…" next to a student it knew perfectly well.
    pairedStudentName = stu?.name?.trim() || stu?.email?.split("@")[0] || null;
  }

  // Access is membership in lesson_room_participants. A 1:1 room has exactly two
  // rows and behaves as it always did; a group room holds up to
  // MAX_GROUP_LEARNERS students. Everything in a room — chat, highlights,
  // answers — is visible to every member, so this gate is the whole privacy
  // boundary and nobody joins by accident.
  const isTutor = session.tutor_id === user.id;
  const { data: memberRows } = await svc
    .from("lesson_room_participants")
    .select("user_id, role")
    .eq("session_id", id);
  const members = memberRows || [];
  // The student_id branch is a deliberate fallback: a session created before
  // this table existed (or by a path that somehow skipped the seeding trigger)
  // must never lock out its own student.
  const isMember =
    isTutor ||
    members.some((m) => m.user_id === user.id) ||
    session.student_id === user.id;

  if (!isMember) {
    // Not a member yet. A group room admits a newcomer holding the link, up to
    // capacity; a 1:1 room never does.
    if (!session.is_group) {
      redirect("/dashboard?error=not_your_room");
    }
    const learnerCount = members.filter((m) => m.role === "student").length;
    if (learnerCount >= MAX_GROUP_LEARNERS) {
      redirect("/dashboard?error=room_full");
    }
    // The DB trigger is the real capacity guard — the count above can race
    // against four other people opening the link at the same moment.
    const { error: joinErr } = await svc
      .from("lesson_room_participants")
      .insert({ session_id: id, user_id: user.id, role: "student" });
    if (joinErr && joinErr.code !== "23505") {
      redirect("/dashboard?error=room_full");
    }
  }
  const currentRole: "tutor" | "student" = isTutor ? "tutor" : "student";

  // The tutor's other live rooms, for the in-room switcher. A tutor running
  // back-to-back or parallel classes can hop straight between them instead of
  // going out to the dashboard. Students never see this.
  //
  // Scoped to rooms started in the last day and capped: sessions are rarely
  // marked ended, so "status = active" alone accumulates indefinitely — one
  // tutor currently has 22. The switcher is for the classes you are actually
  // teaching today, not an archive; /tutor/sessions remains the full list.
  let otherRooms: { id: string; label: string; isGroup: boolean }[] = [];
  if (isTutor) {
    const since = new Date(Date.now() - 24 * 3600_000).toISOString();
    const { data: siblingRows } = await svc
      .from("tutor_lesson_sessions")
      .select("id, student_id, title, is_group, started_at")
      .eq("tutor_id", user.id)
      .eq("status", "active")
      .neq("id", id)
      .gte("started_at", since)
      .order("started_at", { ascending: false })
      .limit(ROOM_SWITCHER_LIMIT);
    const siblings = siblingRows || [];

    // Name each room after its student. Group rooms have no single student, so
    // they fall back to the session title.
    const otherStudentIds = siblings
      .map((s) => s.student_id)
      .filter((sid): sid is string => Boolean(sid)) as string[];
    const nameById = new Map<string, string>();
    if (otherStudentIds.length > 0) {
      const { data: others } = await svc
        .from("users")
        .select("id, name, email")
        .in("id", otherStudentIds);
      for (const o of others || []) {
        nameById.set(o.id, o.name?.trim() || o.email?.split("@")[0] || "Student");
      }
    }

    otherRooms = siblings.map((s) => {
      // student_id === the tutor's own id is the "no claimed student" sentinel.
      const named =
        s.student_id && s.student_id !== user.id ? nameById.get(s.student_id) : null;
      return {
        id: s.id as string,
        label: s.is_group
          ? s.title || "Group class"
          : named || s.title || "Untitled room",
        isGroup: Boolean(s.is_group),
      };
    });
  }

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
    .select(
      "id, slug, title, level, duration_minutes, topic_tags, language, source_url, hero_image:content->>hero_image_url"
    )
    .eq("status", "published")
    .order("level")
    .order("title");

  // Categorise for the in-room shelf. 645 lessons in one flat grid is a pile,
  // not a catalogue — the same taxonomy the public library uses is derived
  // here so the room groups them the way a tutor already thinks about them.
  // Done server-side so the client never ships the classification regexes.
  const catalogue = (lessonList || []).map((l) => ({
    id: l.id as string,
    slug: l.slug as string,
    title: l.title as string,
    level: l.level as string,
    duration_minutes: l.duration_minutes as number | null,
    topic_tags: l.topic_tags as string[] | null,
    hero_image: (l as { hero_image?: string | null }).hero_image ?? null,
    language: ((l as { language?: string | null }).language || "fr").toLowerCase(),
    category: categoryForLesson(
      (l as { language?: string | null }).language,
      (l as { source_url?: string | null }).source_url,
      (l.topic_tags as string[] | null) ?? undefined
    ),
  }));

  // Load persisted highlights so a refresh restores them (service: a joined
  // student isn't an RLS "member" of an open classroom). The author's role is
  // derived from created_by so each side's highlight keeps its own colour.
  const { data: highlightRows } = await svc
    .from("tutor_lesson_highlights")
    .select("anchor_id, created_by")
    .eq("session_id", id);
  const highlights = (highlightRows || []).map((h) => ({
    anchor_id: h.anchor_id as string,
    role: (h.created_by === session.tutor_id ? "tutor" : "student") as "tutor" | "student",
  }));

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

  // Classroom or Study Space? Decided by the room's TUTOR, not by who is
  // visiting: a student in an independent tutor's room gets the same space
  // their tutor does. Evaluated per visit, so a tutor who gets approved finds
  // their existing rooms have become classrooms with no migration.
  const roomKind = await roomKindFor(session.tutor_id);

  // Is this room's booked class on right now?
  //
  // Resolved here purely so the pre-class state renders at first paint — the
  // token route resolves it again and is the actual gate, because a token is
  // what gets a person onto a call and this page is only what they see.
  // `unscheduled` (no booking has ever used this room) leaves classWindow
  // undefined, and video behaves exactly as it always has.
  // A Study Space has no bookings and no clock; skip the query entirely
  // rather than asking a question whose answer it would throw away.
  const classState =
    roomKind === "space"
      ? ({ kind: "unscheduled" } as const)
      : await resolveClassWindow(id, { persist: true });
  const classWindow =
    classState.kind === "unscheduled"
      ? undefined
      : {
          open: classState.kind === "open",
          opensAt:
            classState.kind === "open"
              ? classState.current.opensAt
              : classState.next?.opensAt ?? null,
          startsAt:
            classState.kind === "open"
              ? classState.current.startsAt
              : classState.next?.startsAt ?? null,
        };

  // The tutor's next free slot, for the card the student sees when class ends.
  //
  // Only for a Classroom, only for the student, and best-effort: a slow or
  // failed availability read must never stop a room from opening. The end of a
  // lesson is the moment with the most intent in the whole product, and until
  // now we spent it on a full stop.
  let nextSlot: { startsAt: string; durationMinutes: number; href: string } | null = null;
  let tutorSlug: string | null = null;
  if (roomKind === "classroom" && !isTutor) {
    try {
      const listing = await listingFor(session.tutor_id);
      tutorSlug = listing?.slug ?? null;
      if (tutorSlug) {
        const { slots } = await getBookableSlots(session.tutor_id);
        const first = slots[0];
        if (first) {
          nextSlot = {
            startsAt: first.start,
            durationMinutes: first.durationMinutes,
            href: `/tutors/${tutorSlug}?slot=${encodeURIComponent(first.start)}&duration=${first.durationMinutes}`,
          };
        }
      }
    } catch (e) {
      console.error("[room] next-slot lookup failed", id, e);
    }
  }

  // Display name for presence.
  const { data: profile } = await supabase
    .from("users")
    .select("name, email")
    .eq("id", user.id)
    .maybeSingle();
  const name = profile?.name || profile?.email?.split("@")[0] || "User";

  return (
    <>
      <LessonRoom
        initialLesson={lesson}
        initialLessonId={session.tutor_lesson_id}
        lessonList={catalogue}
        categories={CATEGORIES.map((c) => ({
          slug: c.slug,
          name: c.name,
          emoji: c.emoji,
          description: c.description,
          gradient: c.gradient,
          language: c.language,
        }))}
        sessionId={id}
        currentUserId={user.id}
        currentRole={currentRole}
        currentName={name}
        studentId={pairedStudentId}
        studentName={pairedStudentName}
        initialHighlights={highlights || []}
        initialChat={initialChat}
        otherRooms={otherRooms}
        classWindow={classWindow}
        roomKind={roomKind}
        nextSlot={nextSlot}
        tutorSlug={tutorSlug}
      />
    </>
  );
}
