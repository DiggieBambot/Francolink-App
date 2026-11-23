"use client";

// Dev-only playground for Professor Léon's animation library: every mood and
// gesture, typed sentences played through text-driven lip sync with the speech
// bubble, an optional audio file through the analyser, and still sheets of
// every pose and mouth shape.

import { notFound } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Leon,
  LeonSpeechBubble,
  GESTURE_NAMES,
  LEON_MOODS,
  POSE_NAMES,
  VISEMES,
  bandBuffers,
  buildSpeechTrack,
  readVoiceBands,
  silentBands,
  type GestureName,
  type LeonCue,
  type LeonMood,
  type SpeechClip,
  type VoiceBands,
} from "@/components/ai-tutor/leon";
import { takeSentences } from "@/hooks/use-tutor-tts";

const LANGS = [
  { code: "fr", name: "French" },
  { code: "es", name: "Spanish" },
  { code: "en", name: "English" },
];

const SAMPLES: Record<string, string> = {
  fr: "Bonjour ! Je m'appelle Léon, et aujourd'hui on va parler de la boulangerie. Tu préfères le pain ou les croissants ?",
  es: "¡Hola! Me llamo Léon y hoy vamos a practicar los verbos. ¿Qué hiciste el fin de semana?",
  en: "Hello there! My name is Léon, and today we're going to practise ordering food. What would you like to eat?",
};

export default function LeonPreviewPage() {
  const [lang, setLang] = useState("fr");
  const [mood, setMood] = useState<LeonMood>("idle");
  const [cue, setCue] = useState<LeonCue | null>(null);
  const [text, setText] = useState(SAMPLES.fr);
  const [rate, setRate] = useState(1);
  const [clip, setClip] = useState<SpeechClip | null>(null);
  const [said, setSaid] = useState<string | null>(null);
  const [useMeter, setUseMeter] = useState(true);
  const voiceLevel = useRef(0);
  const voiceBands = useRef<VoiceBands>(silentBands());
  const micLevel = useRef(0);
  const leonBox = useRef<HTMLDivElement>(null);
  const visemeOut = useRef<HTMLSpanElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const meterRaf = useRef(0);

  if (process.env.NODE_ENV === "production") notFound();

  // Show the live mouth shape the engine picked (read from the SVG, no state).
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const v = leonBox.current?.querySelector("svg")?.dataset.viseme ?? "";
      if (visemeOut.current && visemeOut.current.textContent !== v) visemeOut.current.textContent = v;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // A scripting hook for recording demo videos: drive Léon from the console
  // or a headless browser, e.g. leonPlayground.say("Bonjour !", 1.4).
  useEffect(() => {
    const w = window as unknown as { leonPlayground?: object };
    w.leonPlayground = {
      say: (s: string, duration?: number) => {
        const startedAt = performance.now();
        setSaid(s);
        setMood("speaking");
        setClip({
          text: s,
          startedAt,
          duration: duration ?? buildSpeechTrack(s, lang).duration,
          position: () => (performance.now() - startedAt) / 1000,
        });
      },
      hush: () => {
        setClip(null);
        setMood("idle");
      },
      mood: (m: LeonMood) => setMood(m),
      gesture: (g: GestureName) => setCue((c) => ({ gesture: g, id: (c?.id ?? 0) + 1 })),
      language: (l: string) => setLang(l),
      mic: (level: number) => (micLevel.current = level),
    };
    return () => {
      delete w.leonPlayground;
    };
  }, [lang]);

  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
      cancelAnimationFrame(meterRaf.current);
    },
    []
  );

  const stop = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    audioRef.current?.pause();
    cancelAnimationFrame(meterRaf.current);
    voiceLevel.current = 0;
    Object.assign(voiceBands.current, silentBands());
    setClip(null);
    setMood("idle");
  };

  /** Say `text` sentence by sentence with text-only lip sync (no audio). */
  const speakText = () => {
    stop();
    const sentences = takeSentences(text, true).sentences;
    setSaid(text);
    let at = 0;
    sentences.forEach((s, i) => {
      const dur = buildSpeechTrack(s, lang).duration / rate;
      timers.current.push(
        setTimeout(() => {
          const startedAt = performance.now();
          setMood("speaking");
          setClip({ text: s, startedAt, duration: dur, position: () => (performance.now() - startedAt) / 1000 });
        }, at * 1000)
      );
      at += dur + 0.25;
      if (i === sentences.length - 1)
        timers.current.push(
          setTimeout(() => {
            setClip(null);
            setMood("idle");
          }, (at - 0.2) * 1000)
        );
    });
  };

  /** Play an audio file through an analyser, with the typed text as its transcript. */
  const playFile = async (file: File) => {
    stop();
    if (!audioRef.current) audioRef.current = new Audio();
    const el = audioRef.current;
    if (!analyserRef.current) {
      const ctx = new AudioContext();
      const src = ctx.createMediaElementSource(el);
      const an = ctx.createAnalyser();
      an.fftSize = 512;
      an.smoothingTimeConstant = 0.5;
      src.connect(an);
      an.connect(ctx.destination);
      analyserRef.current = an;
    }
    void (analyserRef.current.context as AudioContext).resume();
    el.src = URL.createObjectURL(file);
    await new Promise((r) => (el.onloadedmetadata = r));
    const an = analyserRef.current;
    const buf = bandBuffers(an);
    const tick = () => {
      if (useMeter) {
        readVoiceBands(an, buf, voiceBands.current);
        voiceLevel.current = voiceBands.current.level;
      }
      meterRaf.current = requestAnimationFrame(tick);
    };
    tick();
    const transcript = text.trim();
    setSaid(transcript || null);
    setMood("speaking");
    setClip({ text: transcript, startedAt: performance.now(), duration: el.duration, position: () => el.currentTime });
    el.onended = () => stop();
    await el.play();
  };

  const play = (g: GestureName) => setCue((c) => ({ gesture: g, id: (c?.id ?? 0) + 1 }));

  const btn = (active: boolean) =>
    `px-3 py-1.5 rounded-lg text-sm capitalize ${active ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`;

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Professor Léon · animation playground</h1>

        <section className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 grid md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-6">
          <div className="flex flex-col items-center">
            <div className="w-full max-w-md min-h-[7rem] flex flex-col justify-end pb-5">
              <LeonSpeechBubble language={lang} text={said} speech={clip} tailX="46%" />
            </div>
            <div ref={leonBox} className="w-[220px] h-[220px] sm:w-[260px] sm:h-[260px]">
              <Leon
                language={lang}
                mood={mood}
                size={260}
                className="w-full h-full"
                cue={cue}
                speech={clip}
                voiceLevel={voiceLevel}
                voiceBands={voiceBands}
                micLevel={micLevel}
              />
            </div>
            <p className="mt-2 text-xs text-gray-500">
              mood <b>{mood}</b> · mouth <b ref={visemeOut} data-testid="viseme" />
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1.5">Language</p>
              <div className="flex flex-wrap gap-2">
                {LANGS.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => {
                      setLang(l.code);
                      setText(SAMPLES[l.code]);
                    }}
                    className={btn(lang === l.code)}
                  >
                    {l.name}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1.5">Mood</p>
              <div className="flex flex-wrap gap-2">
                {LEON_MOODS.map((m) => (
                  <button key={m} onClick={() => setMood(m)} className={btn(mood === m)}>
                    {m}
                  </button>
                ))}
              </div>
              <p className="mt-1 text-xs text-gray-400">
                Listening: hold “Fake mic” to make him nod along.
              </p>
              <button
                onPointerDown={() => {
                  setMood("listening");
                  const iv = setInterval(() => (micLevel.current = 0.2 + Math.random() * 0.6), 80);
                  const up = () => {
                    clearInterval(iv);
                    micLevel.current = 0;
                    window.removeEventListener("pointerup", up);
                  };
                  window.addEventListener("pointerup", up);
                }}
                className="mt-2 px-3 py-1.5 rounded-lg text-sm bg-red-50 text-red-700"
              >
                Fake mic (hold)
              </button>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1.5">Gestures</p>
              <div className="flex flex-wrap gap-2">
                {GESTURE_NAMES.map((g) => (
                  <button key={g} onClick={() => play(g)} className={btn(false)}>
                    {g}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1.5">Say something</p>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-gray-200 p-2 text-sm"
              />
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <button onClick={speakText} className="px-3 py-1.5 rounded-lg text-sm bg-primary text-white">
                  Speak (text lip sync)
                </button>
                <button onClick={stop} className={btn(false)}>
                  Stop
                </button>
                <label className="text-xs text-gray-500 flex items-center gap-1">
                  pace
                  <input type="range" min={0.6} max={1.5} step={0.1} value={rate} onChange={(e) => setRate(+e.target.value)} />
                  {rate.toFixed(1)}×
                </label>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                <label className="cursor-pointer px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700">
                  Play an audio file…
                  <input
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void playFile(f);
                      e.target.value = "";
                    }}
                  />
                </label>
                <label className="flex items-center gap-1">
                  <input type="checkbox" checked={useMeter} onChange={(e) => setUseMeter(e.target.checked)} />
                  use the analyser (untick = iPhone-style, text only)
                </label>
              </div>
              <p className="mt-1 text-xs text-gray-400">The text box is used as the file&apos;s transcript.</p>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow-sm p-4 sm:p-6">
          <p className="text-sm text-gray-500 mb-3">Mouth shapes (visemes)</p>
          <div className="flex flex-wrap gap-3">
            {VISEMES.map((v) => (
              <figure key={v} className="text-center">
                <Leon language={lang} size={92} still viseme={v} />
                <figcaption className="text-xs text-gray-500 mt-1">{v}</figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow-sm p-4 sm:p-6">
          <p className="text-sm text-gray-500 mb-3">Poses</p>
          <div className="flex flex-wrap gap-3">
            {POSE_NAMES.map((p) => (
              <figure key={p} className="text-center">
                <Leon language={lang} size={110} still pose={p} />
                <figcaption className="text-xs text-gray-500 mt-1">{p}</figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 overflow-x-auto">
          <table className="mx-auto">
            <thead>
              <tr>
                <th />
                {LEON_MOODS.map((m) => (
                  <th key={m} className="px-2 pb-2 text-xs font-medium text-gray-500 capitalize">
                    {m}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {LANGS.map((l) => (
                <tr key={l.code}>
                  <td className="pr-3 text-sm text-gray-600">{l.name}</td>
                  {LEON_MOODS.map((m) => (
                    <td key={m} className="p-2">
                      <Leon language={l.code} mood={m} size={88} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="bg-white rounded-2xl shadow-sm p-4 sm:p-6">
          <p className="text-sm text-gray-500 mb-3">Small sizes (header 40px, thread 32px still)</p>
          <div className="flex items-center gap-4">
            {LANGS.map((l) => (
              <div key={l.code} className="flex items-center gap-2">
                <Leon language={l.code} size={40} />
                <Leon language={l.code} size={32} still />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
