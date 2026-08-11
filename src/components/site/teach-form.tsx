"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { LANGUAGE_LABEL } from "@/lib/site/format";
import { cn } from "@/lib/utils";

const LANGUAGES = ["fr", "en", "es", "de", "ar", "it", "pt"];
const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

type Status = "idle" | "sending" | "sent" | "error";

export function TeachForm() {
  const [teaches, setTeaches] = useState<string[]>([]);
  const [levels, setLevels] = useState<string[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (teaches.length === 0) {
      setError("Pick at least one language you'd teach.");
      return;
    }
    setStatus("sending");
    setError(null);

    const f = new FormData(e.currentTarget);
    const num = (k: string) => {
      const v = String(f.get(k) || "").trim();
      return v ? Number(v) : null;
    };

    try {
      const res = await fetch("/api/site/teach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: String(f.get("full_name") || ""),
          email: String(f.get("email") || ""),
          country: String(f.get("country") || ""),
          timezone:
            String(f.get("timezone") || "") ||
            Intl.DateTimeFormat().resolvedOptions().timeZone,
          teaches,
          levels,
          years_experience: num("years_experience"),
          weekly_hours: num("weekly_hours"),
          qualifications: String(f.get("qualifications") || ""),
          about: String(f.get("about") || ""),
          link: String(f.get("link") || ""),
          company: String(f.get("company") || ""),
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
      <div className="p-8 rounded-2xl bg-success-light border border-green-200 text-center">
        <CheckCircle2 className="w-10 h-10 text-green-600 mx-auto mb-4" />
        <h2 className="font-heading font-bold text-xl text-green-900 mb-2">
          Application received
        </h2>
        <p className="text-green-800 leading-relaxed">
          Thanks. We read every application and reply within a few working days.
          If it looks like a fit, the next step is a short teaching demo with our
          team.
        </p>
      </div>
    );
  }

  const busy = status === "sending";

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Full name" name="full_name" required autoComplete="name" />
        <Field label="Email" name="email" type="email" required autoComplete="email" />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Country" name="country" placeholder="Cameroon" />
        <Field
          label="Timezone"
          name="timezone"
          placeholder="Africa/Douala"
          hint="Leave blank and we'll use your browser's."
        />
      </div>

      <Chips
        label="Languages you'd teach"
        required
        options={LANGUAGES.map((c) => ({ value: c, label: LANGUAGE_LABEL[c] ?? c }))}
        selected={teaches}
        onChange={setTeaches}
      />

      <Chips
        label="Levels you're comfortable teaching"
        options={LEVELS.map((l) => ({ value: l, label: l }))}
        selected={levels}
        onChange={setLevels}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Years of teaching experience"
          name="years_experience"
          type="number"
          min={0}
          max={70}
          placeholder="5"
        />
        <Field
          label="Hours you could teach per week"
          name="weekly_hours"
          type="number"
          min={1}
          max={80}
          placeholder="10"
          hint="A realistic number, not a maximum."
        />
      </div>

      <Area
        label="Qualifications"
        name="qualifications"
        rows={4}
        placeholder="e.g. Master FLE, Université de Yaoundé, 2019 — plus any certifications."
        hint="Certified and Professional tiers require a document we can verify."
      />

      <Area
        label="About your teaching"
        name="about"
        rows={6}
        required
        minLength={20}
        placeholder="Who you teach best, how you run a lesson, what students say about you…"
      />

      <Field
        label="A link (optional)"
        name="link"
        placeholder="CV, LinkedIn, or a short demo video"
      />

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
        className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-primary text-white font-bold hover:bg-primary-800 disabled:opacity-60 transition-all shadow-lg shadow-primary/20"
      >
        {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
        {busy ? "Sending…" : "Send application"}
      </button>

      <p className="text-xs text-gray-500">
        We use your details only to assess your application. See our{" "}
        <a href="/privacy" className="underline underline-offset-2">
          privacy policy
        </a>
        .
      </p>
    </form>
  );
}

/* -------------------------------------------------------------------------- */

function Field({
  label,
  hint,
  ...props
}: { label: string; hint?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="block text-sm font-semibold text-primary mb-1.5">
        {label}
      </span>
      {hint && <span className="block text-xs text-gray-500 mb-2">{hint}</span>}
      <input
        {...props}
        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary-100 outline-none"
      />
    </label>
  );
}

function Area({
  label,
  hint,
  ...props
}: { label: string; hint?: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className="block">
      <span className="block text-sm font-semibold text-primary mb-1.5">
        {label}
      </span>
      {hint && <span className="block text-xs text-gray-500 mb-2">{hint}</span>}
      <textarea
        {...props}
        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary-100 outline-none resize-y"
      />
    </label>
  );
}

function Chips({
  label,
  required,
  options,
  selected,
  onChange,
}: {
  label: string;
  required?: boolean;
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  return (
    <div>
      <span className="block text-sm font-semibold text-primary mb-2">
        {label}
        {required && <span className="text-accent"> *</span>}
      </span>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const on = selected.includes(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              aria-pressed={on}
              onClick={() =>
                onChange(
                  on ? selected.filter((v) => v !== opt.value) : [...selected, opt.value]
                )
              }
              className={cn(
                "px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors",
                on ? "bg-primary text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
