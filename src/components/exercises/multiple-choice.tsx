// src/components/exercises/multiple-choice.tsx

"use client";

import { useState } from "react";
import { Button } from "@/components/ui";

interface MultipleChoiceProps {
  exercise: {
    question: string;
    content: {
      options: string[];
      correct_index: number;
    };
    hint?: string;
  };
  onSubmit: (correct: boolean) => void;
  disabled: boolean;
}

export default function MultipleChoice({ exercise, onSubmit, disabled }: MultipleChoiceProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showHint, setShowHint] = useState(false);

  const handleSubmit = () => {
    if (selectedIndex === null) return;
    const correct = selectedIndex === exercise.content.correct_index;
    onSubmit(correct);
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-6">
        {exercise.question}
      </h2>

      <div className="space-y-3 mb-6">
        {exercise.content.options.map((option, index) => (
          <button
            key={index}
            onClick={() => !disabled && setSelectedIndex(index)}
            disabled={disabled}
            className={`w-full p-4 text-left rounded-xl border-2 transition-all ${
              selectedIndex === index
                ? "border-primary bg-primary/5"
                : "border-gray-200 hover:border-gray-300"
            } ${disabled ? "cursor-not-allowed opacity-75" : "cursor-pointer"}`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                selectedIndex === index
                  ? "border-primary bg-primary text-white"
                  : "border-gray-300"
              }`}>
                {selectedIndex === index && (
                  <div className="w-2 h-2 bg-white rounded-full" />
                )}
              </div>
              <span className="text-gray-900">{option}</span>
            </div>
          </button>
        ))}
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
          disabled={selectedIndex === null}
          className="w-full"
        >
          Check Answer
        </Button>
      )}
    </div>
  );
}