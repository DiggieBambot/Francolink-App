// Serving the PDF.
//
// Two things this route is careful about.
//
// The file is not public. It lives in assets/, not public/, because anything
// under public/ is served to anyone who guesses the URL, and this is the paid
// product. Access is checked here, per request, against a paid order.
//
// Every copy is stamped. The buyer's name and order id go on the foot of each
// page before it is sent. It will not stop a determined sharer, and it is not
// meant to -- it is the cheapest thing that makes a copy traceable and makes
// a reader think twice, without DRM that punishes honest customers.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

/** The stamp is user-supplied text going into a document we serve. */
function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!)
  );
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function service() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function GET(request: Request) {
  // Two formats from one route: the PDF to keep, and the interactive HTML to
  // work in. Both are the same book generated from the same source, so they
  // share the same entitlement check and the same per-buyer stamp.
  const format = new URL(request.url).searchParams.get("format") === "html" ? "html" : "pdf";
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(
      new URL("/login/student?next=/workbook", process.env.NEXT_PUBLIC_APP_URL || "https://app.francolink.net")
    );
  }

  const { data: order } = await service()
    .from("digital_orders")
    .select("id, email, digital_order_items(product_key)")
    .eq("user_id", user.id)
    .eq("status", "paid")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const owns = ((order?.digital_order_items ?? []) as { product_key: string }[])
    .some((i) => i.product_key === "workbook_fpp");
  if (!order || !owns) {
    return NextResponse.json(
      { error: "This is for workbook readers. Get your copy at francolink.net/francais-pas-a-pas." },
      { status: 403 }
    );
  }

  const name =
    (user.user_metadata?.name as string | undefined) ||
    (user.user_metadata?.full_name as string | undefined) ||
    order.email;
  const stamp = `Licensed to ${name} · order ${order.id.slice(0, 8)}`;

  const file = format === "html" ? "book.html" : "book.pdf";
  let bytes: Buffer;
  try {
    bytes = await readFile(path.join(process.cwd(), "assets", "workbook", file));
  } catch {
    console.error(`[workbook/download] ${file} missing from the deployment`);
    return NextResponse.json(
      { error: "The download isn't available right now. We're on it — try again shortly." },
      { status: 503 }
    );
  }

  if (format === "html") {
    // Same stamp as the PDF, in the colophon rather than on every page —
    // there are no pages to put it on.
    const html = bytes
      .toString("utf8")
      .replace(
        "</section>\n</div>",
        `<p style="margin-top:14px;font-size:12px;color:#5A6570">${escapeHtml(stamp)}</p></section>\n</div>`
      );
    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": 'attachment; filename="Le-Francais-Pas-a-Pas.html"',
        "Cache-Control": "private, no-store",
      },
    });
  }

  const pdf = await PDFDocument.load(bytes);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const size = 7;

  for (const page of pdf.getPages()) {
    const { width } = page.getSize();
    const w = font.widthOfTextAtSize(stamp, size);
    page.drawText(stamp, {
      x: (width - w) / 2,
      y: 14,
      size,
      font,
      color: rgb(0.55, 0.57, 0.6),
    });
  }

  const out = await pdf.save();
  return new NextResponse(Buffer.from(out), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="Le-Francais-Pas-a-Pas.pdf"',
      "Cache-Control": "private, no-store",
    },
  });
}
