import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Every lesson-worker route is admin-only. Returns the caller's id, or a
 *  response to return immediately. */
export async function requireAdmin(): Promise<
  { userId: string; error: null } | { userId: null; error: NextResponse }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { userId: null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();

  if (profile?.role !== "ADMIN") {
    return { userId: null, error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { userId: user.id, error: null };
}
