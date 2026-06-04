"use client";

import { useLessonRoom } from "@/hooks/use-lesson-room";
import { LessonRoomProvider } from "./lesson-room-context";
import { LessonRenderer } from "./lesson-renderer";
import { Avatar } from "./avatar";
import { IncomingTtsAutoplay } from "./incoming-tts-autoplay";
import { SectionSync } from "./section-sync";
import { StepControls } from "./step-controls";
import { ToolsRail } from "./room/tools-rail";
import { Users, Sparkles } from "lucide-react";
import type { Lesson } from "@/lib/lessons/types";

interface LessonRoomProps {
  lesson: Lesson;
  sessionId: string;
  currentUserId: string;
  currentRole: "tutor" | "student";
  currentName: string;
  initialHighlights: { anchor_id: string; text: string }[];
}

export function LessonRoom({
  lesson,
  sessionId,
  currentUserId,
  currentRole,
  currentName,
  initialHighlights,
}: LessonRoomProps) {
  const {
    highlights,
    presence,
    toggleHighlight,
    broadcastSpeak,
    incomingSpeak,
    revealedTranslations,
    toggleTranslation,
    studentAnswers,
    reportAnswer,
    currentSectionIdx,
    setCurrentSectionIdx,
    chatMessages,
    sendChat,
  } = useLessonRoom({
    sessionId,
    currentUserId,
    currentRole,
    currentName,
    initialHighlights,
  });

  return (
    <LessonRoomProvider
      value={{
        sessionId,
        currentUserId,
        currentRole,
        canHighlight: currentRole === "tutor",
        highlights,
        toggleHighlight,
        presence,
        broadcastSpeak,
        incomingSpeak,
        revealedTranslations,
        toggleTranslation,
        studentAnswers,
        reportAnswer,
        currentSectionIdx,
        setCurrentSectionIdx,
        chatMessages,
        sendChat,
      }}
    >
      {/* Floating presence + room badge */}
      <div className="fixed right-4 top-4 z-40 flex items-center gap-3 rounded-full border bg-white/95 px-3 py-1.5 shadow-md backdrop-blur">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
          <Sparkles className="h-3.5 w-3.5" /> Live session
        </span>
        <span className="h-4 w-px bg-slate-200" />
        <Users className="h-4 w-4 text-slate-500" />
        <div className="flex -space-x-2">
          {presence.map((p) => (
            <span key={p.user_id} title={`${p.name} (${p.role})`} className="relative">
              <Avatar seed={p.avatar_seed || p.name} size={28} />
              <span
                className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-white ${
                  p.role === "tutor" ? "bg-emerald-500" : "bg-blue-500"
                }`}
              />
            </span>
          ))}
          {presence.length === 0 ? (
            <span className="text-xs text-slate-400">connecting…</span>
          ) : null}
        </div>
      </div>

      {currentRole === "tutor" ? (
        <div className="fixed bottom-4 left-1/2 z-40 -translate-x-1/2 rounded-full border bg-emerald-50/95 px-4 py-2 text-xs font-medium text-emerald-900 shadow-md backdrop-blur">
          Click any French phrase to highlight it for your student.
        </div>
      ) : null}

      <IncomingTtsAutoplay />
      <SectionSync />
      <StepControls totalSteps={lesson.sections.length} />
      <ToolsRail />

      {/* Right padding leaves room for the tools rail on wide screens. */}
      <div className="lg:pr-[340px]">
        <LessonRenderer
          lesson={lesson}
          initialView={currentRole}
          lockedView={currentRole}
        />
      </div>
    </LessonRoomProvider>
  );
}
