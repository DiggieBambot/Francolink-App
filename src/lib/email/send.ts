// src/lib/email/send.ts
//
// Thin wrapper over the Resend client for campaign sends. Adds the standard
// From / Reply-To and one-click List-Unsubscribe headers (Gmail/Yahoo require
// these for bulk senders). Returns the Resend message id.

import { getResend, DEFAULT_FROM } from "@/lib/email/resend";

const REPLY_TO = "support@francolink.net";

export interface SendArgs {
  to: string;
  subject: string;
  html: string;
  text: string;
  /** Absolute unsubscribe URL — wired into List-Unsubscribe headers. */
  unsubscribeUrl?: string;
}

export async function sendCampaignEmail({ to, subject, html, text, unsubscribeUrl }: SendArgs): Promise<string> {
  const headers: Record<string, string> = {};
  if (unsubscribeUrl) {
    headers["List-Unsubscribe"] = `<${unsubscribeUrl}>`;
    headers["List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click";
  }

  const { data, error } = await getResend().emails.send({
    from: DEFAULT_FROM,
    to,
    subject,
    html,
    text,
    replyTo: REPLY_TO,
    headers,
  });

  if (error) throw new Error(error.message || "Resend send failed");
  return data?.id ?? "";
}
