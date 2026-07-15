// POST /api/tutor/class-requests/resolve  { id, status: "done" | "declined" }
// The tutor clears a class request from their list once handled.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

function svc() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { id, status } = await req.json().catch(() => ({}));
  if (!id || (status !== "done" && status !== "declined")) {
    return NextResponse.json({ error: "id and a valid status are required" }, { status: 400 });
  }

  const { error } = await svc()
    .from("class_requests")
    .update({ status })
    .eq("id", id)
    .eq("tutor_id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
