"use client";

import { createContext, useContext } from "react";

export interface RoomPresence {
  user_id: string;
  role: "tutor" | "student";
  name: string;
  avatar_seed?: string;
}

export interface LessonRoomContextValue {
  sessionId: string;
  currentUserId: string;
  currentRole: "tutor" | "student";
  canHighlight: boolean;
  /** Anchor id → the role that highlighted it (drives per-role colour). */
  highlights: Map<string, "tutor" | "student">;
  toggleHighlight: (anchor: { id: string; text: string; sectionIdx: number }) => void;
  presence: RoomPresence[];
  /** Broadcast a TTS play event to peers (called by SpeakButton inside a room). */
  broadcastSpeak: (text: string) => void;
  /** Last incoming speak event from a peer — drives auto-play on receivers. */
  incomingSpeak: { text: string; at: number; from: string } | null;
  /** Translations currently revealed to the student (tutor-controlled). Key is text content. */
  revealedTranslations: Set<string>;
  /** Tutor-only: toggle a translation's visibility for the student. */
  toggleTranslation: (key: string) => void;
  /** Live answers of the learner currently being watched, keyed by exercise
   *  anchor. In a 1:1 room that is simply "the student". Exercise sections read
   *  only this and stay unaware of group rooms. */
  studentAnswers: Record<string, { state: unknown; updatedAt: number }>;
  /** Every learner's answers, keyed user id → anchor. For views that show the
   *  whole group at once rather than one learner at a time. */
  answersByStudent: Record<string, Record<string, { state: unknown; updatedAt: number }>>;
  /** Students the tutor can switch between (present, or with answers on file). */
  learners: RoomPresence[];
  /** The learner whose answers `studentAnswers` currently resolves to. */
  viewedStudentId: string | null;
  /** Tutor-only: watch a different learner. */
  setViewedStudentId: (userId: string) => void;
  /** Student broadcasts a change in their answer for one exercise anchor. */
  reportAnswer: (anchor: string, state: unknown) => void;
  /** Tutor-driven current step. When set, both sides scroll to it. */
  currentSectionIdx: number | null;
  /** Tutor-only: broadcast a new current step. */
  setCurrentSectionIdx: (idx: number) => void;
  /** Last incoming scroll position from the tutor (student follows it). */
  incomingScroll: { idx: number; frac: number; at: number } | null;
  /** Tutor-only: broadcast the current scroll position (section + intra fraction). */
  broadcastScroll: (idx: number, frac: number) => void;
  /** Live chat messages in the room. */
  chatMessages: ChatMessage[];
  /** Send a chat message. */
  sendChat: (text: string) => void;
  /** Incoming lesson switch from the other participant. */
  incomingLessonChange: { lessonId: string; title: string; by: string; at: number } | null;
  /** Change the shared current lesson (persists + broadcasts). */
  broadcastLessonChange: (lessonId: string, title: string) => void;
  /** Open the lesson picker (lets either side switch the lesson). */
  openLessonPicker: () => void;
}

export interface ChatMessage {
  id: string;
  from: string;
  name: string;
  role: "tutor" | "student";
  text: string;
  at: number;
}

const LessonRoomContext = createContext<LessonRoomContextValue | null>(null);

export function LessonRoomProvider({
  value,
  children,
}: {
  value: LessonRoomContextValue;
  children: React.ReactNode;
}) {
  return <LessonRoomContext.Provider value={value}>{children}</LessonRoomContext.Provider>;
}

export function useLessonRoom(): LessonRoomContextValue | null {
  return useContext(LessonRoomContext);
}
