"use client";

// Tutor settings card: connect Google Calendar for real two-way sync.
//
// Sits above the ICS subscribe card. The feed still works and is what students
// use; this is the fast path for tutors — lessons appear the moment they're
// confirmed, and their Google busy times stop students booking over them.

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, CalendarCheck, Loader2 } from "lucide-react";

interface Status {
  available: boolean;
  connected: boolean;
  email?: string | null;
  pushEnabled?: boolean;
  blockBusy?: boolean;
  broken?: boolean;
  error?: string | null;
}

const RETURN_MESSAGES: Record<string, { ok: boolean; text: string }> = {
  connected: { ok: true, text: "Google Calendar connected. Your upcoming lessons are on their way in." },
  cancelled: { ok: false, text: "Connection cancelled — nothing was changed." },
  scopes: {
    ok: false,
    text: "Google didn't give FrancoLink calendar access. Try again and leave both calendar boxes ticked.",
  },
  error: { ok: false, text: "Something went wrong connecting Google Calendar. Please try again." },
  unavailable: { ok: false, text: "Google Calendar sync isn't switched on yet." },
  forbidden: { ok: false, text: "Google Calendar sync is for tutor accounts." },
};

export function GoogleCalendarConnect() {
  const params = useSearchParams();
  const [status, setStatus] = useState<Status | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const returned = RETURN_MESSAGES[params.get("gcal") || ""];

  const refresh = async () => {
    try {
      const res = await fetch("/api/calendar/google", { cache: "no-store" });
      if (res.ok) setStatus(await res.json());
    } catch {
      /* card just stays in its loading state */
    }
  };

  useEffect(() => {
    let live = true;
    fetch("/api/calendar/google", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (live && data) setStatus(data);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);

  // A full-page navigation, not a <Link>: this is an API route that redirects
  // to Google, so client routing or prefetching it would be wrong.
  const connect = () => window.location.assign("/api/calendar/google/connect");

  const toggle = async (field: "pushEnabled" | "blockBusy", value: boolean) => {
    setStatus((s) => (s ? { ...s, [field]: value } : s));
    const res = await fetch("/api/calendar/google", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
    if (!res.ok) {
      setError("Couldn't save that setting.");
      refresh();
    }
  };

  const disconnect = async () => {
    if (!confirm("Disconnect Google Calendar? Your upcoming FrancoLink lessons will be removed from it.")) return;
    setBusy(true);
    setError("");
    const res = await fetch("/api/calendar/google", { method: "DELETE" });
    if (!res.ok) setError("Couldn't disconnect. Please try again.");
    await refresh();
    setBusy(false);
  };

  if (!status) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-6 flex items-center gap-2 text-sm text-gray-500">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading Google Calendar…
      </div>
    );
  }

  if (!status.available && !status.connected) return null;

  return (
    <div id="google-calendar" className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
          <CalendarCheck className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <h3 className="font-bold text-gray-900">Sync with Google Calendar</h3>
          <p className="text-sm text-gray-500">
            Lessons appear in Google the moment they&apos;re booked, and your Google events keep students
            from booking over them.
          </p>
        </div>
      </div>

      {returned && (
        <p className={`text-sm ${returned.ok ? "text-green-700" : "text-amber-700"}`}>{returned.text}</p>
      )}

      {!status.connected ? (
        <button
          onClick={connect}
          className="px-4 py-2 rounded-xl text-sm font-bold bg-primary text-white hover:bg-primary-800"
        >
          Connect Google Calendar
        </button>
      ) : (
        <div className="space-y-4">
          {status.broken ? (
            <div className="flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <div>
                <p>{status.error || "Google stopped accepting our connection."}</p>
                <button onClick={connect} className="font-bold underline">
                  Reconnect Google Calendar
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-700">
              Connected{status.email ? <> as <b>{status.email}</b></> : null}.
            </p>
          )}

          <label className="flex items-start gap-3 text-sm text-gray-700">
            <input
              type="checkbox"
              className="mt-1"
              checked={!!status.pushEnabled}
              onChange={(e) => toggle("pushEnabled", e.target.checked)}
            />
            <span>
              <b>Add my lessons to Google Calendar</b>
              <br />
              <span className="text-gray-500">New lessons are added instantly; cancelled ones are removed.</span>
            </span>
          </label>

          <label className="flex items-start gap-3 text-sm text-gray-700">
            <input
              type="checkbox"
              className="mt-1"
              checked={!!status.blockBusy}
              onChange={(e) => toggle("blockBusy", e.target.checked)}
            />
            <span>
              <b>Hide times I&apos;m busy in Google</b>
              <br />
              <span className="text-gray-500">
                Only free/busy is read — FrancoLink never sees your event titles or details.
              </span>
            </span>
          </label>

          <button
            onClick={disconnect}
            disabled={busy}
            className="px-3 py-2 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-50 disabled:opacity-60"
          >
            {busy ? "Disconnecting…" : "Disconnect"}
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
