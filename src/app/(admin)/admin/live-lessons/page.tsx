// src/app/(admin)/admin/live-lessons/page.tsx
//
// The tutor marketplace: listed tutors only (same rule as the public
// directory). Unlisted tutors teaching their own students are counted on a
// separate line, and each one's numbers are on the Users tab.
//
// Every marketplace number comes from getTutorFunnel (lib/analytics/
// tutor-funnel.ts) so this page, the Users tab and a tutor's own Insights page
// can never disagree. Demo accounts are left out everywhere.
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { isDemoEmail } from "@/lib/demo";
import { getListingStatuses, getTutorFunnel, pct, emptyNumbers } from "@/lib/analytics/tutor-funnel";
import {
  CalendarCheck,
  DollarSign,
  Percent,
  GraduationCap,
  Package,
  Repeat,
  ShoppingCart,
  Users,
} from "lucide-react";

export const metadata: Metadata = { title: "Live lessons | Admin" };
export const dynamic = "force-dynamic";

function service() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

async function assertAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  const { data } = await supabase.from("users").select("role").eq("id", user.id).single();
  if ((data?.role || "").toUpperCase() !== "ADMIN") redirect("/admin/login");
}

const money = (cents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
const fmtPct = (v: number | null) => (v === null ? "—" : `${v}%`);

const STATUS_STYLE: Record<string, string> = {
  confirmed: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  pending_payment: "bg-yellow-100 text-yellow-700",
  expired: "bg-gray-100 text-gray-500",
  cancelled_by_student: "bg-red-100 text-red-700",
  cancelled_by_tutor: "bg-red-100 text-red-700",
  no_show_student: "bg-orange-100 text-orange-700",
  no_show_tutor: "bg-orange-100 text-orange-700",
};

interface PageProps {
  searchParams: Promise<{ range?: string }>;
}

export default async function LiveLessonsPage({ searchParams }: PageProps) {
  await assertAdmin();
  const { range = "month" } = await searchParams;
  const db = service();

  const now = new Date();
  const since =
    range === "30d"
      ? new Date(now.getTime() - 30 * 86400_000)
      : range === "all"
        ? new Date(0)
        : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const sinceIso = since.toISOString();
  const weekAgo = new Date(now.getTime() - 7 * 86400_000).toISOString();

  const listing = await getListingStatuses(db);
  const listedIds = Array.from(listing.entries())
    .filter(([, v]) => v.status === "listed")
    .map(([id]) => id);

  const [funnel, tutorsRes, packsRes, recentRes, abandonedRes, sessionsRes, linkedRes, cancelRes] =
    await Promise.all([
      getTutorFunnel(db, { since, tutorIds: listedIds }),
      listedIds.length
        ? db.from("users").select("id, name, email, tutor_plan, created_at").in("id", listedIds)
        : Promise.resolve({ data: [] as { id: string; name: string | null; email: string; tutor_plan: string | null; created_at: string }[] }),
      db
        .from("starter_pack_purchases")
        .select("user_id, price_cents")
        .eq("status", "paid")
        .gte("paid_at", sinceIso)
        .limit(10000),
      db
        .from("bookings")
        .select("id, tutor_id, student_id, starts_at, status, price_cents, is_trial")
        .order("created_at", { ascending: false })
        .limit(40),
      db
        .from("bookings")
        .select("id, tutor_id, student_id, starts_at, created_at, price_cents")
        .eq("status", "expired")
        .gte("created_at", weekAgo)
        .order("created_at", { ascending: false })
        .limit(50),
      // Tutor-run rooms with no booking behind them: tutors' own students.
      db
        .from("tutor_lesson_sessions")
        .select("id, tutor_id, student_id, status")
        .gte("created_at", sinceIso)
        .limit(20000),
      db.from("bookings").select("room_session_id").not("room_session_id", "is", null).limit(20000),
      db
        .from("bookings")
        .select("tutor_id, status")
        .gte("starts_at", sinceIso)
        .in("status", ["cancelled_by_student", "cancelled_by_tutor", "no_show_student", "no_show_tutor"])
        .limit(20000),
    ]);

  const listedSet = new Set(listedIds);
  const tutors = (tutorsRes.data ?? []).filter((t) => !isDemoEmail(t.email));

  // Names for every person mentioned below, in one read.
  const recentRaw = (recentRes.data ?? []).filter((b) => listedSet.has(b.tutor_id));
  const abandonedRaw = (abandonedRes.data ?? []).filter((b) => listedSet.has(b.tutor_id));
  const peopleIds = new Set<string>();
  for (const b of [...recentRaw, ...abandonedRaw]) {
    peopleIds.add(b.tutor_id);
    peopleIds.add(b.student_id);
  }
  for (const s of sessionsRes.data ?? []) {
    peopleIds.add(s.tutor_id);
    peopleIds.add(s.student_id);
  }
  for (const p of packsRes.data ?? []) peopleIds.add(p.user_id);
  const { data: people } = peopleIds.size
    ? await db.from("users").select("id, name, email").in("id", Array.from(peopleIds))
    : { data: [] as { id: string; name: string | null; email: string }[] };
  const person = new Map((people ?? []).map((p) => [p.id, p]));
  const isDemo = (id: string) => isDemoEmail(person.get(id)?.email);
  const nameOf = (id: string) => person.get(id)?.name || person.get(id)?.email || "Unknown";

  const recent = recentRaw.filter((b) => !isDemo(b.student_id) && !isDemo(b.tutor_id)).slice(0, 25);
  const abandoned = abandonedRaw.filter((b) => !isDemo(b.student_id) && !isDemo(b.tutor_id));
  const packs = (packsRes.data ?? []).filter((p) => !isDemo(p.user_id));
  const packRevenue = packs.reduce((n, p) => n + p.price_cents, 0);

  const linked = new Set((linkedRes.data ?? []).map((r) => r.room_session_id as string));
  const ownSessions = (sessionsRes.data ?? []).filter(
    (s) => !linked.has(s.id) && !isDemo(s.student_id) && !isDemo(s.tutor_id) && s.status !== "cancelled"
  );
  const ownTutors = new Set(ownSessions.map((s) => s.tutor_id));
  const ownStudents = new Set(ownSessions.map((s) => s.student_id));

  const cancels = (cancelRes.data ?? []).filter((b) => listedSet.has(b.tutor_id));
  const cancelled = cancels.filter((b) => b.status.startsWith("cancelled")).length;
  const noShows = cancels.length - cancelled;

  const t = funnel.total;
  const commission = t.revenueCents - t.tutorPayCents;

  // Students per tutor (all-time).
  const { data: studentRows } = listedIds.length
    ? await db.from("users").select("referred_by_tutor_id, email").in("referred_by_tutor_id", listedIds)
    : { data: [] as { referred_by_tutor_id: string; email: string }[] };
  const studentCount = new Map<string, number>();
  for (const s of studentRows ?? []) {
    if (isDemoEmail(s.email)) continue;
    studentCount.set(s.referred_by_tutor_id, (studentCount.get(s.referred_by_tutor_id) ?? 0) + 1);
  }

  const planCounts = new Map<string, number>();
  for (const tu of tutors) {
    const p = tu.tutor_plan || "FREE";
    planCounts.set(p, (planCounts.get(p) ?? 0) + 1);
  }

  const tutorRows = tutors
    .map((tu) => ({
      ...tu,
      slug: listing.get(tu.id)?.slug,
      students: studentCount.get(tu.id) ?? 0,
      n: funnel.perTutor.get(tu.id) ?? emptyNumbers(),
    }))
    .sort((a, b) => b.n.revenueCents - a.n.revenueCents || b.n.views - a.n.views);

  const rangeLabel = range === "30d" ? "last 30 days" : range === "all" ? "all time" : "this month";

  const steps = [
    { label: "Directory views", value: funnel.directoryViews },
    { label: "Profile views", value: t.views, sub: `${t.uniqueVisitors} people` },
    { label: "Booking clicks", value: t.slotClicks },
    { label: "Started checkout", value: t.checkouts },
    { label: "Paid", value: t.paid },
    { label: "First lesson", value: t.firstLessons },
    { label: "Came back", value: t.repeatStudents },
  ];

  const tiles = [
    { label: "Lessons taught", value: t.completed, sub: `${cancelled} cancelled · ${noShows} no-shows`, icon: CalendarCheck, tone: "text-green-600 bg-green-50" },
    { label: "Lesson revenue", value: money(t.revenueCents), sub: `${t.paid} paid bookings`, icon: DollarSign, tone: "text-emerald-600 bg-emerald-50" },
    { label: "FrancoLink share", value: money(commission), sub: "price minus tutor pay", icon: Percent, tone: "text-indigo-600 bg-indigo-50" },
    { label: "Pack sales", value: money(packRevenue), sub: `${packs.length} packs paid`, icon: Package, tone: "text-purple-600 bg-purple-50" },
    { label: "Abandoned checkouts", value: t.abandoned, sub: `of ${t.checkouts} started`, icon: ShoppingCart, tone: "text-orange-600 bg-orange-50" },
    { label: "Repeat students", value: t.repeatStudents, sub: "booked the same tutor again", icon: Repeat, tone: "text-sky-600 bg-sky-50" },
    { label: "Listed tutors", value: tutors.length, sub: "in the public directory", icon: GraduationCap, tone: "text-gray-600 bg-gray-100" },
    { label: "Tutors' own students", value: ownSessions.length, sub: `${ownStudents.size} students · ${ownTutors.size} tutors, outside the marketplace`, icon: Users, tone: "text-gray-600 bg-gray-100" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Live lessons</h1>
          <p className="text-gray-500 mt-1">
            Listed tutors, {rangeLabel}. Unlisted tutors are on{" "}
            <Link href="/admin/users?role=tutor" className="text-indigo-600 hover:underline">Users → Tutors</Link>.
          </p>
          {funnel.trackingSince && (
            <p className="text-xs text-gray-400 mt-1">
              Views, clicks and favourites are recorded since{" "}
              {new Date(funnel.trackingSince).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}.
            </p>
          )}
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 text-sm">
          {[
            ["month", "This month"],
            ["30d", "30 days"],
            ["all", "All time"],
          ].map(([key, label]) => (
            <Link
              key={key}
              href={`/admin/live-lessons?range=${key}`}
              className={`px-3 py-1.5 rounded-md ${range === key ? "bg-white shadow-sm font-medium text-gray-900" : "text-gray-600 hover:text-gray-900"}`}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

      {/* Funnel */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Booking funnel</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {steps.map((s, i) => (
            <div key={s.label} className="rounded-lg bg-gray-50 p-3">
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-600">{s.label}</p>
              {s.sub && <p className="text-[11px] text-gray-400">{s.sub}</p>}
              {i > 0 && (
                <p className="text-[11px] mt-1 font-medium text-indigo-600">
                  {fmtPct(pct(s.value, steps[i - 1].value))} continued
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {tiles.map((x) => (
          <div key={x.label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${x.tone}`}>
                <x.icon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-bold text-gray-900">{x.value}</p>
                <p className="text-sm text-gray-700">{x.label}</p>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">{x.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Sources */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-900">Where profile visitors come from</h2>
          <p className="text-xs text-gray-500 mb-3">utm_source when a link has one, otherwise the referring site.</p>
          <table className="w-full text-sm">
            <thead className="text-left text-gray-500">
              <tr>
                <th className="py-1 font-medium">Source</th>
                <th className="py-1 font-medium text-right">Views</th>
                <th className="py-1 font-medium text-right">Booking clicks</th>
                <th className="py-1 font-medium text-right">Click rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {funnel.bySource.slice(0, 12).map((s) => (
                <tr key={s.source}>
                  <td className="py-1.5">{s.source}</td>
                  <td className="py-1.5 text-right">{s.views}</td>
                  <td className="py-1.5 text-right">{s.slotClicks}</td>
                  <td className="py-1.5 text-right text-gray-500">{fmtPct(pct(s.slotClicks, s.views))}</td>
                </tr>
              ))}
              {funnel.bySource.length === 0 && (
                <tr><td colSpan={4} className="py-6 text-center text-gray-400">No visits recorded yet</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Abandoned checkouts */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-900">Abandoned checkouts</h2>
          <p className="text-xs text-gray-500 mb-3">Last 7 days: reached payment, didn&apos;t pay. Worth a follow-up message.</p>
          <ul className="divide-y divide-gray-100 text-sm">
            {abandoned.slice(0, 12).map((b) => (
              <li key={b.id} className="py-2 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <Link href={`/admin/users/${b.student_id}`} className="font-medium text-gray-900 hover:text-indigo-600">
                    {nameOf(b.student_id)}
                  </Link>
                  <p className="text-xs text-gray-500 truncate">
                    with {nameOf(b.tutor_id)} ·{" "}
                    {new Date(b.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                  </p>
                </div>
                <span className="text-gray-600">{money(b.price_cents)}</span>
              </li>
            ))}
            {abandoned.length === 0 && <li className="py-6 text-center text-gray-400">None in the last 7 days</li>}
          </ul>
        </div>
      </div>

      {/* Tutor plans */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center gap-2 mb-3">
          <GraduationCap className="w-5 h-5 text-gray-500" />
          <h2 className="font-semibold text-gray-900">Plans of listed tutors</h2>
          <Link href="/admin/pricing/tutor-plans" className="ml-auto text-sm text-indigo-600 hover:underline">
            Edit plans
          </Link>
        </div>
        <div className="flex flex-wrap gap-2">
          {Array.from(planCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([plan, n]) => (
              <span key={plan} className="px-3 py-1.5 rounded-full bg-gray-100 text-sm text-gray-700">
                {plan} <span className="font-semibold">{n}</span>
              </span>
            ))}
          {planCounts.size === 0 && <span className="text-sm text-gray-400">No listed tutors</span>}
        </div>
      </div>

      {/* Tutors table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Listed tutors</h2>
          <p className="text-xs text-gray-500">Numbers are for {rangeLabel}; students is all-time.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-600">
              <tr>
                <th className="px-4 py-3 font-medium">Tutor</th>
                <th className="px-4 py-3 font-medium">Plan</th>
                <th className="px-4 py-3 font-medium text-right">Students</th>
                <th className="px-4 py-3 font-medium text-right">Views</th>
                <th className="px-4 py-3 font-medium text-right">Favourites</th>
                <th className="px-4 py-3 font-medium text-right">Bookings</th>
                <th className="px-4 py-3 font-medium text-right">View→booking</th>
                <th className="px-4 py-3 font-medium text-right">Lessons</th>
                <th className="px-4 py-3 font-medium text-right">Repeat</th>
                <th className="px-4 py-3 font-medium text-right">Revenue</th>
                <th className="px-4 py-3 font-medium text-right">Tutor pay</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tutorRows.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link href={`/admin/users/${r.id}`} className="font-medium text-gray-900 hover:text-indigo-600">
                      {r.name || "No name"}
                    </Link>
                    <p className="text-xs text-gray-500">{r.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full bg-gray-100 text-xs font-medium text-gray-700">
                      {r.tutor_plan || "FREE"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/tutors/${r.id}/students`} className="hover:text-indigo-600">{r.students}</Link>
                  </td>
                  <td className="px-4 py-3 text-right">{r.n.views}</td>
                  <td className="px-4 py-3 text-right">{r.n.favoritesAdded}</td>
                  <td className="px-4 py-3 text-right">{r.n.paid}</td>
                  <td className="px-4 py-3 text-right text-gray-500">{fmtPct(pct(r.n.paid, r.n.views))}</td>
                  <td className="px-4 py-3 text-right">{r.n.completed}</td>
                  <td className="px-4 py-3 text-right">{r.n.repeatStudents}</td>
                  <td className="px-4 py-3 text-right">{money(r.n.revenueCents)}</td>
                  <td className="px-4 py-3 text-right text-gray-500">{money(r.n.tutorPayCents)}</td>
                </tr>
              ))}
              {tutorRows.length === 0 && (
                <tr>
                  <td colSpan={11} className="px-5 py-10 text-center text-gray-500">No listed tutors yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent bookings */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Recent bookings</h2>
          <p className="text-xs text-gray-500">Latest 25 with listed tutors, any status.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-600">
              <tr>
                <th className="px-5 py-3 font-medium">Lesson time</th>
                <th className="px-5 py-3 font-medium">Student</th>
                <th className="px-5 py-3 font-medium">Tutor</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recent.map((b) => (
                <tr key={b.id}>
                  <td className="px-5 py-3 text-gray-700">
                    {new Date(b.starts_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                    {b.is_trial && <span className="ml-2 text-xs text-amber-600 font-medium">Trial</span>}
                  </td>
                  <td className="px-5 py-3">
                    <Link href={`/admin/users/${b.student_id}`} className="hover:text-indigo-600">{nameOf(b.student_id)}</Link>
                  </td>
                  <td className="px-5 py-3">{nameOf(b.tutor_id)}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLE[b.status] ?? "bg-gray-100 text-gray-600"}`}>
                      {b.status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">{money(b.price_cents)}</td>
                </tr>
              ))}
              {recent.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-gray-500">No bookings yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
