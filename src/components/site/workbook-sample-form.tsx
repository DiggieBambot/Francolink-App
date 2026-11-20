"use client";

// "Send me Partie 0 free." Styled by the sales page's scoped .fpap stylesheet,
// so it must be rendered inside that wrapper.

import { useState } from "react";
import { useFormToken } from "@/hooks/use-form-token";
import { WORKBOOK_CONTENT, ttqIdentifyEmail, ttqTrack } from "@/lib/site/tiktok";

type Status = "idle" | "sending" | "sent" | "error";

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];

export function WorkbookSampleForm({
  source,
  button = "Send me Partie 0",
}: {
  source: "sales-page" | "sample-page";
  button?: string;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const formToken = useFormToken();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    setError(null);
    const f = new FormData(e.currentTarget);

    // The ad's UTM tags, so a campaign can be judged on signups too.
    const params = new URLSearchParams(window.location.search);
    const utm: Record<string, string> = {};
    for (const k of UTM_KEYS) {
      const v = params.get(k);
      if (v) utm[k] = v.slice(0, 200);
    }

    try {
      const res = await fetch("/api/site/workbook-sample", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: String(f.get("email") || ""),
          source,
          utm,
          company: String(f.get("company") || ""),
          form_token: formToken,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Something went wrong. Please try again.");
      setStatus("sent");
      void ttqIdentifyEmail(String(f.get("email") || "")).then(() =>
        ttqTrack("SubmitForm", { contents: [WORKBOOK_CONTENT], description: `free-sample:${source}` })
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="sample-done" role="status">
        <strong>Check your inbox.</strong> Partie 0 is on its way. If it isn&apos;t
        there in a couple of minutes, look in spam or promotions.
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate={false}>
      <div className="sample-form">
        <label htmlFor={`sample-email-${source}`} className="sample-hp">Email</label>
        <input
          id={`sample-email-${source}`}
          className="sample-input"
          type="email"
          name="email"
          required
          placeholder="you@example.com"
          autoComplete="email"
        />
        <div className="sample-hp" aria-hidden>
          <input type="text" name="company" tabIndex={-1} autoComplete="off" />
        </div>
        <button type="submit" className="btn btn-accent btn-lg" disabled={status === "sending"}>
          {status === "sending" ? "Sending…" : button}
        </button>
      </div>
      {error && <p className="sample-msg sample-msg-err" role="alert">{error}</p>}
    </form>
  );
}
