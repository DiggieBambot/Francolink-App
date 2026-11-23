// src/app/api/ai-tutor/phrases/route.ts
//
// The student's review deck: phrases saved from tutor recaps.
//
//   GET    ?due=1        → cards due now (default: all, newest first)
//   POST   { items }     → save cards (duplicates are ignored)
//   PATCH  { id, grade } → record a review: "again" | "good" | "easy"
//   DELETE { id }        → remove a card
//
// Runs on the request-scoped client: students own these rows outright and RLS
// restricts every statement to them.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const MAX_ITEMS = 30;

async function requireUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function GET(request: NextRequest) {
  const { supabase, user } = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dueOnly = request.nextUrl.searchParams.get("due") === "1";
  let query = supabase
    .from("ai_tutor_saved_phrases")
    .select("id, language, front, back, note, source, due_at, interval_days, reps, created_at")
    .eq("user_id", user.id);

  query = dueOnly
    ? query.lte("due_at", new Date().toISOString()).order("due_at", { ascending: true }).limit(50)
    : query.order("created_at", { ascending: false }).limit(500);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: "Review deck unavailable" }, { status: 500 });
  }

  const { count } = await supabase
    .from("ai_tutor_saved_phrases")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  return NextResponse.json({ phrases: data ?? [], total: count ?? 0 });
}

interface SaveItem {
  front?: string;
  back?: string;
  note?: string;
  source?: string;
  conversationId?: string;
  language?: string;
}

export async function POST(request: NextRequest) {
  const { supabase, user } = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const items: SaveItem[] = Array.isArray(body.items) ? body.items.slice(0, MAX_ITEMS) : [];

  const rows = items
    .map((i) => ({
      user_id: user.id,
      language: String(i.language ?? "fr").slice(0, 5),
      front: String(i.front ?? "").trim().slice(0, 200),
      back: String(i.back ?? "").trim().slice(0, 300),
      note: i.note ? String(i.note).trim().slice(0, 300) : null,
      source: ["correction", "vocab", "manual"].includes(String(i.source))
        ? String(i.source)
        : "manual",
      conversation_id: i.conversationId ?? null,
    }))
    .filter((r) => r.front && r.back);

  if (rows.length === 0) {
    return NextResponse.json({ error: "Nothing to save" }, { status: 400 });
  }

  const { error } = await supabase
    .from("ai_tutor_saved_phrases")
    .upsert(rows, { onConflict: "user_id,language,front", ignoreDuplicates: true });

  if (error) {
    console.error("Save phrases error:", error);
    return NextResponse.json({ error: "Couldn't save to your review deck" }, { status: 500 });
  }
  return NextResponse.json({ saved: rows.length });
}

/**
 * SM-2, simplified to three buttons. "Again" brings the card back in ten
 * minutes and makes it harder; "good" grows the interval by the ease factor;
 * "easy" grows it faster and makes the card easier.
 */
function schedule(
  grade: "again" | "good" | "easy",
  card: { interval_days: number; ease: number; reps: number }
) {
  const ease = Number(card.ease) || 2.5;
  if (grade === "again") {
    return {
      interval_days: 0,
      ease: Math.max(1.3, ease - 0.2),
      reps: 0,
      due_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    };
  }

  const newEase = grade === "easy" ? Math.min(3.0, ease + 0.15) : ease;
  let interval: number;
  if (card.reps === 0) interval = grade === "easy" ? 3 : 1;
  else if (card.reps === 1) interval = grade === "easy" ? 6 : 3;
  else interval = Math.round(card.interval_days * newEase * (grade === "easy" ? 1.3 : 1));

  return {
    interval_days: interval,
    ease: newEase,
    reps: card.reps + 1,
    due_at: new Date(Date.now() + interval * 24 * 3600 * 1000).toISOString(),
  };
}

export async function PATCH(request: NextRequest) {
  const { supabase, user } = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, grade } = await request.json();
  if (!id || !["again", "good", "easy"].includes(grade)) {
    return NextResponse.json({ error: "id and grade are required" }, { status: 400 });
  }

  const { data: card } = await supabase
    .from("ai_tutor_saved_phrases")
    .select("interval_days, ease, reps")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!card) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const next = schedule(grade, card);
  const { error } = await supabase
    .from("ai_tutor_saved_phrases")
    .update(next)
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: "Couldn't save review" }, { status: 500 });
  return NextResponse.json({ ok: true, due_at: next.due_at });
}

export async function DELETE(request: NextRequest) {
  const { supabase, user } = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  await supabase.from("ai_tutor_saved_phrases").delete().eq("id", id).eq("user_id", user.id);
  return NextResponse.json({ ok: true });
}
