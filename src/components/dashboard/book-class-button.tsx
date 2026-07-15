"use client";

import { useState } from "react";
import { CalendarPlus, X, Loader2, Check } from "lucide-react";

export function BookClassButton({ tutorName }: { tutorName: string }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState("");

  async function send() {
    setState("sending");
    setError("");
    try {
      const res = await fetch("/api/tutor/book-class", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, preferredTime }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not send");
      setState("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setState("idle");
    }
  }

  function close() {
    setOpen(false);
    setTimeout(() => { setState("idle"); setMessage(""); setPreferredTime(""); setError(""); }, 200);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-800"
        title="Book a class"
      >
        <CalendarPlus className="h-4 w-4" />
        <span className="hidden sm:inline">Book a class</span>
      </button>

      {open ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={close} />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-800">
            <button onClick={close} className="absolute right-3 top-3 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700" aria-label="Close">
              <X className="h-5 w-5" />
            </button>

            {state === "done" ? (
              <div className="py-4 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-green-100 text-green-600">
                  <Check className="h-6 w-6" />
                </div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Request sent!</h2>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                  {tutorName} has been notified and will arrange a time with you.
                </p>
                <button onClick={close} className="mt-5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-800">
                  Done
                </button>
              </div>
            ) : (
              <>
                <div className="mb-1 flex items-center gap-2">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary-100 text-primary">
                    <CalendarPlus className="h-5 w-5" />
                  </span>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">Book a class with {tutorName}</h2>
                </div>
                <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                  Send a quick request — your tutor will get in touch to confirm a time.
                </p>

                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  When works for you? <span className="font-normal text-gray-400">(optional)</span>
                </label>
                <input
                  value={preferredTime}
                  onChange={(e) => setPreferredTime(e.target.value)}
                  placeholder="e.g. weekday evenings, this Saturday…"
                  className="mb-4 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary focus:ring-2 focus:ring-primary-200 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                />

                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Anything to add? <span className="font-normal text-gray-400">(optional)</span>
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  placeholder="What you'd like to work on…"
                  className="mb-4 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary focus:ring-2 focus:ring-primary-200 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                />

                {error ? <p className="mb-3 text-sm text-red-600">{error}</p> : null}

                <button
                  onClick={send}
                  disabled={state === "sending"}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-800 disabled:opacity-50"
                >
                  {state === "sending" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarPlus className="h-4 w-4" />}
                  Send request
                </button>
              </>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
