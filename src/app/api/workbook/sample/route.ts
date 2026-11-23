// The free sample: Partie 0, cut from the real PDF.
//
// Open to anyone with the link -- it is a sample, and the link is what the
// sample-chapter email sends. It is cut from book.pdf at request time rather
// than kept as a second file, so it can never drift from the book it sells,
// and it ends on a page that says where the rest is.

import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { SAMPLE_PAGES, readBookFile } from "@/lib/workbook/files";
import { siteUrl } from "@/lib/site/hosts";

export const runtime = "nodejs";

let cached: Uint8Array | null = null;

async function build(): Promise<Uint8Array | null> {
  const bytes = await readBookFile("book.pdf");
  if (!bytes) return null;

  const book = await PDFDocument.load(bytes);
  const out = await PDFDocument.create();
  out.setTitle("Le Français Pas à Pas — free sample (Partie 0)");
  const count = Math.min(SAMPLE_PAGES, book.getPageCount());
  const pages = await out.copyPages(book, Array.from({ length: count }, (_, i) => i));
  pages.forEach((p) => out.addPage(p));

  // The closing page. Plain on purpose: the sample's job is done by the nine
  // pages before it.
  const { width, height } = pages[0].getSize();
  const end = out.addPage([width, height]);
  const serif = await out.embedFont(StandardFonts.TimesRoman);
  const sans = await out.embedFont(StandardFonts.Helvetica);
  const navy = rgb(0.06, 0.15, 0.27);
  const grey = rgb(0.35, 0.4, 0.44);
  const link = siteUrl("/francais-pas-a-pas").replace(/^https?:\/\//, "");

  const lines: [string, number, typeof serif, typeof navy][] = [
    ["That was Partie 0.", 26, serif, navy],
    ["The full workbook goes on from here:", 13, sans, grey],
    ["all 45 rules from A0 to B2, every exercise with its answer,", 13, sans, grey],
    ["and an online version that marks your exercises as you type.", 13, sans, grey],
    ["", 13, sans, grey],
    [link, 15, sans, navy],
  ];
  let y = height / 2 + 80;
  for (const [text, size, font, color] of lines) {
    const w = font.widthOfTextAtSize(text, size);
    end.drawText(text, { x: (width - w) / 2, y, size, font, color });
    y -= size * 2;
  }
  return out.save();
}

export async function GET() {
  cached ??= await build();
  if (!cached) {
    return NextResponse.json(
      { error: "The sample isn't available right now. Try again shortly." },
      { status: 503 }
    );
  }
  return new NextResponse(Buffer.from(cached), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="Le-Francais-Pas-a-Pas-sample.pdf"',
      "Cache-Control": "public, max-age=3600",
    },
  });
}
