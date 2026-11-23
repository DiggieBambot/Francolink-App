"use client";

// Speech playback for AI tutor replies.
//
// A queue, not a single clip. The chat reply now streams in, and waiting for
// the whole reply before synthesising any of it was most of the dead air in a
// turn. Instead the page hands over each sentence as soon as it is complete:
// its audio is fetched immediately (so the next sentence is usually ready
// before the current one ends) and played in order.
//
// One <audio> element is reused for every clip and "unlocked" on the student's
// click. iOS Safari only lets an element play without a gesture once it has
// played *with* one, and the first sentence arrives well after the click.
//
// Talks to /api/tts/tutor: no cache (tutor replies are unique), voice from the
// learning language, rate from the CEFR level, optionally slowed for replay.

import { useCallback, useEffect, useRef, useState } from "react";

interface UseTutorTTSOptions {
  /** Learning language code, e.g. "fr". */
  language?: string;
  /** CEFR level, used to pick the speaking rate. */
  level?: string;
}

interface SpeakOptions {
  /** Message the audio belongs to, so the UI can show which one is playing. */
  id?: string;
  /** Slower than the level's normal rate. */
  slow?: boolean;
}

interface QueueItem {
  id?: string;
  audio: Promise<Blob | null>;
}

/** 0.1 s of silence; playing it inside a click unlocks the element on iOS. */
const SILENT_WAV =
  "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAAA=";

/**
 * Split off the complete sentences at the front of `buffer`.
 *
 * Very short sentences ("Oui !") are joined to the next one: every chunk is a
 * request, and a two-word clip followed by a gap sounds choppier than one
 * slightly later clip.
 */
export function takeSentences(buffer: string, flush = false): { sentences: string[]; rest: string } {
  const parts: string[] = [];
  const re = /[^.!?…\n]*(?:[.!?…]+["»”')\]]*\s+|\n+)/g;
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(buffer)) !== null) {
    if (m[0].length === 0) {
      re.lastIndex++;
      continue;
    }
    parts.push(m[0]);
    lastIndex = re.lastIndex;
  }
  let rest = buffer.slice(lastIndex);

  const sentences: string[] = [];
  let pending = "";
  for (const p of parts) {
    pending += p;
    if (pending.trim().length >= 25) {
      sentences.push(pending.trim());
      pending = "";
    }
  }
  rest = pending + rest;

  if (flush && rest.trim()) {
    sentences.push(rest.trim());
    rest = "";
  }
  return { sentences, rest };
}

export function useTutorTTS(options: UseTutorTTSOptions = {}) {
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const queueRef = useRef<QueueItem[]>([]);
  const playingRef = useRef(false);
  // Bumped by stop(): anything started under an older generation gives up.
  const genRef = useRef(0);
  // Resolves the clip currently playing, so stop() can release the player loop.
  const finishClipRef = useRef<(() => void) | null>(null);
  const optsRef = useRef(options);
  useEffect(() => {
    optsRef.current = options;
  });

  const element = useCallback(() => {
    if (!audioRef.current && typeof window !== "undefined") {
      audioRef.current = new Audio();
      audioRef.current.preload = "auto";
    }
    return audioRef.current;
  }, []);

  /** Call from a click/tap handler before any audio is expected. */
  const unlock = useCallback(() => {
    const el = element();
    if (!el || el.dataset.unlocked) return;
    el.src = SILENT_WAV;
    el.play()
      .then(() => {
        el.dataset.unlocked = "1";
      })
      .catch(() => {
        /* best effort */
      });
  }, [element]);

  const fetchAudio = useCallback(
    async (text: string, slow: boolean): Promise<Blob | null> => {
      try {
        const res = await fetch("/api/tts/tutor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text,
            language: optsRef.current.language || "fr",
            level: optsRef.current.level || "A1",
            slow,
          }),
        });
        // Stay silent rather than falling back to the OS voice — a robotic
        // English reader mangling French is worse than no audio.
        if (!res.ok) return null;
        return await res.blob();
      } catch {
        return null;
      }
    },
    []
  );

  const pump = useCallback(async () => {
    if (playingRef.current) return;
    playingRef.current = true;
    const gen = genRef.current;

    while (queueRef.current.length > 0 && gen === genRef.current) {
      const item = queueRef.current.shift()!;
      const blob = await item.audio;
      if (gen !== genRef.current) break;
      if (!blob) {
        setError(true);
        continue;
      }

      const el = element();
      if (!el) break;
      const url = URL.createObjectURL(blob);
      setSpeakingId(item.id ?? null);
      setIsSpeaking(true);

      await new Promise<void>((resolve) => {
        const done = () => {
          el.onended = null;
          el.onerror = null;
          finishClipRef.current = null;
          URL.revokeObjectURL(url);
          resolve();
        };
        finishClipRef.current = done;
        el.onended = done;
        el.onerror = () => {
          setError(true);
          done();
        };
        el.src = url;
        el.play().catch(() => {
          // Autoplay refused (no gesture yet) — skip rather than hang.
          setError(true);
          done();
        });
      });
    }

    // After a stop(), a newer loop may already own the player; leave it be.
    if (gen === genRef.current) {
      setIsSpeaking(false);
      setSpeakingId(null);
      playingRef.current = false;
    }
  }, [element]);

  /** Add one chunk (normally a sentence) to the end of the queue. */
  const enqueue = useCallback(
    (text: string, opts: SpeakOptions = {}) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      setError(false);
      queueRef.current.push({ id: opts.id, audio: fetchAudio(trimmed, !!opts.slow) });
      void pump();
    },
    [fetchAudio, pump]
  );

  const stop = useCallback(() => {
    genRef.current++;
    queueRef.current = [];
    playingRef.current = false;
    const el = audioRef.current;
    if (el) el.pause();
    finishClipRef.current?.();
    setIsSpeaking(false);
    setSpeakingId(null);
  }, []);

  /** Replace whatever is playing with `text`, sentence by sentence. */
  const speak = useCallback(
    (text: string, opts: SpeakOptions = {}) => {
      stop();
      for (const s of takeSentences(text, true).sentences) enqueue(s, opts);
    },
    [enqueue, stop]
  );

  useEffect(() => stop, [stop]);

  return { speak, enqueue, stop, unlock, isSpeaking, speakingId, error };
}
