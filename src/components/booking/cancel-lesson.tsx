"use client";

// Cancelling a lesson, with the consequence stated first.
//
// The 12-hour rule has been correct since 20260805_bookings.sql; it was just
// invisible until it had already been applied. Outside the window the lesson
// returns to your balance; inside it, the lesson is spent and the tutor is
// still paid for the time they held. Those are the same button four hours
// apart, so the preview is fetched before the confirm rather than after.

import { useState } from "react";
import { AlertTriangle, Loader2, X } from "lucide-react";

interface Preview {
  cancellable: boolean;
  hours_until: number;
  free_window_hours: number;
  refundable: boolean;
  lessons: number;
  consequence: string;
}

export function CancelLesson({
  bookingId,
  onCancelled,
  className,
}: {
  bookingId: string;
  onCancelled?: () => void;
  className?: string;
}) {
  const [preview, setPreview] = useState<Preview | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function openDialog() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/booking/cancel?booking_id=${bookingId}`);
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Couldn't load that lesson.");
      setPreview(body);
      setOpen(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function confirm() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/booking/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ booking_id: bookingId }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Couldn't cancel that lesson.");
      setOpen(false);
      onCancelled?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't cancel that lesson.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openDialog}
        disabled={busy}
        className={
          className ??
          "text-sm font-semibold text-gray-500 hover:text-red-600 disabled:opacity-50"
        }
      >
        {busy && !open ? "…" : "Cancel lesson"}
      </button>

      {error && !open && (
        <p className="mt-1 text-xs font-semibold text-red-600">{error}</p>
      )}

      {open && preview && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => !busy && setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <h2 className="font-heading font-bold text-lg text-primary">
                Cancel this lesson?
              </h2>
              <button
                type="button"
                onClick={() => !busy && setOpen(false)}
                aria-label="Close"
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* The consequence, before the button that causes it. */}
            <div
              className={
                preview.refundable
                  ? "mt-4 rounded-xl bg-success-light p-4"
                  : "mt-4 rounded-xl bg-warning-light p-4"
              }
            >
              <div className="flex gap-3">
                {!preview.refundable && (
                  <AlertTriangle className="w-5 h-5 shrink-0 text-amber-700" />
                )}
                <p
                  className={
                    preview.refundable
                      ? "text-sm text-green-900"
                      : "text-sm text-amber-900"
                  }
                >
                  {preview.consequence}
                </p>
              </div>
            </div>

            <p className="mt-3 text-xs text-gray-500">
              {preview.hours_until >= preview.free_window_hours
                ? `Free cancellation ends ${preview.free_window_hours} hours before the lesson — you have about ${Math.round(preview.hours_until - preview.free_window_hours)} hours left.`
                : `The lesson starts in about ${preview.hours_until} hours.`}
            </p>

            {error && (
              <p className="mt-3 text-sm font-semibold text-red-600">{error}</p>
            )}

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={busy}
                className="flex-1 px-4 py-2.5 rounded-xl border-2 border-gray-100 font-heading font-bold text-sm text-gray-600 hover:bg-gray-50"
              >
                Keep it
              </button>
              <button
                type="button"
                onClick={confirm}
                disabled={busy || !preview.cancellable}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 text-white font-heading font-bold text-sm hover:bg-red-700 disabled:opacity-60"
              >
                {busy && <Loader2 className="w-4 h-4 animate-spin" />}
                Cancel lesson
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
