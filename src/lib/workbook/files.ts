// The workbook files, and who may have them.
//
// Two ways in, one set of files:
//
//   * signed in    -- /api/workbook/download, entitlement by account
//   * no account   -- /api/workbook/file?t=<token>, entitlement by the order's
//                     delivery token, which is what the receipt email carries
//
// The second path exists because buyers asked to just get the book (decided
// 2026-11-17): the account is now an optional upgrade for the online version,
// not a gate in front of the PDF. Both paths stamp every copy the same way.

import { readFile } from "node:fs/promises";
import path from "node:path";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export const WORKBOOK_KEY = "workbook_fpp";
export const AUDIO_KEY = "audio_fpp";
export const AUDIO_BUCKET = "workbook-audio";

/** Pages 1–9 of the PDF: cover, contents, how-to-use and all of Partie 0. */
export const SAMPLE_PAGES = 9;

export function service() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export interface PaidOrder {
  id: string;
  email: string;
  user_id: string | null;
  claim_token: string;
  products: Set<string>;
}

type Row = {
  id: string;
  email: string;
  status: string;
  user_id: string | null;
  claim_token: string;
  digital_order_items: { product_key: string }[] | null;
};

function toPaid(row: Row | null): PaidOrder | null {
  if (!row || row.status !== "paid") return null;
  return {
    id: row.id,
    email: row.email,
    user_id: row.user_id,
    claim_token: row.claim_token,
    products: new Set((row.digital_order_items ?? []).map((i) => i.product_key)),
  };
}

const COLUMNS = "id, email, status, user_id, claim_token, digital_order_items(product_key)";

/**
 * The paid order a delivery token belongs to, or null. A bad token, an unpaid
 * order and a refunded one all look the same from outside.
 */
export async function paidOrderByToken(token: string | null | undefined): Promise<PaidOrder | null> {
  if (!token || token.length > 200) return null;
  const { data } = await service()
    .from("digital_orders")
    .select(COLUMNS)
    .eq("claim_token", token)
    .maybeSingle();
  return toPaid(data as Row | null);
}

/**
 * Looked up from the Stripe success redirect. `found` is false while the
 * webhook has not recorded the order yet, which is normal for a few seconds.
 */
export async function orderBySession(
  session: string
): Promise<{ found: boolean; order: PaidOrder | null }> {
  if (!/^cs_[A-Za-z0-9_]{10,200}$/.test(session)) return { found: false, order: null };
  const { data } = await service()
    .from("digital_orders")
    .select(COLUMNS)
    .eq("stripe_checkout_session_id", session)
    .maybeSingle();
  return { found: Boolean(data), order: toPaid(data as Row | null) };
}

export function stampText(name: string, orderId: string): string {
  return `Licensed to ${name} · order ${orderId.slice(0, 8)}`;
}

/** The stamp is buyer-supplied text going into a document we serve. */
function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!)
  );
}

export async function readBookFile(file: "book.pdf" | "book.html"): Promise<Buffer | null> {
  try {
    return await readFile(path.join(process.cwd(), "assets", "workbook", file));
  } catch {
    console.error(`[workbook] ${file} missing from the deployment`);
    return null;
  }
}

/** The buyer's name and order on the foot of every page. */
export async function stampPdf(bytes: Buffer, stamp: string): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(bytes);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const size = 7;
  for (const page of pdf.getPages()) {
    const { width } = page.getSize();
    const w = font.widthOfTextAtSize(stamp, size);
    page.drawText(stamp, { x: (width - w) / 2, y: 14, size, font, color: rgb(0.55, 0.57, 0.6) });
  }
  return pdf.save();
}

/** Same stamp as the PDF, in the colophon -- there are no pages to put it on. */
export function stampHtml(bytes: Buffer, stamp: string): string {
  return bytes
    .toString("utf8")
    .replace(
      "</section>\n</div>",
      `<p style="margin-top:14px;font-size:12px;color:#5A6570">${escapeHtml(stamp)}</p></section>\n</div>`
    );
}

export const PDF_NAME = "Le-Francais-Pas-a-Pas.pdf";
export const HTML_NAME = "Le-Francais-Pas-a-Pas.html";
