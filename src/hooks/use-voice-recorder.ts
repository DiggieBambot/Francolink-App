"use client";

// Microphone capture for the AI tutor.
//
// Records a clip with MediaRecorder (every current browser, unlike the Web
// Speech API) and hands the Blob to the caller for server-side transcription.
// Also exposes a live input level so the mic button can show the student it is
// actually hearing them — the single most reassuring thing a voice UI can do.

import { useCallback, useEffect, useRef, useState } from "react";

const MIME_CANDIDATES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
  "audio/ogg;codecs=opus",
];

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  return MIME_CANDIDATES.find((t) => MediaRecorder.isTypeSupported(t));
}

function extensionFor(mime: string): string {
  if (mime.includes("mp4")) return "m4a";
  if (mime.includes("ogg")) return "ogg";
  return "webm";
}

interface Options {
  /** Auto-stop after this long. */
  maxMs?: number;
  /** Called with the finished clip (not called on cancel). */
  onRecorded: (file: File) => void;
  onError?: (message: string) => void;
}

export function useVoiceRecorder({ maxMs = 60_000, onRecorded, onError }: Options) {
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [level, setLevel] = useState(0);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const cancelledRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const rafRef = useRef<number | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const cbRef = useRef({ onRecorded, onError });
  useEffect(() => {
    cbRef.current = { onRecorded, onError };
  });

  const supported =
    typeof window !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof MediaRecorder !== "undefined";

  const cleanup = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    timerRef.current = null;
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    ctxRef.current?.close().catch(() => {});
    ctxRef.current = null;
    setIsRecording(false);
    setLevel(0);
  }, []);

  const stop = useCallback(() => {
    const rec = recorderRef.current;
    if (rec && rec.state !== "inactive") rec.stop();
  }, []);

  const cancel = useCallback(() => {
    cancelledRef.current = true;
    stop();
  }, [stop]);

  const start = useCallback(async () => {
    if (!supported) {
      cbRef.current.onError?.("Your browser can't record audio.");
      return;
    }
    if (recorderRef.current?.state === "recording") return;

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
    } catch {
      cbRef.current.onError?.(
        "Microphone access was blocked. Allow it in your browser's site settings to speak."
      );
      return;
    }

    streamRef.current = stream;
    chunksRef.current = [];
    cancelledRef.current = false;

    const mimeType = pickMimeType();
    const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    recorderRef.current = rec;

    rec.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    rec.onstop = () => {
      const type = rec.mimeType || mimeType || "audio/webm";
      const blob = new Blob(chunksRef.current, { type });
      cleanup();
      // Taps shorter than ~0.4 s are accidental.
      if (!cancelledRef.current && blob.size > 2000) {
        cbRef.current.onRecorded(
          new File([blob], `speech.${extensionFor(type)}`, { type })
        );
      }
    };

    // Input level meter.
    try {
      const ctx = new AudioContext();
      ctxRef.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      ctx.createMediaStreamSource(stream).connect(analyser);
      const data = new Uint8Array(analyser.fftSize);
      const tick = () => {
        analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (const v of data) sum += ((v - 128) / 128) ** 2;
        setLevel(Math.min(1, Math.sqrt(sum / data.length) * 4));
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch {
      /* the meter is decoration */
    }

    const startedAt = Date.now();
    setElapsedMs(0);
    timerRef.current = setInterval(() => {
      const ms = Date.now() - startedAt;
      setElapsedMs(ms);
      if (ms >= maxMs) stop();
    }, 200);

    rec.start();
    setIsRecording(true);
  }, [cleanup, maxMs, stop, supported]);

  useEffect(
    () => () => {
      cancelledRef.current = true;
      if (recorderRef.current?.state === "recording") recorderRef.current.stop();
      cleanup();
    },
    [cleanup]
  );

  return { start, stop, cancel, isRecording, elapsedMs, level, supported };
}
