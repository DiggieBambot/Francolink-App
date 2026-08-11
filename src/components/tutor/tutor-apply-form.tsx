"use client";

import { useState } from "react";
import { CheckCircle2, Clock, ExternalLink, Loader2, Send, XCircle } from "lucide-react";
import { LANGUAGE_LABEL } from "@/lib/site/format";
import { cn } from "@/lib/utils";

const LANGUAGES = ["fr", "en", "es", "de", "ar", "it", "pt"];
const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

interface Application {
  status: string;
  proposed_tier: string | null;
  review_notes: string | null;
  created_at: string;
  created_user_id: string | null;
}

interface Profile {
  slug: string | null;
  approval_status: string | null;
  is_public: boolean;
  accepts_bookings: boolean;
}

type Status = "idle" | "sending" | "sent" | "error";

export function TutorApplyForm({
  name,
  email,
  timezone,
  application,
  profile,
  siteUrl,
}: {
  name: string;
  email: string;
  timezone: string;
  application: Application | null;
  profile: Profile | null;
  siteUrl: string;
}) {
  const [teaches, setTeaches] = useState<string[]>([]);
  const [levels, setLevels] = useState<string[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  // Already live — nothing to apply for.
  const live =
    profile?.approval_status === "approved" &&
    profile.is_public &&
    profile.accepts_bookings;

  if (live) {
    return (
      <Panel tone="green" icon={CheckCircle2} title="You're already listed">
        <p>
          Your profile is live on the public site. Students can find and book
          you there.
        </p>
        <a
          href={`${siteUrl}/tutors/${profile?.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 mt-4 font-bold text-green-900 underline underline-offset-4"
        >
          View your public profile
          <ExternalLink className="w-4 h-4" />
        </a>
      </Panel>
    );
  }

  const open =
    application &&
    ["new", "reviewing", "interviewing"].includes(application.status);

  if (open && status !== "sent") {
    const labels: Record<string, string> = {
      new: "We've got your application and will look at it shortly.",
      reviewing: "We're reviewing your application now.",
      interviewing: "We'd like to see you teach — check your email for the demo lesson invite.",
    };
    return (
      <Panel tone="amber" icon={Clock} title="Your application is with us">
        <p>{labels[application.status]}</p>
        <p className="mt-3 text-sm">
          Submitted {new Date(application.created_at).toLocaleDateString()}. We
          reply to every applicant — if you haven&apos;t heard from us in a week,
          email support.
        </p>
      </Panel>
    );
  }

  if (application?.status === "accepted" && status !== "sent") {
    return (
      <Panel tone="green" icon={CheckCircle2} title="You've been accepted">
        <p>
          Welcome aboard. We&apos;re finishing your public profile — once it&apos;s
          approved you&apos;ll appear in the directory and can start taking
          bookings.
        </p>
      </Panel>
    );
  }

  const rejected = application?.status === "rejected";

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
      const res = await fetch("/api/tutor/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teaches,
          levels,
          years_experience: num("years_experience"),
          weekly_hours: num("weekly_hours"),
          qualifications: String(f.get("qualifications") || ""),
          about: String(f.get("about") || ""),
          link: String(f.get("link") || ""),
          country: String(f.get("country") || ""),
          timezone:
            String(f.get("timezone") || "") ||
            Intl.DateTimeFormat().resolvedOptions().timeZone,
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
      <Panel tone="green" icon={CheckCircle2} title="Application sent">
        <p>
          Thanks. We read every application and reply within a few working days.
          If it looks like a fit, the next step is a short teaching demo.
        </p>
      </Panel>
    );
  }

  const busy = status === "sending";

  return (
    <div className="space-y-6">
      {rejected && (
        <Panel tone="red" icon={XCircle} title="Your last application wasn't accepted">
          <p>
            {application?.review_notes ||
              "We weren't able to take you on at that time."}{" "}
            You&apos;re welcome to apply again if something has changed.
          </p>
        </Panel>
      )}

      <div className="p-4 rounded-xl bg-gray-50 text-sm text-gray-600">
        Applying as <strong className="text-primary">{name || email}</strong> (
        {email}). We&apos;ll use your account details — no need to repeat them.
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <Chips
          label="Languages you'd teach for us"
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
          <Field label="Country" name="country" placeholder="Cameroon" />
          <Field
            label="Timezone"
            name="timezone"
            defaultValue={timezone}
            placeholder="Africa/Douala"
            hint="Students see your availability in this zone."
          />
        </div>

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
            hint="Be realistic — we book against this."
          />
        </div>

        <Area
          label="Qualifications"
          name="qualifications"
          rows={4}
          placeholder="e.g. Master FLE, Université de Yaoundé, 2019"
          hint="We ask to see the document for Certified and Professional tiers."
        />

        <Area
          label="About your teaching"
          name="about"
          rows={6}
          required
          minLength={20}
          placeholder="Who you teach best, how you run a lesson, what your students say…"
        />

        <Field
          label="A link (optional)"
          name="link"
          placeholder="CV, LinkedIn, or a short demo video"
        />

        {error && (
          <p className="text-sm text-red-600 bg-error-light px-4 py-3 rounded-xl">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-primary text-white font-bold hover:bg-primary-800 disabled:opacity-60 shadow-lg shadow-primary/20"
        >
          {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          {busy ? "Sending…" : "Send application"}
        </button>
      </form>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function Panel({
  tone,
  icon: Icon,
  title,
  children,
}: {
  tone: "green" | "amber" | "red";
  icon: typeof Clock;
  title: string;
  children: React.ReactNode;
}) {
  const tones = {
    green: "bg-success-light border-green-200 text-green-900",
    amber: "bg-warning-light border-amber-200 text-amber-900",
    red: "bg-error-light border-red-200 text-red-900",
  };
  return (
    <div className={cn("p-6 rounded-2xl border", tones[tone])}>
      <Icon className="w-8 h-8 mb-3" />
      <h2 className="font-heading font-bold text-xl mb-2">{title}</h2>
      <div className="leading-relaxed">{children}</div>
    </div>
  );
}

function Field({
  label,
  hint,
  ...props
}: { label: string; hint?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="block text-sm font-semibold text-primary mb-1.5">{label}</span>
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
      <span className="block text-sm font-semibold text-primary mb-1.5">{label}</span>
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
