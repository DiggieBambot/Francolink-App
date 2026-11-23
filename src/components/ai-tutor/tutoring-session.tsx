"use client";

// The voice-first AI tutoring session: a class with Professor Léon.
//
// Hands-free turn-taking, built on the same pipeline as the chat (record →
// transcribe → streamed reply → spoken sentence by sentence):
//   - Léon finishes speaking → the mic opens on its own
//   - the student talks → ~0.85 s of silence ends the turn, and Léon answers
//     at once with a short "Mm-hm" so there is no dead air while he thinks
//   - nobody speaks for 10 s → the session pauses (no mic left open)
//   - tap while Léon speaks → he stops and it's the student's turn
// Léon's own voice is never used as a trigger, so speakers can't make him
// interrupt himself.
//
// Around that: Léon (the animation library in ./leon) lip-syncs to each
// sentence from its text and his live voice, nods along while the student
// talks, reacts to corrections and good answers; a comic speech bubble shows
// what he's saying word by word; and a class board collects the corrections.

import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, Pause, PhoneOff, Hand, Loader2, NotebookPen, ChevronUp } from "lucide-react";
import { Leon, LeonSpeechBubble, leonPalette, type LeonMood, type VoiceBands } from "@/components/ai-tutor/leon";
import type { NowPlaying } from "@/hooks/use-tutor-tts";

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
const END_OF_TURN_MS = 850;
/** No speech at all for this long pauses the session. */
const NO_SPEECH_PAUSE_MS = 10_000;
/** Beat between Léon finishing and the mic opening. */
const LISTEN_DELAY_MS = 250;

/** What Léon says the instant a student finishes, before his real reply. */
const ACKS: Record<string, string[]> = {
  fr: ["Mm-hm…", "D'accord…", "Ah, je vois…"],
  es: ["Mm-hm…", "Vale…", "Ah, ya veo…"],
  en: ["Mm-hm…", "Okay…", "I see…"],
};

export function TutoringSession({
  language,
  mood,
  studentLine,
  tutorLine,
  tutorStreaming,
  board,
  isLoading,
  isTranscribing,
  isSpeaking,
  nowPlaying,
  voiceLevel,
  voiceBands,
  recorder,
  prefetchClip,
  playClip,
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
  /** Every correction from this session, oldest first. */
  board: Correction[];
  isLoading: boolean;
  isTranscribing: boolean;
  isSpeaking: boolean;
  nowPlaying: NowPlaying | null;
  voiceLevel: React.MutableRefObject<number>;
  /** His voice's frequency bands, for mouth shapes that follow the sound. */
  voiceBands?: React.MutableRefObject<VoiceBands>;
  recorder: Recorder;
  prefetchClip: (text: string) => Promise<Blob | null>;
  playClip: (audio: Promise<Blob | null>, text?: string) => void;
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
  const [boardOpen, setBoardOpen] = useState(false);
  const palette = leonPalette(language);

  // Only failures while this session is open count, not ones from before it.
  const initialPauseKey = useRef(pauseKey);
  useEffect(() => {
    if (pauseKey !== initialPauseKey.current) setPaused(true);
  }, [pauseKey]);

  // ── Acknowledgement clips, fetched once so they play instantly ────────────
  const acksRef = useRef<Promise<Blob | null>[]>([]);
  useEffect(() => {
    acksRef.current = (ACKS[language] ?? ACKS.en).map((t) => prefetchClip(t));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);
  const ackIndex = useRef(0);
  const acknowledge = () => {
    const clips = acksRef.current;
    if (!clips.length) return;
    // Mostly "Mm-hm", sometimes a word, never the same twice in a row.
    ackIndex.current = (ackIndex.current + 1 + Math.floor(Math.random() * (clips.length - 1))) % clips.length;
    playClip(clips[ackIndex.current], "");
  };

  // A clip with no text is an acknowledgement, not Léon's real reply.
  const leonTalking = isSpeaking && !!nowPlaying?.text;
  const acking = isSpeaking && !nowPlaying?.text;

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
  const micLevel = useRef(0);
  micLevel.current = recorder.level;
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
      if (micLevel.current >= SPEECH_LEVEL) {
        if (!speechAt) {
          speechAt = now;
          setHeard(true);
        }
        lastLoud = now;
      }
      if (speechAt && now - lastLoud > END_OF_TURN_MS) {
        clearInterval(iv);
        recorder.stop(); // sends the turn
        acknowledge();
      } else if (!speechAt && now - startedAt > NO_SPEECH_PAUSE_MS) {
        clearInterval(iv);
        recorder.cancel();
        setPaused(true);
      }
    }, 80);
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
  else if (ending) status = "Wrapping up your class…";
  else if (leonTalking) status = "Tap Professor Léon to interrupt";
  else if (acking || isTranscribing || isLoading) status = "Professor Léon is thinking…";
  else if (recorder.isRecording) status = heard ? "Listening…" : "Your turn, just start talking";
  else if (paused) status = error ? "Paused · tap the mic to try again" : "Paused · tap the mic to talk";
  else status = "Getting ready…";

  const boardPanel = (
    <ClassBoard items={board} />
  );

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col text-gray-900"
      style={{ background: `radial-gradient(120% 70% at 50% 0%, ${palette.bg} 0%, #ffffff 65%)` }}
      role="dialog"
      aria-label="AI tutoring session with Professor Léon"
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 max-w-5xl w-full mx-auto">
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
          End class
        </button>
      </div>

      <div className="flex-1 min-h-0 w-full max-w-5xl mx-auto px-4 grid md:grid-cols-[1fr_300px] gap-6">
        {/* Léon and his speech bubble */}
        <div className="min-h-0 overflow-y-auto flex flex-col items-center text-center">
          {/* Room is kept for the bubble so Léon doesn't jump as it changes;
              it grows upward from just above his head. */}
          <div className="w-full max-w-xl min-h-[6.5rem] md:min-h-[7.5rem] flex flex-col justify-end pt-1 pb-5">
            <LeonSpeechBubble
              language={language}
              text={tutorLine}
              speech={leonTalking ? nowPlaying : null}
              streaming={tutorStreaming && !leonTalking}
              tailX="46%"
            />
          </div>
          <button
            onClick={leonTalking ? interrupt : undefined}
            className="rounded-full focus:outline-none"
            aria-label={leonTalking ? "Interrupt Professor Léon" : "Professor Léon"}
          >
            <div className="w-[200px] h-[200px] md:w-[260px] md:h-[260px]">
              <Leon
                language={language}
                mood={mood}
                size={260}
                className="w-full h-full"
                voiceLevel={voiceLevel}
                voiceBands={voiceBands}
                micLevel={micLevel}
                speech={leonTalking ? nowPlaying : null}
              />
            </div>
          </button>

          <p className="mt-2 text-sm font-medium text-gray-500" aria-live="polite">
            {status}
          </p>

          {studentLine && (
            <p className="mt-5 text-sm text-gray-500 italic max-w-xl">&ldquo;{studentLine}&rdquo;</p>
          )}

          {/* On phones the latest correction shows inline; the board is a sheet. */}
          {board.length > 0 && (
            <div className="md:hidden mt-4 w-full max-w-xl rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-left">
              <CorrectionLine c={board[board.length - 1]} />
            </div>
          )}

          {error && !outOfTime && <p className="mt-4 text-sm text-red-600">{error}</p>}

          {outOfTime && <div className="mt-6 w-full max-w-xl">{outOfTimePanel}</div>}

          {!recorder.supported && (
            <p className="mt-6 text-sm text-gray-500">
              Your browser can&apos;t record audio. End the class to type to Professor Léon instead.
            </p>
          )}
        </div>

        {/* Class board (desktop) */}
        <div className="hidden md:block min-h-0 overflow-y-auto pb-4">{boardPanel}</div>
      </div>

      {/* Controls */}
      <div className="relative pb-8 pt-4 flex items-center justify-center gap-6">
        {leonTalking ? (
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
            disabled={outOfTime || ending || isLoading || isTranscribing || acking}
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

        {/* Board toggle (phones) */}
        {board.length > 0 && (
          <button
            onClick={() => setBoardOpen((v) => !v)}
            className="md:hidden absolute right-4 bottom-10 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1F3B2D] text-white text-xs font-semibold shadow"
          >
            <NotebookPen className="w-4 h-4" /> Board ({board.length})
            <ChevronUp className={`w-3.5 h-3.5 transition-transform ${boardOpen ? "rotate-180" : ""}`} />
          </button>
        )}
      </div>

      {/* Class board sheet (phones) */}
      {boardOpen && (
        <div className="md:hidden absolute inset-x-0 bottom-0 max-h-[60%] overflow-y-auto rounded-t-3xl shadow-2xl bg-white p-4">
          <button onClick={() => setBoardOpen(false)} className="mx-auto mb-3 block h-1.5 w-12 rounded-full bg-gray-300" aria-label="Close board" />
          {boardPanel}
        </div>
      )}
    </div>
  );
}

function CorrectionLine({ c }: { c: Correction }) {
  return (
    <p className="text-sm">
      <span className="line-through opacity-60">{c.original}</span>{" "}
      <span className="opacity-70">→</span> <span className="font-semibold">{c.corrected}</span>
    </p>
  );
}

/** A chalkboard of everything Léon corrected in this class. */
function ClassBoard({ items }: { items: Correction[] }) {
  return (
    <div className="rounded-2xl bg-[#1F3B2D] text-[#F3F1E7] p-4 shadow-inner border-4 border-[#8B6B4A] min-h-[200px]">
      <p className="text-xs uppercase tracking-widest text-[#F3F1E7]/60 flex items-center gap-1.5">
        <NotebookPen className="w-3.5 h-3.5" /> Class board
      </p>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-[#F3F1E7]/60">
          Corrections from today&apos;s class will appear here. They&apos;re in your recap too.
        </p>
      ) : (
        <ul className="mt-3 space-y-3">
          {items.map((c, i) => (
            <li key={i} className="font-[cursive] leading-snug">
              <CorrectionLine c={c} />
              {c.explanation && (
                <p className="text-xs mt-0.5 text-[#F3F1E7]/70 font-sans">{c.explanation}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
