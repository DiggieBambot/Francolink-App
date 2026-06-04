// Public "How it works" / benefits page — explains the student and tutor paths.

import Link from "next/link";
import { GraduationCap, Users, ArrowRight, Check } from "lucide-react";
import { STUDENT_BENEFITS, TUTOR_BENEFITS, COMMISSION } from "@/lib/benefits";
import { PublicShell } from "@/components/layout/public-shell";

export const metadata = {
  title: "How FrancoLink works | For students & tutors",
  description:
    "Browse French lessons free, learn live with a tutor, or teach and earn commission. Here's how FrancoLink works for students and tutors.",
};

export default function HowItWorksPage() {
  return (
    <PublicShell>
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <header className="bg-gradient-to-br from-primary-500 to-primary-700">
        <div className="mx-auto max-w-5xl px-6 py-16 text-center text-white">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">How FrancoLink works</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/90">
            Free French lessons, live tutoring, and a way for tutors to earn. Pick your path.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a
              href="#students"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-primary-700 hover:bg-primary-50"
            >
              <GraduationCap className="h-4 w-4" /> I want to learn
            </a>
            <a
              href="#tutors"
              className="inline-flex items-center gap-2 rounded-lg bg-white/15 px-5 py-3 text-sm font-semibold text-white backdrop-blur hover:bg-white/25"
            >
              <Users className="h-4 w-4" /> I want to teach & earn
            </a>
          </div>
        </div>
      </header>

      {/* Students */}
      <section id="students" className="mx-auto max-w-5xl scroll-mt-8 px-6 py-16">
        <div className="mb-8 flex items-center gap-3">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary-100 text-primary-700">
            <GraduationCap className="h-6 w-6" />
          </span>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">For students</h2>
            <p className="text-sm text-slate-600">Learn French your way — free to start.</p>
          </div>
        </div>
        <div className="grid gap-5 sm:grid-cols-3">
          {STUDENT_BENEFITS.map((b) => (
            <div key={b.title} className="rounded-2xl border bg-white p-5 shadow-sm">
              <div className="text-3xl">{b.emoji}</div>
              <h3 className="mt-3 font-semibold text-slate-900">{b.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{b.body}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-5 py-3 text-sm font-semibold text-white hover:bg-primary-700"
          >
            Sign up as a student <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/library"
            className="inline-flex items-center gap-2 rounded-lg border bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Browse lessons free
          </Link>
        </div>
      </section>

      {/* Tutors */}
      <section id="tutors" className="scroll-mt-8 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <div className="mb-8 flex items-center gap-3">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-secondary-100 text-secondary-700">
              <Users className="h-6 w-6" />
            </span>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">For tutors</h2>
              <p className="text-sm text-slate-600">Teach with ready-made lessons and earn.</p>
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            {TUTOR_BENEFITS.map((b) => (
              <div key={b.title} className="rounded-2xl border bg-slate-50 p-5">
                <div className="text-3xl">{b.emoji}</div>
                <h3 className="mt-3 font-semibold text-slate-900">{b.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{b.body}</p>
              </div>
            ))}
          </div>

          {/* Commission math */}
          <div className="mt-8 rounded-2xl border border-secondary-200 bg-secondary-50 p-6">
            <h3 className="font-semibold text-secondary-900">How tutor earnings work</h3>
            <ol className="mt-3 space-y-2 text-sm text-secondary-900">
              <li className="flex gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-secondary-600" />
                Share your unique invite link with your students.
              </li>
              <li className="flex gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-secondary-600" />
                They sign up under you and study live with you — for free.
              </li>
              <li className="flex gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-secondary-600" />
                When a student subscribes for solo practice, you earn{" "}
                <strong>{COMMISSION.firstMonthPct}% the first month</strong> and{" "}
                <strong>{COMMISSION.recurringPct}% every month after</strong>.
              </li>
            </ol>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/signup/tutor"
              className="inline-flex items-center gap-2 rounded-lg bg-secondary-600 px-5 py-3 text-sm font-semibold text-white hover:bg-secondary-700"
            >
              Become a tutor <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/pricing/tutors"
              className="inline-flex items-center gap-2 rounded-lg border bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              See tutor plans
            </Link>
          </div>
        </div>
      </section>
    </div>
    </PublicShell>
  );
}
