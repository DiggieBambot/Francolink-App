"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check,
  ExternalLink,
  Eye,
  EyeOff,
  Loader2,
  Mail,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

// The admin tables are wide and only partially typed at the query layer; these
// interfaces cover the fields this screen actually renders.
interface ProfileRow {
  user_id: string;
  slug: string;
  headline: string | null;
  teaches: string[] | null;
  levels: string[] | null;
  hourly_rate_cents: number | null;
  currency: string | null;
  is_public: boolean;
  approval_status: string;
  rejection_reason: string | null;
  users: { name: string | null; email: string } | { name: string | null; email: string }[] | null;
}

interface TestimonialRow {
  id: string;
  author_name: string;
  author_role: string | null;
  quote: string;
  rating: number | null;
  is_published: boolean;
}

interface FaqRow {
  id: string;
  category: string;
  question: string;
  answer: string;
  is_published: boolean;
}

interface TutorRow {
  id: string;
  name: string | null;
  email: string;
  tutor_invite_code: string | null;
  has_profile: boolean;
}

interface ApplicationRow {
  id: string;
  full_name: string;
  email: string;
  country: string | null;
  teaches: string[] | null;
  levels: string[] | null;
  years_experience: number | null;
  weekly_hours: number | null;
  qualifications: string | null;
  about: string;
  link: string | null;
  status: string;
  proposed_tier: string | null;
  created_at: string;
}

interface MessageRow {
  id: string;
  name: string;
  email: string;
  topic: string | null;
  message: string;
  status: string;
  created_at: string;
}

type Tab = "profiles" | "applications" | "tutors" | "testimonials" | "faqs" | "messages";

export function WebsiteAdmin({
  siteUrl,
  profiles,
  testimonials,
  faqs,
  messages,
  tutors,
  applications,
}: {
  siteUrl: string;
  profiles: ProfileRow[];
  testimonials: TestimonialRow[];
  faqs: FaqRow[];
  messages: MessageRow[];
  tutors: TutorRow[];
  applications: ApplicationRow[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("profiles");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function act(key: string, payload: Record<string, unknown>) {
    setBusy(key);
    setError(null);
    try {
      const res = await fetch("/api/admin/website", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "That didn't save.");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "That didn't save.");
    } finally {
      setBusy(null);
    }
  }

  const pending = profiles.filter((p) => p.approval_status === "pending").length;
  const unread = messages.filter((m) => m.status === "new").length;
  const newApps = applications.filter((a) => a.status === "new").length;

  const TABS: [Tab, string, number | null][] = [
    ["profiles", "Listings", pending || null],
    ["applications", "Applications", newApps || null],
    ["tutors", "All tutors", null],
    ["testimonials", "Testimonials", null],
    ["faqs", "FAQs", null],
    ["messages", "Messages", unread || null],
  ];

  return (
    <div className="p-6 max-w-6xl">
      <header className="mb-6">
        <h1 className="font-heading font-extrabold text-2xl text-primary">
          Website
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          What visitors see on{" "}
          <a
            href={siteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-4"
          >
            {siteUrl.replace(/^https?:\/\//, "")}
          </a>
        </p>
      </header>

      <nav className="flex gap-1 border-b border-gray-200 mb-6 overflow-x-auto">
        {TABS.map(([key, label, badge]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={cn(
              "px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px whitespace-nowrap transition-colors",
              tab === key
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-700"
            )}
          >
            {label}
            {badge != null && (
              <span className="ml-2 px-1.5 py-0.5 rounded-full bg-secondary text-primary-900 text-xs font-bold">
                {badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      {error && (
        <p className="mb-4 text-sm text-red-600 bg-error-light px-4 py-3 rounded-xl">
          {error}
        </p>
      )}

      {tab === "profiles" && (
        <ProfilesTab
          profiles={profiles}
          siteUrl={siteUrl}
          busy={busy}
          act={act}
        />
      )}
      {tab === "applications" && (
        <ApplicationsTab applications={applications} busy={busy} act={act} />
      )}
      {tab === "tutors" && <TutorsTab tutors={tutors} />}
      {tab === "testimonials" && (
        <TestimonialsTab testimonials={testimonials} busy={busy} act={act} />
      )}
      {tab === "faqs" && <FaqsTab faqs={faqs} busy={busy} act={act} />}
      {tab === "messages" && (
        <MessagesTab messages={messages} busy={busy} act={act} />
      )}
    </div>
  );
}

type Act = (key: string, payload: Record<string, unknown>) => Promise<void>;

/* ----------------------------------------------------------------- profiles */

function ProfilesTab({
  profiles,
  siteUrl,
  busy,
  act,
}: {
  profiles: ProfileRow[];
  siteUrl: string;
  busy: string | null;
  act: Act;
}) {
  if (profiles.length === 0) {
    return <Empty>No tutor has submitted a public profile yet.</Empty>;
  }

  return (
    <ul className="space-y-4">
      {profiles.map((p) => {
        const user = Array.isArray(p.users) ? p.users[0] : p.users;
        const key = `profile-${p.user_id}`;
        return (
          <li
            key={p.user_id}
            className="p-5 rounded-2xl bg-white border border-gray-200"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="font-heading font-bold text-primary">
                    {user?.name || "Unnamed tutor"}
                  </h2>
                  <StatusPill status={p.approval_status} />
                  {!p.is_public && (
                    <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold">
                      Tutor opted out
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-1">{user?.email}</p>
                {p.headline && (
                  <p className="text-sm text-gray-700 mt-2">{p.headline}</p>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  Teaches: {(p.teaches ?? []).join(", ") || "—"} · Levels:{" "}
                  {(p.levels ?? []).join(", ") || "—"} · Rate:{" "}
                  {p.hourly_rate_cents != null
                    ? `${(p.hourly_rate_cents / 100).toFixed(2)} ${p.currency}`
                    : "—"}
                </p>
                {p.rejection_reason && (
                  <p className="text-xs text-red-600 mt-1">
                    Rejected: {p.rejection_reason}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href={`/admin/website/tutors/${p.user_id}`}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-primary hover:border-primary"
                >
                  Edit
                </Link>
                <a
                  href={`${siteUrl}/tutors/${p.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-xl border border-gray-200 text-gray-500 hover:text-primary"
                  title="Open public profile"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
                {p.approval_status !== "approved" && (
                  <button
                    type="button"
                    disabled={busy === key}
                    onClick={() =>
                      act(key, {
                        action: "review_profile",
                        user_id: p.user_id,
                        decision: "approved",
                      })
                    }
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-600 text-white text-sm font-bold disabled:opacity-60"
                  >
                    {busy === key ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    Approve
                  </button>
                )}
                {p.approval_status !== "rejected" && (
                  <button
                    type="button"
                    disabled={busy === key}
                    onClick={() => {
                      const reason = window.prompt(
                        "Why is this profile being rejected? The tutor sees this."
                      );
                      if (reason === null) return;
                      act(key, {
                        action: "review_profile",
                        user_id: p.user_id,
                        decision: "rejected",
                        reason,
                      });
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-bold disabled:opacity-60"
                  >
                    <X className="w-4 h-4" />
                    Reject
                  </button>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/* ----------------------------------------------------------- applications */

const APP_STATUSES = ["new", "reviewing", "interviewing", "accepted", "rejected", "spam"];

/** Inbound "apply to teach" submissions. Accepting one is a manual step:
 *  create the account, then author their listing from the All tutors tab. */
function ApplicationsTab({
  applications,
  busy,
  act,
}: {
  applications: ApplicationRow[];
  busy: string | null;
  act: Act;
}) {
  if (applications.length === 0) {
    return <Empty>No applications yet. The form is live at /teach.</Empty>;
  }

  return (
    <ul className="space-y-4">
      {applications.map((a) => (
        <li
          key={a.id}
          className={cn(
            "p-5 rounded-2xl border",
            a.status === "new"
              ? "bg-secondary-50 border-secondary-200"
              : "bg-white border-gray-200"
          )}
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h2 className="font-heading font-bold text-primary">
                {a.full_name}{" "}
                <span className="font-normal text-gray-500 text-sm">
                  &lt;{a.email}&gt;
                </span>
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                {[
                  a.country,
                  (a.teaches ?? []).join(", ") || null,
                  (a.levels ?? []).length ? (a.levels ?? []).join(", ") : null,
                  a.years_experience != null ? `${a.years_experience} yrs` : null,
                  a.weekly_hours != null ? `${a.weekly_hours} h/week` : null,
                  new Date(a.created_at).toLocaleDateString(),
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              {a.qualifications && (
                <p className="text-sm text-gray-700 mt-3 whitespace-pre-line">
                  <span className="font-semibold">Qualifications: </span>
                  {a.qualifications}
                </p>
              )}
              <p className="text-sm text-gray-700 mt-2 whitespace-pre-line">
                {a.about}
              </p>
              {a.link && (
                <a
                  href={a.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-2 text-sm text-primary underline underline-offset-4 break-all"
                >
                  {a.link}
                </a>
              )}
            </div>

            <div className="flex flex-col gap-2 shrink-0 w-44">
              <select
                value={a.status}
                disabled={busy === `a-${a.id}`}
                onChange={(e) =>
                  act(`a-${a.id}`, {
                    action: "set_application_status",
                    id: a.id,
                    status: e.target.value,
                  })
                }
                className="px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm"
              >
                {APP_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>

              <select
                value={a.proposed_tier ?? ""}
                disabled={busy === `a-${a.id}`}
                onChange={(e) =>
                  act(`a-${a.id}`, {
                    action: "set_application_status",
                    id: a.id,
                    status: a.status,
                    proposed_tier: e.target.value,
                  })
                }
                className="px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm"
              >
                <option value="">Tier…</option>
                <option value="community">Community</option>
                <option value="certified">Certified</option>
                <option value="professional">Professional</option>
              </select>

              <a
                href={`mailto:${a.email}?subject=${encodeURIComponent("Your FrancoLink teaching application")}`}
                className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-primary text-center"
              >
                Reply
              </a>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------------------------------------- all tutors */

/** Pick any tutor account and author their public listing. */
function TutorsTab({ tutors }: { tutors: TutorRow[] }) {
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const visible = q
    ? tutors.filter(
        (t) =>
          (t.name ?? "").toLowerCase().includes(q) ||
          t.email.toLowerCase().includes(q)
      )
    : tutors;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or email…"
          className="flex-1 min-w-64 px-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-primary"
        />
        <span className="text-sm text-gray-500">
          {visible.length} of {tutors.length}
        </span>
      </div>

      <p className="text-sm text-gray-500">
        Writing a listing here saves it to that tutor&apos;s account. You can
        publish it immediately — the tutor can still edit it later, which sends
        it back to the review queue.
      </p>

      <ul className="divide-y divide-gray-100 border border-gray-200 rounded-2xl overflow-hidden">
        {visible.map((t) => (
          <li
            key={t.id}
            className="flex items-center justify-between gap-4 px-5 py-3.5 bg-white"
          >
            <div className="min-w-0">
              <p className="font-semibold text-primary truncate">
                {t.name || "Unnamed tutor"}
              </p>
              <p className="text-xs text-gray-500 truncate">{t.email}</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {t.has_profile && (
                <span className="px-2 py-0.5 rounded-full bg-primary-50 text-primary text-xs font-semibold">
                  Has listing
                </span>
              )}
              <Link
                href={`/admin/website/tutors/${t.id}`}
                className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-bold whitespace-nowrap"
              >
                {t.has_profile ? "Edit listing" : "Create listing"}
              </Link>
            </div>
          </li>
        ))}
        {visible.length === 0 && (
          <li className="px-5 py-8 text-center text-gray-500">
            No tutor matches that search.
          </li>
        )}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------- testimonials */

function TestimonialsTab({
  testimonials,
  busy,
  act,
}: {
  testimonials: TestimonialRow[];
  busy: string | null;
  act: Act;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-5">
      {open ? (
        <form
          className="p-5 rounded-2xl bg-gray-50 border border-gray-200 space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            const rating = Number(f.get("rating"));
            await act("new-testimonial", {
              action: "create_testimonial",
              author_name: String(f.get("author_name")),
              author_role: String(f.get("author_role") || "") || undefined,
              author_country: String(f.get("author_country") || "") || undefined,
              quote: String(f.get("quote")),
              rating: rating || undefined,
              is_published: true,
            });
            setOpen(false);
          }}
        >
          <div className="grid sm:grid-cols-3 gap-4">
            <Input name="author_name" placeholder="Name" required />
            <Input name="author_role" placeholder="Role (e.g. B1 learner)" />
            <Input name="author_country" placeholder="Country" />
          </div>
          <textarea
            name="quote"
            required
            minLength={10}
            rows={4}
            placeholder="What they said…"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-primary"
          />
          <div className="flex items-center gap-4">
            <select
              name="rating"
              defaultValue="5"
              className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white"
            >
              {[5, 4, 3, 2, 1].map((r) => (
                <option key={r} value={r}>
                  {r} stars
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={busy === "new-testimonial"}
              className="px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-bold disabled:opacity-60"
            >
              Publish
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-sm text-gray-500"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-bold"
        >
          <Plus className="w-4 h-4" />
          Add testimonial
        </button>
      )}

      {testimonials.length === 0 ? (
        <Empty>No testimonials yet.</Empty>
      ) : (
        <ul className="space-y-3">
          {testimonials.map((t) => (
            <li
              key={t.id}
              className="p-5 rounded-2xl bg-white border border-gray-200 flex items-start justify-between gap-4"
            >
              <div className="min-w-0">
                <p className="text-gray-700">&ldquo;{t.quote}&rdquo;</p>
                <p className="text-sm text-gray-500 mt-2">
                  {t.author_name}
                  {t.author_role ? ` · ${t.author_role}` : ""}
                  {t.rating ? ` · ${t.rating}★` : ""}
                </p>
              </div>
              <RowActions
                published={t.is_published}
                busyKey={busy}
                id={t.id}
                onToggle={() =>
                  act(`t-${t.id}`, {
                    action: "toggle_testimonial",
                    id: t.id,
                    is_published: !t.is_published,
                  })
                }
                onDelete={() =>
                  act(`t-${t.id}`, { action: "delete_testimonial", id: t.id })
                }
                prefix="t"
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------- FAQ */

function FaqsTab({
  faqs,
  busy,
  act,
}: {
  faqs: FaqRow[];
  busy: string | null;
  act: Act;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-5">
      {open ? (
        <form
          className="p-5 rounded-2xl bg-gray-50 border border-gray-200 space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            await act("new-faq", {
              action: "create_faq",
              category: String(f.get("category") || "General"),
              question: String(f.get("question")),
              answer: String(f.get("answer")),
              display_order: Number(f.get("display_order") || 0),
            });
            setOpen(false);
          }}
        >
          <div className="grid sm:grid-cols-[1fr_2fr_100px] gap-4">
            <Input name="category" placeholder="Category" defaultValue="General" />
            <Input name="question" placeholder="Question" required />
            <Input name="display_order" type="number" placeholder="Order" defaultValue="0" />
          </div>
          <textarea
            name="answer"
            required
            rows={4}
            placeholder="Answer…"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-primary"
          />
          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={busy === "new-faq"}
              className="px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-bold disabled:opacity-60"
            >
              Publish
            </button>
            <button type="button" onClick={() => setOpen(false)} className="text-sm text-gray-500">
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-bold"
        >
          <Plus className="w-4 h-4" />
          Add FAQ
        </button>
      )}

      {faqs.length === 0 ? (
        <Empty>
          No FAQs stored — the website is showing its built-in default set.
        </Empty>
      ) : (
        <ul className="space-y-3">
          {faqs.map((f) => (
            <li
              key={f.id}
              className="p-5 rounded-2xl bg-white border border-gray-200 flex items-start justify-between gap-4"
            >
              <div className="min-w-0">
                <span className="text-xs font-bold uppercase tracking-wide text-secondary">
                  {f.category}
                </span>
                <p className="font-heading font-bold text-primary mt-1">
                  {f.question}
                </p>
                <p className="text-sm text-gray-600 mt-1 whitespace-pre-line">
                  {f.answer}
                </p>
              </div>
              <RowActions
                published={f.is_published}
                busyKey={busy}
                id={f.id}
                onToggle={() =>
                  act(`f-${f.id}`, {
                    action: "toggle_faq",
                    id: f.id,
                    is_published: !f.is_published,
                  })
                }
                onDelete={() => act(`f-${f.id}`, { action: "delete_faq", id: f.id })}
                prefix="f"
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ----------------------------------------------------------------- messages */

function MessagesTab({
  messages,
  busy,
  act,
}: {
  messages: MessageRow[];
  busy: string | null;
  act: Act;
}) {
  if (messages.length === 0) return <Empty>No messages yet.</Empty>;

  return (
    <ul className="space-y-3">
      {messages.map((m) => (
        <li
          key={m.id}
          className={cn(
            "p-5 rounded-2xl border",
            m.status === "new"
              ? "bg-secondary-50 border-secondary-200"
              : "bg-white border-gray-200"
          )}
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="font-heading font-bold text-primary">
                {m.name}{" "}
                <span className="font-normal text-gray-500">&lt;{m.email}&gt;</span>
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {m.topic || "No topic"} ·{" "}
                {new Date(m.created_at).toLocaleString()}
              </p>
              <p className="text-sm text-gray-700 mt-3 whitespace-pre-line">
                {m.message}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <a
                href={`mailto:${m.email}?subject=Re: ${encodeURIComponent(m.topic || "Your message to FrancoLink")}`}
                className="p-2.5 rounded-xl border border-gray-200 text-gray-500 hover:text-primary"
                title="Reply by email"
              >
                <Mail className="w-4 h-4" />
              </a>
              <select
                value={m.status}
                disabled={busy === `m-${m.id}`}
                onChange={(e) =>
                  act(`m-${m.id}`, {
                    action: "set_message_status",
                    id: m.id,
                    status: e.target.value,
                  })
                }
                className="px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm"
              >
                {["new", "read", "replied", "spam"].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

/* -------------------------------------------------------------------- bits */

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    approved: "bg-success-light text-green-800",
    pending: "bg-warning-light text-amber-900",
    rejected: "bg-error-light text-red-800",
  };
  return (
    <span
      className={cn(
        "px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide",
        styles[status] ?? "bg-gray-100 text-gray-600"
      )}
    >
      {status}
    </span>
  );
}

function RowActions({
  published,
  busyKey,
  id,
  onToggle,
  onDelete,
  prefix,
}: {
  published: boolean;
  busyKey: string | null;
  id: string;
  onToggle: () => void;
  onDelete: () => void;
  prefix: string;
}) {
  const busy = busyKey === `${prefix}-${id}`;
  return (
    <div className="flex items-center gap-2 shrink-0">
      <button
        type="button"
        onClick={onToggle}
        disabled={busy}
        title={published ? "Unpublish" : "Publish"}
        className="p-2.5 rounded-xl border border-gray-200 text-gray-500 hover:text-primary disabled:opacity-60"
      >
        {busy ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : published ? (
          <Eye className="w-4 h-4" />
        ) : (
          <EyeOff className="w-4 h-4" />
        )}
      </button>
      <button
        type="button"
        onClick={() => {
          if (window.confirm("Delete this permanently?")) onDelete();
        }}
        disabled={busy}
        className="p-2.5 rounded-xl border border-gray-200 text-gray-400 hover:text-red-600 disabled:opacity-60"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="px-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-primary"
    />
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="py-12 text-center text-gray-500 bg-gray-50 rounded-2xl">
      {children}
    </p>
  );
}
