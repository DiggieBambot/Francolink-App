"use client";

import { useMemo, useState } from "react";
import { CalendarOff, CheckCircle2, Clock, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { generateSlots, type WeeklyRule } from "@/lib/booking/slots";
import { WEEKDAY_LABEL, WEEKDAY_SHORT, formatMinute } from "@/lib/site/format";
import { cn } from "@/lib/utils";

interface Blackout {
  starts_at: string;
  ends_at: string;
  reason: string;
}

// Must match what the booking route uses, or the preview would promise slots
// the server then refuses.
const DURATIONS = [25, 50];
const BUFFER_MINUTES = 10;
const MIN_NOTICE_HOURS = 12;
const PREVIEW_DAYS = 14;

// Monday-first for reading; stored weekday is JS-style (0 = Sunday).
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

export function AvailabilityEditor({
  timezone,
  initialRules,
  initialBlackouts,
  busy,
}: {
  timezone: string;
  initialRules: WeeklyRule[];
  initialBlackouts: Blackout[];
  busy: { start: string; end: string }[];
}) {
  const [rules, setRules] = useState<WeeklyRule[]>(initialRules);
  const [blackouts, setBlackouts] = useState<Blackout[]>(initialBlackouts);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New-block form
  const [weekday, setWeekday] = useState(1);
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("12:00");

  // New-blackout form
  const [offFrom, setOffFrom] = useState("");
  const [offTo, setOffTo] = useState("");
  const [offReason, setOffReason] = useState("");

  function toMinutes(hhmm: string) {
    const [h, m] = hhmm.split(":").map(Number);
    return h * 60 + m;
  }

  function addRule() {
    const s = toMinutes(start);
    const e = toMinutes(end);
    if (!(e > s)) {
      setError("A block has to end after it starts.");
      return;
    }
    const clash = rules.some(
      (r) => r.weekday === weekday && s < r.end_minute && r.start_minute < e
    );
    if (clash) {
      setError("That overlaps a block you already have on that day.");
      return;
    }
    setError(null);
    setRules(
      [...rules, { weekday, start_minute: s, end_minute: e }].sort(
        (a, b) => a.weekday - b.weekday || a.start_minute - b.start_minute
      )
    );
  }

  function addBlackout() {
    if (!offFrom || !offTo) return;
    const s = new Date(offFrom);
    const e = new Date(offTo);
    if (!(e > s)) {
      setError("Time off has to end after it starts.");
      return;
    }
    setError(null);
    setBlackouts(
      [
        ...blackouts,
        { starts_at: s.toISOString(), ends_at: e.toISOString(), reason: offReason },
      ].sort((a, b) => a.starts_at.localeCompare(b.starts_at))
    );
    setOffFrom("");
    setOffTo("");
    setOffReason("");
  }

  // Exactly what a student would be offered, so there are no surprises.
  const preview = useMemo(() => {
    const now = new Date();
    const to = new Date(now.getTime() + PREVIEW_DAYS * 24 * 60 * 60_000);
    const slots = generateSlots({
      timezone,
      rules,
      busy: [
        ...busy.map((b) => ({ start: new Date(b.start), end: new Date(b.end) })),
        ...blackouts.map((b) => ({
          start: new Date(b.starts_at),
          end: new Date(b.ends_at),
        })),
      ],
      durations: DURATIONS,
      from: now,
      to,
      minNoticeHours: MIN_NOTICE_HOURS,
      bufferMinutes: BUFFER_MINUTES,
    });

    // Group by local date for a readable summary.
    const byDay = new Map<string, number>();
    for (const s of slots) {
      const key = s.start.toLocaleDateString("en-GB", {
        timeZone: timezone,
        weekday: "short",
        day: "numeric",
        month: "short",
      });
      byDay.set(key, (byDay.get(key) ?? 0) + 1);
    }
    return { total: slots.length, byDay: [...byDay.entries()] };
  }, [rules, blackouts, busy, timezone]);

  const weeklyHours = useMemo(
    () =>
      rules.reduce((sum, r) => sum + (r.end_minute - r.start_minute), 0) / 60,
    [rules]
  );

  async function save() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/tutor/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rules, blackouts }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Couldn't save.");
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------- weekly hours */}
      <section className="p-6 rounded-2xl bg-white border border-gray-100 shadow-soft">
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1">
          <h2 className="font-heading font-bold text-lg text-primary">
            Weekly hours
          </h2>
          <span className="text-sm text-gray-500">
            {weeklyHours.toFixed(1)} h/week · times in {timezone}
          </span>
        </div>
        <p className="text-sm text-gray-500 mb-5">
          Repeats every week. Students see these converted to their own timezone.
        </p>

        <div className="flex flex-wrap items-end gap-3 p-4 rounded-xl bg-gray-50 mb-5">
          <select
            value={weekday}
            onChange={(e) => setWeekday(Number(e.target.value))}
            className="px-3 py-2.5 rounded-xl border border-gray-200 bg-white outline-none"
          >
            {DAY_ORDER.map((d) => (
              <option key={d} value={d}>
                {WEEKDAY_LABEL[d]}
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
            onClick={addRule}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-bold"
          >
            <Plus className="w-4 h-4" />
            Add block
          </button>
        </div>

        <div className="rounded-2xl border border-gray-100 divide-y divide-gray-100 overflow-hidden">
          {DAY_ORDER.map((day) => {
            const dayRules = rules.filter((r) => r.weekday === day);
            return (
              <div key={day} className="flex items-center gap-4 px-4 py-3 bg-white">
                <span className="w-24 shrink-0 font-heading font-bold text-sm text-primary">
                  {WEEKDAY_LABEL[day]}
                </span>
                {dayRules.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {dayRules.map((r, i) => (
                      <span
                        key={`${r.start_minute}-${i}`}
                        className="inline-flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-xl bg-success-light text-green-800 text-sm font-semibold tabular-nums"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        {formatMinute(r.start_minute)}–{formatMinute(r.end_minute)}
                        <button
                          type="button"
                          aria-label="Remove block"
                          onClick={() =>
                            setRules(
                              rules.filter(
                                (x) =>
                                  !(
                                    x.weekday === r.weekday &&
                                    x.start_minute === r.start_minute &&
                                    x.end_minute === r.end_minute
                                  )
                              )
                            )
                          }
                          className="p-1 hover:text-red-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-sm text-gray-400">Not available</span>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ----------------------------------------------------- time off */}
      <section className="p-6 rounded-2xl bg-white border border-gray-100 shadow-soft">
        <h2 className="font-heading font-bold text-lg text-primary mb-1">
          Time off
        </h2>
        <p className="text-sm text-gray-500 mb-5">
          Holidays and one-off gaps. These override your weekly hours, so nobody
          can book you then.
        </p>

        <div className="flex flex-wrap items-end gap-3 p-4 rounded-xl bg-gray-50 mb-5">
          <label className="text-sm">
            <span className="block text-xs font-semibold text-gray-500 mb-1">From</span>
            <input
              type="datetime-local"
              value={offFrom}
              onChange={(e) => setOffFrom(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-gray-200 outline-none"
            />
          </label>
          <label className="text-sm">
            <span className="block text-xs font-semibold text-gray-500 mb-1">To</span>
            <input
              type="datetime-local"
              value={offTo}
              onChange={(e) => setOffTo(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-gray-200 outline-none"
            />
          </label>
          <input
            value={offReason}
            onChange={(e) => setOffReason(e.target.value)}
            placeholder="Reason (optional)"
            className="flex-1 min-w-40 px-3 py-2.5 rounded-xl border border-gray-200 outline-none"
          />
          <button
            type="button"
            onClick={addBlackout}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-bold"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>

        {blackouts.length === 0 ? (
          <p className="text-sm text-gray-500">No time off booked.</p>
        ) : (
          <ul className="space-y-2">
            {blackouts.map((b, i) => (
              <li
                key={`${b.starts_at}-${i}`}
                className="flex items-center justify-between gap-4 px-4 py-3 rounded-xl bg-gray-50"
              >
                <span className="inline-flex items-center gap-2 text-sm text-gray-700">
                  <CalendarOff className="w-4 h-4 text-gray-400" />
                  {new Date(b.starts_at).toLocaleString("en-GB", {
                    timeZone: timezone,
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                  {" → "}
                  {new Date(b.ends_at).toLocaleString("en-GB", {
                    timeZone: timezone,
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                  {b.reason && (
                    <span className="text-gray-500">· {b.reason}</span>
                  )}
                </span>
                <button
                  type="button"
                  aria-label="Remove time off"
                  onClick={() => setBlackouts(blackouts.filter((_, j) => j !== i))}
                  className="p-1.5 text-gray-400 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ------------------------------------------------------ preview */}
      <section className="p-6 rounded-2xl bg-primary-50 border border-primary-100">
        <h2 className="font-heading font-bold text-lg text-primary mb-1">
          What students will see
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          {preview.total} bookable {preview.total === 1 ? "slot" : "slots"} over
          the next {PREVIEW_DAYS} days, for 25 and 50-minute lessons. Excludes
          your time off, anything already booked, and the {MIN_NOTICE_HOURS}-hour
          minimum notice.
        </p>
        {preview.byDay.length === 0 ? (
          <p className="text-sm text-gray-500">
            Nothing bookable yet — add a weekly block above.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {preview.byDay.map(([day, count]) => (
              <span
                key={day}
                className="px-3 py-1.5 rounded-xl bg-white text-sm font-semibold text-primary"
              >
                {day}
                <span className="ml-2 text-xs text-gray-500">{count}</span>
              </span>
            ))}
          </div>
        )}
      </section>

      {error && (
        <p className="text-sm text-red-600 bg-error-light px-4 py-3 rounded-xl">
          {error}
        </p>
      )}
      {saved && (
        <p className="inline-flex items-center gap-2 text-sm text-green-800 bg-success-light px-4 py-3 rounded-xl">
          <CheckCircle2 className="w-4 h-4" />
          Saved.
        </p>
      )}

      <div className="sticky bottom-4">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className={cn(
            "w-full inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl bg-primary text-white font-bold hover:bg-primary-800 disabled:opacity-60 shadow-lg shadow-primary/20"
          )}
        >
          {saving ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          {saving ? "Saving…" : "Save availability"}
        </button>
      </div>
    </div>
  );
}
