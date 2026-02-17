// src/components/exercises/translation.tsx

"use client";

import { useState } from "react";
import { Button } from "@/components/ui";

interface TranslationProps {
  exercise: {
    question: string;
    content: {
      source_language: string;
      target_language: string;
      correct_answers: string[];
    };
    hint?: string;
  };
  onSubmit: (correct: boolean) => void;
  disabled: boolean;
}

export default function Translation({ exercise, onSubmit, disabled }: TranslationProps) {
  const [answer, setAnswer] = useState("");
  const [showHint, setShowHint] = useState(false);

  const handleSubmit = () => {
    const userAnswer = answer.trim().toLowerCase();
    const correctAnswers = exercise.content.correct_answers.map(a => a.toLowerCase());
    const correct = correctAnswers.some(ca => 
      userAnswer === ca || 
      userAnswer.replace(/[.,!?]/g, "") === ca.replace(/[.,!?]/g, "")
    );
    onSubmit(correct);
  };

  const langNames: Record<string, string> = {
    en: "English",
    fr: "French",
    es: "Spanish"
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">
        {exercise.question}
      </h2>
      <p className="text-gray-500 mb-6">
        Translate to {langNames[exercise.content.target_language] || exercise.content.target_language}
      </p>

      <div className="mb-6">
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          disabled={disabled}
          placeholder="Type your translation..."
          className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-primary focus:outline-none resize-none"
          rows={3}
        />
      </div>

      {/* Hint */}
      {exercise.hint && !showHint && !disabled && (
        <button
          onClick={() => setShowHint(true)}
          className="text-sm text-primary hover:underline mb-4"
        >
          Need a hint?
        </button>
      )}
      {showHint && (
        <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg mb-4">
          💡 {exercise.hint}
        </p>
      )}

      {/* Submit */}
      {!disabled && (
        <Button
          onClick={handleSubmit}
          disabled={!answer.trim()}
          className="w-full"
        >
          Check Answer
        </Button>
      )}
    </div>
  );
}