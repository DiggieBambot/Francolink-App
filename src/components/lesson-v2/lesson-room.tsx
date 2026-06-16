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
import { Users, Sparkles, BookOpen, RefreshCw, UserPlus, Check } from "lucide-react";
import type { Lesson } from "@/lib/lessons/types";

interface LessonRoomProps {
  initialLesson: Lesson | null;
  initialLessonId: string | null;
  lessonList: PickerLesson[];
  sessionId: string;
  currentUserId: string;
  currentRole: "tutor" | "student";
  currentName: string;
  initialHighlights: { anchor_id: string; text: string }[];
  initialChat?: { id: string; from: string; name: string; role: "tutor" | "student"; text: string; at: number }[];
}

export function LessonRoom({
  initialLesson,
  initialLessonId,
  lessonList,
  sessionId,
  currentUserId,
  currentRole,
  currentName,
  initialHighlights,
  initialChat = [],
}: LessonRoomProps) {
  const room = useLessonRoom({ sessionId, currentUserId, currentRole, currentName, initialHighlights, initialChatMessages: initialChat });

  const [lesson, setLesson] = useState<Lesson | null>(initialLesson);
  const [lessonId, setLessonId] = useState<string | null>(initialLessonId);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [inviteCopied, setInviteCopied] = useState(false);
  const lastIncoming = useRef(0);

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
        canHighlight: currentRole === "tutor",
        highlights: room.highlights,
        toggleHighlight: room.toggleHighlight,
        presence: room.presence,
        broadcastSpeak: room.broadcastSpeak,
        incomingSpeak: room.incomingSpeak,
        revealedTranslations: room.revealedTranslations,
        toggleTranslation: room.toggleTranslation,
        studentAnswers: room.studentAnswers,
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
        <div className="flex -space-x-2">
          {room.presence.map((p) => (
            <span key={p.user_id} title={`${p.name} (${p.role})`} className="relative">
              <Avatar seed={p.avatar_seed || p.name} size={28} />
              <span className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-white ${p.role === "tutor" ? "bg-emerald-500" : "bg-blue-500"}`} />
            </span>
          ))}
          {room.presence.length === 0 ? <span className="text-xs text-slate-400">connecting…</span> : null}
        </div>
        <span className="h-4 w-px bg-slate-200" />
        <button
          onClick={copyInvite}
          className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-white hover:bg-secondary-600"
          title="Copy this room link and send it to your student"
        >
          {inviteCopied ? <Check className="h-3 w-3" /> : <UserPlus className="h-3 w-3" />}
          {inviteCopied ? "Copied!" : "Invite"}
        </button>
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
      </div>

      {currentRole === "tutor" && lesson ? (
        <div className="fixed bottom-4 left-1/2 z-40 -translate-x-1/2 rounded-full border bg-emerald-50/95 px-4 py-2 text-xs font-medium text-emerald-900 shadow-md backdrop-blur">
          Click any French phrase to highlight it for your student.
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
            <LessonRenderer lesson={lesson} initialView={currentRole} lockedView={currentRole} />
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
