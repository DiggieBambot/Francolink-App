import { redirect } from "next/navigation";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { Gift } from "lucide-react";
import { getDashboardUser, isAdmin } from "@/lib/admin/access";
import { GrantForm, RevokeButton } from "./grant-form";

export const dynamic = "force-dynamic";

type GrantRow = {
  id: string;
  created_at: string;
  ends_at: string;
  organization: string | null;
  reason: string;
  status: "active" | "expired" | "revoked";
  learner: { email: string | null; name: string | null } | null;
};

function fmt(d: string) {
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default async function PremiumGrantsPage() {
  const me = await getDashboardUser();
  if (!me || !isAdmin(me)) redirect("/admin");

  const db = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
  const { data, error } = await db
    .from("premium_grants")
    .select("id, created_at, ends_at, organization, reason, status, learner:user_id(email, name)")
    .order("created_at", { ascending: false })
    .limit(500);
  const rows = (data ?? []) as unknown as GrantRow[];
  const active = rows.filter((r) => r.status === "active");
  const orgs = new Set(active.map((r) => r.organization || "—"));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Gift className="w-6 h-6 text-indigo-600" />
          Premium grants
        </h1>
        <p className="text-sm text-gray-500 mt-1 max-w-2xl">
          Give Premium to business pilots and seats until a date. Learners must
          have signed up first. Grants end automatically (daily job), and paying
          customers are never touched.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Active grants" value={active.length} />
        <Stat label="Organisations with active grants" value={active.length ? orgs.size : 0} />
        <Stat label="All grants (last 500)" value={rows.length} />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">New grant</h2>
        <GrantForm />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        {error ? (
          <p className="p-6 text-sm text-red-600">
            Couldn&apos;t load grants: {error.message}. Has
            supabase/migrations/20261116_premium_grants.sql been run?
          </p>
        ) : rows.length === 0 ? (
          <p className="p-6 text-sm text-gray-500">No grants yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Learner</th>
                <th className="px-4 py-3 font-medium">Organisation</th>
                <th className="px-4 py-3 font-medium">Reason</th>
                <th className="px-4 py-3 font-medium">Granted</th>
                <th className="px-4 py-3 font-medium">Ends</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{r.learner?.name || "—"}</div>
                    <div className="text-gray-500">{r.learner?.email}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{r.organization || "—"}</td>
                  <td className="px-4 py-3 text-gray-700">{r.reason}</td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{fmt(r.created_at)}</td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{fmt(r.ends_at)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        "inline-flex px-2 py-0.5 rounded-full text-xs font-medium " +
                        (r.status === "active"
                          ? "bg-green-50 text-green-700"
                          : r.status === "revoked"
                            ? "bg-red-50 text-red-700"
                            : "bg-gray-100 text-gray-600")
                      }
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {r.status === "active" && <RevokeButton grantId={r.id} />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
    </div>
  );
}
