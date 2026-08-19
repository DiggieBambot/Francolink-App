"use client";

import { useState } from "react";
import { useFormToken } from "@/hooks/use-form-token";
import { BellRing, CheckCircle2, Loader2 } from "lucide-react";
import { LANGUAGE_LABEL } from "@/lib/site/format";

type Status = "idle" | "sending" | "sent" | "error";

/**
 * Shown in place of an empty tutor list. A language we advertise but can't
 * staff yet is a recruiting signal, not a dead end — so capture the demand
 * rather than showing nothing.
 */
export function TutorWaitlistForm({ language }: { language: string | null }) {
  const [status, setStatus] = useState<Status>("idle");
  // Proves the form was rendered — blocks bots posting straight at the API.
  const formToken = useFormToken();
  const [error, setError] = useState<string | null>(null);

  const label = language ? (LANGUAGE_LABEL[language] ?? language.toUpperCase()) : null;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    setError(null);

    const f = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/site/tutor-waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: String(f.get("email") || ""),
          language,
          note: String(f.get("note") || ""),
          company: String(f.get("company") || ""),
          form_token: formToken,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Something went wrong.");
      setStatus("sent");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="max-w-md mx-auto p-6 rounded-2xl bg-success-light border border-green-200 text-center">
        <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-3" />
        <p className="font-heading font-bold text-green-900">You&apos;re on the list</p>
        <p className="text-sm text-green-800 mt-1">
          We&apos;ll email you the moment a{label ? ` ${label}` : ""} tutor is
          available to book.
        </p>
      </div>
    );
  }

  const busy = status === "sending";

  return (
    <div className="max-w-md mx-auto text-center">
      <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-5">
        <BellRing className="w-7 h-7 text-primary" />
      </div>
      <h3 className="font-heading font-bold text-2xl text-primary">
        {label ? `${label} tutors coming soon` : "Tutors coming soon"}
      </h3>
      <p className="mt-3 text-gray-600 leading-relaxed">
        We&apos;re onboarding our first{label ? ` ${label}` : ""} tutors now.
        Leave your email and we&apos;ll tell you as soon as you can book one —
        no other mail, ever.
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="email"
            name="email"
            required
            placeholder="you@example.com"
            autoComplete="email"
            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary-100 outline-none"
          />
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary-800 disabled:opacity-60 whitespace-nowrap"
          >
            {busy && <Loader2 className="w-4 h-4 animate-spin" />}
            {busy ? "Adding…" : "Notify me"}
          </button>
        </div>

        <input
          name="note"
          placeholder="Optional: your level, or what you want to work on"
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-primary outline-none"
        />

        {/* Honeypot */}
        <input
          type="text"
          name="company"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="hidden"
        />

        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>
    </div>
  );
}
