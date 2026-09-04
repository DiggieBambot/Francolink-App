"use client";

// What happens when the clock runs out.
//
// Until now: nothing. The call was cut and the room showed a card saying the
// class had finished, and that was the end of the product. Every lesson ended
// in a dead end, which is a strange place to end the one moment a student is
// most inclined to book another and most able to remember how it went.
//
// So the ending does the three things an ending is for, in the order they cost
// the person effort:
//
//   1. RATE IT. `lesson_reviews` has existed since August and nothing has ever
//      written to it — every tutor profile shows no rating not because
//      students dislike them but because nobody was ever asked. One tap here
//      is the asking, and the comment box is optional because requiring prose
//      is how you collect nothing.
//   2. TAKE THE WORK. The tutor sends homework; the student sees it landed.
//   3. COME BACK. The tutor's next free slot, one click from booking it. This
//      is the moment with the most intent in the whole product and we have
//      been spending it on a full stop.
//
// Tutors get a different screen: they are not rating themselves and not
// rebooking on the student's behalf. They send homework and get out.

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Star, Send, CalendarPlus, Loader2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface NextSlot {
  startsAt: string;
  durationMinutes: number;
  href: string;
}

export function AfterClass({
  sessionId,
  role,
  peerName,
  /** Null when no material was open — there is nothing to set as homework. */
  lessonId,
  onSendHomework,
  homeworkSent,
  sendingHomework,
  /** Where a student goes to book again; null for a tutor with no directory slug. */
  nextSlot,
  tutorSlug,
}: {
  sessionId: string;
  role: "tutor" | "student";
  peerName: string | null;
  lessonId: string | null;
  onSendHomework: () => void;
  homeworkSent: boolean;
  sendingHomework: boolean;
  nextSlot: NextSlot | null;
  tutorSlug: string | null;
}) {
  if (role === "tutor") {
    return (
      <Frame title="Class finished" subtitle={`That's time with ${peerName || "your student"}.`}>
        <p className="text-sm text-slate-400">
          Chat, notes and the material stay in this room — you and{" "}
          {peerName || "your student"} can both come back to them.
        </p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          {lessonId ? (
            <button
              type="button"
              onClick={onSendHomework}
              disabled={sendingHomework || homeworkSent}
              className={cn(
                "inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full text-sm font-semibold transition",
                homeworkSent
                  ? "bg-slate-800 text-slate-400"
                  : "bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-60"
              )}
            >
              {homeworkSent ? (
                <>
                  <CheckCircle2 className="h-4 w-4" /> Homework sent
                </>
              ) : sendingHomework ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Sending…
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" /> Send this lesson as homework
                </>
              )}
            </button>
          ) : null}
          <Link
            href="/tutor/sessions"
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full border border-slate-700 text-sm font-semibold text-slate-300 transition hover:bg-slate-800"
          >
            Back to my classes <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </Frame>
    );
  }

  return (
    <StudentAfterClass
      sessionId={sessionId}
      peerName={peerName}
      nextSlot={nextSlot}
      tutorSlug={tutorSlug}
    />
  );
}

function StudentAfterClass({
  sessionId,
  peerName,
  nextSlot,
  tutorSlug,
}: {
  sessionId: string;
  peerName: string | null;
  nextSlot: NextSlot | null;
  tutorSlug: string | null;
}) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);

  // Send as soon as a star is picked, then let the comment follow. Asking for
  // the star and the words together means most people give neither.
  useEffect(() => {
    if (!rating || saved || saving) return;
    let cancelled = false;
    (async () => {
      setSaving(true);
      try {
        const res = await fetch(`/api/room/${sessionId}/review`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rating }),
        });
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (res.ok) setSaved(true);
        else setFailed(data.error || "Couldn't save your rating.");
      } catch {
        if (!cancelled) setFailed("Couldn't save your rating.");
      } finally {
        if (!cancelled) setSaving(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // Only the first rating triggers the send; edits go with the comment.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rating]);

  async function saveComment() {
    setSaving(true);
    setFailed(null);
    try {
      const res = await fetch(`/api/room/${sessionId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setFailed(d.error || "Couldn't save your note.");
      } else {
        setSaved(true);
      }
    } catch {
      setFailed("Couldn't save your note.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Frame
      title="That's time — nice work"
      subtitle={peerName ? `Your class with ${peerName} has finished.` : undefined}
    >
      {/* ---------------------------------------------------------- RATING */}
      <div className="rounded-2xl border border-slate-700/70 bg-slate-800/70 p-4">
        <p className="text-sm font-semibold text-slate-200">
          How was it{peerName ? ` with ${peerName.split(" ")[0]}` : ""}?
        </p>
        <div className="mt-2 flex items-center gap-1" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => {
            const lit = (hover || rating) >= n;
            return (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                onMouseEnter={() => setHover(n)}
                aria-label={`${n} star${n > 1 ? "s" : ""}`}
                className="rounded p-1 transition-transform hover:scale-110"
              >
                <Star
                  className={cn(
                    "h-7 w-7 transition-colors",
                    lit ? "fill-secondary-400 text-secondary-400" : "text-slate-600"
                  )}
                />
              </button>
            );
          })}
          {saved ? (
            <span className="ml-2 inline-flex items-center gap-1 text-xs font-semibold text-primary-300">
              <CheckCircle2 className="h-3.5 w-3.5" /> Thanks
            </span>
          ) : null}
        </div>

        {/* The box only appears once there is a rating to attach it to. */}
        {rating ? (
          <div className="mt-3">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              onBlur={() => comment.trim() && saveComment()}
              rows={2}
              placeholder="Anything you'd like to add? (optional)"
              className="w-full resize-none rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-200 outline-none placeholder:text-slate-500 focus:border-primary-400"
            />
          </div>
        ) : null}

        {failed ? <p className="mt-2 text-xs text-accent">{failed}</p> : null}
      </div>

      {/* ------------------------------------------------------- BOOK AGAIN */}
      {nextSlot ? (
        <Link
          href={nextSlot.href}
          className="group mt-3 flex items-center gap-3 rounded-2xl bg-primary-500 p-4 text-white transition hover:bg-primary-600"
        >
          <CalendarPlus className="h-5 w-5 shrink-0" />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold">Book your next lesson</span>
            <span className="block text-xs text-white/80">
              {peerName ? `${peerName.split(" ")[0]} is free ` : "Next free slot: "}
              {new Date(nextSlot.startsAt).toLocaleString([], {
                weekday: "long",
                hour: "numeric",
                minute: "2-digit",
              })}
              {" · "}
              {nextSlot.durationMinutes} min
            </span>
          </span>
          <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-1" />
        </Link>
      ) : tutorSlug ? (
        <Link
          href={`/tutors/${tutorSlug}`}
          className="group mt-3 flex items-center gap-3 rounded-2xl border border-slate-700 p-4 text-slate-200 transition hover:bg-slate-800"
        >
          <CalendarPlus className="h-5 w-5 shrink-0 text-primary-300" />
          <span className="flex-1 text-sm font-semibold">Book another lesson</span>
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      ) : null}

      <p className="mt-4 text-center text-xs text-slate-500">
        Your chat, notes and the lesson you worked through stay in this room.
      </p>
    </Frame>
  );
}

function Frame({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full w-full items-center justify-center overflow-y-auto bg-slate-900 p-6">
      <div className="w-full max-w-md">
        <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary-500/15 text-primary-300">
          <CheckCircle2 className="h-6 w-6" />
        </span>
        <h2 className="text-center text-xl font-bold text-white">{title}</h2>
        {subtitle ? (
          <p className="mt-1 text-center text-sm text-slate-400">{subtitle}</p>
        ) : null}
        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}
