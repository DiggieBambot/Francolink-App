// src/components/exercises/reorder.tsx
"use client";

import { useState } from "react";
import { GripVertical, RotateCcw, Volume2 } from "lucide-react";
import { Button } from "@/components/ui";

interface ReorderProps {
  exercise: {
    id: string;
    question: string;
    content: {
      words: string[];
      correctOrder: string[];
      translation?: string;
    };
    hint?: string;
  };
  language?: string;
  onSubmit: (correct: boolean, userAnswer?: any, correctAnswer?: any) => void;
  disabled?: boolean;
}

export default function Reorder({
  exercise,
  language = "fr-FR",
  onSubmit,
  disabled,
}: ReorderProps) {
  const { content } = exercise;
  const [availableWords, setAvailableWords] = useState<string[]>(
    [...content.words].sort(() => Math.random() - 0.5) // Shuffle initially
  );
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const speak = (text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const langVoice = voices.find(v => v.lang.startsWith(language.split('-')[0]));
    if (langVoice) utterance.voice = langVoice;
    utterance.lang = language;
    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
  };

  const handleWordSelect = (word: string, fromAvailable: boolean) => {
    if (disabled || submitted) return;

    if (fromAvailable) {
      // Move from available to selected
      setAvailableWords(prev => prev.filter(w => w !== word));
      setSelectedWords(prev => [...prev, word]);
    } else {
      // Move from selected back to available
      setSelectedWords(prev => prev.filter(w => w !== word));
      setAvailableWords(prev => [...prev, word]);
    }
  };

  const handleSubmit = () => {
    const userAnswer = selectedWords.join(" ");
    const correctAnswer = content.correctOrder.join(" ");
    const correct = userAnswer === correctAnswer;
    
    setIsCorrect(correct);
    setSubmitted(true);
    onSubmit(correct, userAnswer, correctAnswer);
  };

  const handleReset = () => {
    setAvailableWords([...content.words].sort(() => Math.random() - 0.5));
    setSelectedWords([]);
    setSubmitted(false);
    setIsCorrect(false);
  };

  const allWordsPlaced = availableWords.length === 0;

  return (
    <div className="space-y-4">
      {/* Question */}
      <h3 className="text-lg font-semibold text-gray-900">
        {exercise.question}
      </h3>

      {/* Translation hint */}
      {content.translation && (
        <p className="text-gray-500 text-sm italic">
          "{content.translation}"
        </p>
      )}

      {/* Selected words (answer area) */}
      <div
        className={`min-h-[60px] p-3 rounded-xl border-2 border-dashed transition-colors ${
          submitted
            ? isCorrect
              ? "border-green-400 bg-green-50"
              : "border-red-400 bg-red-50"
            : selectedWords.length > 0
            ? "border-primary bg-primary/5"
            : "border-gray-300 bg-gray-50"
        }`}
      >
        {selectedWords.length === 0 ? (
          <p className="text-gray-400 text-center py-2">
            Tap words below to build the sentence
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {selectedWords.map((word, index) => (
              <button
                key={`selected-${index}`}
                onClick={() => handleWordSelect(word, false)}
                disabled={disabled || submitted}
                className={`px-3 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-1 ${
                  submitted
                    ? isCorrect
                      ? "bg-green-200 text-green-800"
                      : "bg-red-200 text-red-800"
                    : "bg-primary text-white hover:bg-primary-600 active:scale-95"
                }`}
              >
                <GripVertical className="w-3 h-3 opacity-50" />
                {word}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Available words */}
      {!submitted && (
        <div className="flex flex-wrap gap-2 justify-center py-2">
          {availableWords.map((word, index) => (
            <button
              key={`available-${index}`}
              onClick={() => handleWordSelect(word, true)}
              disabled={disabled}
              className="px-3 py-2 rounded-lg font-medium text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 active:scale-95 transition-all"
            >
              {word}
            </button>
          ))}
        </div>
      )}

      {/* Correct answer (shown if wrong) */}
      {submitted && !isCorrect && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-green-600 font-medium mb-1">Correct answer:</p>
              <p className="text-green-800 font-medium">
                {content.correctOrder.join(" ")}
              </p>
            </div>
            <button
              onClick={() => speak(content.correctOrder.join(" "))}
              className="p-2 bg-green-100 hover:bg-green-200 rounded-full transition-colors"
            >
              <Volume2 className="w-4 h-4 text-green-700" />
            </button>
          </div>
        </div>
      )}

      {/* Hint */}
      {exercise.hint && !submitted && (
        <p className="text-sm text-gray-500 italic">💡 {exercise.hint}</p>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {!submitted ? (
          <>
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={selectedWords.length === 0}
              className="flex-shrink-0"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!allWordsPlaced || disabled}
              className="flex-1"
            >
              Check Answer
            </Button>
          </>
        ) : (
          <Button
            onClick={handleReset}
            variant="outline"
            className="w-full"
          >
            Try Again
          </Button>
        )}
      </div>
    </div>
  );
}
