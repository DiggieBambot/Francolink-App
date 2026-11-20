// Tutor marketplace numbers for one tutor, on the admin user detail page.
// Same source as Live Lessons and the tutor's own Insights page.
import Link from "next/link";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { getListingStatuses, getTutorFunnel, emptyNumbers, pct, LISTING_LABEL } from "@/lib/analytics/tutor-funnel";
import { siteUrl } from "@/lib/site/hosts";
import { isDemoEmail } from "@/lib/demo";

const money = (cents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);

export async function TutorStatsCard({ tutorId }: { tutorId: string }) {
  const db = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
  const since30 = new Date(Date.now() - 30 * 86400_000);
  const [listing, f30, fAll, { data: students }] = await Promise.all([
    getListingStatuses(db),
    getTutorFunnel(db, { since: since30, tutorIds: [tutorId] }),
    getTutorFunnel(db, { since: new Date(0), tutorIds: [tutorId] }),
    db.from("users").select("email").eq("referred_by_tutor_id", tutorId),
  ]);
  const l = listing.get(tutorId);
  const status = l?.status ?? "not_applied";
  const studentCount = (students ?? []).filter((s) => !isDemoEmail(s.email)).length;

  const cols = [
    { label: "Last 30 days", n: f30.perTutor.get(tutorId) ?? emptyNumbers() },
    { label: "All time", n: fAll.perTutor.get(tutorId) ?? emptyNumbers() },
  ];
  const rows: [string, (n: ReturnType<typeof emptyNumbers>) => string | number][] = [
    ["Profile views", (n) => `${n.views} (${n.uniqueVisitors} people)`],
    ["Favourites", (n) => n.favoritesAdded - n.favoritesRemoved],
    ["Booking clicks", (n) => n.slotClicks],
    ["Started checkout", (n) => n.checkouts],
    ["Paid bookings", (n) => n.paid],
    ["View → booking", (n) => { const p = pct(n.paid, n.views); return p === null ? "—" : `${p}%`; }],
    ["Lessons taught", (n) => n.completed],
    ["Repeat students", (n) => n.repeatStudents],
    ["Revenue", (n) => money(n.revenueCents)],
    ["Tutor pay", (n) => money(n.tutorPayCents)],
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Tutor marketplace</h2>
        <span className="px-2 py-0.5 rounded-full bg-gray-100 text-xs font-medium text-gray-700">
          {LISTING_LABEL[status]}
        </span>
        <span className="text-sm text-gray-500">{studentCount} students</span>
        {status === "listed" && l?.slug && (
          <a href={siteUrl(`/tutors/${l.slug}`)} target="_blank" rel="noopener noreferrer" className="ml-auto text-sm text-indigo-600 hover:underline">
            Public profile ↗
          </a>
        )}
        <Link href={`/admin/tutors/${tutorId}/students`} className={`${status === "listed" ? "" : "ml-auto "}text-sm text-indigo-600 hover:underline`}>
          Students
        </Link>
      </div>
      <table className="w-full text-sm">
        <thead className="text-left text-gray-500">
          <tr>
            <th className="py-1 font-medium" />
            {cols.map((c) => (
              <th key={c.label} className="py-1 font-medium text-right">{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map(([label, fn]) => (
            <tr key={label}>
              <td className="py-1.5 text-gray-600">{label}</td>
              {cols.map((c) => (
                <td key={c.label} className="py-1.5 text-right text-gray-900">{fn(c.n)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
