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
  initialHighlights?: { anchor_id: string; role: "tutor" | "student" }[];
  initialChatMessages?: {
    id: string; from: string; name: string; role: "tutor" | "student"; text: string; at: number;
  }[];
}

/** Trailing throttle on outgoing answer broadcasts, in ms. */
const ANSWER_THROTTLE_MS = 150;

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
  // Anchor id → the role of whoever highlighted it. Each side has ONE active
  // highlight (single-active per role), and the two coexist so tutor and student
  // highlights are independent and can be coloured differently.
  const [highlights, setHighlights] = useState<Map<string, "tutor" | "student">>(
    () => new Map(initialHighlights.map((h) => [h.anchor_id, h.role]))
  );
  const [presence, setPresence] = useState<RoomPresence[]>([]);
  const [incomingSpeak, setIncomingSpeak] = useState<
    { text: string; at: number; from: string } | null
  >(null);
  const [revealedTranslations, setRevealedTranslations] = useState<Set<string>>(new Set());
  const [chatMessages, setChatMessages] = useState<
    { id: string; from: string; name: string; role: "tutor" | "student"; text: string; at: number }[]
  >(initialChatMessages);
  // Live exercise answers, keyed student → anchor. A room holds up to
  // MAX_GROUP_LEARNERS students, so answers cannot be keyed by anchor alone:
  // two learners on the same exercise would overwrite each other.
  const [answersByStudent, setAnswersByStudent] = useState<
    Record<string, Record<string, { state: unknown; updatedAt: number }>>
  >({});
  // Which learner the tutor is currently watching. null = "first one to answer",
  // resolved below, so a 1:1 room needs no selection at all.
  const [viewedStudentId, setViewedStudentId] = useState<string | null>(null);
  const [currentSectionIdx, setCurrentSectionIdxState] = useState<number | null>(null);
  const [incomingScroll, setIncomingScroll] = useState<
    { idx: number; frac: number; at: number } | null
  >(null);
  const [incomingLessonChange, setIncomingLessonChange] = useState<
    { lessonId: string; title: string; by: string; at: number } | null
  >(null);
  // ── Shared material browsing ──────────────────────────────────────────────
  // Picking the lesson used to be a private act: whoever opened the catalogue
  // was alone in it, and the other person stared at a frozen room until
  // something changed under them. In a real class both people look at the
  // shelf together — the tutor scrolls, the student sees what they are
  // considering. So the catalogue is shared state on the channel, not local
  // component state.
  //
  // What is NOT shared is scroll position. Following someone else's scroll in
  // a grid is nauseating, and it takes away the one thing a student can
  // usefully do while the tutor decides: look ahead.
  const [remoteBrowsing, setRemoteBrowsing] = useState<
    { open: boolean; by: string; byName: string; at: number } | null
  >(null);
  const [remoteFilter, setRemoteFilter] = useState<
    { q: string; level: string | null; by: string; at: number } | null
  >(null);
  // A student cannot change the lesson out from under the class, but they can
  // ASK. The tutor sees the suggestion and accepts or dismisses it.
  const [proposal, setProposal] = useState<
    { lessonId: string; title: string; by: string; byName: string; at: number } | null
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

    // One side moved (or cleared) its own highlight. Update only that role's
    // entry so the other participant's highlight is left untouched.
    channel.on("broadcast", { event: "highlight:role" }, ({ payload }) => {
      const p = payload as { role?: "tutor" | "student"; id?: string | null; from?: string };
      if (!p.role || p.from === currentUserId) return; // own echo already applied
      const role = p.role;
      const id = p.id ?? null;
      setHighlights((prev) => {
        const next = new Map(prev);
        for (const [k, r] of next) if (r === role) next.delete(k);
        if (id) next.set(id, role);
        return next;
      });
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

    channel.on("broadcast", { event: "scroll:position" }, ({ payload }) => {
      const p = payload as { idx?: number; frac?: number; from?: string };
      if (typeof p?.idx !== "number" || p.from === currentUserId) return;
      setIncomingScroll({ idx: p.idx, frac: typeof p.frac === "number" ? p.frac : 0, at: Date.now() });
    });

    channel.on("broadcast", { event: "lesson:change" }, ({ payload }) => {
      const p = payload as { lessonId?: string; title?: string; by?: string };
      if (!p?.lessonId || p.by === currentUserId) return;
      setIncomingLessonChange({ lessonId: p.lessonId, title: p.title || "a lesson", by: p.by || "", at: Date.now() });
    });

    channel.on("broadcast", { event: "materials:open" }, ({ payload }) => {
      const p = payload as { open?: boolean; by?: string; byName?: string };
      if (!p.by || p.by === currentUserId) return;
      setRemoteBrowsing({
        open: Boolean(p.open),
        by: p.by,
        byName: p.byName || "They",
        at: Date.now(),
      });
    });

    channel.on("broadcast", { event: "materials:filter" }, ({ payload }) => {
      const p = payload as { q?: string; level?: string | null; by?: string };
      if (!p.by || p.by === currentUserId) return;
      setRemoteFilter({ q: p.q || "", level: p.level ?? null, by: p.by, at: Date.now() });
    });

    channel.on("broadcast", { event: "materials:propose" }, ({ payload }) => {
      const p = payload as { lessonId?: string; title?: string; by?: string; byName?: string };
      if (!p.lessonId || !p.by || p.by === currentUserId) return;
      setProposal({
        lessonId: p.lessonId,
        title: p.title || "a lesson",
        by: p.by,
        byName: p.byName || "Your student",
        at: Date.now(),
      });
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
      if (!p?.anchor || !p.from) return;
      // Only accept broadcasts from the OTHER side (avoid echoing our own).
      if (p.from === currentUserId) return;
      const sender = p.from;
      setAnswersByStudent((prev) => ({
        ...prev,
        [sender]: {
          ...(prev[sender] || {}),
          [p.anchor!]: { state: p.state, updatedAt: Date.now() },
        },
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

  // Either side may highlight. Single-active PER ROLE: clicking word A then B
  // moves *your* highlight to B; clicking your own highlighted word clears it.
  // The other participant's highlight is never affected.
  const toggleHighlight = useCallback(
    async (anchor: HighlightAnchor) => {
      // My current highlight, if any.
      let mineId: string | null = null;
      for (const [k, r] of highlights) if (r === currentRole) mineId = k;
      const clearing = mineId === anchor.id;
      const nextId = clearing ? null : anchor.id;

      // Optimistic local update: drop my old highlight, set my new one.
      setHighlights((prev) => {
        const next = new Map(prev);
        if (mineId) next.delete(mineId);
        if (nextId) next.set(nextId, currentRole);
        return next;
      });

      // Broadcast only my role's change.
      await channelRef.current?.send({
        type: "broadcast",
        event: "highlight:role",
        payload: {
          role: currentRole,
          id: nextId,
          from: currentUserId,
          text: anchor.text,
          sectionIdx: anchor.sectionIdx,
        },
      });

      // Persist only MY row so a refresh restores both sides' highlights.
      await supabase
        .from("tutor_lesson_highlights")
        .delete()
        .eq("session_id", sessionId)
        .eq("created_by", currentUserId);
      if (nextId) {
        await supabase.from("tutor_lesson_highlights").insert({
          session_id: sessionId,
          anchor_id: nextId,
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
  //
  // Trailing-throttled per anchor: this fires on every keystroke and every tile
  // drop, and with five learners in the room that is five times the traffic the
  // 1:1 design ever saw. The tutor only needs to see the settled answer, so we
  // send at most once per ANSWER_THROTTLE_MS and always flush the final value.
  const answerTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const answerPending = useRef<Record<string, unknown>>({});

  const flushAnswer = useCallback(
    (anchor: string) => {
      const state = answerPending.current[anchor];
      delete answerPending.current[anchor];
      delete answerTimers.current[anchor];
      void channelRef.current?.send({
        type: "broadcast",
        event: "exercise:answer",
        payload: { anchor, state, from: currentUserId },
      });
    },
    [currentUserId]
  );

  const reportAnswer = useCallback(
    (anchor: string, state: unknown) => {
      if (currentRole !== "student") return;
      answerPending.current[anchor] = state;
      if (answerTimers.current[anchor]) return; // a flush is already scheduled
      answerTimers.current[anchor] = setTimeout(
        () => flushAnswer(anchor),
        ANSWER_THROTTLE_MS
      );
    },
    [currentRole, flushAnswer]
  );

  // Never strand a half-sent answer if the room unmounts mid-throttle.
  useEffect(() => {
    const timers = answerTimers.current;
    return () => {
      for (const t of Object.values(timers)) clearTimeout(t);
    };
  }, []);

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

  // Tutor-only: broadcast the current scroll position (topmost section + the
  // fraction scrolled within it) so the student's view follows the tutor.
  const broadcastScroll = useCallback(
    (idx: number, frac: number) => {
      if (currentRole !== "tutor") return;
      void channelRef.current?.send({
        type: "broadcast",
        event: "scroll:position",
        payload: { idx, frac, from: currentUserId },
      });
    },
    [currentRole, currentUserId]
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

  const broadcastMaterialsOpen = useCallback(
    (open: boolean) => {
      void channelRef.current?.send({
        type: "broadcast",
        event: "materials:open",
        payload: { open, by: currentUserId, byName: currentName },
      });
    },
    [currentUserId, currentName]
  );

  const broadcastMaterialsFilter = useCallback(
    (q: string, level: string | null) => {
      void channelRef.current?.send({
        type: "broadcast",
        event: "materials:filter",
        payload: { q, level, by: currentUserId },
      });
    },
    [currentUserId]
  );

  const proposeLesson = useCallback(
    (lessonId: string, title: string) => {
      void channelRef.current?.send({
        type: "broadcast",
        event: "materials:propose",
        payload: { lessonId, title, by: currentUserId, byName: currentName },
      });
    },
    [currentUserId, currentName]
  );

  /** The tutor has dealt with a suggestion — accepted or dismissed. */
  const clearProposal = useCallback(() => setProposal(null), []);

  // The learners the tutor can switch between: anyone present as a student,
  // plus anyone who has answered but has since dropped off the channel (so a
  // student's work does not vanish from the tutor's view on a flaky connection).
  const learners: RoomPresence[] = (() => {
    const byId = new Map<string, RoomPresence>();
    for (const p of presence) {
      if (p.role === "student") byId.set(p.user_id, p);
    }
    for (const id of Object.keys(answersByStudent)) {
      if (!byId.has(id)) {
        byId.set(id, { user_id: id, role: "student", name: "Student" });
      }
    }
    return Array.from(byId.values());
  })();

  // Resolve the selection. A 1:1 room never sets viewedStudentId, so it falls
  // through to the only learner and behaves exactly as it did before.
  const effectiveViewedId =
    (viewedStudentId && answersByStudent[viewedStudentId] ? viewedStudentId : null) ??
    (viewedStudentId && learners.some((l) => l.user_id === viewedStudentId)
      ? viewedStudentId
      : null) ??
    learners[0]?.user_id ??
    null;

  // Sections read this and are unaware that groups exist: it is always "the
  // answers of the learner currently being watched".
  const studentAnswers = (effectiveViewedId && answersByStudent[effectiveViewedId]) || {};

  return {
    highlights,
    presence,
    learners,
    viewedStudentId: effectiveViewedId,
    setViewedStudentId,
    answersByStudent,
    toggleHighlight,
    broadcastSpeak,
    incomingSpeak,
    revealedTranslations,
    toggleTranslation,
    studentAnswers,
    reportAnswer,
    currentSectionIdx,
    setCurrentSectionIdx,
    incomingScroll,
    broadcastScroll,
    chatMessages,
    sendChat,
    incomingLessonChange,
    broadcastLessonChange,
    remoteBrowsing,
    remoteFilter,
    proposal,
    broadcastMaterialsOpen,
    broadcastMaterialsFilter,
    proposeLesson,
    clearProposal,
  };
}
