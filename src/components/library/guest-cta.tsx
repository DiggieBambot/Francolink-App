import Link from "next/link";
import { GraduationCap, Users, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

/**
 * Server component. Renders a sign-up call-to-action only for logged-out
 * visitors. Logged-in users see nothing.
 */
export async function GuestCTA({ variant = "bar" }: { variant?: "bar" | "card" }) {
  let loggedIn = false;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    loggedIn = !!user;
  } catch {
    loggedIn = false;
  }
  if (loggedIn) return null;

  if (variant === "card") {
    return (
      <div className="rounded-2xl border bg-gradient-to-br from-primary-50 to-primary-50 p-6">
        <h3 className="text-lg font-bold text-slate-900">Ready to learn French?</h3>
        <p className="mt-1 text-sm text-slate-600">
          Sign up free to save progress and connect with a tutor for live lessons.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
          >
            <GraduationCap className="h-4 w-4" /> Sign up free
          </Link>
          <Link
            href="/how-it-works#tutors"
            className="inline-flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm font-semibold text-secondary-700 hover:bg-secondary-50"
          >
            <Users className="h-4 w-4" /> Teach & earn
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="border-b bg-primary-600 text-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-4 gap-y-1 px-6 py-2 text-sm">
        <span className="font-medium">
          Free to browse — sign up to save progress &amp; learn live with a tutor.
        </span>
        <Link
          href="/get-started"
          className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-0.5 text-xs font-semibold text-primary-700 hover:bg-primary-50"
        >
          Get started <ArrowRight className="h-3 w-3" />
        </Link>
        <Link href="/how-it-works#tutors" className="text-xs font-medium text-white/90 underline hover:text-white">
          Are you a tutor? Earn by teaching →
        </Link>
      </div>
    </div>
  );
}
