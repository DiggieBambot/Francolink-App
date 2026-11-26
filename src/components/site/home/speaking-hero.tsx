"use client";

// The homepage hero, sold on speaking: Léon asks a question, the learner
// answers out loud, Léon gives feedback and a next step. Phrase chips orbit
// him, and he changes colour with the language. The Speak / For pills switch
// the scene; otherwise it autoplays every language × goal, French first.

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, Mic } from "lucide-react";
import {
  Leon,
  buildSpeechTrack,
  leonPalette,
  type LeonCue,
  type LeonMood,
  type SpeechClip,
} from "@/components/ai-tutor/leon";

type Lang = "fr" | "es" | "en";
const ORDER: Lang[] = ["fr", "es", "en"];
const FLAG: Record<Lang, string> = { fr: "🇫🇷", es: "🇪🇸", en: "🇬🇧" };
const NAME: Record<Lang, string> = {
  fr: "French",
  es: "Spanish",
  en: "English",
};

type Goal = "travel" | "work" | "exams" | "kids";
const GOALS: { id: Goal; icon: string; label: string }[] = [
  { id: "travel", icon: "✈️", label: "Travel" },
  { id: "work", icon: "💼", label: "Work" },
  { id: "exams", icon: "🎓", label: "Exams" },
  { id: "kids", icon: "🧒", label: "Kids" },
];

type Scene = { title: string; leon: string; you: string; tip: string };

/** One short exchange per language and goal: Léon asks, you answer, Léon pushes you on. */
const SCENES: Record<Lang, Record<Goal, Scene>> = {
  fr: {
    travel: {
      title: "Ordering at a café",
      leon: "Qu'est-ce que tu prends ?",
      you: "Je voudrais un café, s'il vous plaît.",
      tip: "Parfait. Now order two, with a croissant.",
    },
    work: {
      title: "Introducing yourself at work",
      leon: "Tu peux te présenter en deux phrases ?",
      you: "Je m'appelle Sam, je travaille dans le marketing.",
      tip: "Clear. Now say what you like about your job.",
    },
    exams: {
      title: "TCF speaking practice",
      leon: "Décrivez votre ville en quelques phrases.",
      you: "J'habite à Lyon, une ville animée au bord du Rhône.",
      tip: "Solid B1 answer. Add a reason with « parce que ».",
    },
    kids: {
      title: "Colours game",
      leon: "Quelle est ta couleur préférée ?",
      you: "Ma couleur préférée, c'est le bleu !",
      tip: "Super ! Now say what colour Léon is.",
    },
  },
  en: {
    travel: {
      title: "Asking for directions",
      leon: "You're lost. Ask me the way to the station.",
      you: "Excuse me, how do I get to the station?",
      tip: "Great. Now ask how long it takes to walk.",
    },
    work: {
      title: "Job interview practice",
      leon: "Tell me about your last project.",
      you: "I led a small team that launched our new website.",
      tip: "Strong. Now say what you would do differently.",
    },
    exams: {
      title: "Exam speaking practice",
      leon: "Describe a place you'd like to visit.",
      you: "I'd love to visit Kyoto because of its old temples.",
      tip: "Good. Now add when you would go, and why.",
    },
    kids: {
      title: "Animals game",
      leon: "What animal do you like best?",
      you: "I like dogs because they are funny!",
      tip: "Brilliant! Now tell me your dog's name.",
    },
  },
  es: {
    travel: {
      title: "Ordering at a café",
      leon: "¿Qué vas a pedir?",
      you: "Quiero un café, por favor.",
      tip: "Good. Now try the polite form: Quisiera…",
    },
    work: {
      title: "Talking about your job",
      leon: "¿A qué te dedicas?",
      you: "Soy enfermera y trabajo en un hospital.",
      tip: "Bien. Now say how long you've worked there.",
    },
    exams: {
      title: "Exam speaking practice",
      leon: "Háblame de tus planes para el verano.",
      you: "Este verano voy a viajar a la costa con mi familia.",
      tip: "Good. Now add one thing you will do there.",
    },
    kids: {
      title: "Numbers game",
      leon: "¿Cuántos años tienes?",
      you: "¡Tengo ocho años!",
      tip: "¡Muy bien! Now ask Léon how old he is.",
    },
  },
};

/** Autoplay order: every language × goal once, French first and most often. */
const STEPS: [Lang, Goal][] = [
  ["fr", "travel"],
  ["en", "work"],
  ["fr", "exams"],
  ["es", "travel"],
  ["fr", "work"],
  ["en", "kids"],
  ["fr", "kids"],
  ["es", "work"],
  ["en", "travel"],
  ["es", "exams"],
  ["en", "exams"],
  ["es", "kids"],
];

/** Things you actually say in a conversation, with a translation on hover. */
const CHIPS: { lang: Lang; text: string; gloss: string }[] = [
  { lang: "fr", text: "Tu peux répéter ?", gloss: "Can you say that again?" },
  { lang: "es", text: "¿Cómo se dice…?", gloss: "How do you say…?" },
  { lang: "en", text: "It depends", gloss: "Ça dépend" },
  { lang: "fr", text: "Je suis d'accord", gloss: "I agree" },
  { lang: "es", text: "Depende", gloss: "It depends" },
  { lang: "en", text: "Could you repeat that?", gloss: "Tu peux répéter ?" },
  { lang: "fr", text: "Comment on dit… ?", gloss: "How do you say…?" },
  { lang: "es", text: "Estoy de acuerdo", gloss: "I agree" },
  { lang: "en", text: "I'd like…", gloss: "Je voudrais…" },
];

/** Two tilted elliptical rings; chips are spread evenly around each one. */
const RINGS = [
  { rx: 0.4, ry: 0.27, speed: 0.06, tilt: -10, cy: 0.47 },
  { rx: 0.5, ry: 0.35, speed: -0.045, tilt: 8, cy: 0.47 },
];

/** 0 Léon asks · 1 you answer (mic) · 2 feedback */
type Phase = 0 | 1 | 2;

export function SpeakingHero({
  signupHref,
  aiTutorEnabled,
}: {
  /** Cross-host link to the app's signup page. */
  signupHref: string;
  /** With the AI tutor switched off, the copy stops promising AI practice. */
  aiTutorEnabled: boolean;
}) {
  const [lang, setLang] = useState<Lang>("fr");
  const [goal, setGoal] = useState<Goal>("travel");
  const [phase, setPhase] = useState<Phase>(0);
  const [mood, setMood] = useState<LeonMood>("idle");
  const [clip, setClip] = useState<SpeechClip | null>(null);
  const [cue, setCue] = useState<LeonCue | null>(null);
  const [leonSize, setLeonSize] = useState(240);
  const [hovered, setHovered] = useState<number | null>(null);

  const stage = useRef<HTMLDivElement>(null);
  const chipEls = useRef<(HTMLDivElement | null)[]>([]);
  const paused = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const step = useRef(0);
  const playRef = useRef<(l: Lang, g: Goal) => void>(() => {});

  // Léon takes about 40% of the orbit stage, so the rings always clear him.
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const ro = new ResizeObserver(() =>
      setLeonSize(Math.round(el.clientWidth * 0.4)),
    );
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Play one exchange, then move on to the next step.
  const play = useCallback((l: Lang, g: Goal, first = false) => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    const at = (ms: number, fn: () => void) => {
      timers.current.push(setTimeout(fn, ms));
    };
    step.current = Math.max(
      0,
      STEPS.findIndex(([sl, sg]) => sl === l && sg === g),
    );
    setLang(l);
    setGoal(g);
    setPhase(0);
    const scene = SCENES[l][g];

    const start = first ? 1900 : 300; // let the first greeting wave finish
    const dur = buildSpeechTrack(scene.leon, l).duration;
    at(start, () => {
      const startedAt = performance.now();
      setMood("speaking");
      setClip({
        text: scene.leon,
        startedAt,
        duration: dur,
        position: () => (performance.now() - startedAt) / 1000,
      });
    });
    at(start + dur * 1000 + 150, () => {
      setClip(null);
      setMood("listening");
      setPhase(1);
    });
    at(start + dur * 1000 + 2300, () => {
      setMood("celebrating");
      setCue({ gesture: "nod", id: Date.now() });
      setPhase(2);
    });
    at(start + dur * 1000 + 3600, () => setMood("idle"));

    const next = () => {
      if (paused.current) return at(800, next);
      const [nl, ng] = STEPS[(step.current + 1) % STEPS.length];
      playRef.current(nl, ng);
    };
    at(start + dur * 1000 + 6200, next);
  }, []);

  // The autoplay chain calls the latest `play` through a ref, so the
  // callback never has to reference itself.
  useEffect(() => {
    playRef.current = play;
  }, [play]);

  // Start the loop on the next tick (the first scene matches the initial
  // state, so nothing flashes).
  useEffect(() => {
    const t = timers;
    const start = setTimeout(() => play("fr", "travel", true), 0);
    return () => {
      clearTimeout(start);
      t.current.forEach(clearTimeout);
    };
  }, [play]);

  // Orbit loop: positions are written straight to the DOM every frame (no
  // React renders). Chips behind Léon shrink, fade and drop below him.
  useEffect(() => {
    const reduce =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    let raf = 0;
    let t = 0;
    let last = performance.now();
    const perRing = Math.ceil(CHIPS.length / RINGS.length);
    const clamp = (v: number, lo: number, hi: number) =>
      Math.min(hi, Math.max(lo, v));
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!paused.current && !reduce) t += dt;
      const el = stage.current;
      if (el) {
        const w = el.clientWidth;
        const h = el.clientHeight;
        // Phones: flatter rings. Every chip is kept inside the stage. Sizes are
        // read for all chips first, then written, to avoid layout thrash.
        const ryScale = w < 480 ? 0.8 : 1;
        const sizes = chipEls.current.map((n) =>
          n ? [n.offsetWidth, n.offsetHeight] : [0, 0],
        );
        CHIPS.forEach((_, idx) => {
          const node = chipEls.current[idx];
          if (!node) return;
          const ring = RINGS[idx % RINGS.length];
          const slot = Math.floor(idx / RINGS.length);
          const a =
            (slot / perRing) * Math.PI * 2 +
            t * ring.speed * Math.PI * 2 +
            (idx % RINGS.length) * 0.6;
          const tilt = (ring.tilt * Math.PI) / 180;
          const ex = Math.cos(a) * ring.rx * w;
          const ey = Math.sin(a) * ring.ry * w * ryScale;
          const depth = Math.sin(a); // -1 back … +1 front
          const scale = 0.78 + 0.22 * ((depth + 1) / 2);
          const hw = (sizes[idx][0] * scale) / 2;
          const hh = (sizes[idx][1] * scale) / 2;
          const x = clamp(
            w / 2 + ex * Math.cos(tilt) - ey * Math.sin(tilt),
            hw,
            w - hw,
          );
          const y = clamp(
            h * ring.cy + ex * Math.sin(tilt) + ey * Math.cos(tilt),
            hh,
            h - hh,
          );
          node.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%) scale(${scale})`;
          node.style.zIndex = depth > 0 ? "30" : "5";
          node.style.opacity = String(0.4 + 0.6 * ((depth + 1) / 2));
          node.style.filter =
            depth > 0 ? "none" : `blur(${(-depth * 1.2).toFixed(2)}px)`;
        });
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const p = leonPalette(lang);
  const talk = SCENES[lang][goal];

  return (
    <section className="relative overflow-hidden bg-primary-50">
      {/* Soft wash in the current language's colour */}
      <div
        className="pointer-events-none absolute inset-0 transition-[background] duration-1000"
        style={{
          background: `radial-gradient(55% 65% at 74% 48%, ${p.bg} 0%, transparent 70%)`,
        }}
      />

      <div className="relative mx-auto grid max-w-7xl items-center gap-4 px-4 pb-20 pt-6 sm:px-6 sm:pt-16 lg:grid-cols-[1.05fr_1fr] lg:gap-x-10 lg:gap-y-0 lg:pb-28">
        {/* Headline (first on phones, top-left on desktop) */}
        <div className="order-1 text-center lg:order-none lg:col-start-1 lg:row-start-1 lg:self-end lg:text-left">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full lg:mb-5 border border-primary-100 bg-white px-4 py-1.5 text-sm font-semibold text-primary shadow-sm">
            <Mic className="h-4 w-4" style={{ color: p.body }} />
            Built for speaking, not tapping
          </div>

          <h1 className="mb-2 font-heading text-[2.1rem] lg:mb-6 sm:text-4xl font-extrabold leading-[1.08] tracking-tight text-primary md:text-5xl xl:text-[3.6rem]">
            Stop translating in your head.
            <br />
            Start speaking{" "}
            <span className="relative inline-block">
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={lang}
                  className="inline-block"
                  style={{ color: p.body }}
                  initial={{ y: "0.45em", opacity: 0 }}
                  animate={{
                    y: 0,
                    opacity: 1,
                    transition: { type: "spring", stiffness: 380, damping: 28 },
                  }}
                  exit={{
                    y: "-0.4em",
                    opacity: 0,
                    transition: { duration: 0.18 },
                  }}
                >
                  {NAME[lang]}.
                </motion.span>
              </AnimatePresence>
            </span>
          </h1>
        </div>

        {/* Body + CTA (after Léon on phones, under the headline on desktop) */}
        <div className="order-3 text-center lg:order-none lg:col-start-1 lg:row-start-2 lg:self-start lg:text-left">
          <p className="mx-auto mb-6 mt-2 max-w-xl text-base sm:text-lg lg:mb-8 lg:mt-0 leading-relaxed text-gray-600 sm:text-xl lg:mx-0">
            {aiTutorEnabled
              ? "Most apps teach you to recognise words. We get you saying them. Practise real conversations out loud with Léon, our AI tutor, then use them in live lessons with vetted tutors."
              : "Most apps teach you to recognise words. We get you saying them, in live lessons with vetted tutors and speaking practice every day in the app."}
          </p>

          <div className="flex flex-col items-center gap-4 sm:flex-row lg:items-center">
            <a
              href={signupHref}
              className="inline-flex w-full items-center justify-center gap-2.5 rounded-xl bg-primary px-8 py-4 text-lg font-bold text-white shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 hover:bg-primary-800 hover:shadow-xl sm:w-auto"
            >
              <Mic className="h-5 w-5" />
              Start speaking
              <ArrowRight className="h-5 w-5" />
            </a>
            <span className="text-sm text-gray-500">
              Free 90-second placement test when you sign up.
            </span>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-2 lg:justify-start">
            <span className="mr-1 text-sm font-medium text-gray-500">
              Speak
            </span>
            {ORDER.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => play(l, goal)}
                className="rounded-full px-3.5 py-1.5 text-sm font-semibold transition-all duration-500"
                style={
                  l === lang
                    ? { background: leonPalette(l).body, color: "#fff" }
                    : { background: "#fff", color: "#475569" }
                }
                aria-pressed={l === lang}
              >
                {FLAG[l]} {NAME[l]}
              </button>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-center gap-2 lg:justify-start">
            <span className="mr-1 text-sm font-medium text-gray-500">For</span>
            {GOALS.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => play(lang, g.id)}
                className="rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-all duration-500"
                style={
                  g.id === goal
                    ? { borderColor: p.body, color: p.dark, background: "#fff" }
                    : {
                        borderColor: "transparent",
                        color: "#475569",
                        background: "#ffffffb3",
                      }
                }
                aria-pressed={g.id === goal}
              >
                {g.icon} {g.label}
              </button>
            ))}
          </div>
        </div>

        {/* Léon, orbiting phrases, and the live exchange card */}
        <div className="order-2 mx-auto w-full max-w-[440px] lg:order-none lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:max-w-[560px]">
          <div
            ref={stage}
            className="relative aspect-[4/3] w-full sm:aspect-[6/5]"
          >
            <div className="absolute left-1/2 top-[47%] z-20 -translate-x-1/2 -translate-y-1/2">
              <div
                className="transition-[filter] duration-700"
                style={{ filter: `drop-shadow(0 24px 40px ${p.body}40)` }}
              >
                <Leon
                  language={lang}
                  mood={mood}
                  size={leonSize}
                  speech={clip}
                  cue={cue}
                  greet
                />
              </div>
            </div>

            {CHIPS.map((c, idx) => {
              const active = c.lang === lang;
              const cp = leonPalette(c.lang);
              return (
                <div
                  key={idx}
                  ref={(n) => {
                    chipEls.current[idx] = n;
                  }}
                  className="absolute left-0 top-0 will-change-transform"
                  onMouseEnter={() => {
                    paused.current = true;
                    setHovered(idx);
                  }}
                  onMouseLeave={() => {
                    paused.current = false;
                    setHovered(null);
                  }}
                >
                  <div
                    className="relative cursor-default whitespace-nowrap rounded-2xl border-2 bg-white px-2.5 py-1.5 text-xs font-bold shadow-md transition-all duration-500 sm:px-3.5 sm:py-2 sm:text-sm"
                    style={{
                      borderColor: active ? cp.body : "transparent",
                      color: active ? cp.dark : "#475569",
                      boxShadow: active ? `0 8px 24px ${cp.body}38` : undefined,
                    }}
                  >
                    <span className="mr-1.5">{FLAG[c.lang]}</span>
                    {c.text}
                    <AnimatePresence>
                      {hovered === idx && (
                        <motion.span
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="absolute left-1/2 top-full z-50 mt-1.5 -translate-x-1/2 rounded-lg bg-gray-900 px-2.5 py-1 text-xs font-medium text-white"
                        >
                          {c.gloss}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              );
            })}
          </div>

          {/* The exchange: Léon asks, you answer out loud, Léon pushes you on */}
          <div className="relative z-40 mx-auto -mt-6 w-[94%] rounded-2xl border border-white/70 bg-white/90 p-4 shadow-xl shadow-primary/10 backdrop-blur sm:-mt-10 sm:p-5">
            <AnimatePresence mode="wait">
              <motion.div
                key={lang + goal}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6, transition: { duration: 0.15 } }}
                className="space-y-2.5 text-left"
              >
                <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                  <span>
                    {GOALS.find((g) => g.id === goal)?.icon} {talk.title}
                  </span>
                  <span>
                    {FLAG[lang]} {NAME[lang]}
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span
                    className="mt-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white"
                    style={{ background: p.body }}
                  >
                    Léon
                  </span>
                  <p className="text-[15px] font-semibold text-primary">
                    {talk.leon}
                  </p>
                </div>

                <div className="flex min-h-[28px] items-center gap-2.5">
                  <span className="rounded-md bg-primary px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                    You
                  </span>
                  {phase === 0 ? (
                    <span className="text-sm text-gray-400">
                      Your turn next…
                    </span>
                  ) : (
                    <div className="flex items-center gap-2.5">
                      {phase === 1 && <Waveform color={p.body} />}
                      <WordsIn text={talk.you} />
                    </div>
                  )}
                </div>

                <AnimatePresence>
                  {phase === 2 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="overflow-hidden"
                    >
                      <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
                        <Check className="h-4 w-4 shrink-0" />
                        {talk.tip}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0">
        <svg
          viewBox="0 0 1440 80"
          fill="none"
          className="w-full"
          preserveAspectRatio="none"
        >
          <path d="M0,40 C480,80 960,0 1440,40 L1440,80 L0,80 Z" fill="white" />
        </svg>
      </div>
    </section>
  );
}

/** A small live mic meter while "you" are speaking. */
function Waveform({ color }: { color: string }) {
  return (
    <span className="flex h-5 items-center gap-[3px]" aria-hidden>
      {[0.5, 1, 0.7, 0.9, 0.4].map((h, i) => (
        <motion.span
          key={i}
          className="w-[3px] rounded-full"
          style={{ background: color, height: "100%" }}
          animate={{ scaleY: [h * 0.4, h, h * 0.5, h * 0.9, h * 0.4] }}
          transition={{
            duration: 0.9,
            repeat: Infinity,
            delay: i * 0.08,
            ease: "easeInOut",
          }}
        />
      ))}
    </span>
  );
}

/** Words appear one by one, like a live transcript. */
function WordsIn({ text }: { text: string }) {
  return (
    <p className="text-[15px] font-semibold text-gray-800">
      {text.split(" ").map((w, i) => (
        <motion.span
          key={i}
          className="mr-[0.28em] inline-block"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.22 }}
        >
          {w}
        </motion.span>
      ))}
    </p>
  );
}
