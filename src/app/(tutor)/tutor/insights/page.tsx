// A tutor's own marketplace numbers: how many people see their profile, save
// it, try to book, book, and come back.
//
// Same source as the admin pages (lib/analytics/tutor-funnel.ts). Tutors see
// counts for anonymous visitors, never who they were; the only names shown
// are signed-in students who saved them, so the tutor can say hello.
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { getListingStatuses, getTutorFunnel, emptyNumbers, pct } from "@/lib/analytics/tutor-funnel";
import { isDemoEmail } from "@/lib/demo";
import { siteUrl } from "@/lib/site/hosts";
import { Eye, Heart, MousePointerClick, CalendarCheck, Repeat, DollarSign, Lightbulb, MessageSquare } from "lucide-react";

export const metadata: Metadata = { title: "Profile insights" };
export const dynamic = "force-dynamic";

const money = (cents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);

interface PageProps {
  searchParams: Promise<{ range?: string }>;
}

export default async function TutorInsightsPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { range = "30d" } = await searchParams;
  const days = range === "7d" ? 7 : range === "all" ? null : 30;
  const since = days ? new Date(Date.now() - days * 86400_000) : new Date(0);

  const db = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const [listing, funnel, favsRes, paidRes] = await Promise.all([
    getListingStatuses(db),
    getTutorFunnel(db, { since, tutorIds: [user.id] }),
    db.from("tutor_favorites").select("student_id, created_at").eq("tutor_id", user.id),
    db
      .from("bookings")
      .select("student_id")
      .eq("tutor_id", user.id)
      .in("status", ["confirmed", "completed", "no_show_student"]),
  ]);

  const me = listing.get(user.id);
  const n = funnel.perTutor.get(user.id) ?? emptyNumbers();

  // Signed-in students who saved this tutor but haven't booked yet.
  const booked = new Set((paidRes.data ?? []).map((b) => b.student_id));
  const savedIds = (favsRes.data ?? []).filter((f) => !booked.has(f.student_id)).map((f) => f.student_id);
  const { data: savedPeople } = savedIds.length
    ? await db.from("users").select("id, name, email").in("id", savedIds)
    : { data: [] as { id: string; name: string | null; email: string }[] };
  const saved = (savedPeople ?? []).filter((p) => !isDemoEmail(p.email));
  const totalFavs = (favsRes.data ?? []).length;

  const viewToBook = pct(n.paid, n.views);
  const tiles = [
    { label: "Profile views", value: n.views, sub: `${n.uniqueVisitors} different people`, icon: Eye, tone: "bg-sky-50 text-sky-600" },
    { label: "Saved you", value: n.favoritesAdded, sub: `${totalFavs} signed-in students in total`, icon: Heart, tone: "bg-rose-50 text-rose-600" },
    { label: "Tried to book", value: n.slotClicks, sub: `${n.checkouts} reached payment`, icon: MousePointerClick, tone: "bg-amber-50 text-amber-600" },
    { label: "Bookings", value: n.paid, sub: viewToBook === null ? "—" : `${viewToBook}% of views`, icon: CalendarCheck, tone: "bg-green-50 text-green-600" },
    { label: "Came back", value: n.repeatStudents, sub: "students who booked again", icon: Repeat, tone: "bg-indigo-50 text-indigo-600" },
    { label: "Earned", value: money(n.tutorPayCents), sub: `${n.completed} lessons taught`, icon: DollarSign, tone: "bg-emerald-50 text-emerald-600" },
  ];

  // Plain-language nudges, only when the numbers point at something.
  const tips: string[] = [];
  if (me?.status !== "listed") tips.push("Your profile isn't in the public directory yet, so students can't find you there. Finish your public profile or check your application.");
  if (n.views >= 20 && n.slotClicks / Math.max(n.views, 1) < 0.05) tips.push("Lots of people view your profile but few try to book. A short intro video and a clear first line about who you help usually make the difference.");
  if (n.slotClicks >= 5 && n.slotClicks > n.checkouts * 2) tips.push("Students click to book but don't find a time that works. Try opening more hours in Availability, especially evenings and weekends.");
  if (n.checkouts >= 3 && n.abandoned / Math.max(n.checkouts, 1) > 0.5) tips.push("Several students reached payment and stopped. A trial lesson or a message to students who saved you can help them decide.");
  if (n.paid >= 3 && n.repeatStudents === 0) tips.push("No one has booked a second lesson yet. Ending each class with homework and a suggested next time helps students come back.");
  if (n.views < 5 && me?.status === "listed") tips.push("Few profile views so far. Share your profile link on social media or with your network — every visit is counted here.");

  const maxDay = Math.max(1, ...funnel.byDay.map((d) => d.views));

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Profile insights</h1>
          <p className="text-gray-500 mt-1 text-sm">
            How students find you and book you on FrancoLink.
            {me?.status === "listed" && me.slug && (
              <>
                {" "}
                <a href={siteUrl(`/tutors/${me.slug}`)} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                  View your profile ↗
                </a>
              </>
            )}
          </p>
          {funnel.trackingSince && (
            <p className="text-xs text-gray-400 mt-1">
              Views and saves are counted since{" "}
              {new Date(funnel.trackingSince).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}.
            </p>
          )}
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 text-sm">
          {[
            ["7d", "7 days"],
            ["30d", "30 days"],
            ["all", "All time"],
          ].map(([key, label]) => (
            <Link
              key={key}
              href={`/tutor/insights?range=${key}`}
              className={`px-3 py-1.5 rounded-md ${range === key ? "bg-white shadow-sm font-medium text-gray-900" : "text-gray-600 hover:text-gray-900"}`}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {tiles.map((t) => (
          <div key={t.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className={`inline-flex p-2 rounded-lg ${t.tone}`}>
              <t.icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-2">{t.value}</p>
            <p className="text-sm text-gray-700">{t.label}</p>
            <p className="text-xs text-gray-400">{t.sub}</p>
          </div>
        ))}
      </div>

      {tips.length > 0 && (
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-5 h-5 text-amber-600" />
            <h2 className="font-semibold text-amber-900">Ideas to get more bookings</h2>
          </div>
          <ul className="list-disc pl-5 space-y-1 text-sm text-amber-900">
            {tips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 mb-3">Profile views by day</h2>
          {funnel.byDay.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">No views recorded in this period yet.</p>
          ) : (
            <div className="flex items-end gap-1 h-32" role="img" aria-label="Profile views by day">
              {funnel.byDay.map((d) => (
                <div key={d.day} className="flex-1 min-w-[4px] group relative">
                  <div
                    className="bg-sky-400 rounded-t hover:bg-sky-500"
                    style={{ height: `${Math.max(4, (d.views / maxDay) * 128)}px` }}
                    title={`${d.day}: ${d.views} views`}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 mb-3">Where visitors come from</h2>
          <ul className="divide-y divide-gray-100 text-sm">
            {funnel.bySource.slice(0, 8).map((s) => (
              <li key={s.source} className="py-1.5 flex justify-between">
                <span className="text-gray-700">{s.source === "direct" ? "Direct / link shared" : s.source}</span>
                <span className="text-gray-900 font-medium">{s.views}</span>
              </li>
            ))}
            {funnel.bySource.length === 0 && <li className="py-8 text-center text-gray-400">Nothing yet</li>}
          </ul>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-semibold text-gray-900">Saved you, haven&apos;t booked yet</h2>
        <p className="text-xs text-gray-500 mb-3">
          Signed-in students only. People who saved you without an account are counted above but not named.
        </p>
        {saved.length === 0 ? (
          <p className="text-sm text-gray-400 py-4">No one waiting right now.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {saved.map((p) => (
              <li key={p.id} className="py-2 flex items-center justify-between">
                <span className="text-sm text-gray-900">{(p.name || "A student").split(" ")[0]}</span>
                <Link href="/messages" className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:underline">
                  <MessageSquare className="w-4 h-4" /> Message
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
