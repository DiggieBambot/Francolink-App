// Delivering the workbook.
//
// The single highest-risk step in the funnel, and the reason it gets its own
// module rather than a few lines inside the webhook: if the buyer ends up with
// a file in their inbox and no FrancoLink account, there is no funnel left --
// just a $27 sale with negative margin after ads. Everything here exists to
// make the next click land them INSIDE the app.
//
// So the email links to a claim URL, never to a file. The file is behind the
// claim.

import { emailShell, escapeHtml } from "@/lib/email/shell";
import { sendTransactionalEmail, type RenderedEmail } from "@/lib/email/transactional";
import { APP_URL } from "@/lib/site/hosts";

/** Where the delivery email points. Claiming binds the order to an account. */
export function claimUrl(claimToken: string): string {
  return `${APP_URL}/unlock?t=${encodeURIComponent(claimToken)}`;
}

export function renderWorkbookDelivery(
  firstName: string,
  url: string,
  hasAudio: boolean
): RenderedEmail {
  const audioLine = hasAudio
    ? "<p style=\"margin:0 0 16px 0;font-size:16px;\">Your <strong>audio pack</strong> is in there too — every dialogue read at natural speed and again slowly, plus the pronunciation drills — so you can hear the liaisons rather than guess at them.</p>"
    : "";

  const bodyHtml = `
    <p style="margin:0 0 16px 0;font-size:16px;">Your workbook is ready. <em>Le Français Pas à Pas</em> takes you from your first sentence to the subjunctive, and every rule comes with the reason behind it.</p>
    <p style="margin:0 0 16px 0;font-size:16px;">Open it below to set a password — that unlocks <strong>both</strong> the PDF and the online version, where the exercises mark themselves as you type.</p>
    ${audioLine}
    <p style="margin:0 0 16px 0;font-size:16px;">Start with Partie 0. It's twenty phrases and three short dialogues, and you can hold a real conversation by the end of it.</p>
  `;

  const text = [
    `Hi ${firstName},`,
    "",
    "Your workbook is ready. Open it here to set a password — that unlocks both",
    "the PDF and the online version, where the exercises mark themselves:",
    "",
    url,
    "",
    hasAudio ? "Your audio pack is included too.\n" : "",
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
      ctaHref: url,
      ctaText: "Open my workbook",
    }),
    text,
  };
}

/**
 * Never throws. A failed send must not make Stripe retry a payment we have
 * already recorded -- that would double-charge nothing but would re-run the
 * whole branch. The claim link is recoverable from the receipt page instead.
 */
export async function sendWorkbookDelivery(
  email: string,
  claimToken: string,
  hasAudio: boolean
): Promise<void> {
  const firstName = escapeHtml(email.split("@")[0] || "there");
  const { subject, html, text } = renderWorkbookDelivery(
    firstName,
    claimUrl(claimToken),
    hasAudio
  );
  await sendTransactionalEmail(email, subject, html, text);
}
