"use client";

import { useState } from "react";
import { GraduationCap, Check, Loader2, X } from "lucide-react";

interface Props {
  sessionId: string;
  tutorName: string;
}

// Shown to a student who enters a tutor's room but isn't connected to that tutor
// yet (e.g. they just signed up from the shared /room link). Offers to join the
// tutor's class; the tutor confirms them from their People tab.
export function JoinClassPrompt({ sessionId, tutorName }: Props) {
  const [open, setOpen] = useState(true);
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState("");

  if (!open) return null;

  async function join() {
    setState("sending");
    setError("");
    try {
      const res = await fetch("/api/tutor/join-from-room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not join");
      setState("done");
      setTimeout(() => setOpen(false), 2500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setState("idle");
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
      <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl dark:bg-gray-800">
        <button
          onClick={() => setOpen(false)}
          className="absolute right-3 top-3 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
          aria-label="Dismiss"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-100 text-primary">
          <GraduationCap className="h-7 w-7" />
        </div>

        {state === "done" ? (
          <>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Request sent!</h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              {tutorName} will confirm you as their student. You can keep learning in the meantime.
            </p>
          </>
        ) : (
          <>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Join {tutorName}&apos;s class?
            </h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              Get lessons, homework, and progress tracking with {tutorName} as your tutor.
            </p>

            {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                Not now
              </button>
              <button
                onClick={join}
                disabled={state === "sending"}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
              >
                {state === "sending" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Join class
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
