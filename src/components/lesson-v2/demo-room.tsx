"use client";

import { useCallback, useState } from "react";
import { Eye, BookOpenCheck, Sparkles } from "lucide-react";
import type { Lesson } from "@/lib/lessons/types";
import { LessonRoomProvider, type RoomPresence } from "./lesson-room-context";
import { LessonRenderer } from "./lesson-renderer";
import { IncomingTtsAutoplay } from "./incoming-tts-autoplay";
import { SectionSync } from "./section-sync";
import { StepControls } from "./step-controls";
import type { ChatMessage } from "./lesson-room-context";

interface DemoRoomProps {
  lesson: Lesson;
}

type IncomingSpeak = { text: string; at: number; from: string } | null;

const PRESENCE: RoomPresence[] = [
  { user_id: "demo-tutor", role: "tutor", name: "Demo Tutor", avatar_seed: "Marie" },
  { user_id: "demo-student", role: "student", name: "Demo Student", avatar_seed: "Lingue" },
];

export function DemoRoom({ lesson }: DemoRoomProps) {
  const [highlights, setHighlights] = useState<Set<string>>(new Set());
  const [revealedTranslations, setRevealedTranslations] = useState<Set<string>>(new Set());
  const [tutorIncoming, setTutorIncoming] = useState<IncomingSpeak>(null);
  const [studentIncoming, setStudentIncoming] = useState<IncomingSpeak>(null);
  const [studentAnswers, setStudentAnswers] = useState<
    Record<string, { state: unknown; updatedAt: number }>
  >({});
  const [currentSectionIdx, setCurrentSectionIdxState] = useState<number | null>(null);
  const setCurrentSectionIdx = useCallback((idx: number) => setCurrentSectionIdxState(idx), []);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const pushChat = useCallback(
    (from: string, name: string, role: "tutor" | "student", text: string) => {
      if (!text.trim()) return;
      setChatMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), from, name, role, text: text.trim(), at: Date.now() },
      ]);
    },
    []
  );

  // Single-active highlight: clicking word A then B leaves only B marked.
  // Clicking the same word again clears it.
  const toggleHighlight = useCallback((anchor: { id: string }) => {
    setHighlights((prev) => {
      const next = new Set<string>();
      if (!prev.has(anchor.id)) next.add(anchor.id);
      return next;
    });
  }, []);

  const tutorBroadcastSpeak = useCallback((text: string) => {
    setStudentIncoming({ text, at: Date.now(), from: "demo-tutor" });
  }, []);

  const studentBroadcastSpeak = useCallback((text: string) => {
    setTutorIncoming({ text, at: Date.now(), from: "demo-student" });
  }, []);

  const toggleTranslation = useCallback((key: string) => {
    setRevealedTranslations((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const reportAnswer = useCallback((anchor: string, state: unknown) => {
    setStudentAnswers((prev) => ({
      ...prev,
      [anchor]: { state, updatedAt: Date.now() },
    }));
  }, []);
  // In demo, the tutor never "reports" their own answer — they're observing.
  const tutorReportAnswer = useCallback((_anchor: string, _state: unknown) => {
    // intentional no-op for the tutor panel
  }, []);

  return (
    <div className="h-screen flex flex-col">
      {/* Demo banner */}
      <div className="border-b bg-emerald-600 px-4 py-1.5 text-center text-xs font-semibold text-white">
        <Sparkles className="mr-1 inline h-3 w-3" />
        DEMO ROOM — Two simulated peers in one window. Click anywhere on the left (tutor side) to highlight or play audio; the right side (student) mirrors instantly.
      </div>

      <div className="grid flex-1 grid-cols-1 divide-y overflow-hidden lg:grid-cols-2 lg:divide-x lg:divide-y-0">
        {/* Tutor panel */}
        <div className="overflow-y-auto">
          <div className="sticky top-0 z-50 flex items-center gap-2 border-b bg-emerald-50 px-4 py-1.5 text-xs font-semibold text-emerald-900">
            <BookOpenCheck className="h-3.5 w-3.5" /> Tutor view
          </div>
          <LessonRoomProvider
            value={{
              sessionId: "demo",
              currentUserId: "demo-tutor",
              currentRole: "tutor",
              canHighlight: true,
              highlights,
              toggleHighlight,
              presence: PRESENCE,
              broadcastSpeak: tutorBroadcastSpeak,
              incomingSpeak: tutorIncoming,
              revealedTranslations,
              toggleTranslation,
              studentAnswers,
              reportAnswer: tutorReportAnswer,
              currentSectionIdx,
              setCurrentSectionIdx,
              incomingScroll: null,
              broadcastScroll: () => {},
              chatMessages,
              sendChat: (t: string) => pushChat("demo-tutor", "Demo Tutor", "tutor", t),
              incomingLessonChange: null,
              broadcastLessonChange: () => {},
              openLessonPicker: () => {},
            }}
          >
            <IncomingTtsAutoplay />
            <SectionSync />
            <StepControls totalSteps={lesson.sections.length} />
            <LessonRenderer lesson={lesson} lockedView="tutor" />
          </LessonRoomProvider>
        </div>

        {/* Student panel */}
        <div className="overflow-y-auto">
          <div className="sticky top-0 z-50 flex items-center gap-2 border-b bg-blue-50 px-4 py-1.5 text-xs font-semibold text-blue-900">
            <Eye className="h-3.5 w-3.5" /> Student view
          </div>
          <LessonRoomProvider
            value={{
              sessionId: "demo",
              currentUserId: "demo-student",
              currentRole: "student",
              canHighlight: false,
              highlights,
              toggleHighlight,
              presence: PRESENCE,
              broadcastSpeak: studentBroadcastSpeak,
              incomingSpeak: studentIncoming,
              revealedTranslations,
              toggleTranslation,
              studentAnswers,
              reportAnswer,
              currentSectionIdx,
              setCurrentSectionIdx: () => {}, // student can't advance
              incomingScroll: null,
              broadcastScroll: () => {},
              chatMessages,
              sendChat: (t: string) => pushChat("demo-student", "Demo Student", "student", t),
              incomingLessonChange: null,
              broadcastLessonChange: () => {},
              openLessonPicker: () => {},
            }}
          >
            <IncomingTtsAutoplay />
            <SectionSync />
            <LessonRenderer lesson={lesson} lockedView="student" />
          </LessonRoomProvider>
        </div>
      </div>
    </div>
  );
}
