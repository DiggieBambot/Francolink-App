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
//
// Two things keep every line whole and at one volume:
// - The element is routed through one long-lived AudioContext (for lip sync).
//   While that context is suspended or "interrupted" (iOS does this when the
//   mic opens), the element plays into nothing, so a clip started then lost
//   its first syllables. Each clip now waits until the context is running and
//   the audio route has settled after the mic (see lib/tts/audio-session).
// - Each clip is measured and played at a gain that brings its speech to one
//   target level, with a limiter after it (see lib/tts/loudness).

import { useCallback, useEffect, useRef, useState } from "react";
import { bandBuffers, readVoiceBands, silentBands, type VoiceBands } from "@/components/ai-tutor/leon/voice";
import { playbackRouteReady } from "@/lib/tts/audio-session";
import { measureClipGain } from "@/lib/tts/loudness";

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
  /** What is being said, for captions. Empty for non-verbal clips. */
  text: string;
  audio: Promise<Blob | null>;
  /** Playback gain that normalises this clip's loudness. */
  gain: Promise<number>;
}

/** The clip playing right now, for word-by-word captions. */
export interface NowPlaying {
  id?: string;
  text: string;
  /** performance.now() when it started, and its length in seconds once known. */
  startedAt: number;
  duration: number | null;
  /** Playback position in seconds, read from the audio element (for lip sync). */
  position?: () => number;
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Start measuring a clip's loudness as soon as it arrives. */
function gainFor(audio: Promise<Blob | null>): Promise<number> {
  return audio.then((b) => (b ? measureClipGain(b) : 1)).catch(() => 1);
}

/**
 * Resolve once `ctx` is actually running. iOS leaves it "suspended" or
 * "interrupted" after the mic has been used, and resume() takes a moment.
 * Returns whether it had to wake up (the output then needs a beat to settle).
 */
async function wakeContext(ctx: AudioContext | null): Promise<boolean> {
  if (!ctx || ctx.state === "running" || ctx.state === "closed") return false;
  try {
    await Promise.race([ctx.resume(), sleep(1000)]);
  } catch {
    /* play anyway: some audio beats a stuck turn */
  }
  return true;
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
  const [nowPlaying, setNowPlaying] = useState<NowPlaying | null>(null);

  // Live loudness of Leon's voice, 0–1, for lip sync. A ref, not state: it
  // changes every frame and is read by the animation directly.
  const voiceLevelRef = useRef(0);
  // The same voice split into frequency bands, so Léon's mouth shape can
  // follow the sound (round for "o", wide for "i", teeth for "s").
  const voiceBandsRef = useRef<VoiceBands>(silentBands());
  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const rafRef = useRef<number | null>(null);

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

  /**
   * Route the player through an analyser so the voice level can drive lip
   * sync. Done once, inside a user gesture; if anything fails the audio still
   * plays normally and Leon simply falls back to a gentle mouth movement.
   */
  const attachAnalyser = useCallback(() => {
    const el = element();
    if (!el || analyserRef.current || typeof window === "undefined") return;
    try {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      const source = ctx.createMediaElementSource(el);
      // element → gain (per-clip loudness) → analyser (lip sync) → limiter → out
      const gain = ctx.createGain();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.5;
      const limiter = ctx.createDynamicsCompressor();
      limiter.threshold.value = -6;
      limiter.knee.value = 4;
      limiter.ratio.value = 12;
      limiter.attack.value = 0.003;
      limiter.release.value = 0.15;
      source.connect(gain);
      gain.connect(analyser);
      analyser.connect(limiter);
      limiter.connect(ctx.destination);
      ctxRef.current = ctx;
      analyserRef.current = analyser;
      gainRef.current = gain;
    } catch {
      /* lip sync is decoration */
    }
  }, [element]);

  const startMeter = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser || rafRef.current !== null) return;
    const buf = bandBuffers(analyser);
    const tick = () => {
      readVoiceBands(analyser, buf, voiceBandsRef.current);
      voiceLevelRef.current = voiceBandsRef.current.level;
      rafRef.current = requestAnimationFrame(tick);
    };
    tick();
  }, []);

  const stopMeter = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    voiceLevelRef.current = 0;
    Object.assign(voiceBandsRef.current, silentBands());
  }, []);

  /** Call from a click/tap handler before any audio is expected. */
  const unlock = useCallback(() => {
    attachAnalyser();
    void ctxRef.current?.resume().catch(() => {});
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
  }, [element, attachAnalyser]);

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
      const gain = await item.gain;

      // Don't start into a dead or switching output: that is what clipped the
      // first syllables. Both waits are ~0 ms in the steady state.
      await playbackRouteReady();
      if (await wakeContext(ctxRef.current)) await sleep(80);
      if (gen !== genRef.current) break;

      const el = element();
      if (!el) break;
      const url = URL.createObjectURL(blob);
      setSpeakingId(item.id ?? null);
      setIsSpeaking(true);
      const g = gainRef.current;
      if (g) {
        g.gain.cancelScheduledValues(0);
        g.gain.setValueAtTime(gain, g.context.currentTime);
      }
      startMeter();
      setNowPlaying({
        id: item.id,
        text: item.text,
        startedAt: performance.now(),
        duration: null,
        position: () => el.currentTime,
      });

      await new Promise<void>((resolve) => {
        const done = () => {
          el.onended = null;
          el.onerror = null;
          el.onloadedmetadata = null;
          finishClipRef.current = null;
          URL.revokeObjectURL(url);
          resolve();
        };
        finishClipRef.current = done;
        el.onloadedmetadata = () => {
          const d = Number.isFinite(el.duration) ? el.duration : null;
          setNowPlaying((np) => (np && np.text === item.text ? { ...np, duration: d } : np));
        };
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
      setNowPlaying(null);
      stopMeter();
      playingRef.current = false;
    }
  }, [element, startMeter, stopMeter]);

  /** Add one chunk (normally a sentence) to the end of the queue. */
  const enqueue = useCallback(
    (text: string, opts: SpeakOptions = {}) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      setError(false);
      const audio = fetchAudio(trimmed, !!opts.slow);
      queueRef.current.push({ id: opts.id, text: trimmed, audio, gain: gainFor(audio) });
      void pump();
    },
    [fetchAudio, pump]
  );

  /** Fetch a short clip now to play later without waiting (e.g. "Mm-hm"). */
  const prefetch = useCallback(
    (text: string) => fetchAudio(text, false),
    [fetchAudio]
  );

  /** Play an already-fetched clip through the same (unlocked) player. */
  const playClip = useCallback(
    (audio: Promise<Blob | null>, text = "") => {
      queueRef.current.push({ text, audio, gain: gainFor(audio) });
      void pump();
    },
    [pump]
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
    setNowPlaying(null);
    stopMeter();
  }, [stopMeter]);

  /** Replace whatever is playing with `text`, sentence by sentence. */
  const speak = useCallback(
    (text: string, opts: SpeakOptions = {}) => {
      stop();
      for (const s of takeSentences(text, true).sentences) enqueue(s, opts);
    },
    [enqueue, stop]
  );

  useEffect(() => stop, [stop]);

  return {
    speak,
    enqueue,
    stop,
    unlock,
    prefetch,
    playClip,
    isSpeaking,
    speakingId,
    error,
    nowPlaying,
    voiceLevelRef,
    voiceBandsRef,
  };
}
