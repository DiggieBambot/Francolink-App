"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { PenLine } from "lucide-react";

interface WritingProps {
  exercise: any;
  onSubmit: (correct: boolean, userAnswer?: any, correctAnswer?: any) => void;
  disabled?: boolean;
}

export default function Writing({ exercise, onSubmit, disabled }: WritingProps) {
  const [text, setText] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const { question, content } = exercise;
  const { prompt, keyPhrases = [], modelAnswer = "", minWords = 30 } = content;

  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const hasEnoughWords = wordCount >= minWords;

  const handleSubmit = () => {
    if (!hasEnoughWords || submitted) return;
    setSubmitted(true);
    // Writing exercises are always marked correct if minimum length met
    // Teacher/AI grading can be added later
    onSubmit(true, text, modelAnswer);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="p-2 bg-purple-100 rounded-lg">
          <PenLine className="w-5 h-5 text-purple-600" />
        </div>
        <span className="text-sm font-medium text-purple-600 uppercase tracking-wide">Writing Task</span>
      </div>

      <p className="text-lg font-semibold text-gray-900">{question}</p>

      {prompt && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-blue-800 text-sm">{prompt}</p>
        </div>
      )}

      {keyPhrases.length > 0 && (
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-xs font-medium text-gray-500 uppercase mb-2">Try to use these phrases:</p>
          <div className="flex flex-wrap gap-2">
            {keyPhrases.map((phrase: string, i: number) => (
              <span key={i} className="bg-white border border-gray-200 rounded-full px-3 py-1 text-sm text-gray-700">
                {phrase}
              </span>
            ))}
          </div>
        </div>
      )}

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={disabled || submitted}
        placeholder="Write your answer here..."
        rows={6}
        className="w-full border border-gray-300 rounded-xl p-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none disabled:bg-gray-50"
      />

      <div className="flex items-center justify-between">
        <span className={`text-sm ${hasEnoughWords ? "text-green-600" : "text-gray-400"}`}>
          {wordCount} / {minWords} words minimum
        </span>
        <Button
          onClick={handleSubmit}
          disabled={!hasEnoughWords || submitted || disabled}
          className="gap-2"
        >
          Submit Writing
        </Button>
      </div>

      {submitted && modelAnswer && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mt-2">
          <p className="text-xs font-medium text-green-600 uppercase mb-2">Model Answer:</p>
          <p className="text-green-800 text-sm italic">{modelAnswer}</p>
        </div>
      )}
    </div>
  );
}
