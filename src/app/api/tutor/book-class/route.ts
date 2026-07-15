// POST /api/tutor/book-class  { message?, preferredTime? }
// A connected student asks their tutor for a class. Records the request and
// notifies the tutor (in-app + email).

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { notifyUser } from "@/lib/notifications/create";
import { notifyTutorClassRequest } from "@/lib/email/transactional";

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

  const body = await req.json().catch(() => ({}));
  const message = typeof body.message === "string" ? body.message.trim().slice(0, 500) : null;
  const preferredTime = typeof body.preferredTime === "string" ? body.preferredTime.trim().slice(0, 120) : null;

  const service = svc();
  const { data: me } = await service
    .from("users")
    .select("name, referred_by_tutor_id")
    .eq("id", user.id)
    .maybeSingle();

  const tutorId = me?.referred_by_tutor_id;
  if (!tutorId) {
    return NextResponse.json({ error: "You're not connected to a tutor yet." }, { status: 400 });
  }

  const { error } = await service.from("class_requests").insert({
    student_id: user.id,
    tutor_id: tutorId,
    message,
    preferred_time: preferredTime,
    status: "open",
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await notifyUser({
    userId: tutorId,
    type: "class_request",
    title: "A student wants to book a class",
    body: `${me?.name || "A student"} requested a class${preferredTime ? ` (${preferredTime})` : ""}.`,
    url: "/tutor/students",
  });
  await notifyTutorClassRequest(tutorId, me?.name, message, preferredTime);

  return NextResponse.json({ ok: true });
}
