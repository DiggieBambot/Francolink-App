// The workbook without an account.
//
//   GET ?t=<token>&format=pdf    the stamped PDF
//   GET ?t=<token>&format=html   the stamped interactive ebook
//   GET ?t=<token>&format=audio  the audio pack as one zip (audio buyers only)
//
// `t` is the delivery token from the receipt email and the download page on
// francolink.net. It is the same unguessable token that can later create an
// account (/unlock), so a buyer never has two links to keep track of. It stops
// working the moment the order is refunded, because paidOrderByToken only
// returns paid orders.

import { NextResponse } from "next/server";
import JSZip from "jszip";
import {
  AUDIO_BUCKET, AUDIO_KEY, HTML_NAME, PDF_NAME, WORKBOOK_KEY,
  paidOrderByToken, readBookFile, service, stampHtml, stampPdf, stampText,
} from "@/lib/workbook/files";
import audioManifest from "@/lib/workbook/content/audio.json";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const NOT_VALID = { error: "That download link isn't valid. Reply to your receipt and we'll sort it out." };

export async function GET(request: Request) {
  const url = new URL(request.url);
  const raw = url.searchParams.get("format");
  const format = raw === "html" || raw === "audio" ? raw : "pdf";

  const order = await paidOrderByToken(url.searchParams.get("t"));
  if (!order || !order.products.has(WORKBOOK_KEY)) {
    return NextResponse.json(NOT_VALID, { status: 404 });
  }

  if (format === "audio") return audioZip(order.products.has(AUDIO_KEY));

  const stamp = stampText(order.email, order.id);
  const bytes = await readBookFile(format === "html" ? "book.html" : "book.pdf");
  if (!bytes) {
    return NextResponse.json(
      { error: "The download isn't available right now. We're on it — try again shortly." },
      { status: 503 }
    );
  }

  if (format === "html") {
    return new NextResponse(stampHtml(bytes, stamp), {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `attachment; filename="${HTML_NAME}"`,
        "Cache-Control": "private, no-store",
      },
    });
  }

  return new NextResponse(Buffer.from(await stampPdf(bytes, stamp)), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${PDF_NAME}"`,
      "Cache-Control": "private, no-store",
    },
  });
}

type Clip = { id: string; text: string; slow: boolean };

/**
 * Every clip in one zip, with a tracklist so a file name can be matched to the
 * French it says. Built per request from the private bucket -- ~12MB, stored
 * uncompressed because m4a does not compress further.
 */
async function audioZip(owns: boolean) {
  if (!owns) {
    return NextResponse.json(
      { error: "The audio pack isn't part of this order." },
      { status: 402 }
    );
  }

  const clips = audioManifest as Clip[];
  const files: { name: string; text: string }[] = [];
  for (const c of clips) {
    files.push({ name: `${c.id}-normal.m4a`, text: c.text });
    if (c.slow) files.push({ name: `${c.id}-slow.m4a`, text: `${c.text} (slow)` });
  }

  const storage = service().storage.from(AUDIO_BUCKET);
  const zip = new JSZip();
  const folder = zip.folder("Le-Francais-Pas-a-Pas-audio")!;
  let missing = 0;

  // Twelve at a time: fast, without opening 144 connections at once.
  for (let i = 0; i < files.length; i += 12) {
    await Promise.all(
      files.slice(i, i + 12).map(async (f) => {
        const { data, error } = await storage.download(f.name);
        if (error || !data) {
          missing++;
          console.error("[workbook/file] audio clip missing", f.name, error?.message);
          return;
        }
        folder.file(f.name, Buffer.from(await data.arrayBuffer()));
      })
    );
  }

  if (missing === files.length) {
    return NextResponse.json(
      { error: "The audio isn't available right now. We're on it — try again shortly." },
      { status: 503 }
    );
  }

  folder.file(
    "tracklist.txt",
    files.map((f) => `${f.name}\t${f.text}`).join("\n") + "\n"
  );

  const out = await zip.generateAsync({ type: "nodebuffer", compression: "STORE" });
  return new NextResponse(new Uint8Array(out), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": 'attachment; filename="Le-Francais-Pas-a-Pas-audio.zip"',
      "Cache-Control": "private, no-store",
    },
  });
}
