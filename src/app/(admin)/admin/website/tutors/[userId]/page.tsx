// Admin-authored tutor listing. Renders the same form the tutor sees, in admin
// mode: writes to the selected tutor's row and can publish without waiting for
// the tutor to fill anything in themselves.

import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { getDashboardUser, isAdmin } from "@/lib/admin/access";
import { PublicProfileForm } from "@/components/tutor/public-profile-form";
import { SITE_URL } from "@/lib/site/hosts";

export const metadata: Metadata = { title: "Edit tutor listing | FrancoLink Admin" };
export const dynamic = "force-dynamic";

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export default async function AdminTutorProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const staff = await getDashboardUser();
  if (!isAdmin(staff)) redirect("/admin");

  const { userId } = await params;
  const db = serviceClient();

  const { data: tutor } = await db
    .from("users")
    .select("id, name, email, role, tutor_invite_code")
    .eq("id", userId)
    .maybeSingle();
  const role = (tutor?.role || "").toUpperCase();
  if (!tutor || (role !== "TUTOR" && role !== "ADMIN")) notFound();

  const [{ data: profile }, { data: availability }] = await Promise.all([
    db.from("tutor_public_profiles").select("*").eq("user_id", userId).maybeSingle(),
    db
      .from("tutor_availability")
      .select("weekday, start_minute, end_minute")
      .eq("tutor_id", userId)
      .order("weekday")
      .order("start_minute"),
  ]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link
        href="/admin/website"
        className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-primary mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Website
      </Link>

      <header className="mb-8">
        <h1 className="font-heading font-extrabold text-2xl text-primary">
          {tutor.name || "Unnamed tutor"}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {tutor.email}
          {tutor.tutor_invite_code ? ` · class code ${tutor.tutor_invite_code}` : ""}
        </p>
        <p className="mt-3 text-sm text-gray-600">
          You&apos;re editing this tutor&apos;s public listing on their behalf.
          Tick &ldquo;Approve and publish&rdquo; at the bottom to put it live
          straight away.
        </p>
        {!tutor.tutor_invite_code && (
          <p className="mt-3 text-sm text-amber-900 bg-warning-light px-4 py-3 rounded-xl">
            This tutor has no class code, so the profile&apos;s booking button
            will fall back to the generic signup page.
          </p>
        )}
      </header>

      <PublicProfileForm
        tutorName={tutor.name || ""}
        profile={profile ?? null}
        siteUrl={SITE_URL}
        targetUserId={tutor.id}
      />
    </div>
  );
}
