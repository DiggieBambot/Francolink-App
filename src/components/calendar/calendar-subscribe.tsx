"use client";

// "Put my lessons in my calendar."
//
// The feed and its token endpoint have existed since 20260813_calendar_feed.sql
// but nothing ever linked to them, so nobody could reach it. This is that link.
//
// A subscription is better than the per-lesson "add to calendar" button for the
// thing people actually want — the reminder their phone already knows how to
// give them — because it keeps tracking: lessons booked later appear on their
// own, and cancelled ones disappear.

import { useState } from "react";
import { CalendarDays, Check, Copy, RefreshCw } from "lucide-react";

export function CalendarSubscribe() {
  const [url, setUrl] = useState("");
  const [webcal, setWebcal] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  // `rotate` invalidates the old link. Worth having in the UI rather than as a
  // support ticket: the URL is a bearer token, and anyone who pastes it into
  // the wrong window needs a way to take it back.
  const load = async (rotate: boolean) => {
    if (rotate && !confirm("This breaks the old link — any calendar already subscribed will stop updating. Continue?")) {
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/calendar/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rotate }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Couldn't create your calendar link.");
      setUrl(data.url);
      setWebcal(data.webcal);
    } catch (e) {
      setError((e as Error).message);
    }
    setLoading(false);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Couldn't copy — select the link and copy it manually.");
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-sky-100 rounded-xl flex items-center justify-center">
          <CalendarDays className="w-5 h-5 text-sky-600" />
        </div>
        <div>
          <h3 className="font-bold text-gray-900">Your lessons in your calendar</h3>
          <p className="text-sm text-gray-500">
            Subscribe once and every lesson shows up — with your calendar&apos;s own alerts.
          </p>
        </div>
      </div>

      {!url ? (
        <button
          onClick={() => load(false)}
          disabled={loading}
          className="px-4 py-2 rounded-xl text-sm font-bold bg-primary text-white hover:bg-primary-800 disabled:opacity-60"
        >
          {loading ? "..." : "Get my calendar link"}
        </button>
      ) : (
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              readOnly
              value={url}
              onFocus={(e) => e.currentTarget.select()}
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 text-gray-700"
            />
            <button
              onClick={copy}
              className="px-3 rounded-xl border border-gray-200 hover:bg-gray-50"
              aria-label="Copy calendar link"
            >
              {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {/* Google can't read webcal:// — it takes the https URL pasted into
                "From URL". Apple Calendar and Outlook subscribe on the click. */}
            <a
              href={`https://calendar.google.com/calendar/u/0/r/settings/addbyurl`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 rounded-xl text-sm font-semibold border border-gray-200 hover:bg-gray-50"
            >
              Add to Google Calendar
            </a>
            <a
              href={webcal}
              className="px-3 py-2 rounded-xl text-sm font-semibold border border-gray-200 hover:bg-gray-50"
            >
              Add to Apple / Outlook
            </a>
            <button
              onClick={() => load(true)}
              disabled={loading}
              className="px-3 py-2 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-50 flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset link
            </button>
          </div>

          <p className="text-xs text-gray-500 leading-relaxed">
            Keep this link private — anyone who has it can see your lesson schedule.
            For Google, paste it into <b>Other calendars → From URL</b>. Google refreshes
            subscribed calendars on its own schedule, so a brand-new lesson can take a few
            hours to appear there.
          </p>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
