import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getFeaturesConfig } from "@/lib/config/settings";

// With the tutor switched off in Admin → Settings → AI, students are sent back
// to the dashboard instead of landing on an "unavailable" page — the tutor is
// meant to be absent, not broken. Admins and testers still get through, the
// same exemption the API makes, so it can be tried before switching back on.
export default async function AiTutorLayout({ children }: { children: React.ReactNode }) {
  const { aiTutorEnabled } = await getFeaturesConfig();
  if (aiTutorEnabled) return children;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (profile?.role !== "ADMIN" && profile?.role !== "TESTER") redirect("/dashboard");

  return children;
}
