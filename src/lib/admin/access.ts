// Role gating for the admin / community-manager dashboards. Analytics queries
// run with the service role, so these checks (not RLS) are what actually scope
// what each role can load in the dashboard.

import { createClient } from "@/lib/supabase/server";

export type DashboardRole = "ADMIN" | "COMMUNITY_MANAGER";

export interface DashboardUser {
  id: string;
  role: DashboardRole;
  name: string | null;
  email: string;
}

/** Returns the signed-in dashboard user, or null if they aren't staff. */
export async function getDashboardUser(): Promise<DashboardUser | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase.from("users").select("role, name, email").eq("id", user.id).maybeSingle();
  const role = (data?.role || "").toUpperCase();
  if (role !== "ADMIN" && role !== "COMMUNITY_MANAGER") return null;

  return { id: user.id, role: role as DashboardRole, name: data?.name ?? null, email: data?.email ?? "" };
}

export function isAdmin(u: DashboardUser | null): boolean {
  return u?.role === "ADMIN";
}

/** Sections a community manager may see (moderation + engagement + support only). */
export function canSeeFinance(u: DashboardUser | null): boolean {
  return isAdmin(u);
}
export function canSeeUserPII(u: DashboardUser | null): boolean {
  return isAdmin(u);
}
