"use client";

// Léon's comic speech bubble.
//
// While he talks it shows the sentence he is saying right now, lighting up
// word by word in time with the audio (same timing as his lips, from
// speech-track.ts). Between sentences it fades out and back in. When he has
// finished, it holds his whole reply so the student can read it back.
//
// The highlight runs on animation frames by flipping a data attribute on each
// word's <span>; React renders once per sentence, not once per word.

import { useEffect, useMemo, useRef, useState } from "react";
import { buildSpeechTrack, clipTime, wordIndexAt, type SpeechClip } from "./speech-track";
import { leonPalette } from "./palette";

const FADE_OUT_MS = 140;

interface Shown {
  key: string;
  text: string;
  live: boolean;
}

export function LeonSpeechBubble({
  language,
  text,
  speech,
  streaming = false,
  tailX = "50%",
  translation,
  className,
}: {
  language: string;
  /** His whole latest reply (shown in full once he's done talking). */
  text: string | null;
  /** The sentence playing now, if any. */
  speech: SpeechClip | null;
  /** The reply is still arriving. */
  streaming?: boolean;
  /** Where the tail sits along the bottom edge (CSS length). */
  tailX?: string;
  /** His whole reply in the student's own language, in small print below. */
  translation?: string | null;
  className?: string;
}) {
  const palette = leonPalette(language);

  const want: Shown | null = speech?.text
    ? { key: `live|${speech.startedAt}|${speech.text}`, text: speech.text, live: true }
    : text
    ? { key: "full", text, live: false }
    : null;

  // Fade out the old sentence, then swap in the new one.
  const [shown, setShown] = useState<Shown | null>(want);
  const [leaving, setLeaving] = useState(false);
  const wantKey = want?.key ?? "";
  const shownKey = shown?.key ?? "";
  const wantRef = useRef(want);
  useEffect(() => {
    wantRef.current = want;
  });
  useEffect(() => {
    if (wantKey === shownKey) return;
    // Text growing inside the same "full" view (streaming) swaps instantly.
    if (!shownKey) {
      setShown(wantRef.current);
      return;
    }
    setLeaving(true);
    const t = setTimeout(() => {
      setShown(wantRef.current);
      setLeaving(false);
    }, FADE_OUT_MS);
    return () => clearTimeout(t);
  }, [wantKey, shownKey]);
  // Same view, newer text (the full reply streaming in).
  const display = shown && want && shown.key === want.key ? want : shown;

  // A fade only counts while there is something new to swap in: if the text
  // changed back before it finished (a very short sentence, or the reply
  // arriving as he stops), the cancelled fade must not leave him invisible.
  const visible = !!display && !(leaving && wantKey !== shownKey);
  return (
    <div
      className={`relative transition-[opacity,transform] duration-200 ease-out motion-reduce:transition-opacity ${
        visible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-1 scale-[0.98] motion-reduce:translate-y-0 motion-reduce:scale-100"
      } ${className ?? ""}`}
      aria-hidden={!display}
    >
      <div
        lang={language}
        className="relative rounded-[26px] border-[2.5px] border-gray-900 bg-white px-4 py-3 md:px-5 md:py-3.5 shadow-[4px_5px_0_rgba(17,24,39,0.13)] text-left"
        style={{ "--hl": palette.light, "--hl-ink": palette.dark } as React.CSSProperties}
      >
        <div className={`${display?.live ? "" : "max-h-[26vh] md:max-h-[30vh] overflow-y-auto"} text-lg md:text-xl leading-snug font-medium text-gray-900 [overflow-wrap:anywhere]`}>
          {display?.live && speech ? (
            <LiveSentence key={display.key} text={display.text} speech={speech} language={language} />
          ) : display ? (
            <span className={streaming ? "text-gray-500" : undefined}>
              {display.text}
              {streaming && <span className="inline-block w-1.5 h-4 -mb-0.5 ml-1 bg-gray-400 animate-pulse rounded-sm" />}
            </span>
          ) : (
            " "
          )}
        </div>
        {translation && display && !streaming && (
          // The student's own language, not the bubble's.
          <p
            lang=""
            className="mt-2 pt-2 border-t border-dashed border-gray-200 text-xs md:text-sm leading-snug text-gray-500 italic max-h-[5.5rem] overflow-y-auto"
          >
            {translation}
          </p>
        )}
        {/* comic tail pointing down at Léon */}
        <svg
          className="absolute -bottom-[19px] h-[21px] w-[30px] -translate-x-1/2"
          style={{ left: tailX }}
          viewBox="0 0 30 21"
          aria-hidden
        >
          <path d="M3 0 C9 6 10 12 6 19.5 C14 15 21 8 27 0" fill="#FFFFFF" stroke="#111827" strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M4.5 0.4 H25.5" stroke="#FFFFFF" strokeWidth="3.4" />
        </svg>
      </div>
    </div>
  );
}

/** One sentence, its words lit up as they're spoken. */
function LiveSentence({ text, speech, language }: { text: string; speech: SpeechClip; language: string }) {
  const track = useMemo(() => buildSpeechTrack(text, language, speech.duration), [text, language, speech.duration]);
  const spans = useRef<(HTMLSpanElement | null)[]>([]);
  const speechRef = useRef(speech);
  useEffect(() => {
    speechRef.current = speech;
  });

  useEffect(() => {
    let raf = 0;
    let lastIdx = -2;
    const tick = () => {
      const idx = wordIndexAt(track, clipTime(speechRef.current));
      if (idx !== lastIdx) {
        spans.current.forEach((el, i) => {
          if (el) el.dataset.s = i < idx ? "said" : i === idx ? "now" : "next";
        });
        lastIdx = idx;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [track]);

  const parts: React.ReactNode[] = [];
  let pos = 0;
  track.words.forEach((w, i) => {
    if (w.start > pos) parts.push(text.slice(pos, w.start));
    parts.push(
      <span
        key={i}
        ref={(el) => {
          spans.current[i] = el;
        }}
        data-s="next"
        className="rounded-md transition-colors duration-100 data-[s=next]:text-gray-400 data-[s=said]:text-gray-900 data-[s=now]:text-[color:var(--hl-ink)] data-[s=now]:bg-[var(--hl)] box-decoration-clone"
      >
        {text.slice(w.start, w.end)}
      </span>
    );
    pos = w.end;
  });
  if (pos < text.length) parts.push(text.slice(pos));
  return <>{parts}</>;
}
