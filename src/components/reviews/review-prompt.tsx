"use client";

// The two-step review ask.
//
// Step one is a cheap in-app question with no stakes -- a thumb, not a form.
// Step two branches: a happy answer gets the Trustpilot link, an unhappy one
// gets a text box that comes to us. Everybody gets asked; only the people
// having a good week get asked to say so in public, which is the whole reason
// this is two steps instead of a bare "Review us on Trustpilot" banner.
//
// Deliberately not a modal. It sits where PushPrompt sits, is dismissible on
// sight, and never blocks the dashboard behind it.

import { useState, useEffect } from "react";
import { Star, X, ThumbsUp, ThumbsDown, CheckCircle, ExternalLink } from "lucide-react";

interface Decision {
  show: boolean;
  reason?: "streak" | "progress";
  streak?: number;
  trustpilotUrl: string;
}

type Step = "ask" | "positive" | "negative" | "thanks";

export function ReviewPrompt() {
  const [decision, setDecision] = useState<Decision | null>(null);
  const [step, setStep] = useState<Step>("ask");
  const [feedback, setFeedback] = useState("");
  const [sending, setSending] = useState(false);
  const [gone, setGone] = useState(false);

  // Ask the server on mount. The delay is not cosmetic: landing on the
  // dashboard and being asked for a review in the same frame reads as a popup,
  // and gets dismissed like one.
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      // PushPrompt owns this corner too, and it asks first (it only needs any
      // XP at all, we need a week of them). Two cards stacked in one corner is
      // worse than either alone, so stand down for the session if the push ask
      // is still unanswered. Checked before the fetch on purpose: the GET is
      // what burns one of our two allowed showings.
      if (
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
        typeof Notification !== "undefined" &&
        Notification.permission === "default"
      ) return;

      try {
        const res = await fetch("/api/reviews/prompt");
        if (!res.ok) return;
        const d: Decision = await res.json();
        if (!cancelled && d.show) setDecision(d);
      } catch { /* silent -- a missing prompt is not an error worth surfacing */ }
    }, 2500);
    return () => { cancelled = true; clearTimeout(timer); };
  }, []);

  const answer = async (action: string, body?: string) => {
    try {
      await fetch("/api/reviews/prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, feedback: body }),
      });
    } catch { /* the user's click already did its job in the UI */ }
  };

  if (!decision || gone) return null;

  const handleThumbsUp = () => {
    setStep("positive");
    answer("positive");
  };

  const handleThumbsDown = () => setStep("negative");

  const handleSendFeedback = async () => {
    setSending(true);
    await answer("negative", feedback);
    setSending(false);
    setStep("thanks");
    setTimeout(() => setGone(true), 3500);
  };

  const handleDismiss = () => {
    setGone(true);
    // "Later" on the first question is a snooze, not a no. Once they have told
    // us how they feel, closing the card means they are done.
    answer(step === "ask" ? "snooze" : "dismiss");
  };

  const headline =
    decision.reason === "streak" && decision.streak
      ? `${decision.streak} days in a row!`
      : "You're making real progress!";

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 lg:bottom-6 lg:left-auto lg:right-6 lg:w-96">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-5 relative">
        <button
          onClick={handleDismiss}
          aria-label="Close"
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
        >
          <X className="w-4 h-4" />
        </button>

        {/* ── Step 1: the thumb ─────────────────────────────────── */}
        {step === "ask" && (
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Star className="w-6 h-6 text-amber-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 mb-1">{headline}</h3>
              <p className="text-sm text-gray-500 mb-4">
                How is FrancoLink working out for you so far?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleThumbsUp}
                  className="flex-1 bg-primary text-white py-2 px-4 rounded-xl text-sm font-bold hover:bg-primary-800 transition-all flex items-center justify-center gap-2"
                >
                  <ThumbsUp className="w-4 h-4" />
                  Loving it
                </button>
                <button
                  onClick={handleThumbsDown}
                  className="flex-1 border border-gray-200 text-gray-600 py-2 px-4 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                >
                  <ThumbsDown className="w-4 h-4" />
                  Not really
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 2a: happy -> Trustpilot ──────────────────────── */}
        {step === "positive" && (
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Star className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 mb-1">That&apos;s great to hear!</h3>
              <p className="text-sm text-gray-500 mb-4">
                Would you tell other French learners? It takes about a minute and
                it genuinely helps people find us.
              </p>
              <div className="flex gap-2">
                <a
                  href={decision.trustpilotUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setTimeout(() => setGone(true), 300)}
                  className="flex-1 bg-[#00b67a] text-white py-2 px-4 rounded-xl text-sm font-bold hover:brightness-95 transition-all flex items-center justify-center gap-2"
                >
                  Review on Trustpilot
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button
                  onClick={handleDismiss}
                  className="px-3 py-2 text-sm text-gray-400 hover:text-gray-600"
                >
                  Not now
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 2b: unhappy -> straight to us ────────────────── */}
        {step === "negative" && (
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <ThumbsDown className="w-6 h-6 text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 mb-1">Sorry to hear that.</h3>
              <p className="text-sm text-gray-500 mb-3">
                What would make it better? This goes straight to the team.
              </p>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={3}
                maxLength={2000}
                placeholder="The lessons are too fast, I can't find…"
                className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
              />
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleSendFeedback}
                  disabled={sending || !feedback.trim()}
                  className="flex-1 bg-primary text-white py-2 px-4 rounded-xl text-sm font-bold hover:bg-primary-800 transition-all disabled:opacity-50"
                >
                  {sending ? "Sending…" : "Send feedback"}
                </button>
                <button
                  onClick={handleDismiss}
                  className="px-3 py-2 text-sm text-gray-400 hover:text-gray-600"
                >
                  Skip
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Acknowledgement ───────────────────────────────────── */}
        {step === "thanks" && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="font-bold text-gray-900">Thank you — got it.</p>
              <p className="text-sm text-gray-500">We read every one of these.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
