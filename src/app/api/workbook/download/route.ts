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
import {
  HTML_NAME, PDF_NAME, WORKBOOK_KEY, readBookFile, service, stampHtml, stampPdf, stampText,
} from "@/lib/workbook/files";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
    .some((i) => i.product_key === WORKBOOK_KEY);
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
  const stamp = stampText(name, order.id);

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
