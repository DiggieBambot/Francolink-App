// src/components/exercises/multiple-choice.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui";

interface MultipleChoiceProps {
  exercise: {
    id: string;
    question: string;
    content: {
      options: string[];
      correctIndex: number;
    };
    hint?: string;
    explanation?: string;
  };
  onSubmit: (correct: boolean, userAnswer?: any, correctAnswer?: any) => void;
  disabled?: boolean;
}

export default function MultipleChoice({
  exercise,
  onSubmit,
  disabled,
}: MultipleChoiceProps) {
  const { content } = exercise;
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  // Reset state when exercise ID changes
  useEffect(() => {
    setSelectedIndex(null);
    setSubmitted(false);
    setIsCorrect(false);
  }, [exercise.id]);

  const handleSelect = (index: number) => {
    if (disabled || submitted) return;
    setSelectedIndex(index);
  };

  const handleSubmit = () => {
    if (selectedIndex === null) return;

    const correct = selectedIndex === content.correctIndex;
    setIsCorrect(correct);
    setSubmitted(true);
    onSubmit(correct, content.options[selectedIndex], content.options[content.correctIndex]);
  };

  return (
    <div className="space-y-4">
      {/* Question */}
      <h3 className="text-lg font-semibold text-gray-900">
        {exercise.question}
      </h3>

      {/* Options */}
      <div className="space-y-2">
        {content.options.map((option, index) => {
          const isSelected = selectedIndex === index;
          const isCorrectOption = index === content.correctIndex;

          let bgColor = "bg-gray-50";
          let borderColor = "border-gray-200";
          let textColor = "text-gray-700";

          if (submitted) {
            if (isCorrectOption) {
              // Always highlight correct answer in green
              bgColor = "bg-green-50";
              borderColor = "border-green-500";
              textColor = "text-green-800";
            } else if (isSelected && !isCorrectOption) {
              // Wrong selection in red
              bgColor = "bg-red-50";
              borderColor = "border-red-500";
              textColor = "text-red-800";
            } else {
              // Unselected options stay muted
              bgColor = "bg-gray-50";
              borderColor = "border-gray-200";
              textColor = "text-gray-400";
            }
          } else if (isSelected) {
            // Selected but not submitted yet
            bgColor = "bg-primary/10";
            borderColor = "border-primary";
            textColor = "text-primary";
          } else {
            // Default hoverable state
            bgColor = "bg-gray-50 hover:bg-gray-100";
          }

          return (
            <button
              key={index}
              onClick={() => handleSelect(index)}
              disabled={disabled || submitted}
              className={`w-full p-4 rounded-xl text-left font-medium transition-all border-2 ${bgColor} ${borderColor} ${textColor}`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                    submitted
                      ? isCorrectOption
                        ? "bg-green-500 text-white"
                        : isSelected
                        ? "bg-red-500 text-white"
                        : "bg-gray-200 text-gray-500"
                      : isSelected
                      ? "bg-primary text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {String.fromCharCode(65 + index)}
                </span>
                <span>{option}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Hint */}
      {exercise.hint && !submitted && (
        <p className="text-sm text-gray-500 italic">💡 {exercise.hint}</p>
      )}

      {/* Submit button */}
      {!submitted && (
        <Button
          onClick={handleSubmit}
          disabled={selectedIndex === null || disabled}
          className="w-full"
        >
          Check Answer
        </Button>
      )}
    </div>
  );
}
