import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Users, BookOpen, ArrowRight, Wallet, TrendingUp, Link2, GraduationCap, Sparkles,
} from "lucide-react";
import { CopyButton } from "@/components/tutor/copy-button";

export const dynamic = "force-dynamic";

function money(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n || 0);
}

export default async function TutorDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: me } = await supabase
    .from("users")
    .select("name, tutor_plan, commission_balance, tutor_invite_code")
    .eq("id", user.id)
    .single();

  // Students (connected) + paying.
  const { count: studentCount } = await supabase
    .from("tutor_students")
    .select("*", { count: "exact", head: true })
    .eq("tutor_id", user.id)
    .eq("status", "active");
  const { count: payingCount } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true })
    .eq("referred_by_tutor_id", user.id)
    .not("subscription_plan", "in", '("FREE","free")');

  // Earnings: lifetime + this month, from the ledger.
  const { data: ledger } = await supabase
    .from("commission_ledger")
    .select("amount, created_at")
    .eq("tutor_id", user.id);
  const lifetime = (ledger || []).reduce((s, r) => s + parseFloat(String(r.amount || 0)), 0);
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const thisMonth = (ledger || [])
    .filter((r) => new Date(r.created_at) >= monthStart)
    .reduce((s, r) => s + parseFloat(String(r.amount || 0)), 0);
  const balance = parseFloat(String(me?.commission_balance || "0"));

  // Recent lesson spaces.
  const { data: spaces } = await supabase
    .from("tutor_lesson_sessions")
    .select("id, student_id, tutor_lesson_id, updated_at, users:student_id(name, email), tutor_lessons:tutor_lesson_id(title)")
    .eq("tutor_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(5);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const inviteLink = me?.tutor_invite_code ? `${appUrl}/join/${me.tutor_invite_code}` : null;
  const planLabel = me?.tutor_plan === "PREMIUM" ? "Premium" : me?.tutor_plan === "PREMIUM_PLUS" ? "Premium+" : "Basic";

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome back{me?.name ? `, ${me.name.split(" ")[0]}` : ""} 👋
          </h1>
          <p className="text-sm text-slate-500">Here&apos;s your teaching at a glance.</p>
        </div>
        <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">
          {planLabel} tutor
        </span>
      </div>

      {/* Earnings + students stat row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-secondary-200 bg-gradient-to-br from-secondary-50 to-white p-5">
          <div className="flex items-center gap-2 text-secondary-700">
            <Wallet className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wide">Balance</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{money(balance)}</p>
          <p className="text-xs text-slate-500">available to withdraw</p>
        </div>
        <div className="rounded-2xl border bg-white p-5">
          <div className="flex items-center gap-2 text-secondary-700">
            <TrendingUp className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wide">This month</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{money(thisMonth)}</p>
          <p className="text-xs text-slate-500">{money(lifetime)} lifetime</p>
        </div>
        <div className="rounded-2xl border bg-white p-5">
          <div className="flex items-center gap-2 text-primary-700">
            <Users className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wide">Students</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{studentCount || 0}</p>
          <p className="text-xs text-slate-500">{payingCount || 0} paying</p>
        </div>
        <div className="rounded-2xl border bg-white p-5">
          <div className="flex items-center gap-2 text-primary-700">
            <GraduationCap className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wide">Commission</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">10% / 5%</p>
          <p className="text-xs text-slate-500">first month / recurring</p>
        </div>
      </div>

      {/* Invite + quick actions */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border bg-white p-5 lg:col-span-2">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Link2 className="h-4 w-4 text-secondary-600" /> Your invite link
          </div>
          <p className="mb-3 text-sm text-slate-500">
            Share this with students. When they join and subscribe, you earn 10% then 5% every month.
          </p>
          {inviteLink ? (
            <div className="flex items-center gap-2 rounded-lg border bg-slate-50 p-2">
              <span className="flex-1 truncate text-sm text-slate-700">{inviteLink}</span>
              <CopyButton text={inviteLink} />
            </div>
          ) : (
            <p className="text-sm text-slate-400">No invite code yet — refresh your profile.</p>
          )}
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border bg-white p-5">
          <div className="text-sm font-semibold text-slate-700">Quick actions</div>
          <Link
            href="/space/new"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700"
          >
            <Sparkles className="h-4 w-4" /> Start a session
          </Link>
          <p className="-mt-1 text-center text-xs text-slate-400">
            Opens your classroom — invite a student from inside with the room link.
          </p>
          <Link href="/library" className="inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            <BookOpen className="h-4 w-4" /> Browse lessons
          </Link>
          <Link href="/tutor/commisions" className="inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            <Wallet className="h-4 w-4" /> Earnings &amp; payouts
          </Link>
        </div>
      </div>

      {/* Recent spaces */}
      <div className="rounded-2xl border bg-white p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">Recent lesson spaces</h2>
          <Link href="/tutor/students" className="text-xs font-medium text-primary-700 hover:underline">
            All students →
          </Link>
        </div>
        {spaces && spaces.length > 0 ? (
          <ul className="divide-y">
            {spaces.map((sp) => {
              const u = sp.users as unknown as { name?: string; email?: string } | null;
              const l = sp.tutor_lessons as unknown as { title?: string } | null;
              return (
                <li key={sp.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <div className="text-sm font-medium text-slate-900">{u?.name || u?.email || "Student"}</div>
                    <div className="text-xs text-slate-500">{l?.title || "No lesson yet"}</div>
                  </div>
                  <Link href={`/room/${sp.id}`} className="inline-flex items-center gap-1 rounded-lg bg-primary-50 px-3 py-1.5 text-xs font-semibold text-primary-700 hover:bg-primary-100">
                    Open <ArrowRight className="h-3 w-3" />
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="py-6 text-center text-sm text-slate-400">
            No lesson spaces yet. Invite a student and open one.
          </p>
        )}
      </div>
    </div>
  );
}
