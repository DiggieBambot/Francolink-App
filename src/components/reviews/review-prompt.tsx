"use client";

// The review ask.
//
// Everybody who earns the ask gets the Trustpilot link, whatever kind of week
// they are having. Trustpilot's rules forbid inviting only the people likely to
// be happy, and a profile flagged for it is worth less than a thin one. The
// private feedback box sits beside the link as a second option, not a filter in
// front of it: someone with a complaint can tell us, tell Trustpilot, or both.
//
// Deliberately not a modal. It sits where PushPrompt sits, is dismissible on
// sight, and never blocks the dashboard behind it.

import { useState, useEffect } from "react";
import { Star, X, MessageSquare, CheckCircle, ExternalLink } from "lucide-react";
import { lessonReviewShowing } from "./lesson-review-gate";

interface Decision {
  show: boolean;
  reason?: "streak" | "progress";
  streak?: number;
  trustpilotUrl: string;
}

type Step = "ask" | "feedback" | "thanks";

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

      // A finished lesson waiting for its rating takes the corner instead.
      if (await lessonReviewShowing()) return;

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

  const handleTrustpilot = () => {
    answer("positive");
    setTimeout(() => setGone(true), 300);
  };

  const handleSendFeedback = async () => {
    setSending(true);
    await answer("negative", feedback);
    setSending(false);
    setStep("thanks");
  };

  const handleDismiss = () => {
    setGone(true);
    // Their feedback is already recorded; closing the thank-you is not a no.
    if (step === "thanks") return;
    // Closing the first card is a snooze, not a no. Closing the feedback box
    // half-written means they are done.
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

        {/* ── The ask: Trustpilot for everyone, feedback as an option ── */}
        {step === "ask" && (
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Star className="w-6 h-6 text-amber-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 mb-1">{headline}</h3>
              <p className="text-sm text-gray-500 mb-4">
                How is FrancoLink working out for you? An honest review on
                Trustpilot takes about a minute and helps other French learners
                decide.
              </p>
              <div className="flex gap-2">
                <a
                  href={decision.trustpilotUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleTrustpilot}
                  className="flex-1 bg-[#00b67a] text-white py-2 px-4 rounded-xl text-sm font-bold hover:brightness-95 transition-all flex items-center justify-center gap-2"
                >
                  Review on Trustpilot
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
              <button
                onClick={() => setStep("feedback")}
                className="mt-3 text-sm text-gray-500 hover:text-gray-700 underline underline-offset-2"
              >
                Or tell us privately what to improve
              </button>
            </div>
          </div>
        )}

        {/* ── Private feedback, straight to us ──────────────────── */}
        {step === "feedback" && (
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <MessageSquare className="w-6 h-6 text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 mb-1">What would make it better?</h3>
              <p className="text-sm text-gray-500 mb-3">
                This goes straight to the team.
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
                  onClick={() => setStep("ask")}
                  className="px-3 py-2 text-sm text-gray-400 hover:text-gray-600"
                >
                  Back
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Acknowledgement ───────────────────────────────────── */}
        {step === "thanks" && (
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-gray-900">Thank you — got it.</p>
              <p className="text-sm text-gray-500">
                We read every one of these. You&apos;re also welcome to{" "}
                <a
                  href={decision.trustpilotUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleTrustpilot}
                  className="text-[#00b67a] font-semibold hover:underline"
                >
                  review us on Trustpilot
                </a>
                .
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
