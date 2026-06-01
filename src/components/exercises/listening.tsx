// src/components/exercises/listening.tsx
"use client";

import { useState, useEffect } from "react";
import { Volume2 } from "lucide-react";
import { Button } from "@/components/ui";
import { useInworldTTS } from "@/hooks/use-inworld-tts";

interface ListeningProps {
  exercise: {
    id: string;
    question: string;
    content: {
      ttsText?: string;
      ttsLang?: string;
      audioText?: string;
      audioUrl?: string;
      options: string[];
      correctIndex: number;
    };
    hint?: string;
    explanation?: string;
  };
  language?: string;
  onSubmit: (correct: boolean, userAnswer?: any, correctAnswer?: any) => void;
  disabled?: boolean;
}

export default function Listening({
  exercise,
  language = "fr-FR",
  onSubmit,
  disabled,
}: ListeningProps) {
  const { content } = exercise;
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [playCount, setPlayCount] = useState(0);

  const textToSpeak = content.ttsText || content.audioText || "";
  const speakLang = content.ttsLang || language;
  const { speak, stop, isSpeaking } = useInworldTTS({ language: speakLang });
  const isPlaying = isSpeaking;

  // Reset on exercise change
  useEffect(() => {
    setSelectedIndex(null);
    setSubmitted(false);
    setIsCorrect(false);
    setPlayCount(0);
    stop();
  }, [exercise.id, stop]);

  const playAudio = async () => {
    if (!textToSpeak) return;
    await speak(textToSpeak);
    setPlayCount((p) => p + 1);
  };

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
      <h3 className="text-lg font-semibold text-gray-900">
        {exercise.question}
      </h3>

      {/* Audio Player */}
      <div
        className="flex items-center justify-center p-6 rounded-xl"
        style={{ background: "linear-gradient(135deg, #0f2744, #0a1e35)" }}
      >
        <button
          onClick={playAudio}
          className={`flex flex-col items-center gap-3 transition-transform ${
            isPlaying ? "scale-110" : "hover:scale-105 active:scale-95"
          }`}
        >
          <div
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
              isPlaying ? "bg-orange-500 animate-pulse" : "bg-white/20 hover:bg-white/30"
            }`}
          >
            <Volume2 className="w-10 h-10 text-white" />
          </div>
          <span className="text-white/80 text-sm font-medium">
            {isPlaying ? "Playing..." : playCount > 0 ? "Tap to play again" : "Tap to listen"}
          </span>
        </button>
      </div>

      {playCount > 0 && !submitted && (
        <p className="text-center text-sm text-gray-500">
          Played {playCount} time{playCount !== 1 ? "s" : ""}
        </p>
      )}

      {/* Options */}
      <div className="space-y-2">
        {content.options.map((option, index) => {
          const isSelected = selectedIndex === index;
          const isCorrectOption = index === content.correctIndex;

          let style = "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100";
          
          if (submitted) {
            if (isCorrectOption) {
              style = "bg-green-50 border-green-500 text-green-800";
            } else if (isSelected) {
              style = "bg-red-50 border-red-500 text-red-800";
            } else {
              style = "bg-gray-50 border-gray-200 text-gray-400";
            }
          } else if (isSelected) {
            style = "bg-primary/10 border-primary text-primary";
          }

          return (
            <button
              key={index}
              onClick={() => handleSelect(index)}
              disabled={disabled || submitted}
              className={`w-full p-4 rounded-xl text-left font-medium transition-all border-2 ${style}`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
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

      {exercise.hint && !submitted && (
        <p className="text-sm text-gray-500 italic">💡 {exercise.hint}</p>
      )}

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
