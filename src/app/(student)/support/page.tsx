import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { HelpSupport } from "@/components/support/help-support";

export const metadata: Metadata = { title: "Help & support | Francolink" };
export const dynamic = "force-dynamic";

export default async function StudentSupportPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: me } = await supabase.from("users").select("name, email").eq("id", user.id).maybeSingle();

  return <HelpSupport name={me?.name} email={me?.email || user.email} notificationsHref="/notifications" />;
}
