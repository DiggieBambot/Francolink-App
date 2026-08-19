"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";

/**
 * Holds the slot and sends the student to Stripe.
 *
 * Fires once on mount. The guard matters: React Strict Mode double-invokes
 * effects in development, and without it every booking would attempt twice —
 * the second hitting the exclusion constraint against its own hold and showing
 * the student "that time was just taken" for a slot they had actually got.
 */
export function BookingHandoff({
  tutorSlug,
  start,
  durationMinutes,
  backUrl,
}: {
  tutorSlug: string;
  start: string;
  durationMinutes: number;
  backUrl: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;

    (async () => {
      try {
        const res = await fetch("/api/booking/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tutor_slug: tutorSlug,
            start,
            duration_minutes: durationMinutes,
          }),
        });
        const body = await res.json().catch(() => ({}));

        if (res.status === 401 || body.needsLogin) {
          window.location.href = `/login?next=${encodeURIComponent(
            window.location.pathname + window.location.search
          )}`;
          return;
        }
        if (!res.ok || !body.url) {
          throw new Error(body.error || "Couldn't start checkout.");
        }
        window.location.href = body.url;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't start checkout.");
      }
    })();
  }, [tutorSlug, start, durationMinutes]);

  if (error) {
    return (
      <div className="p-6 rounded-2xl bg-error-light border border-red-200 text-center">
        <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-3" />
        <h1 className="font-heading font-bold text-lg text-red-900 mb-2">
          We couldn&apos;t hold that slot
        </h1>
        <p className="text-sm text-red-800 mb-5">{error}</p>
        <a
          href={backUrl}
          className="inline-flex px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-bold"
        >
          Pick another time
        </a>
      </div>
    );
  }

  const when = new Date(start).toLocaleString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="text-center py-10">
      <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-5" />
      <h1 className="font-heading font-bold text-xl text-primary mb-2">
        Holding your slot…
      </h1>
      <p className="text-gray-600">
        {when} · {durationMinutes} minutes
      </p>
      <p className="mt-4 text-sm text-gray-500">
        Taking you to secure checkout. Don&apos;t close this page.
      </p>
    </div>
  );
}
