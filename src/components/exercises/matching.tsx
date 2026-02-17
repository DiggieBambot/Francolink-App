// src/components/exercises/matching.tsx

"use client";

import { useState } from "react";
import { Button } from "@/components/ui";

interface MatchingProps {
  exercise: {
    question: string;
    content: {
      pairs: { left: string; right: string }[];
    };
    hint?: string;
  };
  onSubmit: (correct: boolean) => void;
  disabled: boolean;
}

export default function Matching({ exercise, onSubmit, disabled }: MatchingProps) {
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [matches, setMatches] = useState<Record<string, string>>({});
  const [showHint, setShowHint] = useState(false);

  const pairs = exercise.content.pairs;
  const leftItems = pairs.map(p => p.left);
  const rightItems = [...pairs.map(p => p.right)].sort(() => Math.random() - 0.5);

  const handleLeftClick = (item: string) => {
    if (disabled || matches[item]) return;
    setSelectedLeft(item);
  };

  const handleRightClick = (item: string) => {
    if (disabled || !selectedLeft || Object.values(matches).includes(item)) return;
    setMatches(prev => ({ ...prev, [selectedLeft]: item }));
    setSelectedLeft(null);
  };

  const handleSubmit = () => {
    const allMatched = leftItems.every(left => matches[left]);
    if (!allMatched) return;

    const allCorrect = pairs.every(pair => matches[pair.left] === pair.right);
    onSubmit(allCorrect);
  };

  const isComplete = leftItems.every(left => matches[left]);

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-6">
        {exercise.question}
      </h2>

      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Left column */}
        <div className="space-y-2">
          {leftItems.map((item) => (
            <button
              key={item}
              onClick={() => handleLeftClick(item)}
              disabled={disabled || !!matches[item]}
              className={`w-full p-3 text-left rounded-lg border-2 transition-all ${
                matches[item]
                  ? "border-green-300 bg-green-50 text-green-800"
                  : selectedLeft === item
                    ? "border-primary bg-primary/5"
                    : "border-gray-200 hover:border-gray-300"
              } ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
            >
              {item}
            </button>
          ))}
        </div>

        {/* Right column */}
        <div className="space-y-2">
          {rightItems.map((item) => {
            const isMatched = Object.values(matches).includes(item);
            return (
              <button
                key={item}
                onClick={() => handleRightClick(item)}
                disabled={disabled || isMatched || !selectedLeft}
                className={`w-full p-3 text-left rounded-lg border-2 transition-all ${
                  isMatched
                    ? "border-green-300 bg-green-50 text-green-800"
                    : selectedLeft && !isMatched
                      ? "border-secondary hover:bg-secondary/5"
                      : "border-gray-200"
                } ${disabled || !selectedLeft ? "cursor-not-allowed" : "cursor-pointer"}`}
              >
                {item}
              </button>
            );
          })}
        </div>
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
          disabled={!isComplete}
          className="w-full"
        >
          Check Answer
        </Button>
      )}
    </div>
  );
}