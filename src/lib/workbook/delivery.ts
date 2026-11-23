// Delivering the workbook.
//
// The receipt email gives the buyer the book: one link to the download page on
// francolink.net, which holds the PDF, the ebook and (if bought) the audio.
// No account needed (decided 2026-11-17).
//
// That used to be the other way round -- the email linked only to a claim
// screen, and the file sat behind a new account -- so that every buyer landed
// in the app. The account is still offered, from the download page and as a
// second link here, as what it really is: the online version.

import { emailShell } from "@/lib/email/shell";
import { sendTransactionalEmail, type RenderedEmail } from "@/lib/email/transactional";
import { APP_URL, siteUrl } from "@/lib/site/hosts";

/** The download page. The token is the order's delivery credential. */
export function downloadUrl(claimToken: string): string {
  return siteUrl(`/francais-pas-a-pas/download?t=${encodeURIComponent(claimToken)}`);
}

/** Creates the optional account and binds the order to it. */
export function claimUrl(claimToken: string): string {
  return `${APP_URL}/unlock?t=${encodeURIComponent(claimToken)}`;
}

export function renderWorkbookDelivery(
  firstName: string,
  download: string,
  claim: string,
  hasAudio: boolean
): RenderedEmail {
  const audioLine = hasAudio
    ? "<p style=\"margin:0 0 16px 0;font-size:16px;\">Your <strong>audio pack</strong> is there too — every dialogue read at natural speed and again slowly, plus the pronunciation drills — so you can hear the liaisons rather than guess at them.</p>"
    : "";

  const bodyHtml = `
    <p style="margin:0 0 16px 0;font-size:16px;">Your workbook is ready. <em>Le Français Pas à Pas</em> takes you from your first sentence to the subjunctive, and every rule comes with the reason behind it.</p>
    <p style="margin:0 0 16px 0;font-size:16px;">Use the button below to download the <strong>PDF</strong> and the <strong>ebook</strong>, an interactive version that opens in any browser and marks your exercises for you. Keep this email: the link works whenever you need it.</p>
    ${audioLine}
    <p style="margin:0 0 16px 0;font-size:16px;">Prefer to work online, with your progress saved? <a href="${claim}" style="color:#0f2744;">Create a free account</a> and the workbook will be waiting in it.</p>
    <p style="margin:0 0 16px 0;font-size:16px;">Start with Partie 0. It's twenty phrases and three short dialogues, and you can hold a real conversation by the end of it.</p>
    <p style="margin:0 0 16px 0;font-size:14px;color:#64748b;">14-day money-back guarantee: reply to this email and we'll refund you.</p>
  `;

  const text = [
    `Hi ${firstName},`,
    "",
    "Your workbook is ready. Download the PDF and the ebook here:",
    "",
    download,
    "",
    hasAudio ? "Your audio pack is on the same page.\n" : "",
    "Prefer to work online, with your progress saved? Create a free account:",
    claim,
    "",
    "Start with Partie 0 — twenty phrases and three short dialogues.",
    "",
    "14-day money-back guarantee: reply to this email and we'll refund you.",
    "",
    "— The Francolink Team",
  ]
    .filter(Boolean)
    .join("\n");

  return {
    subject: "Your French workbook is ready",
    html: emailShell({
      firstName,
      bodyHtml,
      ctaHref: download,
      ctaText: "Download my workbook",
    }),
    text,
  };
}

/**
 * Never throws. A failed send must not make Stripe retry a payment we have
 * already recorded -- that would re-run the whole branch. The links are
 * recoverable from the success page instead.
 */
export async function sendWorkbookDelivery(
  email: string,
  claimToken: string,
  hasAudio: boolean
): Promise<void> {
  // emailShell escapes the name itself.
  const firstName = email.split("@")[0] || "there";
  const { subject, html, text } = renderWorkbookDelivery(
    firstName,
    downloadUrl(claimToken),
    claimUrl(claimToken),
    hasAudio
  );
  await sendTransactionalEmail(email, subject, html, text);
}
