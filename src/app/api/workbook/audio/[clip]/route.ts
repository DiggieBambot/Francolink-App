// Serving one audio clip.
//
// The pack lives in a PRIVATE Supabase bucket rather than in the deployment.
// Two reasons: 144 clips is ~12MB that would otherwise ride along in every
// build of every function, and regenerating a clip should not require a
// deploy — re-run the generator, re-upload, done.
//
// Entitlement is checked here, per request, because the audio pack is the $17
// order bump and not everyone who owns the workbook has bought it. The bucket
// is private and the URL handed back is short-lived, so a link that leaks
// stops working rather than becoming a permanent free copy.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET = "workbook-audio";
/** Long enough to play a 30-second dialogue, short enough that a leak dies. */
const TTL_SECONDS = 60 * 30;

function service() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ clip: string }> }
) {
  const { clip } = await params;

  // The clip id becomes a storage path, so it may only be what the manifest
  // generates: digits, letters, dots and hyphens. No slashes, no traversal.
  if (!/^[a-z0-9][a-z0-9.-]{0,60}\.mp3$/i.test(clip)) {
    return NextResponse.json({ error: "No such clip." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to listen." }, { status: 401 });
  }

  const db = service();
  const { data: orders } = await db
    .from("digital_orders")
    .select("id, digital_order_items(product_key)")
    .eq("user_id", user.id)
    .eq("status", "paid");

  const owned = new Set<string>();
  for (const o of orders ?? []) {
    for (const i of (o.digital_order_items ?? []) as { product_key: string }[]) {
      owned.add(i.product_key);
    }
  }

  if (!owned.has("audio_fpp")) {
    // Deliberately explicit rather than a bare 403: someone hitting this owns
    // the workbook and simply skipped the bump, and the useful thing to tell
    // them is where to get it.
    return NextResponse.json(
      {
        error: "The audio pack isn't part of your order yet.",
        offer: "/workbook",
      },
      { status: 402 }
    );
  }

  const { data, error } = await db.storage
    .from(BUCKET)
    .createSignedUrl(clip, TTL_SECONDS);

  if (error || !data?.signedUrl) {
    console.error("[workbook/audio] sign failed", clip, error?.message);
    return NextResponse.json({ error: "That clip isn't available." }, { status: 404 });
  }

  return NextResponse.redirect(data.signedUrl, 307);
}
