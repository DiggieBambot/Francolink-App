// src/lib/email/templates/reengagement.ts
//
// Two re-engagement templates personalised by user state:
//   - placement: user signed up but never took the placement test.
//     CTA → /placement-test
//   - premium: user has activity but is still on the FREE plan.
//     CTA → /pricing
//
// Voice is the "Francolink Team" — warm, concise, encouraging, one CTA per email.

const APP_URL = "https://app.francolink.net";

interface TemplateArgs {
  /** Recipient first name (best-effort from users.name). */
  firstName: string;
  /** Optional target language pretty-name, e.g. "French" or "Spanish". */
  targetLanguage?: string;
}

export interface RenderedEmail {
  subject: string;
  text: string;
  html: string;
}

function escape(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Shared HTML shell — keeps the visual identity consistent and works in every
// email client (no fancy CSS, no external images, no <head> styling).
function shell(args: { firstName: string; bodyHtml: string; ctaHref: string; ctaText: string; footerHtml?: string }): string {
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#f7f7f5;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;color:#1a1a1a;line-height:1.55;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f7f5;padding:32px 0;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;padding:32px;max-width:560px;">
        <tr><td>
          <div style="font-weight:800;font-size:20px;color:#0f2744;letter-spacing:-0.02em;margin-bottom:24px;">francolink.</div>
          <p style="margin:0 0 16px 0;font-size:16px;">Hi ${escape(args.firstName)},</p>
          ${args.bodyHtml}
          <p style="margin:28px 0;">
            <a href="${args.ctaHref}" style="display:inline-block;background:#f97316;color:#fff;text-decoration:none;font-weight:600;padding:12px 22px;border-radius:8px;">${escape(args.ctaText)}</a>
          </p>
          <p style="margin:0 0 4px 0;font-size:15px;">À bientôt,</p>
          <p style="margin:0;font-size:15px;">— The Francolink Team<br/><span style="color:#64748b;font-size:13px;">francolink.net</span></p>
        </td></tr>
      </table>
      <p style="font-size:12px;color:#94a3b8;margin:16px 0 0 0;">
        Francolink • <a href="${APP_URL}" style="color:#94a3b8;">app.francolink.net</a>
        ${args.footerHtml || ""}
      </p>
    </td></tr>
  </table>
</body></html>`;
}

/** "You signed up but never took the placement test — let's start there." */
export function renderPlacementEmail({ firstName, targetLanguage }: TemplateArgs): RenderedEmail {
  const lang = targetLanguage || "your target language";
  const subject = `${firstName}, your 90-second ${targetLanguage ? targetLanguage + " " : ""}placement test is waiting`;

  const text = `Hi ${firstName},

Welcome to Francolink! We noticed you signed up but haven't taken the placement test yet.

It takes about 90 seconds and it's how we figure out exactly where to start you. After that, your dashboard lights up with lessons matched to your level in ${lang} — no guessing, no boring "Hello, my name is..." for the tenth time.

Take the placement test:
${APP_URL}/placement-test

If anything's confusing, or you'd rather hop on a quick call with a tutor first, just hit reply — we read every email.

À bientôt,
— The Francolink Team
`;

  const html = shell({
    firstName,
    bodyHtml: `
      <p style="margin:0 0 14px 0;">Welcome to Francolink! We noticed you signed up but haven't taken the placement test yet.</p>
      <p style="margin:0 0 14px 0;">It takes about <strong>90 seconds</strong> and it's how we figure out exactly where to start you. After that, your dashboard lights up with lessons matched to your level in ${escape(lang)} — no guessing, no boring "Hello, my name is..." for the tenth time.</p>
      <p style="margin:0 0 14px 0;">If anything's confusing, or you'd rather hop on a quick call with a tutor first, just hit reply — we read every email.</p>
    `,
    ctaHref: `${APP_URL}/placement-test`,
    ctaText: "Take the placement test",
  });

  return { subject, text, html };
}

/** "You started — now unlock the full thing." */
export function renderPremiumEmail({ firstName, targetLanguage }: TemplateArgs): RenderedEmail {
  const lang = targetLanguage || "your target language";
  const subject = `${firstName}, unlock the full Francolink experience`;

  const text = `Hi ${firstName},

We see you've started using Francolink — bonjour and welcome.

When you're ready to go deeper into ${lang}, Premium unlocks all 4 CEFR levels (A1 → B2), every lesson, plus access to a live tutor and the AI conversation partner whenever you want to practise speaking.

See the Premium plans:
${APP_URL}/pricing

Reply to this email if you have any questions about what fits your level or budget — we're happy to help.

À bientôt,
— The Francolink Team
`;

  const html = shell({
    firstName,
    bodyHtml: `
      <p style="margin:0 0 14px 0;">We see you've started using Francolink — bonjour and welcome.</p>
      <p style="margin:0 0 14px 0;">When you're ready to go deeper into ${escape(lang)}, <strong>Premium</strong> unlocks all 4 CEFR levels (A1 → B2), every lesson, plus access to a live tutor and the AI conversation partner whenever you want to practise speaking.</p>
      <p style="margin:0 0 14px 0;">Reply to this email if you have any questions about what fits your level or budget — we're happy to help.</p>
    `,
    ctaHref: `${APP_URL}/pricing`,
    ctaText: "See Premium plans",
  });

  return { subject, text, html };
}
