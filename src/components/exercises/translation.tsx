// src/components/exercises/translation.tsx
"use client";

import { useState, useEffect } from "react";
import { Volume2 } from "lucide-react";
import { Button } from "@/components/ui";

interface TranslationProps {
  exercise: {
    id: string;
    question: string;
    content: {
      correctAnswer: string;
      acceptableAnswers?: string[];
      direction?: "to_target" | "to_english";
    };
    hint?: string;
    explanation?: string;
  };
  language?: string;
  onSubmit: (correct: boolean, userAnswer?: any, correctAnswer?: any) => void;
  disabled?: boolean;
}

export default function Translation({
  exercise,
  language = "fr-FR",
  onSubmit,
  disabled,
}: TranslationProps) {
  const { content } = exercise;
  const [inputValue, setInputValue] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  // Reset state when exercise changes
  useEffect(() => {
    setInputValue("");
    setSubmitted(false);
    setIsCorrect(false);
  }, [exercise.id]);

  const normalizeText = (text: string): string => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[.,!?;:'"¿¡]/g, "")
      .replace(/\s+/g, " ");
  };

  const checkAnswer = (answer: string): boolean => {
    const normalized = normalizeText(answer);
    
    // Check main answer
    if (normalized === normalizeText(content.correctAnswer)) {
      return true;
    }
    
    // Check acceptable alternatives
    if (content.acceptableAnswers) {
      return content.acceptableAnswers.some(
        alt => normalizeText(alt) === normalized
      );
    }
    
    return false;
  };

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

  const handleSubmit = () => {
    if (!inputValue.trim()) return;

    const correct = checkAnswer(inputValue);
    setIsCorrect(correct);
    setSubmitted(true);
    onSubmit(correct, inputValue, content.correctAnswer);
  };

  return (
    <div className="space-y-4">
      {/* Question */}
      <h3 className="text-lg font-semibold text-gray-900">
        {exercise.question}
      </h3>

      {/* Input area */}
      <div>
        <textarea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          disabled={disabled || submitted}
          placeholder="Type your translation here..."
          rows={3}
          className={`w-full p-4 rounded-xl border-2 resize-none transition-all focus:outline-none ${
            submitted
              ? isCorrect
                ? "bg-green-50 border-green-500 text-green-800"
                : "bg-red-50 border-red-500 text-red-800"
              : "bg-gray-50 border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20"
          }`}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !submitted && inputValue.trim()) {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />
      </div>

      {/* Correct answer (shown if wrong) */}
      {submitted && !isCorrect && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs text-green-600 font-medium mb-1">Correct answer:</p>
              <p className="text-green-800 font-medium">{content.correctAnswer}</p>
            </div>
            {content.direction === "to_target" && (
              <button
                onClick={() => speak(content.correctAnswer)}
                className="p-2 bg-green-100 hover:bg-green-200 rounded-full transition-colors flex-shrink-0"
              >
                <Volume2 className="w-4 h-4 text-green-700" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Hint */}
      {exercise.hint && !submitted && (
        <p className="text-sm text-gray-500 italic">💡 {exercise.hint}</p>
      )}

      {/* Submit button */}
      {!submitted && (
        <Button
          onClick={handleSubmit}
          disabled={!inputValue.trim() || disabled}
          className="w-full"
        >
          Check Translation
        </Button>
      )}
    </div>
  );
}
