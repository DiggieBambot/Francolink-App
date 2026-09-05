import { UpcomingClasses } from "@/components/dashboard/upcoming-classes";
import { getUpcomingClasses } from "@/lib/booking/upcoming";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Users, BookOpen, ArrowRight, Wallet, TrendingUp, Link2, GraduationCap, Sparkles,
  CalendarDays,
} from "lucide-react";
import { CopyButton } from "@/components/tutor/copy-button";
import { TutorGuideButton } from "@/components/tutor/tutor-guide";
import { TutorLadderCard } from "@/components/tutor/ladder-card";

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

  // Is this tutor already a FrancoLink tutor (listed and paid by us), or have
  // they applied? Drives the banner below — distinct from simply having a
  // TUTOR account, which only means they can teach students they brought.
  const [{ data: flProfile }, { data: flApplication }] = await Promise.all([
    supabase
      .from("tutor_public_profiles")
      .select("slug, approval_status, is_public, accepts_bookings")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("tutor_applications")
      .select("status")
      .eq("applicant_user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  const isListed =
    flProfile?.approval_status === "approved" &&
    flProfile?.is_public &&
    flProfile?.accepts_bookings;

  // Ladder standing, but only for a listed tutor — a tutor teaching students
  // they brought themselves is not paid per lesson by us, so a pay ladder
  // would be describing money that doesn't apply to them.
  const { data: standing } = isListed
    ? await supabase.rpc("tutor_ladder_standing", { p_tutor: user.id })
    : { data: null };
  const applicationOpen = ["new", "reviewing", "interviewing"].includes(
    flApplication?.status ?? ""
  );

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const inviteLink = me?.tutor_invite_code ? `${appUrl}/join/${me.tutor_invite_code}` : null;
  const planLabel = me?.tutor_plan === "PREMIUM" ? "Premium" : me?.tutor_plan === "PREMIUM_PLUS" ? "Premium+" : "Basic";

  // Booked, paid lessons. Best-effort: this page must render without them.
  let bookedClasses: Awaited<ReturnType<typeof getUpcomingClasses>> = [];
  try {
    bookedClasses = await getUpcomingClasses(user.id, "tutor", { limit: 6 });
  } catch (e) {
    console.error("[tutor/dashboard] booked classes failed", e);
  }

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
        <div className="flex items-center gap-2">
          <TutorGuideButton />
          <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">
            {planLabel} tutor
          </span>
        </div>
      </div>

      {/* What is actually happening today, above the standings and the stats.
          A tutor opening this page with a class in ten minutes needs the class,
          not their pay ladder — and until now the dashboard mentioned neither
          their booked lessons nor a route to the schedule. */}
      <UpcomingClasses classes={bookedClasses} role="tutor" />

      {/* Where they stand on the pay ladder. Listed tutors only. */}
      {standing && <TutorLadderCard standing={standing} />}

      {/* Become a FrancoLink tutor — we send the students and pay per lesson.
          Hidden once they're listed; shows status while an application is open. */}
      {!isListed && (
        <div className="rounded-2xl border border-secondary-200 bg-gradient-to-br from-secondary-50 to-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-secondary-700">
                <Sparkles className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-wide">
                  Earning opportunity
                </span>
              </div>
              <h2 className="mt-2 text-lg font-bold text-slate-900">
                Become a FrancoLink tutor
              </h2>
              <p className="mt-1 max-w-2xl text-sm text-slate-600">
                Right now you teach students you bring yourself. Get listed on
                francolink.net and we&apos;ll send you students, take the payment,
                and pay you a fixed amount per lesson.
              </p>
            </div>
            {applicationOpen ? (
              <span className="shrink-0 rounded-xl bg-warning-light px-4 py-2.5 text-sm font-bold text-amber-900">
                Application under review
              </span>
            ) : (
              <Link
                href="/tutor/apply"
                className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white hover:bg-primary-800"
              >
                Apply to join
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </div>
      )}

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
            <Link2 className="h-4 w-4 text-secondary-600" /> Your class code &amp; invite link
          </div>
          <p className="mb-3 text-sm text-slate-500">
            Give students your class code, or share the link. When they join and subscribe, you earn 10% then 5% every month.
          </p>
          {me?.tutor_invite_code ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 rounded-lg border border-secondary-200 bg-secondary-50 p-2.5">
                <span className="text-xs font-semibold uppercase tracking-wide text-secondary-700">Code</span>
                <span className="flex-1 font-mono text-lg font-bold tracking-widest text-secondary-800">{me.tutor_invite_code}</span>
                <CopyButton text={me.tutor_invite_code} />
              </div>
              {inviteLink && (
                <div className="flex items-center gap-2 rounded-lg border bg-slate-50 p-2">
                  <span className="flex-1 truncate text-sm text-slate-700">{inviteLink}</span>
                  <CopyButton text={inviteLink} />
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-400">No invite code yet — refresh your profile.</p>
          )}
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border bg-white p-5">
          <div className="text-sm font-semibold text-slate-700">Quick actions</div>
          <Link
            href="/tutor/students"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700"
          >
            <Sparkles className="h-4 w-4" /> Start a session
          </Link>
          <p className="-mt-1 text-center text-xs text-slate-400">
            Pick a student to open their private room.
          </p>
          <Link href="/library" className="inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            <BookOpen className="h-4 w-4" /> Browse lessons
          </Link>
          <Link href="/tutor/schedule" className="inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            <CalendarDays className="h-4 w-4" /> Schedule
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
