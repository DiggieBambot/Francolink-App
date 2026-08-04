"use client";

import { Fragment, type ReactNode, useState, useRef, useCallback, useEffect } from "react";
import { Volume2, Square, Loader2, AlertCircle } from "lucide-react";
import { useLessonRoom } from "./lesson-room-context";

interface ReadAloudProps {
  /** The full raw passage (may contain **bold** markers and blank-line paragraph breaks). */
  text: string;
  lang?: string;
}

const stripBold = (t: string) => t.replace(/\*\*/g, "");

/**
 * Reading-passage player. Renders the passage as proper paragraphs (drop-cap
 * on the first, **bold** markers honoured) and reads it aloud via the Inworld
 * backend TTS (`/api/tts`), washing a mild yellow highlight across the text as
 * a continuous sweep keyed to playback progress. There is no Web Speech API
 * fallback — if the backend call fails we surface an error rather than
 * silently swap in the robotic OS voice.
 *
 * This is the single source of truth for the passage — the section component
 * should not render the paragraphs again separately.
 */
export function ReadAloud({ text, lang = "fr-FR" }: ReadAloudProps) {
  // Read progress as a character offset into the *plain* (bold-stripped) text,
  // which is what the TTS engine receives.
  const [progressChar, setProgressChar] = useState(0);
  const [speaking, setSpeaking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number | null>(null);
  // In a live room, playing the passage also plays it on the other side.
  const room = useLessonRoom();

  const plain = stripBold(text);
  const rawParagraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  const cleanup = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    cleanup();
    setProgressChar(0);
    setSpeaking(false);
    setLoading(false);
  }, [cleanup]);

  useEffect(() => () => cleanup(), [cleanup]);

  const speak = useCallback(async () => {
    stop();
    const trimmed = plain.trim();
    if (!trimmed) return;
    // Tell the other participant to play the same passage (their
    // IncomingTtsAutoplay handles it; the sender ignores its own echo).
    room?.broadcastSpeak(trimmed);
    setLoading(true);
    setError(false);

    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed, language: lang, speed: 0.95 }),
      });
      if (!res.ok) {
        setLoading(false);
        setError(true);
        return;
      }
      const { audio, format } = await res.json();
      const binaryStr = atob(audio);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
      const blob = new Blob([bytes], { type: format === "wav" ? "audio/wav" : "audio/mp3" });
      const url = URL.createObjectURL(blob);
      const audioEl = new Audio(url);
      audioRef.current = audioEl;

      // Sweep the trailing highlight from playback progress.
      const tick = () => {
        const a = audioRef.current;
        if (!a || !a.duration || Number.isNaN(a.duration)) {
          rafRef.current = requestAnimationFrame(tick);
          return;
        }
        const frac = Math.min(1, a.currentTime / a.duration);
        setProgressChar(frac * plain.length);
        rafRef.current = requestAnimationFrame(tick);
      };

      audioEl.onplay = () => {
        setLoading(false);
        setSpeaking(true);
        rafRef.current = requestAnimationFrame(tick);
      };
      const finish = () => {
        URL.revokeObjectURL(url);
        stop();
      };
      audioEl.onended = finish;
      audioEl.onerror = () => {
        setError(true);
        finish();
      };
      audioEl.play().catch(() => {
        URL.revokeObjectURL(url);
        setError(true);
        stop();
      });
    } catch {
      setLoading(false);
      setError(true);
    }
  }, [plain, lang, stop]);

  // Render one raw paragraph: split into **bold** / plain segments, then into
  // word+space tokens. Each token carries its global offset in the plain text
  // (via the running `cursor`) so the sweep can wash everything read so far.
  const cursorRef = { value: 0 };
  const renderParagraph = (rawPara: string, key: number): ReactNode => {
    const plainPara = stripBold(rawPara);
    // Re-anchor the running cursor to this paragraph's position in `plain`.
    const start = plain.indexOf(plainPara, cursorRef.value);
    if (start >= 0) cursorRef.value = start;

    const segments = rawPara.split(/(\*\*[^*]+\*\*)/g);
    let local = cursorRef.value;
    const nodes: ReactNode[] = [];

    segments.forEach((seg, si) => {
      if (!seg) return;
      const bold = seg.startsWith("**") && seg.endsWith("**");
      const segText = bold ? seg.slice(2, -2) : seg;
      const tokens = segText.split(/(\s+)/);
      tokens.forEach((tok, ti) => {
        if (!tok) return;
        const tokStart = local;
        local += tok.length;
        const washed = speaking && tokStart < progressChar;
        nodes.push(
          <span
            key={`${si}-${ti}`}
            className={`${washed ? "bg-yellow-200/60 " : ""}${bold ? "font-bold text-primary" : ""}`}
          >
            {tok}
          </span>
        );
      });
    });

    cursorRef.value = local;

    return (
      <p
        key={key}
        className={`text-[1.075rem] leading-8 text-gray-800 ${
          key === 0
            ? "first-letter:float-left first-letter:mr-2.5 first-letter:font-heading first-letter:text-5xl first-letter:font-extrabold first-letter:leading-[0.8] first-letter:text-primary"
            : ""
        }`}
      >
        {nodes}
      </p>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={speaking || loading ? stop : speak}
          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
            error ? "bg-red-50 text-red-700 hover:bg-red-100" : "bg-blue-50 text-blue-700 hover:bg-blue-100"
          }`}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : speaking ? (
            <Square className="h-4 w-4" />
          ) : error ? (
            <AlertCircle className="h-4 w-4" />
          ) : (
            <Volume2 className="h-4 w-4" />
          )}
          {loading ? "Loading…" : speaking ? "Stop" : error ? "Audio failed — retry" : "Read aloud"}
        </button>
        {speaking && <span className="animate-pulse text-xs text-slate-400">Reading…</span>}
      </div>

      <div className="space-y-5">
        {rawParagraphs.map((p, i) => (
          <Fragment key={i}>{renderParagraph(p, i)}</Fragment>
        ))}
      </div>
    </div>
  );
}
