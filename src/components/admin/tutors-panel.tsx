"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  CheckCircle2,
  ExternalLink,
  Globe,
  Loader2,
  PencilLine,
  UserPlus,
  Users,
} from "lucide-react";
import type {
  AdminApplication,
  AdminTutor,
  TutorPanelData,
} from "@/lib/admin/tutors";
import { cn } from "@/lib/utils";

type Tab = "tutors" | "applications";

const TIERS = ["community", "certified", "professional"] as const;

export function TutorsPanel({
  data,
  siteUrl,
}: {
  data: TutorPanelData;
  siteUrl: string;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("tutors");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function act(key: string, payload: Record<string, unknown>) {
    setBusy(key);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/admin/tutors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "That didn't save.");
      if (body.message) setNotice(body.message);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "That didn't save.");
    } finally {
      setBusy(null);
    }
  }

  const { stats } = data;

  return (
    <div className="p-6 max-w-7xl">
      <header className="mb-6">
        <h1 className="font-heading font-extrabold text-2xl text-primary">
          Tutors
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Accounts, listings and the application pipeline.
        </p>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <Stat icon={Users} label="Tutor accounts" value={stats.tutors} />
        <Stat icon={Globe} label="Live on site" value={stats.live} tone="green" />
        <Stat
          icon={PencilLine}
          label="Awaiting review"
          value={stats.pendingReview}
          tone={stats.pendingReview ? "amber" : undefined}
        />
        <Stat
          icon={UserPlus}
          label="Open applications"
          value={stats.openApplications}
          tone={stats.openApplications ? "amber" : undefined}
        />
        <Stat icon={BookOpen} label="With students" value={stats.teaching} />
      </div>

      <nav className="flex gap-1 border-b border-gray-200 mb-6">
        {([["tutors", "Tutors"], ["applications", "Applications"]] as const).map(
          ([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={cn(
                "px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors",
                tab === key
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              )}
            >
              {label}
              {key === "applications" && stats.openApplications > 0 && (
                <span className="ml-2 px-1.5 py-0.5 rounded-full bg-secondary text-primary-900 text-xs font-bold">
                  {stats.openApplications}
                </span>
              )}
            </button>
          )
        )}
      </nav>

      {error && (
        <p className="mb-4 text-sm text-red-600 bg-error-light px-4 py-3 rounded-xl">
          {error}
        </p>
      )}
      {notice && (
        <p className="mb-4 text-sm text-green-800 bg-success-light px-4 py-3 rounded-xl inline-flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          {notice}
        </p>
      )}

      {tab === "tutors" ? (
        <TutorsTable
          tutors={data.tutors}
          siteUrl={siteUrl}
          busy={busy}
          act={act}
        />
      ) : (
        <ApplicationsList
          applications={data.applications}
          busy={busy}
          act={act}
        />
      )}
    </div>
  );
}

type Act = (key: string, payload: Record<string, unknown>) => Promise<void>;

/* -------------------------------------------------------------------------- */

function TutorsTable({
  tutors,
  siteUrl,
  busy,
  act,
}: {
  tutors: AdminTutor[];
  siteUrl: string;
  busy: string | null;
  act: Act;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "live" | "listed" | "none">("all");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tutors.filter((t) => {
      if (q && !`${t.name ?? ""} ${t.email}`.toLowerCase().includes(q)) return false;
      if (filter === "live") return t.live;
      if (filter === "listed") return t.approval_status !== null;
      if (filter === "none") return t.approval_status === null;
      return true;
    });
  }, [tutors, query, filter]);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name or email…"
          className="flex-1 min-w-64 px-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-primary"
        />
        <div className="flex gap-1">
          {(
            [
              ["all", "All"],
              ["live", "Live"],
              ["listed", "Has listing"],
              ["none", "No listing"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={cn(
                "px-3 py-2 rounded-lg text-sm font-semibold transition-colors",
                filter === key
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <span className="text-sm text-gray-500">
          {visible.length} of {tutors.length}
        </span>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr className="text-xs uppercase tracking-wide text-gray-500">
              <th className="px-4 py-3 font-bold">Tutor</th>
              <th className="px-4 py-3 font-bold">Listing</th>
              <th className="px-4 py-3 font-bold">Tier</th>
              <th className="px-4 py-3 font-bold text-center">Students</th>
              <th className="px-4 py-3 font-bold text-center">Rooms</th>
              <th className="px-4 py-3 font-bold text-center">Homework</th>
              <th className="px-4 py-3 font-bold">Last active</th>
              <th className="px-4 py-3 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {visible.map((t) => {
              const key = `t-${t.id}`;
              const working = busy === key;
              return (
                <tr key={t.id} className="hover:bg-gray-50/60">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-primary flex items-center gap-2">
                      {t.name || "Unnamed"}
                      {t.role === "ADMIN" && (
                        <span className="px-1.5 py-0.5 rounded bg-primary-50 text-primary text-[10px] font-bold">
                          ADMIN
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">{t.email}</div>
                  </td>

                  <td className="px-4 py-3">
                    {t.approval_status === null ? (
                      <span className="text-gray-400">—</span>
                    ) : (
                      <div className="flex flex-col gap-1">
                        <ListingBadge tutor={t} />
                        {!t.live && (
                          <span className="text-[11px] text-gray-500">
                            {missingGate(t)}
                          </span>
                        )}
                      </div>
                    )}
                  </td>

                  <td className="px-4 py-3">
                    {t.approval_status === null ? (
                      <span className="text-gray-400">—</span>
                    ) : (
                      <select
                        value={t.tier ?? "community"}
                        disabled={working}
                        onChange={(e) =>
                          act(key, {
                            action: "set_tier",
                            user_id: t.id,
                            tier: e.target.value,
                          })
                        }
                        className="px-2 py-1.5 rounded-lg border border-gray-200 bg-white text-xs"
                      >
                        {TIERS.map((tier) => (
                          <option key={tier} value={tier}>
                            {tier}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>

                  <td className="px-4 py-3 text-center tabular-nums">{t.students}</td>
                  <td className="px-4 py-3 text-center tabular-nums">{t.rooms}</td>
                  <td className="px-4 py-3 text-center tabular-nums">{t.homework}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                    {t.last_activity_date
                      ? new Date(t.last_activity_date).toLocaleDateString()
                      : "never"}
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {working && (
                        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                      )}
                      {t.approval_status !== null && (
                        <button
                          type="button"
                          disabled={working}
                          onClick={() =>
                            act(key, {
                              action: "set_bookings",
                              user_id: t.id,
                              accepts_bookings: !t.accepts_bookings,
                            })
                          }
                          className={cn(
                            "px-2.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap",
                            t.accepts_bookings
                              ? "bg-success-light text-green-800"
                              : "bg-gray-100 text-gray-600"
                          )}
                          title="Toggle whether this tutor appears and can be booked"
                        >
                          {t.accepts_bookings ? "Bookable" : "Off"}
                        </button>
                      )}
                      <Link
                        href={`/admin/website/tutors/${t.id}`}
                        className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-bold whitespace-nowrap"
                      >
                        {t.approval_status === null ? "Create listing" : "Edit"}
                      </Link>
                      {t.live && t.slug && (
                        <a
                          href={`${siteUrl}/tutors/${t.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-gray-400 hover:text-primary"
                          title="View public profile"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {visible.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-gray-500">
                  No tutor matches that.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Which of the three gates is still shut. */
function missingGate(t: AdminTutor): string {
  const missing: string[] = [];
  if (t.approval_status !== "approved") missing.push("not approved");
  if (!t.is_public) missing.push("not opted in");
  if (!t.accepts_bookings) missing.push("bookings off");
  return missing.join(" · ");
}

function ListingBadge({ tutor }: { tutor: AdminTutor }) {
  if (tutor.live) {
    return (
      <span className="inline-flex w-fit px-2 py-0.5 rounded-full bg-success-light text-green-800 text-[11px] font-bold uppercase">
        Live
      </span>
    );
  }
  const styles: Record<string, string> = {
    approved: "bg-primary-50 text-primary",
    pending: "bg-warning-light text-amber-900",
    rejected: "bg-error-light text-red-800",
  };
  return (
    <span
      className={cn(
        "inline-flex w-fit px-2 py-0.5 rounded-full text-[11px] font-bold uppercase",
        styles[tutor.approval_status ?? ""] ?? "bg-gray-100 text-gray-600"
      )}
    >
      {tutor.approval_status}
    </span>
  );
}

/* -------------------------------------------------------------------------- */

const APP_STATUS_STYLE: Record<string, string> = {
  new: "bg-secondary-50 text-secondary-700",
  reviewing: "bg-primary-50 text-primary",
  interviewing: "bg-primary-50 text-primary",
  accepted: "bg-success-light text-green-800",
  rejected: "bg-error-light text-red-800",
  spam: "bg-gray-100 text-gray-500",
};

function ApplicationsList({
  applications,
  busy,
  act,
}: {
  applications: AdminApplication[];
  busy: string | null;
  act: Act;
}) {
  if (applications.length === 0) {
    return (
      <p className="py-12 text-center text-gray-500 bg-gray-50 rounded-2xl">
        No applications yet. The form is live at /teach.
      </p>
    );
  }

  return (
    <ul className="space-y-4">
      {applications.map((a) => {
        const key = `a-${a.id}`;
        const working = busy === key;
        const accepted = a.status === "accepted" || Boolean(a.created_user_id);

        return (
          <li
            key={a.id}
            className={cn(
              "p-5 rounded-2xl border",
              a.status === "new"
                ? "bg-secondary-50 border-secondary-200"
                : "bg-white border-gray-200"
            )}
          >
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="font-heading font-bold text-primary">
                    {a.full_name}
                  </h2>
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-full text-[11px] font-bold uppercase",
                      APP_STATUS_STYLE[a.status] ?? "bg-gray-100 text-gray-600"
                    )}
                  >
                    {a.status}
                  </span>
                  {a.applicant_user_id && !a.created_user_id && (
                    <span className="px-2 py-0.5 rounded-full bg-primary-50 text-primary text-[11px] font-bold uppercase">
                      existing tutor
                    </span>
                  )}
                  {a.created_user_id && (
                    <Link
                      href={`/admin/website/tutors/${a.created_user_id}`}
                      className="text-xs font-semibold text-primary underline underline-offset-4"
                    >
                      account created → edit listing
                    </Link>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-1">{a.email}</p>
                <p className="text-xs text-gray-500 mt-2">
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

              <div className="flex flex-col gap-2 shrink-0 w-52">
                <select
                  value={a.proposed_tier ?? ""}
                  disabled={working || accepted}
                  onChange={(e) =>
                    act(key, {
                      action: "set_application_status_tier",
                      id: a.id,
                      proposed_tier: e.target.value,
                    })
                  }
                  className="px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm disabled:opacity-60"
                >
                  <option value="">Tier if accepted…</option>
                  {TIERS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>

                {accepted ? (
                  <span className="px-3 py-2.5 rounded-xl bg-success-light text-green-800 text-xs font-bold text-center">
                    Account created
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={working}
                    onClick={() => {
                      if (
                        window.confirm(
                          a.applicant_user_id
                            ? `Accept ${a.full_name} as a FrancoLink tutor? They already have an account — this creates their draft listing.`
                            : `Create a tutor account for ${a.full_name} (${a.email}) and email them an invite?`
                        )
                      ) {
                        act(key, { action: "accept_application", id: a.id });
                      }
                    }}
                    className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-green-600 text-white text-sm font-bold disabled:opacity-60"
                  >
                    {working ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <UserPlus className="w-4 h-4" />
                    )}
                    {a.applicant_user_id ? "Accept & list" : "Accept & invite"}
                  </button>
                )}

                <a
                  href={`mailto:${a.email}?subject=${encodeURIComponent("Your FrancoLink teaching application")}`}
                  className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-primary text-center"
                >
                  Reply
                </a>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/* -------------------------------------------------------------------------- */

function Stat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Users;
  label: string;
  value: number;
  tone?: "green" | "amber";
}) {
  const tones = {
    green: "bg-success-light text-green-700",
    amber: "bg-warning-light text-amber-800",
  };
  return (
    <div className="p-4 rounded-2xl bg-white border border-gray-200">
      <div
        className={cn(
          "w-9 h-9 rounded-xl flex items-center justify-center mb-3",
          tone ? tones[tone] : "bg-gray-100 text-gray-500"
        )}
      >
        <Icon className="w-4 h-4" />
      </div>
      <p className="font-heading font-extrabold text-2xl text-primary tabular-nums">
        {value}
      </p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}
