// src/components/exercises/fill-blank.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui";

interface FillBlankProps {
  exercise: {
    id: string;
    question: string;
    content: {
      sentence?: string;
      answer?: string;
      options?: string[];
      caseSensitive?: boolean;
    };
    hint?: string;
    explanation?: string;
  };
  onSubmit: (correct: boolean, userAnswer?: any, correctAnswer?: any) => void;
  disabled?: boolean;
}

export default function FillBlank({ exercise, onSubmit, disabled }: FillBlankProps) {
  const { content } = exercise;
  
  const sentence = content.sentence || "";
  const correctAnswer = content.answer || "";
  const options = content.options || [];
  const caseSensitive = content.caseSensitive ?? false;

  // Reset state when exercise changes
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  // Reset state when exercise ID changes
  useEffect(() => {
    setSelectedOption(null);
    setInputValue("");
    setSubmitted(false);
    setIsCorrect(false);
  }, [exercise.id]);

  const checkAnswer = (answer: string): boolean => {
    if (caseSensitive) {
      return answer.trim() === correctAnswer;
    }
    return answer.trim().toLowerCase() === correctAnswer.toLowerCase();
  };

  // Handle option selection (multiple choice style)
  const handleOptionSelect = (option: string) => {
    if (disabled || submitted) return;
    setSelectedOption(option);
  };

  // Handle text input
  const handleInputChange = (value: string) => {
    if (disabled || submitted) return;
    setInputValue(value);
  };

  // Submit answer
  const handleSubmit = () => {
    const answer = options.length > 0 ? selectedOption : inputValue;
    if (!answer?.trim()) return;

    const correct = checkAnswer(answer);
    setIsCorrect(correct);
    setSubmitted(true);
    onSubmit(correct, answer, correctAnswer);
  };

  // Render sentence with blank highlighted
  const renderSentence = () => {
    const parts = sentence.split(/_{2,}|_____/);
    
    if (parts.length < 2) {
      return <p className="text-lg text-gray-800 mb-4">{sentence}</p>;
    }

    const displayAnswer = options.length > 0 ? selectedOption : inputValue;

    return (
      <p className="text-lg text-gray-800 mb-4 leading-relaxed">
        {parts[0]}
        <span
          className={`inline-block min-w-[80px] px-3 py-1 mx-1 rounded-lg font-semibold text-center transition-all ${
            submitted
              ? isCorrect
                ? "bg-green-100 text-green-800 border-2 border-green-500"
                : "bg-red-100 text-red-800 border-2 border-red-500"
              : displayAnswer
              ? "bg-primary/10 text-primary border-2 border-primary"
              : "bg-gray-100 text-gray-400 border-2 border-dashed border-gray-300"
          }`}
        >
          {displayAnswer || "______"}
        </span>
        {parts[1]}
      </p>
    );
  };

  // Multiple choice style (with options)
  if (options.length > 0) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {exercise.question}
        </h3>

        {renderSentence()}

        {/* Options grid */}
        <div className="grid grid-cols-2 gap-2">
          {options.map((option, index) => {
            const isSelected = selectedOption === option;
            const isCorrectOption = checkAnswer(option);
            
            let bgColor = "bg-gray-50";
            let borderColor = "border-gray-200";
            let textColor = "text-gray-700";

            if (submitted) {
              if (isCorrectOption) {
                // Always show correct answer in green
                bgColor = "bg-green-50";
                borderColor = "border-green-500";
                textColor = "text-green-800";
              } else if (isSelected && !isCorrectOption) {
                // Show wrong selection in red
                bgColor = "bg-red-50";
                borderColor = "border-red-500";
                textColor = "text-red-800";
              } else {
                // Unselected wrong options stay gray
                bgColor = "bg-gray-50";
                borderColor = "border-gray-200";
                textColor = "text-gray-400";
              }
            } else if (isSelected) {
              // Selected but not submitted
              bgColor = "bg-primary/10";
              borderColor = "border-primary";
              textColor = "text-primary";
            } else {
              // Not selected, hoverable
              bgColor = "bg-gray-50 hover:bg-gray-100";
            }

            return (
              <button
                key={index}
                onClick={() => handleOptionSelect(option)}
                disabled={disabled || submitted}
                className={`p-3 rounded-xl text-left font-medium transition-all border-2 ${bgColor} ${borderColor} ${textColor}`}
              >
                {option}
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
            disabled={!selectedOption || disabled}
            className="w-full mt-4"
          >
            Check Answer
          </Button>
        )}
      </div>
    );
  }

  // Text input style (no options)
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {exercise.question}
      </h3>

      {/* Sentence with input */}
      <p className="text-lg text-gray-800 mb-4 leading-relaxed">
        {sentence.split(/_{2,}|_____/)[0]}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          disabled={disabled || submitted}
          placeholder="..."
          className={`inline-block w-32 px-3 py-1 mx-1 rounded-lg border-2 font-medium text-center transition-all ${
            submitted
              ? isCorrect
                ? "bg-green-100 text-green-800 border-green-500"
                : "bg-red-100 text-red-800 border-red-500"
              : "bg-gray-50 border-gray-300 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          }`}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !submitted && inputValue.trim()) {
              handleSubmit();
            }
          }}
        />
        {sentence.split(/_{2,}|_____/)[1]}
      </p>

      {/* Show correct answer if wrong */}
      {submitted && !isCorrect && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-xl">
          <p className="text-sm text-green-700">
            ✓ Correct answer: <strong>{correctAnswer}</strong>
          </p>
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
          className="w-full mt-4"
        >
          Check Answer
        </Button>
      )}
    </div>
  );
}
