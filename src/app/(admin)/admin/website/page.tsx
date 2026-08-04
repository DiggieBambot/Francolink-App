// Admin control for francolink.net: approve tutor listings, curate
// testimonials and FAQs, and read the contact inbox.

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { getDashboardUser, isAdmin } from "@/lib/admin/access";
import { WebsiteAdmin } from "@/components/admin/website-admin";
import { SITE_URL } from "@/lib/site/hosts";

export const metadata: Metadata = { title: "Website | FrancoLink Admin" };
export const dynamic = "force-dynamic";

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export default async function AdminWebsitePage() {
  const staff = await getDashboardUser();
  if (!isAdmin(staff)) redirect("/admin");

  const db = serviceClient();

  const [profiles, testimonials, faqs, messages] = await Promise.all([
    db
      .from("tutor_public_profiles")
      .select(
        "user_id, slug, headline, teaches, levels, hourly_rate_cents, currency, is_public, approval_status, rejection_reason, display_order, updated_at, users:users!tutor_public_profiles_user_id_fkey(name, email)"
      )
      .order("approval_status", { ascending: true })
      .order("updated_at", { ascending: false }),
    db
      .from("testimonials")
      .select("*")
      .order("display_order")
      .order("created_at", { ascending: false }),
    db.from("site_faqs").select("*").order("category").order("display_order"),
    db
      .from("contact_messages")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  // Every tutor account, so you can author a listing for one directly instead
  // of waiting for them to fill it in themselves.
  const { data: allTutors } = await db
    .from("users")
    .select("id, name, email, tutor_invite_code")
    .eq("role", "TUTOR")
    .order("name", { ascending: true });

  const withProfile = new Set(
    (profiles.data ?? []).map((p: { user_id: string }) => p.user_id)
  );

  return (
    <WebsiteAdmin
      siteUrl={SITE_URL}
      profiles={profiles.data ?? []}
      testimonials={testimonials.data ?? []}
      faqs={faqs.data ?? []}
      messages={messages.data ?? []}
      tutors={(allTutors ?? []).map((t) => ({
        ...t,
        has_profile: withProfile.has(t.id),
      }))}
    />
  );
}
