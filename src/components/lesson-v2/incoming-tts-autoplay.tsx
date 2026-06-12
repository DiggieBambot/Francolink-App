"use client";

import { useEffect, useRef } from "react";
import { useInworldTTS } from "@/hooks/use-inworld-tts";
import { useLessonRoom } from "./lesson-room-context";
import { useLessonTTSLocale } from "./lesson-language-context";

/**
 * Mount-once inside a LessonRoomProvider. Watches the room's incomingSpeak
 * state and auto-plays the same TTS text on this side so both participants
 * hear it together.
 */
export function IncomingTtsAutoplay() {
  const room = useLessonRoom();
  const ttsLocale = useLessonTTSLocale();
  const tts = useInworldTTS({ language: ttsLocale });
  const lastAt = useRef(0);

  useEffect(() => {
    if (!room?.incomingSpeak) return;
    if (room.incomingSpeak.at === lastAt.current) return;
    lastAt.current = room.incomingSpeak.at;
    void tts.speak(room.incomingSpeak.text);
  }, [room?.incomingSpeak, tts]);

  return null;
}
