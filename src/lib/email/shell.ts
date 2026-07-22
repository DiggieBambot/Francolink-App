// src/lib/email/shell.ts
//
// Shared HTML shell for Francolink campaign email. Deliberately boring HTML
// (tables, inline styles, no external images, no <head> CSS) so it renders the
// same in Gmail, Outlook, Apple Mail and the rest.
//
// Voice across all campaigns is the "Francolink Team" — warm, concise, one CTA.

export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://app.francolink.net";

export function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export interface ShellArgs {
  firstName: string;
  /** Pre-escaped HTML for the email body (paragraphs). */
  bodyHtml: string;
  ctaHref: string;
  ctaText: string;
  /** Absolute unsubscribe URL. Rendered in the footer; omit for previews. */
  unsubscribeUrl?: string;
}

export function emailShell({ firstName, bodyHtml, ctaHref, ctaText, unsubscribeUrl }: ShellArgs): string {
  const unsub = unsubscribeUrl
    ? `<br/><a href="${unsubscribeUrl}" style="color:#94a3b8;">Unsubscribe from tips</a>`
    : "";

  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#f7f7f5;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;color:#1a1a1a;line-height:1.55;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f7f5;padding:32px 0;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;padding:32px;max-width:560px;">
        <tr><td>
          <div style="font-weight:800;font-size:20px;color:#0f2744;letter-spacing:-0.02em;margin-bottom:24px;">francolink.</div>
          <p style="margin:0 0 16px 0;font-size:16px;">Hi ${escapeHtml(firstName)},</p>
          ${bodyHtml}
          <p style="margin:28px 0;">
            <a href="${ctaHref}" style="display:inline-block;background:#f97316;color:#fff;text-decoration:none;font-weight:600;padding:12px 22px;border-radius:8px;">${escapeHtml(ctaText)}</a>
          </p>
          <p style="margin:0 0 4px 0;font-size:15px;">À bientôt,</p>
          <p style="margin:0;font-size:15px;">— The Francolink Team<br/><span style="color:#64748b;font-size:13px;">francolink.net</span></p>
        </td></tr>
      </table>
      <p style="font-size:12px;color:#94a3b8;margin:16px 0 0 0;">
        Francolink • <a href="${APP_URL}" style="color:#94a3b8;">app.francolink.net</a>${unsub}
      </p>
    </td></tr>
  </table>
</body></html>`;
}
