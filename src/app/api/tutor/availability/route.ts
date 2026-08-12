// A tutor's bookable hours: recurring weekly rules plus one-off blackouts.
//
// This route is the ONLY writer of tutor_availability. The listing editor used
// to write it too, with a delete-then-insert full replace, which would have
// silently wiped whatever was set here the next time a tutor saved their bio.
// Scheduling and profile content are separate concerns and now have separate
// owners.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { z } from "zod";

export const runtime = "nodejs";

const Rule = z.object({
  weekday: z.number().int().min(0).max(6),
  start_minute: z.number().int().min(0).max(1440),
  end_minute: z.number().int().min(0).max(1440),
});

const Blackout = z.object({
  starts_at: z.string().datetime(),
  ends_at: z.string().datetime(),
  reason: z.string().trim().max(200).optional().default(""),
});

const Body = z.object({
  rules: z.array(Rule).max(60).default([]),
  blackouts: z.array(Blackout).max(200).default([]),
  /** Admin only: manage another tutor's calendar. */
  user_id: z.uuid().optional(),
});

function serviceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { data: me } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  const role = (me?.role || "").toUpperCase();
  if (role !== "TUTOR" && role !== "ADMIN") {
    return NextResponse.json({ error: "Tutors only" }, { status: 403 });
  }

  let input;
  try {
    input = Body.parse(await request.json());
  } catch {
    return NextResponse.json(
      { error: "Those times aren't valid." },
      { status: 400 }
    );
  }

  const editingSomeoneElse = Boolean(input.user_id && input.user_id !== user.id);
  if (editingSomeoneElse && role !== "ADMIN") {
    return NextResponse.json({ error: "Admins only" }, { status: 403 });
  }
  const targetId = editingSomeoneElse ? input.user_id! : user.id;
  const db = editingSomeoneElse ? serviceClient() : supabase;

  for (const r of input.rules) {
    if (r.end_minute <= r.start_minute) {
      return NextResponse.json(
        { error: "Each block must end after it starts." },
        { status: 400 }
      );
    }
  }
  for (const b of input.blackouts) {
    if (new Date(b.ends_at) <= new Date(b.starts_at)) {
      return NextResponse.json(
        { error: "Each time off must end after it starts." },
        { status: 400 }
      );
    }
  }

  // Reject overlapping rules on the same weekday — two overlapping blocks would
  // generate duplicate slots and make the preview disagree with the booking
  // route about what's on offer.
  const byDay = new Map<number, { start: number; end: number }[]>();
  for (const r of input.rules) {
    const day = byDay.get(r.weekday) ?? [];
    if (day.some((x) => r.start_minute < x.end && x.start < r.end_minute)) {
      return NextResponse.json(
        { error: "Two blocks on the same day overlap — merge them instead." },
        { status: 400 }
      );
    }
    day.push({ start: r.start_minute, end: r.end_minute });
    byDay.set(r.weekday, day);
  }

  // Full replace for both. Simpler and safer than diffing, and the volumes are
  // tiny. Confirmed bookings are unaffected — they hold their own times.
  const { error: delRules } = await db
    .from("tutor_availability")
    .delete()
    .eq("tutor_id", targetId);
  if (delRules) {
    console.error("[tutor/availability] clearing rules failed", delRules);
    return NextResponse.json({ error: "Couldn't save your hours." }, { status: 500 });
  }

  if (input.rules.length > 0) {
    const { error } = await db
      .from("tutor_availability")
      .insert(input.rules.map((r) => ({ ...r, tutor_id: targetId })));
    if (error) {
      console.error("[tutor/availability] inserting rules failed", error);
      return NextResponse.json({ error: "Couldn't save your hours." }, { status: 500 });
    }
  }

  // Only clear blackouts from today onwards — past time off is a record of what
  // happened and shouldn't be rewritten by an edit made months later.
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  const { error: delBlackouts } = await db
    .from("tutor_blackouts")
    .delete()
    .eq("tutor_id", targetId)
    .gte("starts_at", todayStart.toISOString());
  if (delBlackouts) {
    console.error("[tutor/availability] clearing blackouts failed", delBlackouts);
    return NextResponse.json({ error: "Couldn't save your time off." }, { status: 500 });
  }

  const future = input.blackouts.filter(
    (b) => new Date(b.ends_at) >= todayStart
  );
  if (future.length > 0) {
    const { error } = await db.from("tutor_blackouts").insert(
      future.map((b) => ({
        tutor_id: targetId,
        starts_at: b.starts_at,
        ends_at: b.ends_at,
        reason: b.reason || null,
      }))
    );
    if (error) {
      console.error("[tutor/availability] inserting blackouts failed", error);
      return NextResponse.json(
        { error: "Hours saved, but your time off didn't save." },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ ok: true });
}
