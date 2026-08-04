"use client";

import { useState } from "react";
import { CheckCircle2, Clock, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { LANGUAGE_LABEL, WEEKDAY_SHORT, formatMinute } from "@/lib/site/format";
import { PhotoUpload } from "@/components/site/photo-upload";
import { cn } from "@/lib/utils";

const LANGUAGES = ["fr", "en", "es", "de", "ar", "it", "pt"];
const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

interface Slot {
  weekday: number;
  start_minute: number;
  end_minute: number;
}

interface Qualification {
  title: string;
  issuer?: string;
  year?: number;
}

// Shape of the stored row; `any`-free but loose, since the table is wide.
interface ProfileRow {
  slug?: string;
  headline?: string | null;
  bio?: string | null;
  teaches?: string[] | null;
  speaks?: string[] | null;
  levels?: string[] | null;
  specialties?: string[] | null;
  qualifications?: Qualification[] | null;
  years_experience?: number | null;
  photo_url?: string | null;
  intro_video_url?: string | null;
  country?: string | null;
  timezone?: string | null;
  hourly_rate_cents?: number | null;
  currency?: string | null;
  trial_available?: boolean;
  is_public?: boolean;
  approval_status?: string;
  rejection_reason?: string | null;
}

export function PublicProfileForm({
  tutorName,
  profile,
  availability,
  siteUrl,
  /**
   * Set when an admin is authoring someone else's profile. Changes who the
   * save applies to and unlocks the approve-on-save control — a tutor editing
   * their own listing can never approve it.
   */
  targetUserId,
}: {
  tutorName: string;
  profile: ProfileRow | null;
  availability: Slot[];
  siteUrl: string;
  targetUserId?: string;
}) {
  const asAdmin = Boolean(targetUserId);
  const [approveNow, setApproveNow] = useState(
    profile?.approval_status === "approved"
  );
  const [headline, setHeadline] = useState(profile?.headline ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [teaches, setTeaches] = useState<string[]>(profile?.teaches ?? []);
  const [speaks, setSpeaks] = useState<string[]>(profile?.speaks ?? []);
  const [levels, setLevels] = useState<string[]>(profile?.levels ?? []);
  const [specialties, setSpecialties] = useState((profile?.specialties ?? []).join("\n"));
  const [quals, setQuals] = useState<Qualification[]>(profile?.qualifications ?? []);
  const [years, setYears] = useState(profile?.years_experience?.toString() ?? "");
  const [photoUrl, setPhotoUrl] = useState(profile?.photo_url ?? "");
  const [videoUrl, setVideoUrl] = useState(profile?.intro_video_url ?? "");
  const [country, setCountry] = useState(profile?.country ?? "");
  const [timezone, setTimezone] = useState(
    profile?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone
  );
  const [rate, setRate] = useState(
    profile?.hourly_rate_cents != null ? (profile.hourly_rate_cents / 100).toString() : ""
  );
  const [currency, setCurrency] = useState(profile?.currency ?? "EUR");
  const [trial, setTrial] = useState(profile?.trial_available ?? true);
  const [isPublic, setIsPublic] = useState(profile?.is_public ?? false);
  const [slots, setSlots] = useState<Slot[]>(availability);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    setSaved(false);

    const payload = {
      headline,
      bio,
      teaches,
      speaks,
      levels,
      specialties: specialties
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      qualifications: quals.filter((q) => q.title.trim()),
      years_experience: years ? Number(years) : null,
      photo_url: photoUrl || null,
      intro_video_url: videoUrl || null,
      country,
      timezone,
      hourly_rate_cents: rate ? Math.round(Number(rate) * 100) : null,
      currency,
      trial_available: trial,
      is_public: isPublic,
      availability: slots,
      ...(asAdmin && { user_id: targetUserId, approve: approveNow }),
    };

    try {
      const res = await fetch("/api/tutor/public-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Couldn't save.");
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save.");
    } finally {
      setSaving(false);
    }
  }

  const status = profile?.approval_status;

  return (
    <div className="space-y-8">
      {status && (
        <div
          className={cn(
            "p-4 rounded-xl text-sm",
            status === "approved"
              ? "bg-success-light text-green-800"
              : status === "rejected"
                ? "bg-error-light text-red-800"
                : "bg-warning-light text-amber-900"
          )}
        >
          {status === "approved" && (
            <>
              Your profile is <strong>live</strong> at{" "}
              <a
                href={`${siteUrl}/tutors/${profile?.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-4 font-semibold"
              >
                {siteUrl.replace(/^https?:\/\//, "")}/tutors/{profile?.slug}
              </a>
              .
            </>
          )}
          {status === "pending" && (
            <>
              Your profile is <strong>waiting for review</strong>. We usually get
              to it within a working day.
            </>
          )}
          {status === "rejected" && (
            <>
              Your profile <strong>wasn&apos;t approved</strong>
              {profile?.rejection_reason ? `: ${profile.rejection_reason}` : "."}{" "}
              Make the changes and save again to resubmit.
            </>
          )}
        </div>
      )}

      <Card title="The basics">
        <Text
          label="Headline"
          hint="One line students see under your name. Be specific."
          value={headline}
          onChange={setHeadline}
          placeholder={`${tutorName ? tutorName.split(" ")[0] + " —" : ""} DELF-qualified French tutor for adult beginners`}
          maxLength={200}
        />
        <label className="block">
          <span className="block text-sm font-semibold text-primary mb-2">
            About you
          </span>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={8}
            maxLength={4000}
            placeholder="How you teach, who you're best with, what a first lesson looks like…"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary-100 outline-none resize-y"
          />
          <span className="text-xs text-gray-400">{bio.length}/4000</span>
        </label>
        <div className="grid sm:grid-cols-2 gap-5">
          <Text label="Country" value={country} onChange={setCountry} placeholder="France" />
          <Text
            label="Timezone"
            hint="Your availability below is shown in this zone."
            value={timezone}
            onChange={setTimezone}
            placeholder="Europe/Paris"
          />
        </div>
        <PhotoUpload
          value={photoUrl || null}
          onChange={(url) => setPhotoUrl(url ?? "")}
          targetUserId={targetUserId}
          name={tutorName}
        />
        <Text
          label="Intro video (embed URL)"
          hint="A YouTube/Vimeo embed link, e.g. youtube.com/embed/xyz"
          value={videoUrl}
          onChange={setVideoUrl}
          placeholder="https://www.youtube.com/embed/…"
        />
      </Card>

      <Card title="What you teach">
        <Chips
          label="Languages you teach"
          options={LANGUAGES.map((c) => ({ value: c, label: LANGUAGE_LABEL[c] ?? c }))}
          selected={teaches}
          onChange={setTeaches}
        />
        <Chips
          label="Other languages you speak"
          options={LANGUAGES.map((c) => ({ value: c, label: LANGUAGE_LABEL[c] ?? c }))}
          selected={speaks}
          onChange={setSpeaks}
        />
        <Chips
          label="CEFR levels you cover"
          options={LEVELS.map((l) => ({ value: l, label: l }))}
          selected={levels}
          onChange={setLevels}
        />
        <label className="block">
          <span className="block text-sm font-semibold text-primary mb-2">
            Specialities
          </span>
          <span className="block text-xs text-gray-500 mb-2">
            One per line — e.g. &ldquo;DELF/DALF exam prep&rdquo;, &ldquo;Business
            French&rdquo;, &ldquo;Conversation for shy learners&rdquo;.
          </span>
          <textarea
            value={specialties}
            onChange={(e) => setSpecialties(e.target.value)}
            rows={5}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary-100 outline-none resize-y"
          />
        </label>
      </Card>

      <Card title="Qualifications and experience">
        <Text
          label="Years of teaching experience"
          type="number"
          value={years}
          onChange={setYears}
          placeholder="6"
        />
        <div className="space-y-3">
          <span className="block text-sm font-semibold text-primary">
            Qualifications
          </span>
          {quals.map((q, i) => (
            <div key={i} className="grid sm:grid-cols-[2fr_1.5fr_auto_auto] gap-3">
              <input
                value={q.title}
                onChange={(e) =>
                  setQuals(quals.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))
                }
                placeholder="Qualification"
                className="px-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-primary"
              />
              <input
                value={q.issuer ?? ""}
                onChange={(e) =>
                  setQuals(quals.map((x, j) => (j === i ? { ...x, issuer: e.target.value } : x)))
                }
                placeholder="Issued by"
                className="px-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-primary"
              />
              <input
                value={q.year ?? ""}
                onChange={(e) =>
                  setQuals(
                    quals.map((x, j) =>
                      j === i
                        ? { ...x, year: e.target.value ? Number(e.target.value) : undefined }
                        : x
                    )
                  )
                }
                type="number"
                placeholder="Year"
                className="w-24 px-3 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-primary"
              />
              <button
                type="button"
                onClick={() => setQuals(quals.filter((_, j) => j !== i))}
                aria-label="Remove qualification"
                className="p-2.5 text-gray-400 hover:text-red-600"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setQuals([...quals, { title: "" }])}
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
          >
            <Plus className="w-4 h-4" />
            Add a qualification
          </button>
        </div>
      </Card>

      <Card title="Rate and availability">
        <div className="grid sm:grid-cols-3 gap-5">
          <Text label="Hourly rate" type="number" value={rate} onChange={setRate} placeholder="25" />
          <label className="block">
            <span className="block text-sm font-semibold text-primary mb-2">Currency</span>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white outline-none focus:border-primary"
            >
              {["EUR", "USD", "GBP", "CAD", "XAF"].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-3 sm:mt-8">
            <input
              type="checkbox"
              checked={trial}
              onChange={(e) => setTrial(e.target.checked)}
              className="w-5 h-5 rounded accent-[#092845]"
            />
            <span className="text-sm font-semibold text-primary">
              I offer a free trial lesson
            </span>
          </label>
        </div>

        <AvailabilityEditor slots={slots} onChange={setSlots} />
      </Card>

      <Card title="Listing">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="w-5 h-5 mt-0.5 rounded accent-[#092845]"
          />
          <span>
            <span className="block text-sm font-semibold text-primary">
              List me on francolink.net
            </span>
            <span className="block text-sm text-gray-500 mt-0.5">
              Untick this at any time to remove yourself from the public
              directory. Your classes and students are unaffected.
            </span>
          </span>
        </label>

        {asAdmin && (
          <label className="flex items-start gap-3 pt-4 border-t border-gray-100">
            <input
              type="checkbox"
              checked={approveNow}
              onChange={(e) => setApproveNow(e.target.checked)}
              className="w-5 h-5 mt-0.5 rounded accent-[#092845]"
            />
            <span>
              <span className="block text-sm font-semibold text-primary">
                Approve and publish immediately
              </span>
              <span className="block text-sm text-gray-500 mt-0.5">
                Skips the review queue. The profile goes live as soon as you
                save — provided &ldquo;List me on francolink.net&rdquo; above is
                also ticked.
              </span>
            </span>
          </label>
        )}
      </Card>

      {error && (
        <p className="text-sm text-red-600 bg-error-light px-4 py-3 rounded-xl">{error}</p>
      )}
      {saved && (
        <p className="flex items-center gap-2 text-sm text-green-800 bg-success-light px-4 py-3 rounded-xl">
          <CheckCircle2 className="w-4 h-4" />
          {asAdmin ? "Profile saved." : "Saved and sent for review."}
        </p>
      )}

      <div className="sticky bottom-4">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="w-full inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl bg-primary text-white font-bold hover:bg-primary-800 disabled:opacity-60 shadow-lg shadow-primary/20"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          {saving ? "Saving…" : asAdmin ? "Save profile" : "Save and submit for review"}
        </button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="p-6 rounded-2xl bg-white border border-gray-100 shadow-soft space-y-5">
      <h2 className="font-heading font-bold text-lg text-primary">{title}</h2>
      {children}
    </section>
  );
}

function Text({
  label,
  hint,
  value,
  onChange,
  ...props
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  return (
    <label className="block">
      <span className="block text-sm font-semibold text-primary mb-2">{label}</span>
      {hint && <span className="block text-xs text-gray-500 mb-2">{hint}</span>}
      <input
        {...props}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary-100 outline-none"
      />
    </label>
  );
}

function Chips({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  return (
    <div>
      <span className="block text-sm font-semibold text-primary mb-2">{label}</span>
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

/** Weekly recurring hours, entered in the tutor's own timezone. */
function AvailabilityEditor({
  slots,
  onChange,
}: {
  slots: Slot[];
  onChange: (s: Slot[]) => void;
}) {
  const [weekday, setWeekday] = useState(1);
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("12:00");

  function toMinutes(hhmm: string): number {
    const [h, m] = hhmm.split(":").map(Number);
    return h * 60 + m;
  }

  function add() {
    const s = toMinutes(start);
    const e = toMinutes(end);
    if (!(e > s)) return;
    onChange(
      [...slots, { weekday, start_minute: s, end_minute: e }].sort(
        (a, b) => a.weekday - b.weekday || a.start_minute - b.start_minute
      )
    );
  }

  return (
    <div>
      <span className="block text-sm font-semibold text-primary mb-2">
        Weekly availability
      </span>
      <span className="block text-xs text-gray-500 mb-3">
        Recurring hours students see on your profile. These are indicative — you
        still confirm the exact time with each student.
      </span>

      <div className="flex flex-wrap items-end gap-3 p-4 rounded-xl bg-gray-50 mb-4">
        <select
          value={weekday}
          onChange={(e) => setWeekday(Number(e.target.value))}
          className="px-3 py-2.5 rounded-xl border border-gray-200 bg-white outline-none"
        >
          {[1, 2, 3, 4, 5, 6, 0].map((d) => (
            <option key={d} value={d}>
              {WEEKDAY_SHORT[d]}
            </option>
          ))}
        </select>
        <input
          type="time"
          value={start}
          onChange={(e) => setStart(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-gray-200 outline-none"
        />
        <span className="pb-2.5 text-gray-400">→</span>
        <input
          type="time"
          value={end}
          onChange={(e) => setEnd(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-gray-200 outline-none"
        />
        <button
          type="button"
          onClick={add}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-bold"
        >
          <Plus className="w-4 h-4" />
          Add
        </button>
      </div>

      {slots.length === 0 ? (
        <p className="text-sm text-gray-500">
          No hours added — your profile will say you arrange times directly.
        </p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {slots.map((s, i) => (
            <li
              key={`${s.weekday}-${s.start_minute}-${i}`}
              className="inline-flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-xl bg-success-light text-green-800 text-sm font-semibold"
            >
              <Clock className="w-3.5 h-3.5" />
              {WEEKDAY_SHORT[s.weekday]} {formatMinute(s.start_minute)}–
              {formatMinute(s.end_minute)}
              <button
                type="button"
                onClick={() => onChange(slots.filter((_, j) => j !== i))}
                aria-label="Remove slot"
                className="p-1 hover:text-red-600"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
