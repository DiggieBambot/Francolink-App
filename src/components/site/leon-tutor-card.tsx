"use client";

// Professor Léon in the tutor directory.
//
// Léon is FrancoLink's AI tutor, and the directory is where people go looking
// for someone to practise with, so he is listed there, but as what he is. The
// card is pinned above the human tutors and labelled "AI tutor" everywhere a
// person's card would show a tier. It deliberately has none of a person's
// signals: no photo, rating, review count, country, years of experience or
// "certified" claim. He is not a row from the tutors table either, so he never
// counts towards "N tutors", the tutor sitemap, the JSON-LD list or any tutor
// metric.
//
// He is live, not a still: the same animation engine as the class. He waves
// hello, and (being a chameleon) changes colour for each language he teaches,
// greeting the visitor in it with his mouth following the words. Filtering the
// directory to one of his languages pins him to that language.

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Bot, Clock, GraduationCap, Mic, Sparkles } from "lucide-react";
import { Leon, buildSpeechTrack, leonPalette, type LeonCue, type SpeechClip } from "@/components/ai-tutor/leon";
import { PLANS, formatTutoringTime } from "@/lib/config/subscription";
import { appUrl } from "@/lib/site/hosts";
import { LANGUAGE_LABEL } from "@/lib/site/format";
import { trackSite } from "@/lib/analytics/site";
import { cn } from "@/lib/utils";

/** The languages the AI class runs in. */
export const LEON_LANGUAGES = ["fr", "es", "en"] as const;

const HELLO: Record<string, string> = {
  fr: "Bonjour !",
  es: "¡Hola!",
  en: "Hello!",
};

/** Seconds on each language before he changes colour. */
const CYCLE_S = 6;

const REDUCE = "(prefers-reduced-motion: reduce)";
function subscribeReduced(cb: () => void) {
  const m = window.matchMedia?.(REDUCE);
  m?.addEventListener("change", cb);
  return () => m?.removeEventListener("change", cb);
}
const readReduced = () => window.matchMedia?.(REDUCE).matches ?? false;

export function LeonTutorCard({ language }: { language?: string | null }) {
  const pinned = language && (LEON_LANGUAGES as readonly string[]).includes(language) ? language : null;
  const [index, setIndex] = useState(0);
  const lang = pinned ?? LEON_LANGUAGES[index % LEON_LANGUAGES.length];

  // Assume visible until the observer says otherwise (it reports at once).
  const [onScreen, setOnScreen] = useState(true);
  const reduced = useSyncExternalStore(subscribeReduced, readReduced, () => false);
  const [clip, setClip] = useState<SpeechClip | null>(null);
  const [talking, setTalking] = useState(false);
  const [cue, setCue] = useState<LeonCue | null>(null);
  const ref = useRef<HTMLElement>(null);

  // Only animate while the card is on screen: the engine runs every frame.
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting), { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Each language: a wave or a nod, then the greeting with lip sync.
  useEffect(() => {
    if (!onScreen || reduced) return;
    const text = HELLO[lang];
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => setCue((c) => ({ gesture: index === 0 ? "wave" : "nod", id: (c?.id ?? 0) + 1 })), 0));
    timers.push(
      setTimeout(() => {
        const startedAt = performance.now();
        const duration = buildSpeechTrack(text, lang).duration;
        setClip({ text, startedAt, duration, position: () => (performance.now() - startedAt) / 1000 });
        setTalking(true);
        // The greeting stays in the bubble after he has said it.
        timers.push(setTimeout(() => setTalking(false), duration * 1000));
      }, 700)
    );
    if (!pinned) timers.push(setTimeout(() => setIndex((i) => i + 1), CYCLE_S * 1000));
    return () => timers.forEach(clearTimeout);
  }, [lang, onScreen, reduced, pinned, index]);

  const animating = onScreen && !reduced;
  const said = animating ? clip : null;
  const palette = leonPalette(lang);
  const classHref = appUrl("/student/ai-tutor");

  return (
    <article
      ref={ref}
      aria-label="Professor Léon, FrancoLink's AI tutor"
      className="@container relative bg-white rounded-2xl border-2 border-secondary-100 shadow-soft overflow-hidden"
    >
      <div className="p-5 @lg:p-6 flex flex-col @lg:flex-row gap-5 @lg:gap-6">
        {/* ------------------------------------------------------- LEON */}
        <div className="relative shrink-0 self-start">
          <div
            className="relative w-28 h-28 @lg:w-32 @lg:h-32 rounded-2xl overflow-hidden transition-colors duration-700"
            style={{ background: palette.bg }}
          >
            <Leon
              language={lang}
              mood={animating && talking ? "speaking" : "idle"}
              size={128}
              background={false}
              still={!onScreen}
              greet={false}
              cue={cue}
              speech={said}
              className="w-full h-full"
            />
            {/* Same place as a person's tier ribbon, so the list scans the same
                way, and it says plainly what he is. */}
            <span className="absolute inset-x-0 bottom-0 py-1 text-center text-[10px] font-heading font-extrabold uppercase tracking-wide bg-secondary text-primary-900">
              AI tutor
            </span>
          </div>

          {/* His greeting, in the language he is showing. */}
          <div
            aria-hidden
            className={cn(
              "absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-xl bg-white border border-gray-200 shadow-soft px-2.5 py-1 text-xs font-semibold text-primary transition-opacity duration-300",
              said ? "opacity-100" : "opacity-0"
            )}
          >
            {said?.text ?? HELLO[lang]}
          </div>
        </div>

        {/* ------------------------------------------------------- INFO */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <h3 className="font-heading font-bold text-xl text-primary">Professor Léon</h3>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary-50 text-secondary-700 text-[11px] font-bold">
              <Bot className="w-3.5 h-3.5" />
              AI tutor, not a person
            </span>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-gray-500">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-secondary" />
              Available 24/7, no booking
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Mic className="w-3.5 h-3.5 text-secondary" />
              Spoken conversation
            </span>
          </div>

          <p className="mt-3 text-sm text-gray-600 leading-relaxed">
            Practise speaking out loud whenever you like. Léon adapts to your
            level, helps when you&apos;re stuck and recaps what you worked on.
            A good warm-up between lessons with a human tutor.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {LEON_LANGUAGES.map((code) => (
              <span
                key={code}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors",
                  code === lang ? "bg-primary text-white" : "bg-primary-50 text-primary"
                )}
              >
                {LANGUAGE_LABEL[code] ?? code.toUpperCase()}
              </span>
            ))}
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-secondary-50 text-secondary-700 text-xs font-semibold">
              <GraduationCap className="w-3 h-3" />
              A1–C2
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-secondary-50 text-secondary-700 text-xs font-semibold">
              <Sparkles className="w-3 h-3" />
              Speaking practice
            </span>
          </div>
        </div>

        {/* ------------------------------------------------------- ACTIONS */}
        <div className="@lg:w-52 shrink-0 flex flex-col gap-2.5 @lg:border-l @lg:border-gray-50 @lg:pl-6 @lg:justify-center">
          <p className="text-center text-xs text-gray-500 leading-snug">
            <span className="block font-heading font-bold text-sm text-primary">
              Included in Premium
            </span>
            {formatTutoringTime(PLANS.PREMIUM.aiMonthlyMinutes * 60)}/month on Premium,{" "}
            {formatTutoringTime(PLANS.PREMIUM_PLUS.aiMonthlyMinutes * 60)} on Premium+.
            Not on the free plan.
          </p>
          <a
            href={classHref}
            onClick={() => trackSite("tutor_leon_opened", { lang })}
            className="w-full text-center px-4 py-3 rounded-xl bg-primary text-white font-heading font-bold text-sm hover:bg-primary-600 transition-colors"
          >
            Practise with Léon
          </a>
          <Link
            href="/pricing"
            className="text-center text-xs font-semibold text-gray-500 hover:text-primary"
          >
            See Premium plans
          </Link>
        </div>
      </div>
    </article>
  );
}
