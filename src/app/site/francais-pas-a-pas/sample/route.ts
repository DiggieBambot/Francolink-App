// francolink.net/francais-pas-a-pas/sample -- the interactive free sample.
//
// Partie 0 of the real ebook, opened straight in the browser: the exercise
// marks itself and every phrase and dialogue plays. A route handler rather
// than a page, because it serves the book's own standalone HTML, not the
// website's layout. See lib/workbook/sample.ts for what is in it and why.

import { NextResponse } from "next/server";
import { buildSampleHtml } from "@/lib/workbook/sample";

export const runtime = "nodejs";

let cached: string | null = null;

export async function GET() {
  try {
    cached ??= await buildSampleHtml();
  } catch (e) {
    console.error("[workbook/sample] build failed", (e as Error).message);
    return NextResponse.json({ error: "The sample isn't available right now." }, { status: 503 });
  }
  return new NextResponse(cached, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
      "X-Robots-Tag": "noindex",
    },
  });
}
