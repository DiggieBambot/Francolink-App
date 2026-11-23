"use client";

// The voice-first AI tutoring session: a full-screen conversation with Leon.
//
// Hands-free turn-taking, built on the same pipeline as the chat (record →
// transcribe → streamed reply → spoken sentence by sentence):
//   - Leon finishes speaking → the mic opens on its own
//   - the student talks → ~1.2 s of silence sends the turn
//   - nobody speaks for 10 s → the session pauses (no mic left open)
//   - tap while Leon speaks → he stops and it's the student's turn
// Leon's voice is never used as a trigger, so speakers can't make him
// interrupt himself.

import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, Pause, PhoneOff, Hand, Loader2 } from "lucide-react";
import { Leon, leonPalette, type LeonMood } from "@/components/ai-tutor/leon";

interface Correction {
  original: string;
  corrected: string;
  explanation?: string;
}

interface Recorder {
  start: () => Promise<void>;
  stop: () => void;
  cancel: () => void;
  isRecording: boolean;
  level: number;
  supported: boolean;
}

/** Input level that counts as speech (0–1 meter from useVoiceRecorder). */
const SPEECH_LEVEL = 0.12;
/** Silence after speech that ends the student's turn. */
const END_OF_TURN_MS = 1200;
/** No speech at all for this long pauses the session. */
const NO_SPEECH_PAUSE_MS = 10_000;
/** Beat between Leon finishing and the mic opening. */
const LISTEN_DELAY_MS = 450;

export function TutoringSession({
  language,
  mood,
  studentLine,
  tutorLine,
  tutorStreaming,
  corrections,
  isLoading,
  isTranscribing,
  isSpeaking,
  recorder,
  onInterrupt,
  onEnd,
  ending,
  timeLabel,
  outOfTime,
  outOfTimePanel,
  error,
  pauseKey = 0,
}: {
  language: string;
  mood: LeonMood;
  studentLine: string | null;
  tutorLine: string | null;
  tutorStreaming: boolean;
  corrections: Correction[];
  isLoading: boolean;
  isTranscribing: boolean;
  isSpeaking: boolean;
  recorder: Recorder;
  onInterrupt: () => void;
  onEnd: () => void;
  ending: boolean;
  timeLabel: string | null;
  outOfTime: boolean;
  outOfTimePanel: React.ReactNode;
  error: string | null;
  /** Changes when a turn failed: pause rather than retry into the same error. */
  pauseKey?: number;
}) {
  const [paused, setPaused] = useState(false);

  // Only failures while this session is open count, not ones from before it.
  const initialPauseKey = useRef(pauseKey);
  useEffect(() => {
    if (pauseKey !== initialPauseKey.current) setPaused(true);
  }, [pauseKey]);
  const palette = leonPalette(language);

  // ── Auto-listen ──────────────────────────────────────────────────────────
  const busy = isLoading || isTranscribing || isSpeaking;
  const startingRef = useRef(false);
  useEffect(() => {
    if (paused || outOfTime || ending || busy || recorder.isRecording || !recorder.supported) return;
    const t = setTimeout(async () => {
      if (startingRef.current) return;
      startingRef.current = true;
      try {
        await recorder.start();
      } finally {
        startingRef.current = false;
      }
    }, LISTEN_DELAY_MS);
    return () => clearTimeout(t);
    // recorder.start is stable; listing the flags is what matters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused, outOfTime, ending, busy, recorder.isRecording, recorder.supported]);

  // ── End-of-turn detection ────────────────────────────────────────────────
  const levelRef = useRef(0);
  levelRef.current = recorder.level;
  const [heard, setHeard] = useState(false);
  useEffect(() => {
    if (!recorder.isRecording) {
      setHeard(false);
      return;
    }
    const startedAt = Date.now();
    let speechAt = 0;
    let lastLoud = 0;
    const iv = setInterval(() => {
      const now = Date.now();
      if (levelRef.current >= SPEECH_LEVEL) {
        if (!speechAt) {
          speechAt = now;
          setHeard(true);
        }
        lastLoud = now;
      }
      if (speechAt && now - lastLoud > END_OF_TURN_MS) {
        clearInterval(iv);
        recorder.stop(); // sends the turn
      } else if (!speechAt && now - startedAt > NO_SPEECH_PAUSE_MS) {
        clearInterval(iv);
        recorder.cancel();
        setPaused(true);
      }
    }, 100);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recorder.isRecording]);

  // Stop listening if the session closes mid-turn (unmount only: the recorder
  // object is new every render, so it is read through a ref).
  const cancelRef = useRef(recorder.cancel);
  cancelRef.current = recorder.cancel;
  useEffect(() => () => cancelRef.current(), []);

  const togglePause = useCallback(() => {
    if (paused) {
      setPaused(false);
    } else {
      if (recorder.isRecording) recorder.cancel();
      setPaused(true);
    }
  }, [paused, recorder]);

  const interrupt = () => {
    onInterrupt();
    setPaused(false);
  };

  // ── Status line ──────────────────────────────────────────────────────────
  let status: string;
  if (outOfTime) status = "Out of tutoring time";
  else if (ending) status = "Wrapping up your session…";
  else if (isSpeaking) status = "Professor Léon is speaking · tap to interrupt";
  else if (isLoading) status = "Professor Léon is thinking…";
  else if (isTranscribing) status = "Got it…";
  else if (recorder.isRecording) status = heard ? "Listening…" : "Your turn — just start talking";
  else if (paused) status = error ? "Paused · tap the mic to try again" : "Paused · tap the mic to talk";
  else status = "Getting ready…";

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col text-gray-900"
      style={{ background: `linear-gradient(180deg, ${palette.bg} 0%, #ffffff 70%)` }}
      role="dialog"
      aria-label="AI tutoring session with Professor Léon"
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 max-w-3xl w-full mx-auto">
        <div>
          <p className="text-sm font-semibold">Professor Léon</p>
          <p className="text-xs text-gray-500">
            AI tutoring session{timeLabel ? ` · ${timeLabel}` : ""}
          </p>
        </div>
        <button
          onClick={onEnd}
          disabled={ending}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 disabled:opacity-60"
        >
          {ending ? <Loader2 className="w-4 h-4 animate-spin" /> : <PhoneOff className="w-4 h-4" />}
          End session
        </button>
      </div>

      {/* Leon + captions */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-xl mx-auto px-4 flex flex-col items-center text-center">
          <button
            onClick={isSpeaking ? interrupt : undefined}
            className="mt-2 rounded-full focus:outline-none"
            aria-label={isSpeaking ? "Interrupt Professor Léon" : "Professor Léon"}
          >
            <Leon language={language} mood={mood} size={220} />
          </button>

          <p className="mt-3 text-sm font-medium text-gray-500" aria-live="polite">
            {status}
          </p>

          {studentLine && (
            <p className="mt-6 text-sm text-gray-500 italic">&ldquo;{studentLine}&rdquo;</p>
          )}

          {tutorLine && (
            <p className="mt-3 text-xl leading-relaxed font-medium text-gray-900">
              {tutorLine}
              {tutorStreaming && (
                <span className="inline-block w-1.5 h-5 -mb-0.5 ml-1 bg-gray-400 animate-pulse rounded-sm" />
              )}
            </p>
          )}

          {corrections.length > 0 && (
            <div className="mt-4 w-full rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-left space-y-1">
              {corrections.slice(0, 3).map((c, i) => (
                <p key={i} className="text-sm">
                  <span className="line-through text-amber-700/70">{c.original}</span>{" "}
                  <span className="text-amber-700">→</span>{" "}
                  <span className="font-semibold text-amber-900">{c.corrected}</span>
                </p>
              ))}
            </div>
          )}

          {error && !outOfTime && <p className="mt-4 text-sm text-red-600">{error}</p>}

          {outOfTime && <div className="mt-6 w-full">{outOfTimePanel}</div>}

          {!recorder.supported && (
            <p className="mt-6 text-sm text-gray-500">
              Your browser can&apos;t record audio. End the session to type to Professor Léon instead.
            </p>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="pb-8 pt-4 flex items-center justify-center gap-6">
        {isSpeaking ? (
          <button
            onClick={interrupt}
            className="w-20 h-20 rounded-full bg-gray-900 text-white flex items-center justify-center shadow-lg"
            aria-label="Interrupt Professor Léon"
          >
            <Hand className="w-8 h-8" />
          </button>
        ) : (
          <button
            onClick={togglePause}
            disabled={outOfTime || ending || isLoading || isTranscribing}
            className={`relative w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-colors disabled:opacity-50 ${
              recorder.isRecording ? "bg-red-500 text-white" : "bg-white text-gray-900 border border-gray-200"
            }`}
            aria-label={recorder.isRecording ? "Pause listening" : "Start talking"}
          >
            {recorder.isRecording && (
              <span
                className="absolute inset-0 rounded-full bg-red-400/40"
                style={{ transform: `scale(${1 + recorder.level * 0.5})` }}
              />
            )}
            {recorder.isRecording ? (
              <Pause className="relative w-8 h-8" />
            ) : (
              <Mic className="relative w-8 h-8" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}
