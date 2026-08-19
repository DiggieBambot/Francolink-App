"use client";

import { useState } from "react";
import { useFormToken } from "@/hooks/use-form-token";
import { CheckCircle2, Loader2, Send } from "lucide-react";

const TOPICS = [
  "Learning with FrancoLink",
  "Finding the right tutor",
  "Billing and subscriptions",
  "Teaching with FrancoLink",
  "Something else",
];

type Status = "idle" | "sending" | "sent" | "error";

export function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  // Proves the form was rendered — blocks bots posting straight at the API.
  const formToken = useFormToken();
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    setError(null);

    const form = new FormData(e.currentTarget);
    const payload = {
      name: String(form.get("name") || ""),
      email: String(form.get("email") || ""),
      topic: String(form.get("topic") || ""),
      message: String(form.get("message") || ""),
      // Honeypot: real people never fill a hidden field.
      company: String(form.get("company") || ""),
          form_token: formToken,
    };

    try {
      const res = await fetch("/api/site/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Something went wrong.");
      }
      setStatus("sent");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="p-8 rounded-2xl bg-success-light border border-green-200 text-center">
        <CheckCircle2 className="w-10 h-10 text-green-600 mx-auto mb-4" />
        <h2 className="font-heading font-bold text-xl text-green-900 mb-2">
          Message sent
        </h2>
        <p className="text-green-800">
          Thanks — we&apos;ll get back to you within one working day.
        </p>
      </div>
    );
  }

  const busy = status === "sending";

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Your name" name="name" autoComplete="name" required />
        <Field
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
      </div>

      <label className="block">
        <span className="block text-sm font-semibold text-primary mb-2">
          What&apos;s it about?
        </span>
        <select
          name="topic"
          defaultValue={TOPICS[0]}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-800 focus:border-primary focus:ring-2 focus:ring-primary-100 outline-none"
        >
          {TOPICS.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="block text-sm font-semibold text-primary mb-2">
          Message
        </span>
        <textarea
          name="message"
          rows={6}
          required
          minLength={10}
          maxLength={4000}
          placeholder="Tell us what you need…"
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary-100 outline-none resize-y"
        />
      </label>

      {/* Honeypot — hidden from people, irresistible to bots. */}
      <input
        type="text"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
      />

      {error && (
        <p className="text-sm text-red-600 bg-error-light px-4 py-3 rounded-xl">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-primary text-white font-bold hover:bg-primary-800 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary/20"
      >
        {busy ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Send className="w-5 h-5" />
        )}
        {busy ? "Sending…" : "Send message"}
      </button>

      <p className="text-xs text-gray-500">
        We use your details only to reply to this message. See our{" "}
        <a href="/privacy" className="underline underline-offset-2">
          privacy policy
        </a>
        .
      </p>
    </form>
  );
}

function Field({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="block text-sm font-semibold text-primary mb-2">
        {label}
      </span>
      <input
        {...props}
        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary-100 outline-none"
      />
    </label>
  );
}
