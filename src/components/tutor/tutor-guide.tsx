"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  HelpCircle, X, ChevronLeft, ChevronRight, Sparkles, UserPlus, Video,
  BookOpen, Highlighter, Wallet, type LucideIcon,
} from "lucide-react";

interface Slide {
  icon: LucideIcon;
  /** Tailwind gradient classes for the illustration panel. */
  gradient: string;
  /** Optional real screenshot to show instead of the illustration. */
  image?: string;
  title: string;
  body: string;
  hint?: string;
}

const SLIDES: Slide[] = [
  {
    icon: Sparkles,
    gradient: "from-primary-700 to-primary-500",
    title: "Welcome, tutor 👋",
    body: "FrancoLink gives you ready-made French lessons and a live classroom. Teach your own students, keep the session free, and earn commission. Here's how it works in 30 seconds.",
    hint: "A quick tour",
  },
  {
    icon: UserPlus,
    gradient: "from-secondary-600 to-secondary-400",
    title: "1. Add your students",
    body: "Open the People tab and share your personal invite link. When a student uses it, they appear under “Wants to join” — tap Accept and they're added to your class.",
    hint: "People tab → invite link",
  },
  {
    icon: Video,
    gradient: "from-primary-600 to-primary-400",
    title: "2. Start a session",
    body: "Click “Start Session” to open your live classroom, then copy the room link and send it to a student (any chat, email, or the People tab). They join instantly — no account hoops.",
    hint: "Start Session → copy room link",
  },
  {
    icon: BookOpen,
    gradient: "from-primary-700 to-secondary-500",
    title: "3. Pick a lesson together",
    body: "Inside the room, hit “Change lesson” to browse the full library. Choose any lesson and it opens for both of you at once — you control the pace.",
    hint: "Change lesson → browse library",
  },
  {
    icon: Highlighter,
    gradient: "from-emerald-600 to-emerald-400",
    title: "4. Teach interactively",
    body: "Click any French phrase to highlight it for your student, reveal translations when they're ready, drag-and-drop exercises, and use chat or the shared whiteboard.",
    hint: "Highlight · translate · whiteboard",
  },
  {
    icon: Wallet,
    gradient: "from-secondary-600 to-secondary-400",
    title: "5. Earn commission",
    body: "When a student you invited subscribes, you earn 10% the first month and 5% every month after — tracked automatically on your dashboard.",
    hint: "10% then 5%, every month",
  },
];

const SEEN_KEY = "francolink_tutor_guide_seen_v1";

export function TutorGuideButton({ autoOpenFirstVisit = true }: { autoOpenFirstVisit?: boolean }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!autoOpenFirstVisit) return;
    try {
      if (!localStorage.getItem(SEEN_KEY)) setOpen(true);
    } catch {
      /* ignore */
    }
  }, [autoOpenFirstVisit]);

  function close() {
    setOpen(false);
    try {
      localStorage.setItem(SEEN_KEY, "1");
    } catch {
      /* ignore */
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg border border-primary-200 bg-white px-3.5 py-2 text-sm font-semibold text-primary-700 shadow-sm transition hover:bg-primary-50"
      >
        <HelpCircle className="h-4 w-4" /> How to use
      </button>
      {open ? <GuideModal onClose={close} /> : null}
    </>
  );
}

function GuideModal({ onClose }: { onClose: () => void }) {
  const [i, setI] = useState(0);
  const last = SLIDES.length - 1;
  const go = (n: number) => setI((v) => Math.min(last, Math.max(0, n)));

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setI((v) => Math.min(last, v + 1));
      if (e.key === "ArrowLeft") setI((v) => Math.max(0, v - 1));
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [last, onClose]);

  const s = SLIDES[i];
  const Icon = s.icon;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="flex w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Illustration / picture */}
        <div className={`relative h-56 w-full overflow-hidden bg-gradient-to-br ${s.gradient}`}>
          {s.image ? (
            <Image src={s.image} alt={s.title} fill sizes="512px" className="object-cover" />
          ) : (
            <>
              <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/15 blur-2xl" />
              <div className="pointer-events-none absolute -bottom-12 -left-8 h-40 w-40 rounded-full bg-black/10 blur-2xl" />
              <div className="flex h-full items-center justify-center">
                <span className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-white/20 ring-1 ring-white/30 backdrop-blur">
                  <Icon className="h-10 w-10 text-white" />
                </span>
              </div>
              {s.hint ? (
                <span className="absolute bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-primary shadow">
                  {s.hint}
                </span>
              ) : null}
            </>
          )}
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 rounded-full bg-white/80 p-1.5 text-slate-700 transition hover:bg-white"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 pb-5 pt-5">
          <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-secondary">
            Step {i + 1} of {SLIDES.length}
          </div>
          <h2 className="font-heading text-xl font-bold text-primary">{s.title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">{s.body}</p>

          {/* Dots */}
          <div className="mt-5 flex items-center justify-center gap-1.5">
            {SLIDES.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => go(idx)}
                aria-label={`Go to step ${idx + 1}`}
                className={`h-2 rounded-full transition-all ${idx === i ? "w-6 bg-primary" : "w-2 bg-gray-200 hover:bg-gray-300"}`}
              />
            ))}
          </div>

          {/* Nav */}
          <div className="mt-5 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => go(i - 1)}
              disabled={i === 0}
              className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold text-gray-500 transition hover:bg-gray-100 disabled:opacity-0"
            >
              <ChevronLeft className="h-4 w-4" /> Back
            </button>
            {i < last ? (
              <button
                type="button"
                onClick={() => go(i + 1)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold !text-white shadow-sm transition hover:bg-primary-700"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center gap-1.5 rounded-lg bg-secondary px-5 py-2.5 text-sm font-semibold !text-white shadow-sm transition hover:bg-secondary-600"
              >
                Got it — let's go
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
