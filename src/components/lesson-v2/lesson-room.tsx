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
import dynamic from "next/dynamic";
import { RoomShell, type RailTab, type StageKey, type StagePanel } from "./room/room-shell";
import { RoomVideoProvider, type InitialClassWindow } from "./room/video-context";
import { SpaceShell } from "./room/space-shell";
import { AfterClass } from "./room/after-class";
import { VideoStage } from "./room/video-views";
import { PeoplePanel } from "./room/people-panel";
import { ChatPanel } from "./room/chat-panel";
import { DiggieChatPanel } from "@/components/shared/diggie-chat-panel";

// tldraw is heavy + browser-only.
const WhiteboardPanel = dynamic(
  () => import("./room/whiteboard-panel").then((m) => m.WhiteboardPanel),
  { ssr: false, loading: () => <div className="p-4 text-sm text-slate-400">Loading whiteboard…</div> }
);
import { MaterialsPanel } from "./room/materials-panel";
import type { PickerLesson } from "./room/lesson-picker";
import { Users, Sparkles, BookOpen, RefreshCw, UserPlus, Check, Video, Send, Eye, DoorOpen, ChevronDown, PenTool, MessageSquare, Library, X } from "lucide-react";
import type { Lesson } from "@/lib/lessons/types";
import { cn } from "@/lib/utils";

/**
 * Mounts the video context for a Classroom and nothing at all for a Study
 * Space. A component rather than a ternary around the whole tree so both
 * branches render the SAME children — otherwise switching kinds would remount
 * every panel and lose the board and the student's answers.
 */
function ShellFrame({
  isSpace,
  sessionId,
  classWindow,
  children,
}: {
  isSpace: boolean;
  sessionId: string;
  classWindow?: InitialClassWindow;
  children: React.ReactNode;
}) {
  if (isSpace) return <>{children}</>;
  return (
    <RoomVideoProvider sessionId={sessionId} initialWindow={classWindow}>
      {children}
    </RoomVideoProvider>
  );
}

/** A student's filtering stays theirs — see toggleMaterials. */
const noopFilter = () => {};

/**
 * One button language for the room toolbar.
 *
 * It used to be five: emerald Ring, slate Board, orange Invite, navy Send
 * homework, pale-blue Materials — five saturated fills competing in one
 * 40px strip, none of which meant anything, and one of them the only green
 * on the site. Colour has to earn its place, so exactly one action is filled
 * (the one that is urgent right now) and the rest are quiet until hovered.
 */
const TOOL_BTN =
  "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold transition-colors";
const TOOL_QUIET = "text-slate-600 hover:bg-slate-100 hover:text-slate-900";
const TOOL_LOUD = "bg-primary-500 text-white hover:bg-primary-600";

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
  /**
   * Which room this is. "classroom" — a listed FrancoLink tutor's live,
   * scheduled, video lesson. "space" — everyone else: a shared workspace for
   * material, chat and the board, with no call at all. Resolved server-side
   * from the same predicate that decides who can be booked.
   */
  roomKind?: "classroom" | "space";
  /**
   * The tutor's next free slot, for the "book again" card at the end of class.
   * Resolved server-side; null when they have none inside the booking window.
   */
  nextSlot?: { startsAt: string; durationMinutes: number; href: string } | null;
  /** The tutor's directory slug, for the fallback "book another lesson" link. */
  tutorSlug?: string | null;
  /**
   * Whether this room's booked class is on right now, resolved server-side.
   * Absent on a room no booking has ever used, which has no schedule at all.
   */
  classWindow?: InitialClassWindow;
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
  classWindow,
  roomKind = "classroom",
  nextSlot = null,
  tutorSlug = null,
}: LessonRoomProps) {
  const isSpace = roomKind === "space";
  const room = useLessonRoom({ sessionId, currentUserId, currentRole, currentName, initialHighlights, initialChatMessages: initialChat });

  const [lesson, setLesson] = useState<Lesson | null>(initialLesson);
  const [lessonId, setLessonId] = useState<string | null>(initialLessonId);
  const [materialsOpen, setMaterialsOpen] = useState(isSpace && !initialLesson);
  const [toast, setToast] = useState<string | null>(null);
  const [inviteCopied, setInviteCopied] = useState(false);
  const [ringing, setRinging] = useState(false);
  const [sendingHw, setSendingHw] = useState(false);
  const [homeworkSent, setHomeworkSent] = useState(false);
  const [roomMenuOpen, setRoomMenuOpen] = useState(false);
  const [ending, setEnding] = useState(false);
  // Ending a class closes the room for the student too, which the button does
  // not say on its own. This used to be a native window.confirm — correct, and
  // jarring: an OS dialog on top of a lesson reads as an error, not a choice.
  const [confirmEnd, setConfirmEnd] = useState(false);
  // The tutor has ended the class and is on the after-class screen.
  const [classOver, setClassOver] = useState(false);
  // Which panel owns the main stage. In a Classroom, with no material open,
  // the CALL is the stage — the call is the lesson at that point. A Study
  // Space has no call, so what fills the gap is the shelf: you opened a room
  // with nothing in it, and choosing material is the only thing to do next.
  const fallbackStage: StageKey = isSpace ? "materials" : "call";
  const [activeStage, setActiveStage] = useState<StageKey>(
    initialLesson ? "lesson" : fallbackStage
  );
  const [boardOpen, setBoardOpen] = useState(false);
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
        setHomeworkSent(true);
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
    setEnding(true);
    try {
      const res = await fetch("/api/tutor/end-room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        // Deliberately NOT a redirect to /tutor/sessions. Bouncing the tutor
        // straight out skipped the one step the end of a lesson exists for —
        // sending the homework, while the lesson they just taught is still on
        // screen and still the obvious thing to assign.
        setClassOver(true);
        return;
      }
      showToast(data.error || "Could not end the class.");
    } catch {
      showToast("Could not end the class.");
    } finally {
      setEnding(false);
    }
  }

  /**
   * Put a lesson on the stage.
   *
   * Every path that changes the material goes through here. It used not to:
   * `loadLesson` (used when following the other side, and by the old picker)
   * set local state WITHOUT broadcasting, while `pickBySlug` broadcast — so
   * one of the two ways of choosing a lesson silently left the other person
   * on the old one. `broadcast` is explicit for exactly that reason: applying
   * a change we RECEIVED must not echo it back.
   */
  async function applyLesson(
    id: string,
    opts: { broadcast: boolean; title?: string; toast?: string } = { broadcast: false }
  ) {
    try {
      const res = await fetch(`/api/lessons/${id}`);
      if (!res.ok) return;
      const data = await res.json();
      const title = (data.lesson as Lesson)?.title || opts.title || "this lesson";
      setLesson(data.lesson as Lesson);
      setLessonId(id);
      if (opts.broadcast) room.broadcastLessonChange(id, title);
      if (opts.toast) showToast(opts.toast);
    } catch {
      /* ignore */
    }
  }

  /** The tutor opens material for the whole room. */
  function openForEveryone(l: PickerLesson) {
    setActiveStage("lesson");
    void applyLesson(l.id, {
      broadcast: true,
      title: l.title,
      toast: `You opened “${l.title}” for the class`,
    });
  }

  /** A student cannot change the material, but can ask for it. */
  function suggest(l: PickerLesson) {
    room.proposeLesson(l.id, l.title);
    showToast(`Suggested “${l.title}” to your tutor`);
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
    // Received, so do NOT broadcast back — that is how a two-person room
    // talks itself into an echo loop.
    void applyLesson(inc.lessonId, { broadcast: false });
    setActiveStage("lesson");
    setToast(`Switched to “${inc.title}”`);
    window.setTimeout(() => setToast(null), 2500);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room.incomingLessonChange]);

  // Follow the other side onto the shelf. This is the whole point of making
  // material selection shared: when the tutor opens the catalogue the student
  // goes there too and watches the shortlist narrow, instead of sitting in
  // front of a frozen room until the lesson changes without warning.
  const lastBrowse = useRef(0);
  useEffect(() => {
    const b = room.remoteBrowsing;
    if (!b || b.at === lastBrowse.current) return;
    lastBrowse.current = b.at;
    if (b.open) {
      setMaterialsOpen(true);
      setActiveStage("materials");
    } else {
      setMaterialsOpen(false);
      setActiveStage((cur) => (cur === "materials" ? (lesson ? "lesson" : fallbackStage) : cur));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room.remoteBrowsing]);

  function toggleMaterials(open: boolean) {
    setMaterialsOpen(open);
    setActiveStage(open ? "materials" : lesson ? "lesson" : fallbackStage);
    // Only the tutor's shelf is shared. A student browsing ahead is private —
    // dragging the person teaching the class onto a catalogue they did not
    // ask for would be the same interruption we just removed, pointed the
    // other way. A student's opinion reaches the tutor as a suggestion.
    if (currentRole === "tutor") room.broadcastMaterialsOpen(open);
  }

  // ---------------------------------------------------------------- STAGE
  // Panels are mounted and hidden, never unmounted: a whiteboard that
  // remounts loses its canvas and a lesson that remounts loses the student's
  // answers. The array shape is also what makes real multi-tab a matter of
  // allowing more than one entry rather than a rewrite.
  const panels: StagePanel[] = [
    // A Study Space has no call, so it has no Call tab. This is the whole
    // difference in one line: the old room kept the tab and put an apology
    // behind it.
    ...(isSpace
      ? []
      : [
          {
            key: "call" as const,
            label: "Call",
            icon: Video,
            content: (
              <VideoStage
                afterClass={
                  <AfterClass
                    sessionId={sessionId}
                    role={currentRole}
                    peerName={
                      studentName || (currentRole === "student" ? "your tutor" : null)
                    }
                    lessonId={lessonId}
                    onSendHomework={sendHomework}
                    homeworkSent={homeworkSent}
                    sendingHomework={sendingHw}
                    nextSlot={nextSlot ?? null}
                    tutorSlug={tutorSlug ?? null}
                  />
                }
              />
            ),
          },
        ]),
    ...(lesson
      ? [
          {
            key: "lesson" as const,
            label: lesson.title ?? "Lesson",
            icon: BookOpen,
            content: (
              <div className="mx-auto max-w-5xl px-4 pb-28 pt-4">
                {/* Key by lessonId so switching lessons fully remounts the
                    renderer. Exercise components hold answer state in
                    useState; without this a switch reuses instances (sections
                    are index-keyed) and the old lesson's blanks bleed into the
                    new lesson's answers. */}
                <LessonRenderer
                  key={lessonId ?? "none"}
                  lesson={lesson}
                  initialView={currentRole}
                  lockedView={currentRole}
                />
                <StepControls totalSteps={lesson.sections.length} />
              </div>
            ),
          },
        ]
      : []),
    ...(materialsOpen
      ? [
          {
            key: "materials" as const,
            label: "Materials",
            icon: Library,
            closable: true,
            content: (
              <MaterialsPanel
                lessons={lessonList}
                currentId={lessonId}
                canChoose={currentRole === "tutor"}
                onPick={openForEveryone}
                onPropose={suggest}
                onFilterChange={
                  currentRole === "tutor" ? room.broadcastMaterialsFilter : noopFilter
                }
                followingName={
                  room.remoteBrowsing?.open ? room.remoteBrowsing.byName : null
                }
                remoteFilter={room.remoteFilter}
              />
            ),
          },
        ]
      : []),
    ...(boardOpen
      ? [
          {
            key: "board" as const,
            label: "Board",
            icon: PenTool,
            closable: true,
            content: (
              <WhiteboardPanel sessionId={sessionId} userId={currentUserId} />
            ),
          },
        ]
      : []),
  ];

  const railTabs: RailTab[] = [
    { key: "chat", label: "Chat", icon: MessageSquare, badge: room.chatMessages.length || undefined, content: <ChatPanel /> },
    { key: "people", label: "People", icon: Users, content: <PeoplePanel /> },
    { key: "ai", label: "AI", icon: Sparkles, content: <DiggieChatPanel /> },
  ];

  function closePanel(key: StageKey) {
    if (key === "board") {
      setBoardOpen(false);
      setActiveStage(lesson ? "lesson" : fallbackStage);
    }
    // Closing the shelf closes it for both — the same rule as opening it, so
    // the two sides can never end up on different stages.
    if (key === "materials") toggleMaterials(false);
  }

  // The room toolbar, built once and handed to whichever shell renders it.
  const actionsNode = (
            <div className="flex items-center gap-1.5 overflow-x-auto">
        <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold text-primary-600">
          <Sparkles className="h-3.5 w-3.5" />
          {isSpace ? "Study space" : "Live space"}
        </span>
        <span className="h-4 w-px bg-slate-200" />
        <Users className="h-4 w-4 text-slate-500" />
        {/* A full group is 6 people. Show the first four and count the rest so
            the pill never outgrows a narrow phone. */}
        <div className="flex -space-x-2">
          {room.presence.slice(0, 4).map((p) => (
            <span key={p.user_id} title={`${p.name} (${p.role})`} className="relative">
              <Avatar seed={p.avatar_seed || p.name} size={28} />
              <span className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-white ${p.role === "tutor" ? "bg-primary-500" : "bg-secondary-500"}`} />
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
                      className="flex items-center gap-2 border-t px-3 py-2 text-sm font-semibold text-primary-600 hover:bg-primary-50"
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
                        ? "bg-primary-500 text-white"
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
            className={cn(TOOL_BTN, TOOL_LOUD, "disabled:opacity-60")}
            title={
              isSpace
                ? `Nudge ${studentName || "your student"} — pops an alert on their dashboard asking them to open this space`
                : `Ring ${studentName || "your student"} — pops a “Join class” alert on their dashboard`
            }
          >
            <Video className="h-3.5 w-3.5" />
            {ringing
              ? isSpace
                ? "Nudging…"
                : "Ringing…"
              : `${isSpace ? "Nudge" : "Ring"}${studentName ? ` ${studentName.split(" ")[0]}` : ""}`}
          </button>
        ) : null}
        {/* The board is a STAGE panel now, not a rail tab: a whiteboard in a
            340px column is a novelty, and DMM/Engoo both give it the main
            area. Opening it adds a closable tab. */}
        <button
          onClick={() => {
            setBoardOpen(true);
            setActiveStage("board");
          }}
          className={cn(TOOL_BTN, TOOL_QUIET)}
          title="Open the whiteboard"
        >
          <PenTool className="h-3.5 w-3.5" />
          Board
        </button>
        <button
          onClick={copyInvite}
          className={cn(TOOL_BTN, TOOL_QUIET)}
          title="Copy this room link and send it to your student"
        >
          {inviteCopied ? (
            <Check className="h-3.5 w-3.5 text-primary-500" />
          ) : (
            <UserPlus className="h-3.5 w-3.5" />
          )}
          {inviteCopied ? "Copied!" : "Invite"}
        </button>
        {currentRole === "tutor" && studentId && lesson ? (
          <button
            onClick={sendHomework}
            disabled={sendingHw}
            className={cn(TOOL_BTN, TOOL_QUIET, "disabled:opacity-60")}
            title="Send this lesson's homework to your student"
          >
            <Send className="h-3.5 w-3.5" />
            {sendingHw ? "Sending…" : "Send homework"}
          </button>
        ) : null}
        {/* Always offered, not only once a lesson is open: with no material
            chosen there was previously nothing in the toolbar that led to
            any, and the shelf is where a class starts. */}
        <span className="h-4 w-px bg-slate-200" />
        <button
          onClick={() => toggleMaterials(!materialsOpen)}
          aria-pressed={materialsOpen}
          className={cn(TOOL_BTN, materialsOpen ? TOOL_LOUD : TOOL_QUIET)}
          title={
            currentRole === "tutor"
              ? "Browse the library together and open a lesson"
              : "Browse the library and suggest a lesson"
          }
        >
          {lesson ? <RefreshCw className="h-3.5 w-3.5" /> : <Library className="h-3.5 w-3.5" />}
          {lesson ? "Change lesson" : "Materials"}
        </button>
        {/* "End class" is not here any more — it lives in the control bar at
            the bottom, away from the things a tutor reaches for mid-lesson.
            It used to sit in this scrolling toolbar one pixel from "Send
            homework". */}
            </div>
  );

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
        openLessonPicker: () => toggleMaterials(true),
      }}
    >
      {/* A Study Space is not wrapped in RoomVideoProvider at all. Nothing
          inside it asks for a call, so mounting a Daily-backed context to sit
          idle would be a camera permission prompt waiting to happen in a room
          that never uses one. */}
      <ShellFrame isSpace={isSpace} sessionId={sessionId} classWindow={classWindow}>
        {classOver ? (
          <div className="h-[100dvh]">
            <AfterClass
              sessionId={sessionId}
              role={currentRole}
              peerName={studentName || (currentRole === "student" ? "your tutor" : null)}
              lessonId={lessonId}
              onSendHomework={sendHomework}
              homeworkSent={homeworkSent}
              sendingHomework={sendingHw}
              nextSlot={nextSlot ?? null}
              tutorSlug={tutorSlug ?? null}
            />
          </div>
        ) : (
          <>
        {isSpace ? (
          <SpaceShell
            panels={panels}
            activeStage={activeStage}
            onStageChange={setActiveStage}
            onClosePanel={closePanel}
            railTabs={railTabs}
            actions={actionsNode}
            showUpgrade={currentRole === "tutor"}
          />
        ) : (
          <RoomShell
            panels={panels}
            activeStage={activeStage}
            onStageChange={setActiveStage}
            onClosePanel={closePanel}
            peerName={studentName || (currentRole === "student" ? "Your tutor" : null)}
            onEndClass={() => setConfirmEnd(true)}
            canEndClass={currentRole === "tutor"}
            railTabs={railTabs}
            actions={actionsNode}
          />
        )}

        {/* Toast is the one thing that still floats: it is transient, it must
            sit above the sheet, and it belongs to no zone. */}
        {toast ? (
          <div className="fixed left-1/2 top-16 z-[60] -translate-x-1/2 rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-lg">
            {toast}
          </div>
        ) : null}

        <IncomingTtsAutoplay />
        <SectionSync />
        <ScrollSync />

        {confirmEnd ? (
          <div
            className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
            onClick={() => setConfirmEnd(false)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="end-class-title"
              className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 id="end-class-title" className="text-base font-bold text-slate-900">
                End this class?
              </h2>
              <p className="mt-1.5 text-sm text-slate-500">
                The room closes for {studentName || "your student"} as well. Chat,
                notes and the lesson stay saved.
              </p>
              <div className="mt-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setConfirmEnd(false);
                    void endClass();
                  }}
                  disabled={ending}
                  className="inline-flex flex-1 items-center justify-center rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
                >
                  {ending ? "Ending…" : "End class"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmEnd(false)}
                  className="inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100"
                >
                  Keep teaching
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {/* A student's suggestion, waiting on the tutor. Deliberately a
            prompt and not an automatic switch: the tutor is running the
            lesson, and material changing under them mid-explanation is worse
            than a student waiting three seconds for a yes. */}
        {currentRole === "tutor" && room.proposal ? (
          <div className="fixed bottom-6 left-1/2 z-[60] w-[min(26rem,calc(100vw-2rem))] -translate-x-1/2 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl">
            <p className="text-xs font-semibold uppercase tracking-wide text-secondary-600">
              {room.proposal.byName} suggests
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {room.proposal.title}
            </p>
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const p = room.proposal!;
                  room.clearProposal();
                  setActiveStage("lesson");
                  void applyLesson(p.lessonId, {
                    broadcast: true,
                    title: p.title,
                    toast: `Opened “${p.title}”`,
                  });
                }}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-primary-600"
              >
                <Check className="h-4 w-4" /> Open it
              </button>
              <button
                type="button"
                onClick={room.clearProposal}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100"
              >
                <X className="h-4 w-4" /> Not now
              </button>
            </div>
          </div>
        ) : null}
          </>
        )}
      </ShellFrame>
    </LessonRoomProvider>
  );
}
