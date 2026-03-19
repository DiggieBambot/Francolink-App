"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { AlertTriangle } from "lucide-react";

interface ErrorCorrectionProps {
  exercise: any;
  onSubmit: (correct: boolean, userAnswer?: any, correctAnswer?: any) => void;
  disabled?: boolean;
}

export default function ErrorCorrection({ exercise, onSubmit, disabled }: ErrorCorrectionProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const { question, content } = exercise;
  const { sentence, options, correctIndex, errorType } = content;

  const handleSubmit = () => {
    if (selected === null || submitted) return;
    setSubmitted(true);
    const correct = selected === correctIndex;
    onSubmit(correct, options[selected], options[correctIndex]);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="p-2 bg-orange-100 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-orange-600" />
        </div>
        <span className="text-sm font-medium text-orange-600 uppercase tracking-wide">Error Correction</span>
      </div>

      <p className="text-lg font-semibold text-gray-900">{question}</p>

      {errorType && (
        <span className="inline-block bg-orange-50 text-orange-700 text-xs font-medium px-3 py-1 rounded-full border border-orange-200">
          {errorType}
        </span>
      )}

      <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
        <p className="text-xs text-red-500 font-medium mb-1 uppercase">Incorrect sentence:</p>
        <p className="text-gray-900 font-medium text-lg">{sentence}</p>
      </div>

      <p className="text-sm text-gray-600 font-medium">Which is the correct version?</p>

      <div className="space-y-2">
        {options.map((option: string, index: number) => {
          let className = "w-full text-left p-4 rounded-xl border-2 transition-all ";
          if (submitted) {
            if (index === correctIndex) {
              className += "border-green-400 bg-green-50 text-green-800";
            } else if (index === selected && selected !== correctIndex) {
              className += "border-red-400 bg-red-50 text-red-800";
            } else {
              className += "border-gray-200 bg-gray-50 text-gray-500";
            }
          } else if (selected === index) {
            className += "border-primary bg-primary/5 text-gray-900";
          } else {
            className += "border-gray-200 hover:border-gray-300 bg-white text-gray-900";
          }

          return (
            <button
              key={index}
              onClick={() => !submitted && !disabled && setSelected(index)}
              disabled={submitted || disabled}
              className={className}
            >
              <span className="font-medium">{option}</span>
            </button>
          );
        })}
      </div>

      {!submitted && (
        <Button
          onClick={handleSubmit}
          disabled={selected === null || disabled}
          className="w-full"
        >
          Check Answer
        </Button>
      )}
    </div>
  );
}
