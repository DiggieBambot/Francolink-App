"use client";

// "How was your lesson?" -- follows a student around the app until they answer
// or dismiss it.
//
// The rating card at the end of a live class only shows to people still in the
// room when the clock runs out. Leave the call early, lose connection, close
// the tab: no card, no rating. This asks again on the next page they open, for
// the most recent finished lesson only. Reviews go to an admin before they are
// published on the tutor's profile, and the copy says so.

import { useEffect, useState } from "react";
import { Star, X, CheckCircle2 } from "lucide-react";
import { settleLessonReview } from "./lesson-review-gate";

interface Pending {
  bookingId: string;
  sessionId: string;
  tutorName: string | null;
}

const dismissedKey = (bookingId: string) => `lesson-review-dismissed:${bookingId}`;

export function LessonReviewPrompt() {
  const [pending, setPending] = useState<Pending | null>(null);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      let showing = false;
      try {
        const res = await fetch("/api/reviews/lesson-pending");
        if (!res.ok) return;
        const { pending: p } = (await res.json()) as { pending: Pending | null };
        if (!p || cancelled) return;
        try {
          if (localStorage.getItem(dismissedKey(p.bookingId))) return;
        } catch { /* storage blocked: ask anyway */ }
        setPending(p);
        showing = true;
      } catch { /* a missing prompt is not an error worth surfacing */ }
      finally {
        settleLessonReview(showing);
      }
    }, 1500);
    return () => { cancelled = true; clearTimeout(timer); };
  }, []);

  if (!pending) return null;

  const dismiss = () => {
    try { localStorage.setItem(dismissedKey(pending.bookingId), "1"); } catch { /* ignore */ }
    setPending(null);
  };

  const submit = async () => {
    if (!rating) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/room/${pending.sessionId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment: comment.trim() || undefined, bookingId: pending.bookingId }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error || "Couldn't save your review.");
        return;
      }
      setDone(true);
      setTimeout(() => setPending(null), 2500);
    } catch {
      setError("Couldn't save your review.");
    } finally {
      setSending(false);
    }
  };

  const first = pending.tutorName?.split(" ")[0];

  return (
    <div className="fixed inset-x-3 bottom-24 z-50 mx-auto max-w-sm rounded-2xl border border-gray-100 bg-white p-4 shadow-xl md:bottom-6 md:left-auto md:right-6">
      <button onClick={dismiss} aria-label="Dismiss" className="absolute right-3 top-3 text-gray-400 hover:text-gray-600">
        <X className="h-4 w-4" />
      </button>
      {done ? (
        <p className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
          <CheckCircle2 className="h-5 w-5" /> Thanks — your review will appear once it&apos;s been checked.
        </p>
      ) : (
        <>
          <p className="pr-6 text-sm font-bold text-gray-900">
            How was your lesson{first ? ` with ${first}` : ""}?
          </p>
          <div className="mt-2 flex gap-1" onMouseLeave={() => setHover(0)}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                onMouseEnter={() => setHover(n)}
                aria-label={`${n} star${n > 1 ? "s" : ""}`}
                className="p-0.5"
              >
                <Star className={`h-7 w-7 ${(hover || rating) >= n ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} />
              </button>
            ))}
          </div>
          {rating ? (
            <>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={2}
                maxLength={2000}
                placeholder="Tell others about your lesson (optional)"
                className="mt-2 w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary"
              />
              <p className="mt-1 text-[11px] text-gray-400">
                Reviews are checked by our team before they show on {first ? `${first}'s` : "the tutor's"} profile.
              </p>
              {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
              <button
                onClick={submit}
                disabled={sending}
                className="mt-2 w-full rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {sending ? "Sending…" : "Submit review"}
              </button>
            </>
          ) : null}
        </>
      )}
    </div>
  );
}
