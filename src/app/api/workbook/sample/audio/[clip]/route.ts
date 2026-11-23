// One Partie 0 recording, for the free interactive sample.
//
// Open to anyone, but only for the 22 Partie 0 clips (lib/workbook/sample).
// Every other clip is the paid audio pack and stays behind
// /api/workbook/audio and the token zip. Redirects to a short-lived signed
// URL on the private bucket, so a copied link stops working within the hour.

import { NextResponse } from "next/server";
import { AUDIO_BUCKET, service } from "@/lib/workbook/files";
import { isSampleClip } from "@/lib/workbook/sample";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TTL_SECONDS = 60 * 60;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ clip: string }> }
) {
  const { clip } = await params;
  if (!isSampleClip(clip)) {
    return NextResponse.json({ error: "That recording is part of the full audio pack." }, { status: 404 });
  }

  const { data, error } = await service().storage.from(AUDIO_BUCKET).createSignedUrl(clip, TTL_SECONDS);
  if (error || !data?.signedUrl) {
    console.error("[workbook/sample/audio] sign failed", clip, error?.message);
    return NextResponse.json({ error: "Audio unavailable right now." }, { status: 503 });
  }

  return NextResponse.redirect(data.signedUrl, {
    status: 302,
    headers: { "Cache-Control": "private, max-age=300" },
  });
}
