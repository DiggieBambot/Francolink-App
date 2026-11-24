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

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  Mic,
  Pause,
  PhoneOff,
  Hand,
  Loader2,
  NotebookPen,
  ChevronUp,
  BookOpen,
  RotateCcw,
  Languages,
  Lightbulb,
  LifeBuoy,
  Keyboard,
  Send,
  Volume2,
  Settings2,
  Check,
  X,
  Target,
} from "lucide-react";
import { Leon, LeonSpeechBubble, leonPalette, type LeonMood, type VoiceBands } from "@/components/ai-tutor/leon";
import { ClassLesson as LessonOnScreen } from "@/components/ai-tutor/class-lesson";
import type { NowPlaying } from "@/hooks/use-tutor-tts";
import { markSaid, type WordMark } from "@/lib/ai/say-again";
import type { SupportLevel, CorrectionStyle } from "@/lib/ai/tutor-coach";

/** A role-play mission Léon offers (for languages without prepared lessons). */
export interface MissionCard {
  id: string;
  title: string;
  emoji: string;
  goal: string;
  objectives: string[];
  level: string;
}

/** Something Léon wrote on the board: a rule, a contrast, key phrases. */
export interface BoardNote {
  title: string;
  lines: string[];
}

interface Hint {
  text: string;
  en?: string;
}

/** Levels at which reply suggestions show without asking. */
const HINTS_UP_FRONT = new Set(["A1", "A2", "B1"]);

/** A live-class lesson Léon offers at the start of a class. */
export interface ClassTopicOption {
  id: string;
  title: string;
  translation: string | null;
  level: string;
  minutes: number | null;
  /** Set on the unfinished lesson from a previous class. */
  sectionIndex?: number;
  totalSections?: number;
}

export interface ClassLesson {
  /** Set by the server for lessons from the live-class programme. */
  id?: string;
  title: string;
  sectionIndex: number;
  totalSections: number;
  finished: boolean;
}

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
/** Loud time needed before it counts as the student talking (not a click or a cough). */
const MIN_SPEECH_MS = 240;
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

const WIDE = "(min-width: 768px)";
function subscribeWide(cb: () => void) {
  const m = window.matchMedia(WIDE);
  m.addEventListener("change", cb);
  return () => m.removeEventListener("change", cb);
}
/** Desktop layout (md and up), for the one prop CSS can't switch. */
function useWide(): boolean {
  return useSyncExternalStore(subscribeWide, () => window.matchMedia(WIDE).matches, () => true);
}

export function TutoringSession({
  language,
  mood,
  studentLine,
  tutorLine,
  tutorStreaming,
  tutorTranslation = null,
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
  topics = [],
  resume = null,
  onPickTopic,
  lesson = null,
  lessonAnswers,
  onLessonStep,
  onLessonCheck,
  level = "A1",
  hints = [],
  onSend,
  onHelp,
  onSpeak,
  missions = [],
  onPickMission,
  mission = null,
  notes = [],
  support = "balanced",
  onSupport,
  correctionStyle = "all",
  onCorrectionStyle,
  unsure = null,
  onUnsure,
}: {
  language: string;
  mood: LeonMood;
  studentLine: string | null;
  tutorLine: string | null;
  tutorStreaming: boolean;
  /** His reply in the student's own language, shown small under the bubble. */
  tutorTranslation?: string | null;
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
  /** Lessons offered for today's class, until one is chosen. */
  topics?: ClassTopicOption[];
  resume?: ClassTopicOption | null;
  onPickTopic?: (topic: ClassTopicOption) => void;
  /** The lesson being taught, once chosen. */
  lesson?: ClassLesson | null;
  /** The student's answers in the on-screen exercises, by exercise anchor. */
  lessonAnswers?: React.MutableRefObject<Record<string, unknown>>;
  /** The student moved to another step of the lesson on screen. */
  onLessonStep?: (index: number) => void;
  /** The student asked Léon to check their on-screen answers. */
  onLessonCheck?: () => void;
  /** The student's CEFR level (hints show up front at A1–B1). */
  level?: string;
  /** Replies the student could give to what Léon just asked. */
  hints?: Hint[];
  /** Send a typed or tapped message as the student's turn. */
  onSend?: (text: string) => void;
  /** "Help me": Léon explains what he asked in the student's language. */
  onHelp?: () => void;
  /** Say a phrase aloud (hint chips, the "say it again" sentence). */
  onSpeak?: (text: string) => void;
  /** Role-play missions offered for today's class, until one is chosen. */
  missions?: MissionCard[];
  onPickMission?: (m: MissionCard) => void;
  /** The mission in progress and the objectives met so far. */
  mission?: (MissionCard & { met: number[] }) | null;
  /** What Léon wrote on the board this class. */
  notes?: BoardNote[];
  support?: SupportLevel;
  onSupport?: (v: SupportLevel) => void;
  correctionStyle?: CorrectionStyle;
  onCorrectionStyle?: (v: CorrectionStyle) => void;
  /** A transcript the recogniser was unsure of, waiting for a yes/no. */
  unsure?: string | null;
  onUnsure?: (send: boolean) => void;
}) {
  const [paused, setPaused] = useState(false);
  // Paused because nobody spoke for a while (not by the student): Léon offers help.
  const [idle, setIdle] = useState(false);
  const [boardOpen, setBoardOpen] = useState(false);
  const [hintsOpen, setHintsOpen] = useState(false);
  const [typing, setTyping] = useState(false);
  const [draft, setDraft] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);

  // While a class is open, the page's background polling (notifications) waits.
  useEffect(() => {
    document.body.dataset.leonClass = "1";
    return () => {
      delete document.body.dataset.leonClass;
    };
  }, []);

  // New suggestions for each question: closed again unless shown up front.
  const hintKey = hints.map((h) => h.text).join("|");
  useEffect(() => {
    setHintsOpen(false);
  }, [hintKey]);

  // ── "Say it again" ───────────────────────────────────────────────────────
  // After a correction, the student's next attempt is checked word by word.
  const [sayAgain, setSayAgain] = useState<{
    target: string;
    before: string | null;
    marks: WordMark[] | null;
    score: number;
  } | null>(null);
  const boardCount = board.length;
  const lastCorrected = board[board.length - 1]?.corrected ?? null;
  const studentLineRef = useRef(studentLine);
  useEffect(() => {
    studentLineRef.current = studentLine;
  });
  useEffect(() => {
    if (!boardCount || !lastCorrected || correctionStyle === "fluency") {
      setSayAgain(null);
      return;
    }
    setSayAgain({ target: lastCorrected, before: studentLineRef.current, marks: null, score: 0 });
  }, [boardCount, lastCorrected, correctionStyle]);
  useEffect(() => {
    setSayAgain((s) => {
      if (!s || !studentLine || studentLine === s.before) return s;
      // Already scored: the next turn after that closes the card.
      if (s.marks) return null;
      const { marks, score } = markSaid(s.target, studentLine);
      return { ...s, marks, score };
    });
  }, [studentLine]);
  // Small translation under Léon's bubble, on unless the student turns it off.
  const [showTranslation, setShowTranslation] = useState(true);
  useEffect(() => {
    try {
      if (localStorage.getItem("leon-translation") === "off") setShowTranslation(false);
    } catch {
      /* private mode: keep the default */
    }
  }, []);
  const toggleTranslation = () =>
    setShowTranslation((v) => {
      try {
        localStorage.setItem("leon-translation", v ? "off" : "on");
      } catch {
        /* not remembered, still toggled */
      }
      return !v;
    });
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
    if (paused || typing || unsure || outOfTime || ending || busy || recorder.isRecording || !recorder.supported) return;
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
  }, [paused, typing, unsure, outOfTime, ending, busy, recorder.isRecording, recorder.supported]);

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
    let loudMs = 0;
    const iv = setInterval(() => {
      const now = Date.now();
      if (micLevel.current >= SPEECH_LEVEL) {
        loudMs += 80;
        lastLoud = now;
        // A click, a cough or a door is not the student's turn.
        if (!speechAt && loudMs >= MIN_SPEECH_MS) {
          speechAt = now;
          setHeard(true);
        }
      } else if (!speechAt && now - lastLoud > 600) {
        loudMs = 0;
      }
      if (speechAt && now - lastLoud > END_OF_TURN_MS) {
        clearInterval(iv);
        recorder.stop(); // sends the turn
        acknowledge();
      } else if (!speechAt && now - startedAt > NO_SPEECH_PAUSE_MS) {
        clearInterval(iv);
        recorder.cancel();
        setPaused(true);
        setIdle(true);
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
    setIdle(false);
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
    setIdle(false);
  };

  // A typed or tapped reply is the student's turn, like speaking.
  const sendText = (text: string) => {
    const t = text.trim();
    if (!t || !onSend) return;
    if (recorder.isRecording) recorder.cancel();
    if (isSpeaking) onInterrupt();
    setIdle(false);
    setPaused(false);
    setDraft("");
    onSend(t);
  };
  const help = () => {
    if (!onHelp) return;
    if (recorder.isRecording) recorder.cancel();
    setIdle(false);
    setPaused(false);
    onHelp();
  };
  const openTyping = () => {
    if (recorder.isRecording) recorder.cancel();
    setTyping(true);
  };

  // A tap on the lesson is the student's turn: stop listening, hand it to
  // Léon, and listen again once he has answered.
  const lessonTap = (fn: () => void) => {
    if (recorder.isRecording) recorder.cancel();
    if (isSpeaking) onInterrupt();
    setPaused(false);
    fn();
  };
  const showLesson = !!(lesson?.id && lessonAnswers && onLessonStep && onLessonCheck);
  const wide = useWide();

  // ── Status line ──────────────────────────────────────────────────────────
  let status: string;
  if (outOfTime) status = "Out of tutoring time";
  else if (ending) status = "Wrapping up your class…";
  else if (leonTalking) status = "Tap Professor Léon to interrupt";
  else if (acking || isTranscribing || isLoading) status = "Professor Léon is thinking…";
  else if (recorder.isRecording) status = heard ? "Listening…" : "Your turn, just start talking";
  else if (unsure) status = "Did Léon hear you right?";
  else if (typing) status = "Type your answer below";
  else if (paused && idle && !error) status = "Take your time. Need a hint?";
  else if (paused) status = error ? "Paused · tap the mic to try again" : "Paused · tap the mic to talk";
  else status = "Getting ready…";

  const boardPanel = (
    <ClassBoard items={board} lesson={lesson} mission={mission} notes={notes} />
  );
  const boardCountAll = board.length + notes.length + (mission ? 1 : 0);

  const showHints =
    !leonTalking && !isLoading && hints.length > 0 && (HINTS_UP_FRONT.has(level) || hintsOpen || idle);

  // Under Léon: everything that helps a student who is stuck or can't talk.
  const helpers = (
    <div className="w-full max-w-xl mt-3 space-y-2 text-left">
      {unsure && onUnsure && (
        <div className="rounded-2xl border border-gray-200 bg-white px-3 py-2.5 shadow-sm">
          <p className="text-sm text-gray-700">
            Did you say <span className="font-semibold text-gray-900">&ldquo;{unsure}&rdquo;</span>?
          </p>
          <div className="mt-2 flex gap-2">
            <button
              onClick={() => onUnsure(true)}
              className="inline-flex items-center gap-1 rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white"
            >
              <Check className="w-3.5 h-3.5" /> Yes, send it
            </button>
            <button
              onClick={() => onUnsure(false)}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
            >
              <X className="w-3.5 h-3.5" /> No, that wasn&apos;t me
            </button>
          </div>
        </div>
      )}

      {sayAgain && !leonTalking && (
        <div
          className={`rounded-2xl border px-3 py-2.5 ${
            sayAgain.marks
              ? sayAgain.score >= 0.85
                ? "border-green-200 bg-green-50"
                : "border-amber-200 bg-amber-50"
              : "border-gray-200 bg-white"
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              {sayAgain.marks
                ? sayAgain.score >= 0.85
                  ? "Nailed it 🎉"
                  : `Léon heard ${sayAgain.marks.filter((m) => m.ok).length} of ${sayAgain.marks.length} words`
                : "Say it again"}
            </p>
            {onSpeak && (
              <button
                onClick={() => onSpeak(sayAgain.target)}
                className="p-1 rounded text-gray-500 hover:text-gray-900"
                aria-label="Hear the corrected sentence"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            )}
          </div>
          <p className="mt-0.5 text-base font-medium leading-snug">
            {sayAgain.marks
              ? sayAgain.marks.map((m, i) => (
                  <span key={i} className={m.ok ? "text-green-700" : "text-amber-700 underline decoration-dotted"}>
                    {m.word}{" "}
                  </span>
                ))
              : sayAgain.target}
          </p>
        </div>
      )}

      {showHints && (
        <div>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400 flex items-center gap-1">
            <Lightbulb className="w-3 h-3" /> You could say · tap to answer
          </p>
          <div className="flex flex-col gap-1.5">
            {hints.map((h, i) => (
              <div key={i} className="flex items-stretch gap-1">
                <button
                  onClick={() => sendText(h.text)}
                  disabled={!onSend || isLoading}
                  className="flex-1 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-left hover:border-gray-400 disabled:opacity-60"
                >
                  <span className="block text-sm text-gray-900">{h.text}</span>
                  {h.en && <span className="block text-xs text-gray-500">{h.en}</span>}
                </button>
                {onSpeak && (
                  <button
                    onClick={() => onSpeak(h.text)}
                    className="px-2 rounded-xl text-gray-400 hover:text-gray-900 hover:bg-white"
                    aria-label="Hear this"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {typing && onSend && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendText(draft);
          }}
          className="flex items-center gap-2"
        >
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Type your answer…"
            className="flex-1 rounded-xl border border-gray-300 bg-white px-3 py-2 text-base md:text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10"
          />
          <button
            type="submit"
            disabled={!draft.trim() || isLoading}
            className="rounded-xl bg-gray-900 p-2.5 text-white disabled:opacity-50"
            aria-label="Send"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      )}

      {!outOfTime && !ending && (
        <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
          {hints.length > 0 && !showHints && !leonTalking && (
            <button onClick={() => setHintsOpen(true)} className={CHIP}>
              <Lightbulb className="w-3.5 h-3.5" /> Hints
            </button>
          )}
          {onHelp && (
            <button onClick={help} disabled={isLoading || acking} className={CHIP}>
              <LifeBuoy className="w-3.5 h-3.5" /> Help me
            </button>
          )}
          {onSend && (
            <button
              onClick={() => (typing ? setTyping(false) : openTyping())}
              className={CHIP}
              aria-pressed={typing}
            >
              {typing ? <Mic className="w-3.5 h-3.5" /> : <Keyboard className="w-3.5 h-3.5" />}
              {typing ? "Talk instead" : "Type instead"}
            </button>
          )}
        </div>
      )}
    </div>
  );

  const missionOffers = !lesson && !mission && missions.length > 0 && onPickMission && (
    <div className="mt-5 w-full max-w-xl text-left">
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
        Today&apos;s mission · say it or tap it
      </p>
      <div className="grid sm:grid-cols-3 gap-2">
        {missions.map((m) => (
          <button
            key={m.id}
            onClick={() => onPickMission(m)}
            disabled={isLoading}
            className="flex sm:flex-col items-start gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-left hover:border-gray-400 disabled:opacity-60"
          >
            <span className="text-2xl leading-none" aria-hidden>
              {m.emoji}
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-gray-900">{m.title}</span>
              <span className="block text-xs text-gray-500">{m.goal}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div
      // z-[100]: above the bottom nav, the AI FAB and the z-[60] prompts.
      // viewport-fit=cover is set app-wide, so a fixed full-screen layer
      // starts under the iPhone status bar / Dynamic Island, where iOS eats
      // taps — that left End class unclickable. Pad by the safe areas.
      className="fixed inset-0 z-[100] flex flex-col text-gray-900"
      style={{
        background: `radial-gradient(120% 70% at 50% 0%, ${palette.bg} 0%, #ffffff 65%)`,
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
        paddingLeft: "env(safe-area-inset-left)",
        paddingRight: "env(safe-area-inset-right)",
      }}
      role="dialog"
      aria-label="AI tutoring session with Professor Léon"
    >
      {/* Top bar */}
      <div className="shrink-0 flex items-center justify-between gap-3 px-4 py-3 max-w-5xl w-full mx-auto">
        <div className="min-w-0">
          <p className="text-sm font-semibold">Professor Léon</p>
          <p className="text-xs text-gray-500 truncate">
            {mission ? (
              <span className="inline-flex items-center gap-1 font-medium text-gray-700">
                <Target className="w-3 h-3" /> {mission.emoji} {mission.title} · {mission.met.length}/{mission.objectives.length}
              </span>
            ) : (
              "AI tutoring session"
            )}
            {timeLabel ? ` · ${timeLabel}` : ""}
          </p>
        </div>
        <div className="relative ml-auto">
          <button
            onClick={() => setSettingsOpen((v) => !v)}
            className="p-2 rounded-xl text-gray-500 hover:bg-gray-100"
            aria-label="Class settings"
            aria-expanded={settingsOpen}
          >
            <Settings2 className="w-5 h-5" />
          </button>
          {settingsOpen && (
            <div className="absolute right-0 top-11 z-10 w-72 rounded-2xl border border-gray-200 bg-white p-3 shadow-xl text-left">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">English help</p>
              <Segmented
                value={support}
                onChange={(v) => onSupport?.(v as SupportLevel)}
                options={[
                  ["more_english", "More English"],
                  ["balanced", "Balanced"],
                  ["immersion", "Immersion"],
                ]}
              />
              <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Corrections</p>
              <Segmented
                value={correctionStyle}
                onChange={(v) => onCorrectionStyle?.(v as CorrectionStyle)}
                options={[
                  ["all", "Everything"],
                  ["major", "Big ones"],
                  ["fluency", "Just talk"],
                ]}
              />
              <p className="mt-2 text-[11px] text-gray-400">Léon uses these from his next reply.</p>
            </div>
          )}
        </div>
        <button
          onClick={onEnd}
          disabled={ending}
          className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 disabled:opacity-60"
        >
          {ending ? <Loader2 className="w-4 h-4 animate-spin" /> : <PhoneOff className="w-4 h-4" />}
          End class
        </button>
      </div>

      {showLesson ? (
        <div className="flex-1 min-h-0 w-full max-w-6xl mx-auto px-3 md:px-4 flex flex-col md:grid md:grid-cols-[minmax(0,1fr)_320px] gap-2 md:gap-6">
          {/* Léon: a strip above the lesson on phones, a column beside it on desktop */}
          <div className="md:order-2 shrink-0 md:min-h-0 md:overflow-y-auto flex flex-col items-center text-center">
            {/* Phones: bubble and a small Léon side by side; desktop: stacked */}
            <div className="w-full flex items-end gap-1 md:flex-col md:items-center md:gap-0">
            <div className="flex-1 min-w-0 md:w-full shrink-0 max-h-[7.5rem] md:max-h-none overflow-y-auto pt-1 pb-3 text-left md:text-center">
            <LeonSpeechBubble
              language={language}
              text={tutorLine}
              speech={leonTalking ? nowPlaying : null}
              streaming={tutorStreaming && !leonTalking}
              translation={showTranslation ? tutorTranslation : null}
              tailX={wide ? "50%" : "88%"}
            />
            </div>
          <button
            onClick={leonTalking ? interrupt : undefined}
            className="rounded-full focus:outline-none"
            aria-label={leonTalking ? "Interrupt Professor Léon" : "Professor Léon"}
          >
            <div className="w-[76px] h-[76px] md:w-[210px] md:h-[210px]">
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

            </div>
            <p className="mt-1 text-xs md:text-sm font-medium text-gray-500" aria-live="polite">
              {status}
            </p>
            {tutorTranslation && (
              <button
                onClick={toggleTranslation}
                className="mt-1 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100"
                aria-pressed={showTranslation}
              >
                <Languages className="w-3.5 h-3.5" />
                {showTranslation ? "Hide translation" : "Show translation"}
              </button>
            )}
            {studentLine && (
              <p className="hidden md:block mt-3 text-sm text-gray-500 italic">&ldquo;{studentLine}&rdquo;</p>
            )}
            {helpers}
          {error && !outOfTime && <p className="mt-4 text-sm text-red-600">{error}</p>}

          {outOfTime && <div className="mt-6 w-full max-w-xl">{outOfTimePanel}</div>}

          {!recorder.supported && (
            <p className="mt-6 text-sm text-gray-500">
              Your browser can&apos;t record audio. End the class to type to Professor Léon instead.
            </p>
          )}
            <div className="hidden md:block mt-4 w-full text-left">{boardPanel}</div>
          </div>

          {/* The lesson, as in the live lesson room */}
          <div className="md:order-1 flex-1 min-h-0 overflow-y-auto pb-3 text-left">
            <LessonOnScreen
              lessonId={lesson!.id!}
              sectionIndex={lesson!.sectionIndex}
              answersRef={lessonAnswers!}
              onStep={(i) => lessonTap(() => onLessonStep!(i))}
              onCheck={() => lessonTap(onLessonCheck!)}
              busy={isLoading || isTranscribing || acking}
              accent={palette.dark}
            />
            {board.length > 0 && (
              <div className="md:hidden mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
                <CorrectionLine c={board[board.length - 1]} />
              </div>
            )}
          </div>
        </div>
      ) : (
      <div className="flex-1 min-h-0 w-full max-w-5xl mx-auto px-4 grid md:grid-cols-[1fr_300px] gap-6">
        {/* Léon and his speech bubble */}
        {/* Children never shrink: when the column overflows it scrolls, rather
            than squeezing the bubble (which grows upward) off the top. */}
        <div className="min-h-0 overflow-y-auto flex flex-col items-center text-center [&>*]:shrink-0">
          {/* Room is kept for the bubble so Léon doesn't jump as it changes;
              it grows upward from just above his head. */}
          <div className="w-full max-w-xl min-h-[6.5rem] md:min-h-[7.5rem] flex flex-col justify-end pt-1 pb-5">
            <LeonSpeechBubble
              language={language}
              text={tutorLine}
              speech={leonTalking ? nowPlaying : null}
              streaming={tutorStreaming && !leonTalking}
              translation={showTranslation ? tutorTranslation : null}
              tailX="46%"
            />
          </div>
          <button
            onClick={leonTalking ? interrupt : undefined}
            className="rounded-full focus:outline-none"
            aria-label={leonTalking ? "Interrupt Professor Léon" : "Professor Léon"}
          >
            {/* Shrinks on short screens so the help below him stays in view. */}
            <div className="w-[min(160px,22vh)] h-[min(160px,22vh)] md:w-[min(260px,32vh)] md:h-[min(260px,32vh)]">
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
          {tutorTranslation && (
            <button
              onClick={toggleTranslation}
              className="mt-1 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100"
              aria-pressed={showTranslation}
            >
              <Languages className="w-3.5 h-3.5" />
              {showTranslation ? "Hide translation" : "Show translation"}
            </button>
          )}

          {studentLine && (
            <p className="mt-5 text-sm text-gray-500 italic max-w-xl">&ldquo;{studentLine}&rdquo;</p>
          )}

          {missionOffers}

          {helpers}

          {!lesson && (topics.length > 0 || resume) && onPickTopic && (
            <div className="mt-6 w-full max-w-xl text-left">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                Today&apos;s lesson · say it or tap it
              </p>
              <div className="grid sm:grid-cols-2 gap-2">
                {resume && (
                  <button
                    onClick={() => onPickTopic(resume)}
                    disabled={isLoading}
                    className="sm:col-span-2 flex items-start gap-3 rounded-xl border-2 px-3 py-2.5 text-left hover:bg-gray-50 disabled:opacity-60"
                    style={{ borderColor: palette.body }}
                  >
                    <RotateCcw className="w-4 h-4 mt-0.5 shrink-0" style={{ color: palette.dark }} />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-gray-900 truncate">
                        Finish &ldquo;{resume.title}&rdquo;
                      </span>
                      <span className="block text-xs text-gray-500">
                        {resume.translation ? `${resume.translation} · ` : ""}part {(resume.sectionIndex ?? 0) + 1}
                        {resume.totalSections ? ` of ${resume.totalSections}` : ""}
                      </span>
                    </span>
                  </button>
                )}
                {topics.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => onPickTopic(t)}
                    disabled={isLoading}
                    className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-left hover:border-gray-400 disabled:opacity-60"
                  >
                    <BookOpen className="w-4 h-4 mt-0.5 shrink-0" style={{ color: palette.dark }} />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-gray-900">{t.title}</span>
                      <span className="block text-xs text-gray-500">
                        {[t.translation, t.level, t.minutes ? `${t.minutes} min` : null].filter(Boolean).join(" · ")}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* On phones the latest correction shows inline (unless the "say it
              again" card already shows it); the board is a sheet. */}
          {board.length > 0 && !sayAgain && (
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
      )}

      {/* Controls */}
      <div className={`relative flex items-center justify-center gap-6 ${showLesson ? "pb-4 pt-2" : "pb-8 pt-4"}`}>
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
        {boardCountAll > 0 && (
          <button
            onClick={() => setBoardOpen((v) => !v)}
            className="md:hidden absolute right-4 bottom-10 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1F3B2D] text-white text-xs font-semibold shadow"
          >
            <NotebookPen className="w-4 h-4" /> Board ({boardCountAll})
            <ChevronUp className={`w-3.5 h-3.5 transition-transform ${boardOpen ? "rotate-180" : ""}`} />
          </button>
        )}
      </div>

      {/* Class board sheet (phones) */}
      {boardOpen && (
        <div
          className="md:hidden absolute inset-x-0 bottom-0 max-h-[60%] overflow-y-auto rounded-t-3xl shadow-2xl bg-white p-4"
          style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
        >
          <button onClick={() => setBoardOpen(false)} className="mx-auto mb-3 block h-1.5 w-12 rounded-full bg-gray-300" aria-label="Close board" />
          {boardPanel}
        </div>
      )}
    </div>
  );
}

const CHIP =
  "inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:border-gray-400 hover:text-gray-900 disabled:opacity-50";

function Segmented({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  return (
    <div className="mt-1.5 grid grid-cols-3 gap-1 rounded-xl bg-gray-100 p-1">
      {options.map(([v, label]) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          aria-pressed={value === v}
          className={`rounded-lg px-2 py-1.5 text-xs font-medium ${
            value === v ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-800"
          }`}
        >
          {label}
        </button>
      ))}
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
function ClassBoard({
  items,
  lesson,
  mission = null,
  notes = [],
}: {
  items: Correction[];
  lesson: ClassLesson | null;
  mission?: (MissionCard & { met: number[] }) | null;
  notes?: BoardNote[];
}) {
  const done = lesson ? Math.min(lesson.sectionIndex, lesson.totalSections) : 0;
  const missionDone = !!mission && mission.met.length >= mission.objectives.length;
  return (
    <div className="rounded-2xl bg-[#1F3B2D] text-[#F3F1E7] p-4 shadow-inner border-4 border-[#8B6B4A] min-h-[200px]">
      {mission && !lesson && (
        <div className="mb-4 pb-3 border-b border-[#F3F1E7]/15">
          <p className="text-xs uppercase tracking-widest text-[#F3F1E7]/60">Today&apos;s mission</p>
          <p className="mt-1 font-[cursive] text-lg leading-snug">
            {mission.emoji} {mission.title}
          </p>
          <p className="text-xs text-[#F3F1E7]/70">{mission.goal}</p>
          <ul className="mt-2 space-y-1">
            {mission.objectives.map((o, i) => {
              const ok = mission.met.includes(i);
              return (
                <li key={i} className={`flex items-start gap-2 text-sm ${ok ? "text-[#F3F1E7]" : "text-[#F3F1E7]/60"}`}>
                  <span
                    className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                      ok ? "bg-[#9BE3A5] border-[#9BE3A5] text-[#1F3B2D]" : "border-[#F3F1E7]/40"
                    }`}
                  >
                    {ok && <Check className="w-3 h-3" />}
                  </span>
                  <span className={ok ? "line-through decoration-[#9BE3A5]/70" : ""}>{o}</span>
                </li>
              );
            })}
          </ul>
          {missionDone && <p className="mt-2 text-sm font-semibold text-[#9BE3A5]">Mission complete 🎉</p>}
        </div>
      )}
      {notes.length > 0 && (
        <div className="mb-4 pb-3 border-b border-[#F3F1E7]/15 space-y-3">
          {[...notes].reverse().map((n, i) => (
            <div key={i}>
              <p className="font-[cursive] text-base underline decoration-[#F3F1E7]/30 underline-offset-4">{n.title}</p>
              <ul className="mt-1 space-y-0.5">
                {n.lines.map((l, j) => (
                  <li key={j} className="font-[cursive] text-sm leading-snug text-[#F3F1E7]/90">
                    {l}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
      {lesson && (
        <div className="mb-4 pb-3 border-b border-[#F3F1E7]/15">
          <p className="text-xs uppercase tracking-widest text-[#F3F1E7]/60">Today&apos;s lesson</p>
          <p className="mt-1 font-[cursive] text-lg leading-snug">{lesson.title}</p>
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full bg-[#F3F1E7]/15 overflow-hidden">
              <div
                className="h-full bg-[#F3F1E7]/80 transition-all duration-500"
                style={{ width: `${lesson.totalSections ? (done / lesson.totalSections) * 100 : 0}%` }}
              />
            </div>
            <span className="text-xs text-[#F3F1E7]/70">
              {lesson.finished || done >= lesson.totalSections
                ? "Done 🎉"
                : `Part ${done + 1} of ${lesson.totalSections}`}
            </span>
          </div>
        </div>
      )}
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
