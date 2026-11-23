"use client";

// End-of-session recap: what you practised, what you got right, what to fix,
// and the words worth keeping — with one tap to put them in the review deck.

import { useState } from "react";
import Link from "next/link";
import {
  Check,
  Clock,
  Loader2,
  MessageSquare,
  Sparkles,
  Target,
  Trophy,
  Volume2,
  X,
} from "lucide-react";

export interface Recap {
  summary: string;
  wins: string[];
  vocab: { term: string; translation: string }[];
  focus: string;
  corrections: {
    original: string;
    corrected: string;
    explanation: string | null;
    tag: string | null;
  }[];
  stats: { studentMessages: number; minutes: number };
}

interface Props {
  recap: Recap;
  conversationId: string;
  language: string;
  onClose: () => void;
  onNewSession: () => void;
  onSpeak: (text: string) => void;
}

export function RecapPanel({
  recap,
  conversationId,
  language,
  onClose,
  onNewSession,
  onSpeak,
}: Props) {
  // Everything selected by default: keeping is the point.
  const [pickedCorrections, setPickedCorrections] = useState(
    () => new Set(recap.corrections.map((_, i) => i))
  );
  const [pickedVocab, setPickedVocab] = useState(() => new Set(recap.vocab.map((_, i) => i)));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<number | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const toggle = (set: Set<number>, i: number, update: (s: Set<number>) => void) => {
    const next = new Set(set);
    if (next.has(i)) next.delete(i);
    else next.add(i);
    update(next);
  };

  const selectedCount = pickedCorrections.size + pickedVocab.size;

  const save = async () => {
    setSaving(true);
    setSaveError(null);
    const items = [
      ...recap.corrections
        .filter((_, i) => pickedCorrections.has(i))
        .map((c) => ({
          front: c.corrected,
          back: c.explanation || "Corrected form",
          note: `You said: ${c.original}`,
          source: "correction",
          conversationId,
          language,
        })),
      ...recap.vocab
        .filter((_, i) => pickedVocab.has(i))
        .map((v) => ({
          front: v.term,
          back: v.translation,
          source: "vocab",
          conversationId,
          language,
        })),
    ];
    try {
      const res = await fetch("/api/ai-tutor/phrases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSaved(items.length);
    } catch (err) {
      setSaveError(err instanceof Error && err.message ? err.message : "Couldn't save. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 bg-gray-900/40 backdrop-blur-sm flex items-end sm:items-center justify-center">
      <div className="bg-white w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl shadow-xl">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-primary to-primary/80 text-white px-6 pt-6 pb-5 rounded-t-3xl">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-1.5 rounded-full hover:bg-white/15"
            aria-label="Close recap"
          >
            <X className="w-5 h-5" />
          </button>
          <p className="text-xs uppercase tracking-wider text-white/70 font-semibold mb-1">
            Session recap
          </p>
          <p className="text-lg font-semibold leading-snug pr-8">{recap.summary}</p>
          <div className="flex gap-4 mt-4 text-sm text-white/85">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" /> {recap.stats.minutes} min
            </span>
            <span className="flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4" /> {recap.stats.studentMessages} messages
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4" /> {recap.corrections.length} fixes
            </span>
          </div>
        </div>

        <div className="px-6 py-5 space-y-6">
          {recap.wins.length > 0 && (
            <section>
              <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-2">
                <Trophy className="w-4 h-4 text-amber-500" /> What you did well
              </h3>
              <ul className="space-y-1.5">
                {recap.wins.map((w, i) => (
                  <li key={i} className="text-sm text-gray-700 flex gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    {w}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {recap.corrections.length > 0 && (
            <section>
              <h3 className="text-sm font-bold text-gray-900 mb-2">Say it like this</h3>
              <div className="space-y-2">
                {recap.corrections.map((c, i) => {
                  const on = pickedCorrections.has(i);
                  return (
                    <div
                      key={i}
                      className={`rounded-xl border px-3 py-2.5 flex gap-3 items-start transition-colors ${
                        on ? "border-primary/30 bg-primary/5" : "border-gray-200"
                      }`}
                    >
                      <button
                        onClick={() => toggle(pickedCorrections, i, setPickedCorrections)}
                        className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 ${
                          on ? "bg-primary border-primary text-white" : "border-gray-300"
                        }`}
                        aria-label={on ? "Don't save" : "Save"}
                      >
                        {on && <Check className="w-3.5 h-3.5" />}
                      </button>
                      <div className="flex-1 min-w-0 text-sm">
                        <p className="text-gray-400 line-through">{c.original}</p>
                        <p className="font-semibold text-gray-900">{c.corrected}</p>
                        {c.explanation && (
                          <p className="text-xs text-gray-500 mt-0.5">{c.explanation}</p>
                        )}
                      </div>
                      <button
                        onClick={() => onSpeak(c.corrected)}
                        className="p-1 text-gray-400 hover:text-primary"
                        aria-label="Listen"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {recap.vocab.length > 0 && (
            <section>
              <h3 className="text-sm font-bold text-gray-900 mb-2">Words to keep</h3>
              <div className="flex flex-wrap gap-2">
                {recap.vocab.map((v, i) => {
                  const on = pickedVocab.has(i);
                  return (
                    <div
                      key={i}
                      className={`flex items-start gap-1 rounded-xl border pl-3 pr-1.5 py-2 text-sm transition-colors ${
                        on ? "border-primary/30 bg-primary/5" : "border-gray-200 opacity-60"
                      }`}
                    >
                      <button
                        onClick={() => toggle(pickedVocab, i, setPickedVocab)}
                        className="text-left"
                        aria-pressed={on}
                      >
                        <span className="font-semibold text-gray-900">{v.term}</span>
                        <span className="block text-xs text-gray-500">{v.translation}</span>
                      </button>
                      <button
                        onClick={() => onSpeak(v.term)}
                        className="p-1 text-gray-400 hover:text-primary"
                        aria-label={`Hear ${v.term}`}
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {recap.focus && (
            <section className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
              <h3 className="flex items-center gap-2 text-sm font-bold text-amber-900 mb-1">
                <Target className="w-4 h-4" /> Next time
              </h3>
              <p className="text-sm text-amber-900/80">{recap.focus}</p>
            </section>
          )}

          {/* Save */}
          {selectedCount > 0 && (
            <div>
              {saved !== null ? (
                <div className="flex items-center justify-between rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm">
                  <span className="text-green-800 flex items-center gap-2">
                    <Check className="w-4 h-4" /> Saved {saved} to your review deck
                  </span>
                  <Link href="/student/ai-tutor/review" className="font-semibold text-primary hover:underline">
                    Review now
                  </Link>
                </div>
              ) : (
                <button
                  onClick={save}
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 bg-primary text-white font-semibold py-3 rounded-xl hover:bg-primary/90 disabled:opacity-60"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  Save {selectedCount} to review deck
                </button>
              )}
              {saveError && <p className="text-xs text-red-600 mt-2 text-center">{saveError}</p>}
            </div>
          )}

          <button
            onClick={onNewSession}
            className="w-full py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            Start a new conversation
          </button>
        </div>
      </div>
    </div>
  );
}
