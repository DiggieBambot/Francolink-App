// src/components/exercises/fill-blank.tsx

"use client";

import { useState } from "react";
import { Button } from "@/components/ui";

interface FillBlankProps {
  exercise: {
    question: string;
    content: {
      sentence: string;
      blanks: {
        position: number;
        correct_answer: string;
        acceptable_answers: string[];
      }[];
    };
    hint?: string;
  };
  onSubmit: (correct: boolean) => void;
  disabled: boolean;
}

export default function FillBlank({ exercise, onSubmit, disabled }: FillBlankProps) {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showHint, setShowHint] = useState(false);

  const blanks = exercise.content.blanks;

  const handleSubmit = () => {
    const allCorrect = blanks.every((blank) => {
      const userAnswer = answers[blank.position]?.trim().toLowerCase();
      const acceptableAnswers = blank.acceptable_answers.map(a => a.toLowerCase());
      return acceptableAnswers.includes(userAnswer);
    });
    onSubmit(allCorrect);
  };

  const allFilled = blanks.every(blank => answers[blank.position]?.trim());

  // Render sentence with blanks
  const renderSentence = () => {
    const sentence = exercise.content.sentence;
    const parts = sentence.split("___");
    
    return (
      <div className="text-lg text-gray-900 leading-relaxed">
        {parts.map((part, index) => (
          <span key={index}>
            {part}
            {index < parts.length - 1 && (
              <input
                type="text"
                value={answers[index] || ""}
                onChange={(e) => setAnswers(prev => ({ ...prev, [index]: e.target.value }))}
                disabled={disabled}
                className="inline-block w-32 mx-1 px-3 py-1 border-b-2 border-primary bg-primary/5 rounded text-center font-medium focus:outline-none focus:border-primary"
                placeholder="..."
              />
            )}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-6">
        {exercise.question}
      </h2>

      <div className="bg-gray-50 p-6 rounded-xl mb-6">
        {renderSentence()}
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
          disabled={!allFilled}
          className="w-full"
        >
          Check Answer
        </Button>
      )}
    </div>
  );
}