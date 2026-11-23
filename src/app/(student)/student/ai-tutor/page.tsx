"use client";
import { useTutorTTS, takeSentences } from "@/hooks/use-tutor-tts";
import { useVoiceRecorder } from "@/hooks/use-voice-recorder";
import { PLANS, formatTutoringTime } from "@/lib/config/subscription";
import { TutoringSession } from "@/components/ai-tutor/tutoring-session";
import { ExtraHoursOffer } from "@/components/ai-tutor/extra-hours-offer";
import { TappableText } from "@/components/ai-tutor/tappable-text";
import { RecapPanel, type Recap } from "@/components/ai-tutor/recap-panel";
import { Leon, leonGreeting, type LeonMood } from "@/components/ai-tutor/leon";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Send,
  Bot,
  Clock,
  Sparkles,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Crown,
  Mic,
  Square,
  X,
  Volume2,
  VolumeX,
  Languages,
  Snail,
  Lightbulb,
  Flag,
  Layers,
} from "lucide-react";

interface Correction {
  original: string;
  corrected: string;
  explanation?: string;
  tag?: string;
}

interface Hint {
  text: string;
  en?: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  /** True while the reply is still streaming in. */
  streaming?: boolean;
  /** Corrections the tutor made to the student's previous message. */
  corrections?: Correction[];
  /** English translation of the whole message, once asked for. */
  translation?: string;
  translating?: boolean;
}

interface LessonProgress {
  title: string;
  sectionIndex: number;
  totalSections: number;
  finished: boolean;
}

interface UsageData {
  hasAccess: boolean;
  tutorEnabled: boolean;
  plan: string;
  isPrivileged: boolean;
  allowed?: boolean;
  reason?: string | null;
  /** AI tutoring time in seconds; `null` caps/remaining mean unlimited. */
  time?: {
    dailyCapSeconds: number | null;
    monthlyCapSeconds: number | null;
    usedTodaySeconds: number;
    usedMonthSeconds: number;
    extraSeconds: number;
    planRemainingSeconds: number | null;
    remainingSeconds: number | null;
    limitScope: "DAY" | "MONTH" | null;
  };
  learningLanguage?: string;
  level?: string;
  /** Most recent lesson the student's human tutor covered, if any. */
  suggestedLesson?: { id: string; title: string } | null;
}

/** The greeting chip on the empty state, in the language being learned. */
const OPENERS: Record<string, string> = {
  fr: "Bonjour ! Comment allez-vous ?",
  es: "¡Hola! ¿Cómo estás?",
  en: "Hi! How are you?",
};

/** Levels at which reply suggestions are shown up front rather than on request. */
const HINTS_UP_FRONT = new Set(["A1", "A2", "B1"]);

function formatElapsed(ms: number) {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export default function AITutorPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [usageLoading, setUsageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [lesson, setLesson] = useState<LessonProgress | null>(null);
  const [hints, setHints] = useState<Hint[]>([]);
  const [hintsOpen, setHintsOpen] = useState(false);
  const [recap, setRecap] = useState<Recap | null>(null);
  const [recapLoading, setRecapLoading] = useState(false);
  // The voice-first AI tutoring session (full screen, hands-free).
  const [sessionOpen, setSessionOpen] = useState(false);
  const [showHoursOffer, setShowHoursOffer] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  // Bumped whenever a turn fails during a session: the session pauses instead
  // of re-opening the mic into the same failure over and over.
  const [sessionPauseKey, setSessionPauseKey] = useState(0);
  // Learned from the usage/chat responses, so voice and speech recognition
  // follow the student instead of assuming French at A1.
  const [learningLanguage, setLearningLanguage] = useState("fr");
  const [studentLevel, setStudentLevel] = useState("A1");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  // A short-lived reaction (tongue flick on a correction, a hop on a clean
  // answer) that overrides Leon's steady state for a moment.
  const [flashMood, setFlashMood] = useState<LeonMood | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flash = useCallback((mood: LeonMood, ms: number) => {
    if (flashTimer.current) clearTimeout(flashTimer.current);
    setFlashMood(mood);
    flashTimer.current = setTimeout(() => setFlashMood(null), ms);
  }, []);
  useEffect(
    () => () => {
      if (flashTimer.current) clearTimeout(flashTimer.current);
    },
    []
  );

  // Voice follows the student's own language and level rather than a
  // hardcoded French default.
  const tts = useTutorTTS({ language: learningLanguage, level: studentLevel });

  const fetchUsage = useCallback(async () => {
    try {
      const res = await fetch("/api/ai-tutor/usage");
      if (res.ok) {
        const data = await res.json();
        setUsage(data);
        if (data.learningLanguage) setLearningLanguage(data.learningLanguage);
        if (data.level) setStudentLevel(data.level);
      }
    } catch (err) {
      console.error("Failed to fetch AI usage:", err);
    } finally {
      setUsageLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("hours") !== "added") return;
    setNotice("Extra tutoring hours added. Enjoy your time with Leon!");
    params.delete("hours");
    const qs = params.toString();
    window.history.replaceState(null, "", window.location.pathname + (qs ? `?${qs}` : ""));
    const t = setTimeout(fetchUsage, 2500);
    return () => clearTimeout(t);
  }, [fetchUsage]);

  // Lesson mode is entered by link (?lesson=<tutor_lesson_id>) from a lesson
  // page. Read it off the URL rather than useSearchParams so the page does not
  // need a Suspense boundary.
  const [lessonId, setLessonId] = useState<string | null>(null);
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("lesson");
    if (id) setLessonId(id);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, hints]);

  // Abort an in-flight reply if the student leaves the page.
  useEffect(() => () => abortRef.current?.abort(), []);

  const patchMessage = (id: string, patch: Partial<Message>) =>
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));

  const sendMessage = async (
    override?: string,
    opts: { greet?: boolean; session?: boolean } = {}
  ) => {
    const greet = opts.greet === true;
    // Passed explicitly when opening a session, before sessionOpen has updated.
    const inSession = opts.session ?? sessionOpen;
    const trimmed = (override ?? input).trim();
    if ((!trimmed && !greet) || isLoading) return;

    // This runs inside the click, so it is the moment to unlock audio for the
    // reply that will arrive later.
    tts.unlock();
    if (!inSession) tts.stop();

    setError(null);
    setHints([]);
    setHintsOpen(false);
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmed,
      timestamp: new Date(),
    };

    if (!greet) setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    if (inputRef.current) inputRef.current.style.height = "auto";

    const assistantId = `assistant-${Date.now()}`;
    // A tutoring session is spoken by definition.
    const speakAsItArrives = autoSpeak || inSession;
    let assistantAdded = false;

    try {
      const apiMessages = (greet ? messages : [...messages, userMessage]).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      abortRef.current = new AbortController();
      const res = await fetch("/api/ai-tutor/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: apiMessages,
          conversationId,
          lessonId,
          mode: inSession ? "session" : undefined,
          greet: greet || undefined,
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        if (data.code === "LIMIT_REACHED") {
          setUsage((prev) =>
            prev && prev.time
              ? {
                  ...prev,
                  reason: data.error,
                  time: {
                    ...prev.time,
                    remainingSeconds: 0,
                    planRemainingSeconds: 0,
                    extraSeconds: 0,
                    limitScope: data.limitScope ?? prev.time.limitScope,
                  },
                }
              : prev
          );
        }
        setError(data.error || "Something went wrong. Please try again.");
        if (inSession) setSessionPauseKey((k) => k + 1);
        return;
      }

      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: "assistant", content: "", timestamp: new Date(), streaming: true },
      ]);
      assistantAdded = true;

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let lineBuf = "";
      let text = "";
      let speechBuf = "";
      let finished = false;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const handle = (ev: any) => {
        if (ev.t === "start") {
          if (ev.conversationId) setConversationId(ev.conversationId);
        } else if (ev.t === "delta") {
          text += ev.text;
          patchMessage(assistantId, { content: text });
          if (speakAsItArrives) {
            speechBuf += ev.text;
            const { sentences, rest } = takeSentences(speechBuf);
            speechBuf = rest;
            sentences.forEach((s) => tts.enqueue(s, { id: assistantId }));
          }
        } else if (ev.t === "done") {
          finished = true;
          patchMessage(assistantId, {
            content: ev.reply || text,
            streaming: false,
            corrections: ev.corrections?.length ? ev.corrections : undefined,
          });
          if (speakAsItArrives && speechBuf.trim()) {
            tts.enqueue(speechBuf, { id: assistantId });
            speechBuf = "";
          }
          if (ev.corrections?.length) flash("correcting", 2400);
          else if (trimmed.split(/\s+/).length >= 4) flash("celebrating", 1800);
          setHints(Array.isArray(ev.hints) ? ev.hints : []);
          if (ev.conversationId) setConversationId(ev.conversationId);
          if (ev.lesson) setLesson(ev.lesson);
          if (ev.level) setStudentLevel(ev.level);
          // Refresh the time left (today, this month, extra) after each turn.
          if (ev.remainingSeconds !== undefined) void fetchUsage();
        } else if (ev.t === "error") {
          if (inSession) setSessionPauseKey((k) => k + 1);
          setError(ev.error || "Something went wrong. Please try again.");
        }
      };

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        lineBuf += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = lineBuf.indexOf("\n")) >= 0) {
          const line = lineBuf.slice(0, nl).trim();
          lineBuf = lineBuf.slice(nl + 1);
          if (!line) continue;
          try {
            handle(JSON.parse(line));
          } catch {
            /* ignore a malformed line */
          }
        }
      }

      if (!finished) {
        // Stream ended early: keep whatever arrived, drop an empty bubble.
        if (text.trim()) patchMessage(assistantId, { streaming: false });
        else setMessages((prev) => prev.filter((m) => m.id !== assistantId));
      }
    } catch (err) {
      if ((err as Error)?.name === "AbortError") return;
      setError("Network error. Please check your connection and try again.");
      if (assistantAdded) {
        setMessages((prev) =>
          prev.filter((m) => !(m.id === assistantId && !m.content.trim()))
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  // The recorder callback outlives renders; always call the latest sendMessage.
  const sendRef = useRef(sendMessage);
  useEffect(() => {
    sendRef.current = sendMessage;
  });

  const transcribe = useCallback(
    async (file: File) => {
      setIsTranscribing(true);
      setError(null);
      try {
        const form = new FormData();
        form.append("audio", file);
        form.append("language", learningLanguage);
        const res = await fetch("/api/ai-tutor/transcribe", { method: "POST", body: form });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Couldn't hear that. Please try again.");
          setSessionPauseKey((k) => k + 1);
          return;
        }
        if (!data.text) {
          setError("I didn't catch anything — try again a little closer to the mic.");
          return;
        }
        await sendRef.current(data.text);
      } catch {
        setError("Couldn't hear that. Please try again.");
        setSessionPauseKey((k) => k + 1);
      } finally {
        setIsTranscribing(false);
      }
    },
    [learningLanguage]
  );

  const recorder = useVoiceRecorder({
    onRecorded: transcribe,
    onError: (msg) => setError(msg),
  });

  const toggleRecording = () => {
    if (recorder.isRecording) {
      recorder.stop();
      return;
    }
    // The click is also the audio-unlock gesture for the reply to come.
    tts.unlock();
    tts.stop();
    setError(null);
    void recorder.start();
  };

  const toggleSpeak = (msg: Message, slow = false) => {
    tts.unlock();
    if (tts.speakingId === msg.id && !slow) {
      tts.stop();
      return;
    }
    tts.speak(msg.content, { id: msg.id, slow });
  };

  const sayPhrase = (text: string) => {
    tts.unlock();
    tts.speak(text, { id: `phrase-${text}` });
  };

  const toggleTranslation = async (msg: Message) => {
    if (msg.translation !== undefined) {
      patchMessage(msg.id, { translation: undefined });
      return;
    }
    patchMessage(msg.id, { translating: true });
    try {
      const res = await fetch("/api/ai-tutor/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: msg.content, mode: "message" }),
      });
      const data = await res.json();
      patchMessage(msg.id, {
        translating: false,
        translation: res.ok ? data.translation : "Translation unavailable.",
      });
    } catch {
      patchMessage(msg.id, { translating: false, translation: "Translation unavailable." });
    }
  };

  const endSession = async () => {
    if (!conversationId) return;
    tts.stop();
    setRecapLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai-tutor/recap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Couldn't build your recap.");
        return;
      }
      setRecap(data.recap);
      flash("celebrating", 2500);
    } catch {
      setError("Couldn't build your recap.");
    } finally {
      setRecapLoading(false);
    }
  };

  const startTutoringSession = () => {
    // This click is the audio-unlock gesture for everything Leon says.
    tts.unlock();
    tts.stop();
    setError(null);
    setNotice(null);
    setSessionOpen(true);
    // A fresh class: Professor Léon welcomes the student before they speak.
    if (messages.length === 0) void sendMessage(undefined, { greet: true, session: true });
  };

  const endTutoringSession = async () => {
    recorder.cancel();
    tts.stop();
    const turns = messages.filter((m) => m.role === "user").length;
    // Long enough for a recap: build it, then show it in place of the session.
    if (conversationId && turns >= 2) await endSession();
    setSessionOpen(false);
  };

  const newSession = () => {
    tts.stop();
    setRecap(null);
    setMessages([]);
    setConversationId(null);
    setLesson(null);
    setLessonId(null);
    setHints([]);
    setError(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const isLimitReached =
    !!usage?.time && usage.time.remainingSeconds !== null && usage.time.remainingSeconds <= 0;
  const noAccess = usage && !usage.hasAccess;
  const studentTurns = messages.filter((m) => m.role === "user").length;
  const canEnd = !!conversationId && studentTurns >= 2 && !isLoading;
  const hintsVisible = hints.length > 0 && (HINTS_UP_FRONT.has(studentLevel) || hintsOpen);

  // Loading state
  if (usageLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-3" />
          <p className="text-gray-500">Loading AI Tutor...</p>
        </div>
      </div>
    );
  }

  // Tutor switched off from the admin panel
  if (usage && !usage.tutorEnabled && !usage.isPrivileged) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bot className="w-8 h-8 text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            AI Tutor Unavailable
          </h1>
          <p className="text-gray-600 mb-6">
            The AI Tutor is temporarily switched off. Please check back soon —
            your monthly allowance is untouched.
          </p>
          <Link
            href="/dashboard"
            className="block w-full bg-primary text-white font-medium py-3 rounded-xl hover:bg-primary/90 transition-colors text-center"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // No access (free user)
  if (noAccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Crown className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Premium Feature</h1>
          <p className="text-gray-600 mb-6">
            AI tutoring sessions with Leon come with Premium and Premium Plus. Speak
            out loud, get gentle corrections, and build real conversation skills.
          </p>
          <div className="space-y-3">
            <div className="bg-gray-50 rounded-xl p-4 text-left">
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium text-gray-900">Premium</span>
                <span className="text-primary font-bold">
                  {formatTutoringTime(PLANS.PREMIUM.aiMonthlyMinutes * 60)}/month
                </span>
              </div>
              <p className="text-sm text-gray-500">
                Up to {PLANS.PREMIUM.aiDailyMinutes} min of AI tutoring a day
              </p>
            </div>
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-left">
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium text-gray-900">Premium Plus</span>
                <span className="text-primary font-bold">
                  {formatTutoringTime(PLANS.PREMIUM_PLUS.aiMonthlyMinutes * 60)}/month
                </span>
              </div>
              <p className="text-sm text-gray-500">
                Up to {PLANS.PREMIUM_PLUS.aiDailyMinutes} min of AI tutoring a day
              </p>
            </div>
          </div>
          <div className="mt-6 space-y-2">
            <Link
              href="/upgrade-plus"
              className="block w-full bg-primary text-white font-medium py-3 rounded-xl hover:bg-primary/90 transition-colors text-center"
            >
              Upgrade Now
            </Link>
            <Link
              href="/dashboard"
              className="block w-full text-gray-500 hover:text-gray-700 py-2 text-sm text-center"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const time = usage?.time;
  const isUnlimited = !time || time.remainingSeconds === null;
  const planLeft = time?.planRemainingSeconds ?? 0;
  const extraLeft = time?.extraSeconds ?? 0;
  const displayLimit = isUnlimited
    ? "Unlimited"
    : planLeft > 0
      ? `${formatTutoringTime(planLeft)} left today`
      : extraLeft > 0
        ? `${formatTutoringTime(extraLeft)} extra left`
        : "Out of time";
  const extraLabel =
    !isUnlimited && planLeft > 0 && extraLeft > 0 ? `+${formatTutoringTime(extraLeft)} extra` : null;

  // Fraction of today's time still available, for the meter.
  const poolRemaining =
    isUnlimited || !time?.dailyCapSeconds
      ? 1
      : Math.min(1, (planLeft + extraLeft) / time.dailyCapSeconds);
  // Warn on the last fifth of the day's time.
  const poolLow = !isUnlimited && poolRemaining <= 0.2;

  const lastAssistantId = [...messages].reverse().find((m) => m.role === "assistant")?.id;
  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
  const lastStudent = [...messages].reverse().find((m) => m.role === "user");
  const micBusy = isTranscribing || isLoading;

  // Leon's face follows what the tutor is doing right now.
  const leonMood: LeonMood =
    recorder.isRecording || isTranscribing
      ? "listening"
      : flashMood
      ? flashMood
      : tts.isSpeaking || messages.some((m) => m.streaming && m.content)
      ? "speaking"
      : isLoading
      ? "thinking"
      : "idle";

  return (
    // Fill what the student layout leaves: its top bar (3.5rem) plus <main>'s
    // padding (mobile: 1rem top + 7rem for the bottom nav; sm: 1.5rem + 7rem;
    // lg: 2rem + 2rem). A plain h-screen overflowed by that much and pushed
    // this header, with End session, up under the layout's bar.
    <div className="flex flex-col h-[calc(100dvh-11.5rem)] sm:h-[calc(100dvh-12rem)] lg:h-[calc(100dvh-7.5rem)] bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <Link
                href="/dashboard"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className={`rounded-full flex-shrink-0 transition-shadow ${
                    tts.isSpeaking ? "ring-2 ring-primary/40 ring-offset-2" : ""
                  }`}
                >
                  <Leon
                    language={learningLanguage}
                    mood={leonMood}
                    size={40}
                    voiceLevel={tts.voiceLevelRef}
                  />
                </div>
                <div className="min-w-0">
                  <h1 className="font-bold text-gray-900 text-sm">
                    Professor Léon <span className="font-normal text-gray-400">· AI tutor</span>
                  </h1>
                  {lesson ? (
                    <p className="text-xs text-gray-500 truncate">
                      {lesson.title} · step{" "}
                      {Math.min(lesson.sectionIndex + 1, lesson.totalSections)} of{" "}
                      {lesson.totalSections}
                    </p>
                  ) : tts.isSpeaking ? (
                    <p className="text-xs text-primary">Speaking…</p>
                  ) : isLoading ? (
                    <p className="text-xs text-gray-500">Thinking…</p>
                  ) : (
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                      Online
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-3">
              <Link
                href="/student/ai-tutor/review"
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"
                title="Review deck"
              >
                <Layers className="w-4 h-4" />
              </Link>

              <button
                onClick={startTutoringSession}
                disabled={isLimitReached || isLoading}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-primary hover:bg-primary/90 disabled:opacity-50"
                title="Start a voice tutoring session with Leon"
              >
                <Mic className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Session</span>
              </button>

              {poolLow && !isLimitReached && (
                <button
                  onClick={() => setShowHoursOffer((v) => !v)}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100"
                >
                  Add hours
                </button>
              )}

              {canEnd && (
                <button
                  onClick={endSession}
                  disabled={recapLoading}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/15 disabled:opacity-60"
                  title="End session and see your recap"
                >
                  {recapLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Flag className="w-3.5 h-3.5" />
                  )}
                  <span className="hidden sm:inline">End session</span>
                </button>
              )}

              {/* Auto-speak toggle */}
              <button
                onClick={() => {
                  if (autoSpeak) tts.stop();
                  setAutoSpeak(!autoSpeak);
                }}
                className={`p-2 rounded-lg transition-colors ${
                  autoSpeak ? "bg-primary/10 text-primary" : "bg-gray-100 text-gray-400"
                }`}
                title={autoSpeak ? "Auto-speak on" : "Auto-speak off"}
              >
                {autoSpeak ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>

              {/* Monthly pool meter */}
              <div className="hidden sm:flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-gray-400" />
                <div className="flex flex-col items-end gap-1">
                  <span
                    className={`font-medium text-xs ${
                      poolLow ? "text-amber-600" : "text-gray-900"
                    }`}
                  >
                    {displayLimit}
                  </span>
                  {extraLabel && <span className="text-[10px] text-gray-500">{extraLabel}</span>}
                  {!isUnlimited && (
                    <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          poolLow ? "bg-amber-500" : "bg-primary"
                        }`}
                        style={{ width: `${Math.max(0, Math.min(100, poolRemaining * 100))}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <div className="flex justify-center mb-4">
                <Leon language={learningLanguage} mood={leonMood} size={120} />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Say &ldquo;{leonGreeting(learningLanguage)}&rdquo; to Professor Léon
              </h2>
              <p className="text-gray-500 max-w-sm mx-auto mb-5">
                Professor Léon is your AI tutor. Start a session and he&apos;ll
                welcome you, listen, answer out loud and gently correct you.
              </p>
              <button
                onClick={startTutoringSession}
                disabled={isLimitReached}
                className="mb-5 inline-flex items-center gap-2 px-6 py-3.5 bg-primary text-white rounded-2xl text-base font-semibold shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                <Mic className="w-5 h-5" />
                Start AI tutoring session
              </button>
              <p className="text-xs text-gray-400 mb-2">Or type to Leon below</p>
              <p className="text-xs text-gray-400 mb-6">
                Tap any word for its meaning &nbsp;·&nbsp; End the session for your recap
              </p>

              {/* One-tap way into lesson mode: practise what the student's own
                  tutor last taught them. */}
              {usage?.suggestedLesson && !lessonId && (
                <button
                  onClick={() => {
                    setLessonId(usage.suggestedLesson!.id);
                    setInput(
                      `Let's practise "${usage.suggestedLesson!.title}" together.`
                    );
                    inputRef.current?.focus();
                  }}
                  className="mb-4 inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  <Sparkles className="w-4 h-4" />
                  Practise &ldquo;{usage.suggestedLesson.title}&rdquo;
                </button>
              )}

              <div className="flex flex-wrap justify-center gap-2">
                {[
                  OPENERS[learningLanguage] ?? "Hi! How are you?",
                  "Help me practice ordering food",
                  "Can we do a role-play?",
                  "Explain the past tense",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => {
                      setInput(suggestion);
                      inputRef.current?.focus();
                    }}
                    className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="flex-shrink-0 mt-1">
                    <Leon
                      language={learningLanguage}
                      mood={msg.id === lastAssistantId ? leonMood : "idle"}
                      still={msg.id !== lastAssistantId}
                      size={32}
                    />
                  </div>
                )}
                <div className="max-w-[80%]">
                  <div
                    className={`rounded-2xl px-4 py-3 ${
                      msg.role === "user"
                        ? "bg-primary text-white rounded-br-md"
                        : `bg-white border text-gray-900 rounded-bl-md shadow-sm transition-colors ${
                            tts.speakingId === msg.id ? "border-primary/40" : "border-gray-200"
                          }`
                    }`}
                  >
                    {msg.role === "assistant" && msg.streaming && !msg.content ? (
                      <div className="flex items-center gap-1 py-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">
                        {msg.role === "assistant" && !msg.streaming ? (
                          <TappableText text={msg.content} onSpeak={sayPhrase} />
                        ) : (
                          msg.content
                        )}
                        {msg.streaming && (
                          <span className="inline-block w-1.5 h-4 -mb-0.5 ml-0.5 bg-primary/60 animate-pulse rounded-sm" />
                        )}
                      </p>
                    )}
                    {msg.translation !== undefined && (
                      <p className="mt-2 pt-2 border-t border-gray-100 text-sm text-gray-500 italic">
                        {msg.translation}
                      </p>
                    )}
                  </div>

                  {/* Corrections are the part worth keeping — surface them as
                      their own card rather than burying them in the reply. */}
                  {msg.corrections?.length ? (
                    <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 space-y-2">
                      {msg.corrections.map((c, i) => (
                        <div key={i} className="text-xs">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="line-through text-amber-700/70">
                              {c.original}
                            </span>
                            <span className="text-amber-700">→</span>
                            <span className="font-semibold text-amber-900">
                              {c.corrected}
                            </span>
                            <button
                              onClick={() => sayPhrase(c.corrected)}
                              className="p-0.5 text-amber-700/70 hover:text-amber-900"
                              aria-label="Hear the corrected version"
                            >
                              <Volume2 className="w-3 h-3" />
                            </button>
                            {c.tag && (
                              <span className="px-1.5 py-0.5 rounded bg-amber-200/70 text-amber-900 text-[10px] uppercase tracking-wide">
                                {c.tag.replace(/_/g, " ")}
                              </span>
                            )}
                          </div>
                          {c.explanation && (
                            <p className="text-amber-800/80 mt-0.5">{c.explanation}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : null}

                  <div className={`flex items-center gap-1 mt-1 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <p className="text-xs text-gray-400 mr-1">
                      {msg.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    {msg.role === "assistant" && !msg.streaming && msg.content && (
                      <>
                        <button
                          onClick={() => toggleSpeak(msg)}
                          className={`p-1 rounded transition-colors ${
                            tts.speakingId === msg.id
                              ? "text-primary bg-primary/10"
                              : "text-gray-400 hover:text-gray-600"
                          }`}
                          title={tts.speakingId === msg.id ? "Stop" : "Listen"}
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => toggleSpeak(msg, true)}
                          className="p-1 rounded text-gray-400 hover:text-gray-600 transition-colors"
                          title="Listen slowly"
                        >
                          <Snail className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => toggleTranslation(msg)}
                          className={`p-1 rounded transition-colors ${
                            msg.translation !== undefined
                              ? "text-primary bg-primary/10"
                              : "text-gray-400 hover:text-gray-600"
                          }`}
                          title={msg.translation !== undefined ? "Hide translation" : "Translate"}
                        >
                          {msg.translating ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Languages className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </>
                    )}
                  </div>

                  {/* Reply suggestions under the latest tutor message. */}
                  {msg.id === lastAssistantId && hints.length > 0 && !isLoading && (
                    hintsVisible ? (
                      <div className="mt-3 flex flex-col gap-1.5">
                        <p className="text-[11px] uppercase tracking-wide text-gray-400 font-semibold flex items-center gap-1">
                          <Lightbulb className="w-3 h-3" /> You could say
                        </p>
                        {hints.map((h, i) => (
                          <div key={i} className="flex items-stretch gap-1">
                            <button
                              onClick={() => {
                                setInput(h.text);
                                inputRef.current?.focus();
                              }}
                              className="flex-1 text-left px-3 py-2 bg-white border border-gray-200 rounded-xl hover:border-primary/40 hover:bg-primary/5 transition-colors"
                            >
                              <span className="block text-sm text-gray-900">{h.text}</span>
                              {h.en && (
                                <span className="block text-xs text-gray-500">{h.en}</span>
                              )}
                            </button>
                            <button
                              onClick={() => sayPhrase(h.text)}
                              className="px-2 rounded-xl text-gray-400 hover:text-primary hover:bg-primary/5"
                              aria-label="Hear this"
                            >
                              <Volume2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <button
                        onClick={() => setHintsOpen(true)}
                        className="mt-2 inline-flex items-center gap-1 text-xs text-gray-500 hover:text-primary"
                      >
                        <Lightbulb className="w-3.5 h-3.5" /> Need a hint?
                      </button>
                    )
                  )}
                </div>
                {msg.role === "user" && (
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0 mt-1 overflow-hidden">
                    <img
                      src="/api/auth/avatar"
                      alt="You"
                      className="w-8 h-8 object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                        (e.target as HTMLImageElement).parentElement!.innerHTML =
                          '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-gray-500"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';
                      }}
                    />
                  </div>
                )}
              </div>
            ))}

            {isTranscribing && (
              <div className="flex justify-end">
                <div className="rounded-2xl rounded-br-md bg-primary/10 text-primary px-4 py-3 text-sm flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Listening back…
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-red-50 border-t border-red-200 px-4 py-3">
          <div className="max-w-3xl mx-auto flex items-center gap-2 text-sm text-red-700">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <p className="flex-1">{error}</p>

          </div>
        </div>
      )}

      {notice && (
        <div className="bg-green-50 border-t border-green-200 px-4 py-3">
          <p className="max-w-3xl mx-auto text-sm text-green-800">{notice}</p>
        </div>
      )}

      {(isLimitReached || showHoursOffer) && usage?.hasAccess && !usage?.isPrivileged && (
        <div className="px-4 py-3 bg-white border-t border-gray-200">
          <div className="max-w-3xl mx-auto">
            <ExtraHoursOffer reason={isLimitReached ? usage?.reason : null} />
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="bg-white border-t border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-3">
          {recorder.isRecording ? (
            <div className="flex items-center gap-3">
              <button
                onClick={recorder.cancel}
                className="p-3 rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200 flex-shrink-0"
                title="Cancel"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex-1 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-sm font-medium text-red-700 tabular-nums">
                  {formatElapsed(recorder.elapsedMs)}
                </span>
                {/* Live input level so the student can see they are heard. */}
                <div className="flex-1 flex items-center gap-[3px] h-6 overflow-hidden">
                  {Array.from({ length: 28 }).map((_, i) => {
                    const wave = Math.abs(Math.sin((i + recorder.elapsedMs / 120) * 0.7));
                    const h = 15 + recorder.level * 85 * (0.4 + 0.6 * wave);
                    return (
                      <span
                        key={i}
                        className="w-[3px] rounded-full bg-red-400 transition-[height] duration-75"
                        style={{ height: `${h}%` }}
                      />
                    );
                  })}
                </div>
              </div>
              <button
                onClick={toggleRecording}
                className="relative p-3 rounded-xl bg-red-500 text-white hover:bg-red-600 flex-shrink-0"
                title="Send"
              >
                <span
                  className="absolute inset-0 rounded-xl bg-red-400/50"
                  style={{ transform: `scale(${1 + recorder.level * 0.35})` }}
                />
                <Square className="relative w-5 h-5 fill-current" />
              </button>
            </div>
          ) : (
            <div className="flex items-end gap-2">
              {/* Microphone button */}
              <button
                onClick={toggleRecording}
                disabled={!!isLimitReached || micBusy}
                className="p-3 rounded-xl transition-all flex-shrink-0 bg-primary/10 text-primary hover:bg-primary/15 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Tap to speak"
              >
                {isTranscribing ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Mic className="w-5 h-5" />
                )}
              </button>

              <textarea
                ref={inputRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={
                  isLimitReached
                    ? "Monthly limit reached. Upgrade for more messages!"
                    : isTranscribing
                    ? "Listening back…"
                    : "Type or tap the mic to speak..."
                }
                disabled={isLoading || !!isLimitReached}
                rows={1}
                className="flex-1 resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50 disabled:bg-gray-50"
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || isLoading || !!isLimitReached}
                className="p-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
          )}
          <p className="text-xs text-gray-400 mt-2 text-center">
            {recorder.isRecording
              ? "Tap ■ when you're done · it sends automatically"
              : `Tap the mic and talk · Auto-read is ${autoSpeak ? "on" : "off"} · AI may make mistakes`}
          </p>
        </div>
      </div>

      {sessionOpen && (
        <TutoringSession
          language={learningLanguage}
          mood={leonMood}
          studentLine={lastStudent?.content ?? null}
          tutorLine={lastAssistant?.content || null}
          tutorStreaming={!!lastAssistant?.streaming}
          board={messages.flatMap((m) => (m.role === "assistant" ? m.corrections ?? [] : []))}
          nowPlaying={tts.nowPlaying}
          voiceLevel={tts.voiceLevelRef}
          voiceBands={tts.voiceBandsRef}
          prefetchClip={tts.prefetch}
          playClip={tts.playClip}
          isLoading={isLoading}
          isTranscribing={isTranscribing}
          isSpeaking={tts.isSpeaking}
          recorder={recorder}
          onInterrupt={() => tts.stop()}
          onEnd={endTutoringSession}
          ending={recapLoading}
          timeLabel={isUnlimited ? null : displayLimit}
          outOfTime={isLimitReached}
          outOfTimePanel={<ExtraHoursOffer reason={usage?.reason} tone="light" />}
          error={error}
          pauseKey={sessionPauseKey}
        />
      )}

      {recap && conversationId && (
        <RecapPanel
          recap={recap}
          conversationId={conversationId}
          language={learningLanguage}
          onClose={() => setRecap(null)}
          onNewSession={newSession}
          onSpeak={sayPhrase}
        />
      )}
    </div>
  );
}
