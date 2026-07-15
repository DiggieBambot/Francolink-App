// POST /api/email/welcome — send the current user their welcome email (once).
// Called by the signup forms after account creation. Idempotent server-side.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendWelcomeOnce } from "@/lib/email/transactional";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  await sendWelcomeOnce(user.id);
  return NextResponse.json({ ok: true });
}
