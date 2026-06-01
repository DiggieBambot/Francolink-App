// src/hooks/use-sound-engine.ts
"use client";

import { useEffect, useRef, useCallback } from "react";
import { useSoundSettings } from "./use-sound-settings";

type SoundType =
  | "correct"
  | "incorrect"
  | "complete"
  | "xp"
  | "streak"
  | "leaderboard"
  | "mic_on"
  | "tap"
  | "phase_change"
  | "perfect";

// iOS Safari quirks this engine works around:
//   1. AudioContext starts in "suspended" state. ctx.resume() is async; if you
//      don't await it before scheduling oscillators, the early oscillators
//      drop silently.
//   2. The context can only be unlocked from inside a user-gesture event
//      handler. We install a one-shot pointerdown listener that runs a silent
//      buffer to "warm" the context the first time the user taps anywhere.
//   3. The hardware mute switch silences Web Audio entirely. There is no
//      JavaScript workaround — only swapping to <audio> playback (media route)
//      can sidestep it, at the cost of needing audio files.

export function useSoundEngine() {
  const ctxRef = useRef<AudioContext | null>(null);
  const unlockedRef = useRef(false);
  const { soundEnabled } = useSoundSettings();

  // Unlock the AudioContext on the first user gesture anywhere on the page.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const unlock = async () => {
      if (unlockedRef.current) return;
      try {
        const Ctor = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
        if (!ctxRef.current) ctxRef.current = new Ctor();
        if (ctxRef.current.state === "suspended") await ctxRef.current.resume();
        // Play a 1-sample silent buffer to fully unlock on iOS.
        const buffer = ctxRef.current.createBuffer(1, 1, 22050);
        const src = ctxRef.current.createBufferSource();
        src.buffer = buffer;
        src.connect(ctxRef.current.destination);
        src.start(0);
        unlockedRef.current = true;
      } catch {
        // Will retry on next user gesture.
      }
    };
    const opts: AddEventListenerOptions = { once: false, passive: true };
    window.addEventListener("pointerdown", unlock, opts);
    window.addEventListener("touchstart", unlock, opts);
    window.addEventListener("keydown", unlock, opts);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("touchstart", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  const getCtx = useCallback(async (): Promise<AudioContext | null> => {
    if (typeof window === "undefined") return null;
    if (!ctxRef.current || ctxRef.current.state === "closed") {
      const Ctor = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
      ctxRef.current = new Ctor();
    }
    if (ctxRef.current.state === "suspended") {
      try {
        await ctxRef.current.resume();
      } catch {
        return null;
      }
    }
    return ctxRef.current;
  }, []);

  const playTone = useCallback((
    ctx: AudioContext,
    freq: number,
    startTime: number,
    duration: number,
    gain: number = 0.3,
    type: OscillatorType = "sine",
  ) => {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(gain, startTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);
  }, []);

  const playNoise = useCallback((
    ctx: AudioContext,
    startTime: number,
    duration: number,
    gain: number = 0.05,
    highpass: number = 800
  ) => {
    const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * duration));
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = highpass;
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(gain, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);
    source.start(startTime);
    source.stop(startTime + duration);
  }, []);

  const play = useCallback(async (sound: SoundType): Promise<void> => {
    if (!soundEnabled) return;
    const ctx = await getCtx();
    if (!ctx) return;
    // Read currentTime AFTER ctx is confirmed "running" — schedules accurately.
    const t = ctx.currentTime + 0.001;

    switch (sound) {
      case "correct":
        playTone(ctx, 523, t, 0.12, 0.25);
        playTone(ctx, 659, t + 0.1, 0.18, 0.28);
        playTone(ctx, 784, t + 0.2, 0.25, 0.22);
        break;
      case "incorrect":
        playTone(ctx, 220, t, 0.08, 0.2);
        playTone(ctx, 180, t + 0.06, 0.15, 0.15);
        playNoise(ctx, t, 0.12, 0.04, 200);
        break;
      case "complete":
        [523, 659, 784, 1047].forEach((f, i) => playTone(ctx, f, t + i * 0.12, 0.2, 0.25));
        playTone(ctx, 1047, t + 0.5, 0.5, 0.3);
        break;
      case "xp":
        playTone(ctx, 880, t, 0.08, 0.2);
        playTone(ctx, 1100, t + 0.06, 0.1, 0.18);
        playTone(ctx, 1320, t + 0.12, 0.15, 0.15);
        break;
      case "streak":
        [330, 440, 550, 660, 880].forEach((f, i) => playTone(ctx, f, t + i * 0.08, 0.3, 0.2));
        playTone(ctx, 1100, t + 0.45, 0.6, 0.25);
        break;
      case "leaderboard":
        [392, 523, 659, 784, 1047].forEach((f, i) => playTone(ctx, f, t + i * 0.1, 0.22, 0.22));
        [494, 622, 740, 988].forEach((f, i) => playTone(ctx, f, t + i * 0.1 + 0.05, 0.2, 0.1));
        break;
      case "mic_on":
        playNoise(ctx, t, 0.04, 0.08, 1200);
        playTone(ctx, 880, t + 0.03, 0.1, 0.12);
        break;
      case "tap":
        playNoise(ctx, t, 0.03, 0.06, 1500);
        playTone(ctx, 440, t, 0.05, 0.08);
        break;
      case "phase_change":
        playTone(ctx, 392, t, 0.08, 0.15);
        playTone(ctx, 523, t + 0.07, 0.12, 0.15);
        break;
      case "perfect":
        [523, 659, 784, 1047, 1319, 1047, 784].forEach((f, i) => playTone(ctx, f, t + i * 0.1, 0.2, 0.25));
        playTone(ctx, 1568, t + 0.75, 0.8, 0.3);
        break;
    }
  }, [soundEnabled, getCtx, playTone, playNoise]);

  return { play };
}
