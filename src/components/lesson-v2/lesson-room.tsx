"use client";

import { useEffect, useRef, useState } from "react";
import { useLessonRoom } from "@/hooks/use-lesson-room";
import { LessonRoomProvider } from "./lesson-room-context";
import { LessonRenderer } from "./lesson-renderer";
import { Avatar } from "./avatar";
import { IncomingTtsAutoplay } from "./incoming-tts-autoplay";
import { SectionSync } from "./section-sync";
import { ScrollSync } from "./scroll-sync";
import { StepControls } from "./step-controls";
import { ToolsRail } from "./room/tools-rail";
import { LessonBrowser } from "./room/lesson-browser";
import type { PickerLesson } from "./room/lesson-picker";
import { Users, Sparkles, BookOpen, RefreshCw, UserPlus, Check, Video, Send, Eye, DoorOpen, ChevronDown, LogOut } from "lucide-react";
import type { Lesson } from "@/lib/lessons/types";

/** Visible time on one lesson before it counts as covered. */
const DWELL_MS = 2 * 60 * 1000;
const DWELL_TICK_MS = 15 * 1000;

interface LessonRoomProps {
  initialLesson: Lesson | null;
  initialLessonId: string | null;
  lessonList: PickerLesson[];
  sessionId: string;
  currentUserId: string;
  currentRole: "tutor" | "student";
  currentName: string;
  /** The room's student (null for an open classroom not yet paired). Tutor-only affordances. */
  studentId?: string | null;
  studentName?: string | null;
  initialHighlights: { anchor_id: string; role: "tutor" | "student" }[];
  initialChat?: { id: string; from: string; name: string; role: "tutor" | "student"; text: string; at: number }[];
  /** The tutor's other live rooms, for the in-room room switcher. Tutor-only. */
  otherRooms?: { id: string; label: string; isGroup: boolean }[];
}

export function LessonRoom({
  initialLesson,
  initialLessonId,
  lessonList,
  sessionId,
  currentUserId,
  currentRole,
  currentName,
  studentId = null,
  studentName = null,
  initialHighlights,
  initialChat = [],
  otherRooms = [],
}: LessonRoomProps) {
  const room = useLessonRoom({ sessionId, currentUserId, currentRole, currentName, initialHighlights, initialChatMessages: initialChat });

  const [lesson, setLesson] = useState<Lesson | null>(initialLesson);
  const [lessonId, setLessonId] = useState<string | null>(initialLessonId);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [inviteCopied, setInviteCopied] = useState(false);
  const [ringing, setRinging] = useState(false);
  const [sendingHw, setSendingHw] = useState(false);
  const [roomMenuOpen, setRoomMenuOpen] = useState(false);
  const [ending, setEnding] = useState(false);
  const lastIncoming = useRef(0);

  const showToast = (msg: string, ms = 3000) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), ms);
  };

  async function copyInvite() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setInviteCopied(true);
      setToast("Room link copied — send it to your student");
      window.setTimeout(() => setInviteCopied(false), 2000);
      window.setTimeout(() => setToast(null), 2500);
    } catch {
      /* ignore */
    }
  }

  // Ring the student: fires the dashboard popup + Web Push for this room.
  async function ringStudent() {
    if (ringing) return;
    setRinging(true);
    try {
      const res = await fetch("/api/tutor/ring-room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        showToast(`Rang ${studentName || "your student"} — they'll see a “Join class” popup.`);
      } else if (data.reason === "no_student") {
        showToast("No student is paired to this room yet — use Invite to share the link.");
      } else {
        showToast(data.error || "Could not ring the student.");
      }
    } catch {
      showToast("Could not ring the student.");
    } finally {
      setRinging(false);
    }
  }

  // Send the current lesson's homework to the room's student.
  async function sendHomework() {
    if (sendingHw || !lessonId) return;
    setSendingHw(true);
    try {
      const res = await fetch("/api/tutor/room-homework", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, lessonId }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        showToast(`Homework sent to ${studentName || "your student"} — they've been notified.`);
      } else {
        showToast(data.error || "Could not send homework.");
      }
    } catch {
      showToast("Could not send homework.");
    } finally {
      setSendingHw(false);
    }
  }

  // End the class: marks the session completed so it stops showing as live in
  // the switcher and on /tutor/sessions. Confirmed first — it is not obvious
  // from the button alone that this closes the room for the student too.
  async function endClass() {
    if (ending) return;
    if (!window.confirm("End this class? The room will close for everyone.")) return;
    setEnding(true);
    try {
      const res = await fetch("/api/tutor/end-room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        window.location.href = "/tutor/sessions";
        return;
      }
      showToast(data.error || "Could not end the class.");
    } catch {
      showToast("Could not end the class.");
    } finally {
      setEnding(false);
    }
  }

  async function loadLesson(id: string) {
    try {
      const res = await fetch(`/api/lessons/${id}`);
      if (!res.ok) return;
      const data = await res.json();
      setLesson(data.lesson as Lesson);
      setLessonId(id);
    } catch {
      /* ignore */
    }
  }

  async function pickBySlug(slug: string, title: string) {
    setPickerOpen(false);
    try {
      const res = await fetch(`/api/lessons/by-slug/${slug}`);
      if (!res.ok) return;
      const data = await res.json();
      setLesson(data.lesson as Lesson);
      setLessonId(data.id as string);
      room.broadcastLessonChange(data.id, data.title || title);
      setToast(`You opened “${data.title || title}”`);
      window.setTimeout(() => setToast(null), 2500);
    } catch {
      /* ignore */
    }
  }

  // ── Coverage tracking ────────────────────────────────────────────────────
  // A lesson counts as "covered" once it's been open in the room for DWELL_MS,
  // so browsing past a lesson doesn't land in the student's history. The timer
  // restarts on every lesson switch and pauses while the tab is hidden — a room
  // left open in a background tab overnight shouldn't log anything.
  useEffect(() => {
    if (!lessonId) return;
    let elapsed = 0;
    let lastTick = Date.now();
    let recorded = false;

    const tick = () => {
      const now = Date.now();
      if (!document.hidden) elapsed += now - lastTick;
      lastTick = now;
      if (recorded || elapsed < DWELL_MS) return;
      recorded = true;
      void fetch(`/api/space/${sessionId}/covered`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId, minutes: Math.round(elapsed / 60000) }),
      }).catch(() => {});
    };

    const timer = setInterval(tick, DWELL_TICK_MS);
    return () => clearInterval(timer);
  }, [lessonId, sessionId]);

  useEffect(() => {
    const inc = room.incomingLessonChange;
    if (!inc || inc.at === lastIncoming.current) return;
    lastIncoming.current = inc.at;
    void loadLesson(inc.lessonId);
    setToast(`Switched to “${inc.title}”`);
    window.setTimeout(() => setToast(null), 2500);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room.incomingLessonChange]);

  return (
    <LessonRoomProvider
      value={{
        sessionId,
        currentUserId,
        currentRole,
        canHighlight: true,
        highlights: room.highlights,
        toggleHighlight: room.toggleHighlight,
        presence: room.presence,
        broadcastSpeak: room.broadcastSpeak,
        incomingSpeak: room.incomingSpeak,
        revealedTranslations: room.revealedTranslations,
        toggleTranslation: room.toggleTranslation,
        studentAnswers: room.studentAnswers,
        answersByStudent: room.answersByStudent,
        learners: room.learners,
        viewedStudentId: room.viewedStudentId,
        setViewedStudentId: room.setViewedStudentId,
        reportAnswer: room.reportAnswer,
        currentSectionIdx: room.currentSectionIdx,
        setCurrentSectionIdx: room.setCurrentSectionIdx,
        incomingScroll: room.incomingScroll,
        broadcastScroll: room.broadcastScroll,
        chatMessages: room.chatMessages,
        sendChat: room.sendChat,
        incomingLessonChange: room.incomingLessonChange,
        broadcastLessonChange: room.broadcastLessonChange,
        openLessonPicker: () => setPickerOpen(true),
      }}
    >
      {/* Top bar: presence + change-lesson */}
      <div className="fixed right-4 top-4 z-40 flex items-center gap-3 rounded-full border bg-white/95 px-3 py-1.5 shadow-md backdrop-blur">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
          <Sparkles className="h-3.5 w-3.5" /> Live space
        </span>
        <span className="h-4 w-px bg-slate-200" />
        <Users className="h-4 w-4 text-slate-500" />
        {/* A full group is 6 people. Show the first four and count the rest so
            the pill never outgrows a narrow phone. */}
        <div className="flex -space-x-2">
          {room.presence.slice(0, 4).map((p) => (
            <span key={p.user_id} title={`${p.name} (${p.role})`} className="relative">
              <Avatar seed={p.avatar_seed || p.name} size={28} />
              <span className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-white ${p.role === "tutor" ? "bg-emerald-500" : "bg-blue-500"}`} />
            </span>
          ))}
          {room.presence.length > 4 ? (
            <span
              title={room.presence.slice(4).map((p) => p.name).join(", ")}
              className="relative inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 text-[11px] font-semibold text-slate-600 ring-2 ring-white"
            >
              +{room.presence.length - 4}
            </span>
          ) : null}
          {room.presence.length === 0 ? <span className="text-xs text-slate-400">connecting…</span> : null}
        </div>

        {/* Tutor with more than one class open: hop straight to another room
            without going back out to the dashboard. Students never see this. */}
        {currentRole === "tutor" && otherRooms.length > 0 ? (
          <>
            <span className="h-4 w-px bg-slate-200" />
            <div className="relative">
              <button
                onClick={() => setRoomMenuOpen((v) => !v)}
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                title="Switch to another of your live rooms"
              >
                <DoorOpen className="h-3.5 w-3.5" />
                Rooms
                <span className="rounded-full bg-slate-200 px-1.5 text-[10px] font-bold text-slate-600">
                  {otherRooms.length}
                </span>
                <ChevronDown className="h-3 w-3" />
              </button>

              {roomMenuOpen ? (
                <>
                  {/* Click-away catcher. */}
                  <div className="fixed inset-0 z-40" onClick={() => setRoomMenuOpen(false)} />
                  <div className="absolute right-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-xl border bg-white shadow-lg">
                    <p className="border-b px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Your other live rooms
                    </p>
                    <ul className="max-h-64 overflow-y-auto py-1">
                      {otherRooms.map((r) => (
                        <li key={r.id}>
                          {/* A full navigation, not a client push: the room's
                              realtime channel and presence must be torn down and
                              rebuilt for the new session. */}
                          <a
                            href={`/room/${r.id}`}
                            className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                          >
                            {r.isGroup ? (
                              <Users className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                            ) : (
                              <Video className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                            )}
                            <span className="truncate">{r.label}</span>
                          </a>
                        </li>
                      ))}
                    </ul>
                    <a
                      href="/tutor/sessions/new"
                      className="flex items-center gap-2 border-t px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
                    >
                      <Sparkles className="h-3.5 w-3.5" /> Start another class
                    </a>
                  </div>
                </>
              ) : null}
            </div>
          </>
        ) : null}

        {/* Tutor watching a group: pick whose answers fill the exercises. Hidden
            in a 1:1 room, where there is nothing to switch between. */}
        {currentRole === "tutor" && room.learners.length > 1 ? (
          <>
            <span className="h-4 w-px bg-slate-200" />
            <div className="flex items-center gap-1">
              <Eye className="h-3.5 w-3.5 text-slate-500" />
              {room.learners.map((l) => {
                const active = l.user_id === room.viewedStudentId;
                return (
                  <button
                    key={l.user_id}
                    onClick={() => room.setViewedStudentId(l.user_id)}
                    title={`Watch ${l.name}'s answers`}
                    className={`rounded-full px-2 py-0.5 text-xs font-medium transition ${
                      active
                        ? "bg-blue-600 text-white"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {l.name.split(" ")[0]}
                  </button>
                );
              })}
            </div>
          </>
        ) : null}
        <span className="h-4 w-px bg-slate-200" />
        {currentRole === "tutor" && studentId ? (
          <button
            onClick={ringStudent}
            disabled={ringing}
            className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-0.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
            title={`Ring ${studentName || "your student"} — pops a “Join class” alert on their dashboard`}
          >
            <Video className="h-3 w-3" />
            {ringing ? "Ringing…" : `Ring${studentName ? ` ${studentName.split(" ")[0]}` : ""}`}
          </button>
        ) : null}
        <button
          onClick={copyInvite}
          className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-white hover:bg-secondary-600"
          title="Copy this room link and send it to your student"
        >
          {inviteCopied ? <Check className="h-3 w-3" /> : <UserPlus className="h-3 w-3" />}
          {inviteCopied ? "Copied!" : "Invite"}
        </button>
        {currentRole === "tutor" && studentId && lesson ? (
          <button
            onClick={sendHomework}
            disabled={sendingHw}
            className="inline-flex items-center gap-1 rounded-full bg-primary-600 px-2.5 py-0.5 text-xs font-semibold text-white hover:bg-primary-700 disabled:opacity-60"
            title="Send this lesson's homework to your student"
          >
            <Send className="h-3 w-3" />
            {sendingHw ? "Sending…" : "Send homework"}
          </button>
        ) : null}
        {lesson ? (
          <>
            <span className="h-4 w-px bg-slate-200" />
            <button
              onClick={() => setPickerOpen(true)}
              className="inline-flex items-center gap-1 rounded-full bg-primary-600 px-2.5 py-0.5 text-xs font-semibold text-white hover:bg-primary-700"
            >
              <RefreshCw className="h-3 w-3" /> Change lesson
            </button>
          </>
        ) : null}
        {currentRole === "tutor" ? (
          <>
            <span className="h-4 w-px bg-slate-200" />
            <button
              onClick={endClass}
              disabled={ending}
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-60"
              title="End this class and close the room"
            >
              <LogOut className="h-3 w-3" />
              {ending ? "Ending…" : "End class"}
            </button>
          </>
        ) : null}
      </div>

      {lesson ? (
        <div className="fixed bottom-4 left-1/2 z-40 -translate-x-1/2 rounded-full border bg-emerald-50/95 px-4 py-2 text-xs font-medium text-emerald-900 shadow-md backdrop-blur">
          Click any French phrase to highlight it — {currentRole === "tutor" ? "your student" : "your tutor"} sees it live.
        </div>
      ) : null}

      {toast ? (
        <div className="fixed left-1/2 top-20 z-50 -translate-x-1/2 rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      ) : null}

      <IncomingTtsAutoplay />
      <SectionSync />
      <ScrollSync />
      <ToolsRail />

      {lesson ? (
        <>
          <StepControls totalSteps={lesson.sections.length} />
          <div className="lg:pr-[340px]">
            {/* Key by lessonId so switching lessons fully remounts the renderer.
                Exercise components hold answer state in useState; without this,
                a lesson switch reuses instances (sections are index-keyed) and
                the old lesson's tiles/blanks bleed into the new lesson's
                answers — the "answers from another exercise" mixup. */}
            <LessonRenderer key={lessonId ?? "none"} lesson={lesson} initialView={currentRole} lockedView={currentRole} />
          </div>
        </>
      ) : (
        <div className="flex min-h-screen items-center justify-center lg:pr-[340px]">
          <div className="max-w-md rounded-2xl border bg-white p-8 text-center shadow-sm">
            <BookOpen className="mx-auto h-10 w-10 text-primary-500" />
            <h2 className="mt-4 text-xl font-bold text-slate-900">Pick a lesson to begin</h2>
            <p className="mt-1 text-sm text-slate-600">
              Choose any lesson — your {currentRole === "tutor" ? "student" : "tutor"} will see it instantly.
            </p>
            <button
              onClick={() => setPickerOpen(true)}
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700"
            >
              <BookOpen className="h-4 w-4" /> Choose a lesson
            </button>
          </div>
        </div>
      )}

      {pickerOpen ? (
        <LessonBrowser onPick={pickBySlug} onClose={() => setPickerOpen(false)} />
      ) : null}
    </LessonRoomProvider>
  );
}
