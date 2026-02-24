// src/components/exercises/matching.tsx
"use client";

import { useState, useEffect } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui";

interface MatchingProps {
  exercise: {
    id: string;
    question: string;
    content: {
      pairs: { left: string; right: string }[];
    };
    hint?: string;
    explanation?: string;
  };
  onSubmit: (correct: boolean, userAnswer?: any, correctAnswer?: any) => void;
  disabled?: boolean;
}

export default function Matching({
  exercise,
  onSubmit,
  disabled,
}: MatchingProps) {
  const { content } = exercise;
  
  // Shuffle right side on mount
  const [shuffledRight, setShuffledRight] = useState<string[]>([]);
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const [selectedRight, setSelectedRight] = useState<number | null>(null);
  const [matches, setMatches] = useState<Record<number, number>>({}); // leftIndex -> rightIndex
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<Record<number, boolean>>({});

  // Reset and shuffle when exercise changes
  useEffect(() => {
    const rightItems = content.pairs.map(p => p.right);
    const shuffled = [...rightItems].sort(() => Math.random() - 0.5);
    setShuffledRight(shuffled);
    setSelectedLeft(null);
    setSelectedRight(null);
    setMatches({});
    setSubmitted(false);
    setResults({});
  }, [exercise.id, content.pairs]);

  const handleLeftSelect = (index: number) => {
    if (disabled || submitted) return;
    
    // If already matched, unmatch it
    if (matches[index] !== undefined) {
      const newMatches = { ...matches };
      delete newMatches[index];
      setMatches(newMatches);
      return;
    }
    
    setSelectedLeft(index);
    
    // If right is already selected, make the match
    if (selectedRight !== null) {
      setMatches(prev => ({ ...prev, [index]: selectedRight }));
      setSelectedLeft(null);
      setSelectedRight(null);
    }
  };

  const handleRightSelect = (index: number) => {
    if (disabled || submitted) return;
    
    // If already matched to something, don't allow
    if (Object.values(matches).includes(index)) return;
    
    setSelectedRight(index);
    
    // If left is already selected, make the match
    if (selectedLeft !== null) {
      setMatches(prev => ({ ...prev, [selectedLeft]: index }));
      setSelectedLeft(null);
      setSelectedRight(null);
    }
  };

  const handleSubmit = () => {
    const newResults: Record<number, boolean> = {};
    let allCorrect = true;

    content.pairs.forEach((pair, leftIndex) => {
      const rightIndex = matches[leftIndex];
      if (rightIndex === undefined) {
        newResults[leftIndex] = false;
        allCorrect = false;
      } else {
        const selectedRight = shuffledRight[rightIndex];
        const isCorrect = selectedRight === pair.right;
        newResults[leftIndex] = isCorrect;
        if (!isCorrect) allCorrect = false;
      }
    });

    setResults(newResults);
    setSubmitted(true);
    onSubmit(allCorrect, matches, content.pairs);
  };

  const allMatched = Object.keys(matches).length === content.pairs.length;

  const getLeftStyle = (index: number) => {
    const isMatched = matches[index] !== undefined;
    const isSelected = selectedLeft === index;

    if (submitted) {
      if (results[index]) {
        return "bg-green-50 border-green-500 text-green-800";
      } else {
        return "bg-red-50 border-red-500 text-red-800";
      }
    }

    if (isMatched) {
      return "bg-primary/20 border-primary text-primary";
    }
    if (isSelected) {
      return "bg-primary/10 border-primary text-primary ring-2 ring-primary/30";
    }
    return "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100";
  };

  const getRightStyle = (index: number) => {
    const isMatched = Object.values(matches).includes(index);
    const isSelected = selectedRight === index;
    const matchedLeftIndex = Object.entries(matches).find(([_, r]) => r === index)?.[0];

    if (submitted && matchedLeftIndex !== undefined) {
      if (results[parseInt(matchedLeftIndex)]) {
        return "bg-green-50 border-green-500 text-green-800";
      } else {
        return "bg-red-50 border-red-500 text-red-800";
      }
    }

    if (isMatched) {
      return "bg-primary/20 border-primary text-primary";
    }
    if (isSelected) {
      return "bg-primary/10 border-primary text-primary ring-2 ring-primary/30";
    }
    return "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100";
  };

  return (
    <div className="space-y-4">
      {/* Question */}
      <h3 className="text-lg font-semibold text-gray-900">
        {exercise.question}
      </h3>

      {/* Instructions */}
      {!submitted && (
        <p className="text-sm text-gray-500">
          Tap one item on the left, then tap its match on the right.
        </p>
      )}

      {/* Matching columns */}
      <div className="grid grid-cols-2 gap-3">
        {/* Left column */}
        <div className="space-y-2">
          {content.pairs.map((pair, index) => (
            <button
              key={`left-${index}`}
              onClick={() => handleLeftSelect(index)}
              disabled={disabled || submitted}
              className={`w-full p-3 rounded-xl text-left font-medium transition-all border-2 ${getLeftStyle(index)}`}
            >
              <div className="flex items-center justify-between">
                <span>{pair.left}</span>
                {submitted && (
                  results[index] ? (
                    <Check className="w-5 h-5 text-green-600" />
                  ) : (
                    <X className="w-5 h-5 text-red-600" />
                  )
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Right column */}
        <div className="space-y-2">
          {shuffledRight.map((item, index) => (
            <button
              key={`right-${index}`}
              onClick={() => handleRightSelect(index)}
              disabled={disabled || submitted || Object.values(matches).includes(index)}
              className={`w-full p-3 rounded-xl text-left font-medium transition-all border-2 ${getRightStyle(index)}`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {/* Match count */}
      {!submitted && (
        <p className="text-center text-sm text-gray-500">
          {Object.keys(matches).length} of {content.pairs.length} matched
        </p>
      )}

      {/* Hint */}
      {exercise.hint && !submitted && (
        <p className="text-sm text-gray-500 italic">💡 {exercise.hint}</p>
      )}

      {/* Submit button */}
      {!submitted && (
        <Button
          onClick={handleSubmit}
          disabled={!allMatched || disabled}
          className="w-full"
        >
          Check Matches
        </Button>
      )}
    </div>
  );
}
