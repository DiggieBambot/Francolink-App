// Moderation — recent room chat (user-generated content). Admin + community mgr.

import { redirect } from "next/navigation";
import Link from "next/link";
import { MessageSquare, LifeBuoy } from "lucide-react";
import { getDashboardUser } from "@/lib/admin/access";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export default async function ModerationPage() {
  const me = await getDashboardUser();
  if (!me) redirect("/admin/login");

  const svc = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const { data: msgs } = await svc
    .from("tutor_lesson_messages")
    .select("id, session_id, sender_name, sender_role, text, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="mx-auto max-w-3xl p-4 md:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 font-heading text-2xl font-bold text-primary md:text-3xl">
            <MessageSquare className="h-6 w-6" /> Moderation
          </h1>
          <p className="text-sm text-gray-500">Recent classroom chat — newest first</p>
        </div>
        <Link href="/admin/support" className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-sm font-semibold text-primary hover:bg-gray-50">
          <LifeBuoy className="h-4 w-4" /> Support
        </Link>
      </div>

      {(msgs || []).length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-12 text-center text-gray-400">
          No classroom messages yet.
        </div>
      ) : (
        <div className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-soft">
          {(msgs || []).map((m) => (
            <div key={m.id} className="flex items-start gap-3 px-5 py-3">
              <span className={`mt-0.5 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${m.sender_role === "tutor" ? "bg-emerald-100 text-emerald-700" : "bg-primary-50 text-primary"}`}>
                {m.sender_role || "user"}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-gray-800">{m.text}</p>
                <p className="text-xs text-gray-400">{m.sender_name || "Someone"} · {new Date(m.created_at).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
