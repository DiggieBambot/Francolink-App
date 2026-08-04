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
  /** Live student answers for interactive exercises. Tutor reads to watch progress. */
  studentAnswers: Record<string, { state: unknown; updatedAt: number }>;
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
