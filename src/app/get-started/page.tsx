// Role chooser — guests pick Student or Tutor, see the benefits, and route to
// the right signup.

import Link from "next/link";
import { GraduationCap, Users, ArrowRight, Check } from "lucide-react";
import { STUDENT_BENEFITS, TUTOR_BENEFITS, COMMISSION } from "@/lib/benefits";

export const metadata = {
  title: "Get started | FrancoLink",
  description: "Join FrancoLink as a student to learn French, or as a tutor to teach and earn.",
};

export default function GetStartedPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-6 py-14">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Join FrancoLink
          </h1>
          <p className="mt-3 text-slate-600">Choose how you want to start.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Student */}
          <div className="flex flex-col rounded-2xl border-2 border-blue-200 bg-white p-7 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                <GraduationCap className="h-6 w-6" />
              </span>
              <div>
                <h2 className="text-xl font-bold text-slate-900">I want to learn</h2>
                <p className="text-sm text-slate-600">Free to start</p>
              </div>
            </div>
            <ul className="mt-5 space-y-3 text-sm">
              {STUDENT_BENEFITS.map((b) => (
                <li key={b.title} className="flex gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                  <span>
                    <strong className="text-slate-900">{b.title}.</strong>{" "}
                    <span className="text-slate-600">{b.body}</span>
                  </span>
                </li>
              ))}
            </ul>
            <Link
              href="/signup"
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Sign up as a student <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Tutor */}
          <div className="flex flex-col rounded-2xl border-2 border-emerald-200 bg-white p-7 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <Users className="h-6 w-6" />
              </span>
              <div>
                <h2 className="text-xl font-bold text-slate-900">I want to teach & earn</h2>
                <p className="text-sm text-emerald-700">
                  {COMMISSION.firstMonthPct}% then {COMMISSION.recurringPct}% commission
                </p>
              </div>
            </div>
            <ul className="mt-5 space-y-3 text-sm">
              {TUTOR_BENEFITS.map((b) => (
                <li key={b.title} className="flex gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <span>
                    <strong className="text-slate-900">{b.title}.</strong>{" "}
                    <span className="text-slate-600">{b.body}</span>
                  </span>
                </li>
              ))}
            </ul>
            <Link
              href="/signup/tutor"
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Become a tutor <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-slate-500">
          Just browsing?{" "}
          <Link href="/library" className="font-medium text-blue-700 hover:underline">
            Explore the free lesson catalogue
          </Link>{" "}
          ·{" "}
          <Link href="/how-it-works" className="font-medium text-blue-700 hover:underline">
            See how it works
          </Link>
        </p>
        <p className="mt-2 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-blue-700 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
