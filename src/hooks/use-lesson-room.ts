"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createBrowserClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { RoomPresence } from "@/components/lesson-v2/lesson-room-context";

interface UseLessonRoomArgs {
  sessionId: string;
  currentUserId: string;
  currentRole: "tutor" | "student";
  currentName: string;
  initialHighlights?: { anchor_id: string }[];
  initialChatMessages?: {
    id: string; from: string; name: string; role: "tutor" | "student"; text: string; at: number;
  }[];
}

interface HighlightAnchor {
  id: string;
  text: string;
  sectionIdx: number;
}

export function useLessonRoom({
  sessionId,
  currentUserId,
  currentRole,
  currentName,
  initialHighlights = [],
  initialChatMessages = [],
}: UseLessonRoomArgs) {
  const supabase = createBrowserClient();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [highlights, setHighlights] = useState<Set<string>>(
    () => new Set(initialHighlights.map((h) => h.anchor_id))
  );
  const [presence, setPresence] = useState<RoomPresence[]>([]);
  const [incomingSpeak, setIncomingSpeak] = useState<
    { text: string; at: number; from: string } | null
  >(null);
  const [revealedTranslations, setRevealedTranslations] = useState<Set<string>>(new Set());
  const [chatMessages, setChatMessages] = useState<
    { id: string; from: string; name: string; role: "tutor" | "student"; text: string; at: number }[]
  >(initialChatMessages);
  const [studentAnswers, setStudentAnswers] = useState<
    Record<string, { state: unknown; updatedAt: number }>
  >({});
  const [currentSectionIdx, setCurrentSectionIdxState] = useState<number | null>(null);
  const [incomingLessonChange, setIncomingLessonChange] = useState<
    { lessonId: string; title: string; by: string; at: number } | null
  >(null);

  // Subscribe to the session channel for presence + highlight broadcasts.
  useEffect(() => {
    const channel = supabase.channel(`session:${sessionId}`, {
      config: { presence: { key: currentUserId } },
    });
    channelRef.current = channel;

    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState() as Record<string, RoomPresence[]>;
      const flat: RoomPresence[] = [];
      for (const arr of Object.values(state)) {
        if (arr[0]) flat.push(arr[0]);
      }
      setPresence(flat);
    });

    // Replace the full set in one event — supports single-active highlight semantics.
    channel.on("broadcast", { event: "highlight:set" }, ({ payload }) => {
      const ids = (payload as { ids?: string[] }).ids;
      if (Array.isArray(ids)) setHighlights(new Set(ids));
    });

    channel.on("broadcast", { event: "tts:play" }, ({ payload }) => {
      const p = payload as { text?: string; from?: string };
      if (!p?.text) return;
      if (p.from === currentUserId) return;
      setIncomingSpeak({ text: p.text, at: Date.now(), from: p.from || "" });
    });

    channel.on("broadcast", { event: "translation:set" }, ({ payload }) => {
      const keys = (payload as { keys?: string[] }).keys;
      if (Array.isArray(keys)) setRevealedTranslations(new Set(keys));
    });

    channel.on("broadcast", { event: "section:current" }, ({ payload }) => {
      const idx = (payload as { idx?: number }).idx;
      if (typeof idx === "number") setCurrentSectionIdxState(idx);
    });

    channel.on("broadcast", { event: "lesson:change" }, ({ payload }) => {
      const p = payload as { lessonId?: string; title?: string; by?: string };
      if (!p?.lessonId || p.by === currentUserId) return;
      setIncomingLessonChange({ lessonId: p.lessonId, title: p.title || "a lesson", by: p.by || "", at: Date.now() });
    });

    channel.on("broadcast", { event: "chat:message" }, ({ payload }) => {
      const m = payload as {
        id?: string; from?: string; name?: string; role?: "tutor" | "student"; text?: string; at?: number;
      };
      if (!m?.text) return;
      setChatMessages((prev) => {
        if (m.id && prev.some((x) => x.id === m.id)) return prev; // dedupe own echo
        return [
          ...prev,
          {
            id: m.id || crypto.randomUUID(),
            from: m.from || "",
            name: m.name || "Someone",
            role: m.role || "student",
            text: m.text!,
            at: m.at || Date.now(),
          },
        ];
      });
    });

    channel.on("broadcast", { event: "exercise:answer" }, ({ payload }) => {
      const p = payload as { anchor?: string; state?: unknown; from?: string };
      if (!p?.anchor) return;
      // Only accept broadcasts from the OTHER side (avoid echoing our own).
      if (p.from === currentUserId) return;
      setStudentAnswers((prev) => ({
        ...prev,
        [p.anchor!]: { state: p.state, updatedAt: Date.now() },
      }));
    });

    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({
          user_id: currentUserId,
          role: currentRole,
          name: currentName,
          avatar_seed: currentName,
        });
      }
    });

    return () => {
      // removeChannel (not just unsubscribe) so React StrictMode's double-mount
      // in dev doesn't leave a stale channel on the same topic that can swallow
      // incoming broadcasts on the re-subscribed channel.
      void supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [sessionId, currentUserId, currentRole, currentName, supabase]);

  // Tutor toggle: single-active highlight. Clicking word A then B leaves only B
  // highlighted. Clicking the same word again clears it.
  const toggleHighlight = useCallback(
    async (anchor: HighlightAnchor) => {
      if (currentRole !== "tutor") return; // only tutor highlights
      const already = highlights.has(anchor.id);
      const nextIds = already ? [] : [anchor.id];

      // Optimistic local update.
      setHighlights(new Set(nextIds));

      // Broadcast the full new set.
      await channelRef.current?.send({
        type: "broadcast",
        event: "highlight:set",
        payload: { ids: nextIds, text: anchor.text, sectionIdx: anchor.sectionIdx },
      });

      // Persist: always replace the session's row set so refresh restores accurately.
      await supabase
        .from("tutor_lesson_highlights")
        .delete()
        .eq("session_id", sessionId);
      if (!already) {
        await supabase.from("tutor_lesson_highlights").insert({
          session_id: sessionId,
          anchor_id: anchor.id,
          text: anchor.text,
          section_idx: anchor.sectionIdx,
          created_by: currentUserId,
        });
      }
    },
    [highlights, currentRole, currentUserId, sessionId, supabase]
  );

  const broadcastSpeak = useCallback(
    (text: string) => {
      void channelRef.current?.send({
        type: "broadcast",
        event: "tts:play",
        payload: { text, from: currentUserId },
      });
    },
    [currentUserId]
  );

  // Tutor-only: toggle which translations are revealed to the student.
  const toggleTranslation = useCallback(
    async (key: string) => {
      if (currentRole !== "tutor") return;
      // Compute the next set SYNCHRONOUSLY from current state so the broadcast
      // payload is correct. (Deriving it inside a setState updater races the
      // send() below — the updater may not have run yet.)
      const next = new Set(revealedTranslations);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      const nextKeys = Array.from(next);
      setRevealedTranslations(next);
      await channelRef.current?.send({
        type: "broadcast",
        event: "translation:set",
        payload: { keys: nextKeys },
      });
    },
    [currentRole, revealedTranslations]
  );

  // Student-only: broadcast a change in their exercise answer.
  const reportAnswer = useCallback(
    (anchor: string, state: unknown) => {
      if (currentRole !== "student") return;
      void channelRef.current?.send({
        type: "broadcast",
        event: "exercise:answer",
        payload: { anchor, state, from: currentUserId },
      });
    },
    [currentRole, currentUserId]
  );

  // Tutor-only: broadcast the new current section to both sides.
  const setCurrentSectionIdx = useCallback(
    (idx: number) => {
      if (currentRole !== "tutor") return;
      setCurrentSectionIdxState(idx);
      void channelRef.current?.send({
        type: "broadcast",
        event: "section:current",
        payload: { idx },
      });
    },
    [currentRole]
  );

  // Anyone can chat. Broadcast + optimistic local + best-effort persist.
  const sendChat = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      const msg = {
        id: crypto.randomUUID(),
        from: currentUserId,
        name: currentName,
        role: currentRole,
        text: trimmed,
        at: Date.now(),
      };
      setChatMessages((prev) => [...prev, msg]);
      void channelRef.current?.send({ type: "broadcast", event: "chat:message", payload: msg });
      // Persist via the service-backed API route so a link-joined student's
      // messages are saved too (member-only RLS would block a direct insert).
      void fetch(`/api/space/${sessionId}/chat`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: trimmed, name: currentName, role: currentRole }),
      }).catch(() => {});
    },
    [currentUserId, currentName, currentRole, sessionId]
  );

  // Either member: change the current lesson. Persists via API + broadcasts.
  const broadcastLessonChange = useCallback(
    async (lessonId: string, title: string) => {
      await fetch(`/api/space/${sessionId}/lesson`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ lessonId }),
      }).catch(() => {});
      void channelRef.current?.send({
        type: "broadcast",
        event: "lesson:change",
        payload: { lessonId, title, by: currentUserId, byName: currentName },
      });
    },
    [sessionId, currentUserId, currentName]
  );

  return {
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
    incomingLessonChange,
    broadcastLessonChange,
  };
}
