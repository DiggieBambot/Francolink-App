// Admin: everyone learning under one tutor.
//
// Two different links can tie a student to a tutor and they don't always
// agree, so both are shown side by side:
//   - tutor_students  — the teaching relationship (a student may have several)
//   - referred_by_tutor_id — who brought them in, and who earns the commission
// A student can appear through either one; the "Link" column says which.

import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Users } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { getDashboardUser, isAdmin } from "@/lib/admin/access";
import { sourceLabel, sourceStyle } from "@/lib/admin/acquisition";

export const metadata: Metadata = { title: "Tutor students | FrancoLink Admin" };
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

interface Row {
  id: string;
  name: string | null;
  email: string;
  subscription_plan: string | null;
  created_at: string | null;
  last_activity_date: string | null;
  signup_source: string | null;
  referred_by_tutor_id: string | null;
  /** tutor_students.status, or null when they are referral-only. */
  linkStatus: string | null;
}

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

const fmt = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

export default async function AdminTutorStudentsPage({ params }: PageProps) {
  const staff = await getDashboardUser();
  if (!isAdmin(staff)) redirect("/admin");

  const { id } = await params;
  const db = serviceClient();

  const { data: tutor } = await db
    .from("users")
    .select("id, name, email, role")
    .eq("id", id)
    .maybeSingle();
  if (!tutor) notFound();

  const [{ data: links }, { data: referred }] = await Promise.all([
    db.from("tutor_students").select("student_id, status").eq("tutor_id", id),
    db
      .from("users")
      .select(
        "id, name, email, subscription_plan, created_at, last_activity_date, signup_source, referred_by_tutor_id"
      )
      .eq("referred_by_tutor_id", id),
  ]);

  // Pull the profiles for taught students that the referral read didn't
  // already cover.
  const linkStatus = new Map<string, string | null>();
  for (const l of links ?? []) linkStatus.set(l.student_id as string, l.status ?? null);

  const known = new Map<string, Row>();
  for (const u of referred ?? []) {
    known.set(u.id, { ...u, linkStatus: linkStatus.get(u.id) ?? null } as Row);
  }
  const missing = [...linkStatus.keys()].filter((sid) => !known.has(sid));
  if (missing.length > 0) {
    const { data: extra } = await db
      .from("users")
      .select(
        "id, name, email, subscription_plan, created_at, last_activity_date, signup_source, referred_by_tutor_id"
      )
      .in("id", missing);
    for (const u of extra ?? []) {
      known.set(u.id, { ...u, linkStatus: linkStatus.get(u.id) ?? null } as Row);
    }
  }

  const rows = [...known.values()].sort(
    (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
  );

  const active = rows.filter((r) => r.linkStatus === "active").length;
  const pending = rows.filter((r) => r.linkStatus === "pending").length;
  const referralCount = rows.filter((r) => r.referred_by_tutor_id === id).length;
  const paying = rows.filter(
    (r) => r.subscription_plan && r.subscription_plan !== "FREE"
  ).length;

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/tutors"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Tutors
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          Students under {tutor.name || tutor.email}
        </h1>
        <p className="text-gray-500 mt-1">
          Everyone taught by or referred by this tutor.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          ["Teaching", active],
          ["Pending", pending],
          ["Referred", referralCount],
          ["Paying", paying],
        ].map(([label, value]) => (
          <div
            key={label as string}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-4"
          >
            <p className="text-2xl font-bold text-gray-900 tabular-nums">{value}</p>
            <p className="text-sm text-gray-500">{label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Student", "Link", "Plan", "Came from", "Joined", "Last active", ""].map(
                  (h, i) => (
                    <th
                      key={h || i}
                      className="text-left px-6 py-4 text-sm font-semibold text-gray-900"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((r) => {
                const taught = r.linkStatus !== null;
                const isReferral = r.referred_by_tutor_id === id;
                return (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{r.name || "No name"}</p>
                      <p className="text-sm text-gray-500">{r.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {taught && (
                          <span
                            className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                              r.linkStatus === "active"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {r.linkStatus === "active" ? "Teaching" : r.linkStatus}
                          </span>
                        )}
                        {isReferral && (
                          <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                            Referred
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {r.subscription_plan === "PREMIUM_PLUS"
                        ? "Premium+"
                        : r.subscription_plan === "PREMIUM"
                          ? "Premium"
                          : "Free"}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${sourceStyle(
                          isReferral ? "referral" : r.signup_source
                        )}`}
                      >
                        {isReferral ? "Referral" : sourceLabel(r.signup_source)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                      {fmt(r.created_at)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                      {fmt(r.last_activity_date)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/admin/users/${r.id}`}
                        className="text-indigo-600 hover:text-indigo-800 font-medium text-sm"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })}

              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">
                      No students are linked to this tutor yet.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
