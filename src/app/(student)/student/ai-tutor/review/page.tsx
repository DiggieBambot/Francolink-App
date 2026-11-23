"use client";

// Review deck: phrases the student saved from AI tutor recaps, scheduled with
// spaced repetition. Front is the target language (heard aloud), back is the
// meaning; the student grades themselves and the card comes back accordingly.

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, PartyPopper, RotateCcw, Snail, Volume2 } from "lucide-react";
import { useTutorTTS } from "@/hooks/use-tutor-tts";

interface Phrase {
  id: string;
  language: string;
  front: string;
  back: string;
  note: string | null;
  source: string;
}

export default function TutorReviewPage() {
  const [cards, setCards] = useState<Phrase[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [reviewed, setReviewed] = useState(0);
  const tts = useTutorTTS({ language: cards[0]?.language ?? "fr", level: "B1" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ai-tutor/phrases?due=1");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCards(data.phrases ?? []);
      setTotal(data.total ?? 0);
    } catch {
      setError("Your review deck isn't available right now.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const card = cards[0];

  const hear = (slow = false) => {
    if (!card) return;
    tts.unlock();
    tts.speak(card.front, { id: card.id, slow });
  };

  const grade = async (g: "again" | "good" | "easy") => {
    if (!card) return;
    tts.stop();
    setFlipped(false);
    setReviewed((n) => n + 1);
    // "Again" goes to the back of today's queue; the others leave it.
    setCards((prev) => (g === "again" ? [...prev.slice(1), prev[0]] : prev.slice(1)));
    fetch("/api/ai-tutor/phrases", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: card.id, grade: g }),
    }).catch(() => {});
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/student/ai-tutor" className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div className="flex-1">
            <h1 className="font-bold text-gray-900 text-sm">Review deck</h1>
            <p className="text-xs text-gray-500">
              {loading
                ? "Loading…"
                : `${cards.length} due · ${total} saved from your tutor sessions`}
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-xl w-full mx-auto px-4 py-8 flex flex-col">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : error ? (
          <p className="text-center text-gray-500">{error}</p>
        ) : !card ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <PartyPopper className="w-12 h-12 text-primary mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {total === 0 ? "Nothing saved yet" : "All caught up"}
            </h2>
            <p className="text-gray-500 max-w-xs mb-6">
              {total === 0
                ? "End a session with your AI tutor and save the corrections and new words from your recap. They'll show up here."
                : reviewed > 0
                ? `Nice work — ${reviewed} reviewed. Cards come back when they're due.`
                : "No cards are due right now. Come back later, or practise something new."}
            </p>
            <Link
              href="/student/ai-tutor"
              className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90"
            >
              Talk to your tutor
            </Link>
          </div>
        ) : (
          <>
            <button
              onClick={() => {
                if (!flipped) hear();
                setFlipped(true);
              }}
              className="flex-1 min-h-[18rem] bg-white rounded-3xl border border-gray-200 shadow-sm px-6 py-8 flex flex-col items-center justify-center text-center"
            >
              <p className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold mb-4">
                {card.source === "correction" ? "Say it correctly" : "New word"}
              </p>
              <p className="text-2xl font-semibold text-gray-900 leading-snug">{card.front}</p>
              {flipped ? (
                <div className="mt-6 pt-6 border-t border-gray-100 w-full">
                  <p className="text-lg text-gray-700">{card.back}</p>
                  {card.note && <p className="text-sm text-gray-400 mt-2">{card.note}</p>}
                </div>
              ) : (
                <p className="mt-6 text-sm text-gray-400">Tap to hear it and see the meaning</p>
              )}
            </button>

            <div className="flex justify-center gap-2 mt-4">
              <button
                onClick={() => hear()}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-gray-600 hover:bg-white"
              >
                <Volume2 className="w-4 h-4" /> Listen
              </button>
              <button
                onClick={() => hear(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-gray-600 hover:bg-white"
              >
                <Snail className="w-4 h-4" /> Slowly
              </button>
            </div>

            {flipped && (
              <div className="grid grid-cols-3 gap-2 mt-4">
                <button
                  onClick={() => grade("again")}
                  className="flex flex-col items-center py-3 rounded-xl bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
                >
                  <RotateCcw className="w-4 h-4 mb-0.5" />
                  <span className="text-sm font-semibold">Again</span>
                </button>
                <button
                  onClick={() => grade("good")}
                  className="py-3 rounded-xl bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15 text-sm font-semibold"
                >
                  Good
                </button>
                <button
                  onClick={() => grade("easy")}
                  className="py-3 rounded-xl bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 text-sm font-semibold"
                >
                  Easy
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
