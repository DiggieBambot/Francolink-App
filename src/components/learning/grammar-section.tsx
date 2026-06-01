// src/components/learning/grammar-section.tsx
"use client";

import { useState, useRef } from "react";
import { Volume2, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui";
import { useInworldTTS } from "@/hooks/use-inworld-tts";

interface GrammarExample {
  original: string;
  translation: string;
  breakdown?: string;
}

interface GrammarPoint {
  title: string;
  explanation: string;
  examples: GrammarExample[];
  table?: {
    headers: string[];
    rows: string[][];
  };
  commonMistakes?: string[];
}

interface GrammarSectionProps {
  grammar: GrammarPoint[];
  language?: string;
  onComplete: () => void;
  onProgress: (progress: number) => void;
}

export default function GrammarSection({
  grammar,
  language = "fr-FR",
  onComplete,
  onProgress,
}: GrammarSectionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [expandedMistakes, setExpandedMistakes] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const speakingIdRef = useRef<string | null>(null);

  const totalPoints = grammar.length;
  const currentPoint = grammar[currentIndex];
  const isLastPoint = currentIndex === totalPoints - 1;

  const { speak: ttsSpeak, stop: ttsStop } = useInworldTTS({ language });

  const clearSpeaking = () => {
    speakingIdRef.current = null;
    setSpeakingId(null);
  };

  const speak = async (text: string, id: string) => {
    if (speakingIdRef.current === id) {
      ttsStop();
      clearSpeaking();
      return;
    }
    speakingIdRef.current = id;
    setSpeakingId(id);
    try {
      await ttsSpeak(text);
    } finally {
      if (speakingIdRef.current === id) clearSpeaking();
    }
  };

  const goToNext = () => {
    ttsStop();
    clearSpeaking();

    if (currentIndex < totalPoints - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      onProgress(((newIndex + 1) / totalPoints) * 100);
      setExpandedMistakes(false);
    } else {
      onProgress(100);
      onComplete();
    }
  };

  const goToPrevious = () => {
    ttsStop();
    clearSpeaking();

    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      onProgress(((newIndex + 1) / totalPoints) * 100);
      setExpandedMistakes(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="text-center mb-4">
        <span className="text-sm text-gray-500">
          Grammar Point {currentIndex + 1} of {totalPoints}
        </span>
      </div>

      {/* Progress dots */}
      {totalPoints > 1 && (
        <div className="flex justify-center gap-2 mb-6">
          {grammar.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setCurrentIndex(index);
                onProgress(((index + 1) / totalPoints) * 100);
              }}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                index === currentIndex
                  ? "bg-primary scale-125"
                  : index < currentIndex
                  ? "bg-primary/40"
                  : "bg-gray-300"
              }`}
            />
          ))}
        </div>
      )}

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          {/* Title */}
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {currentPoint.title}
          </h2>

          {/* Explanation */}
          <p className="text-gray-700 leading-relaxed mb-6">
            {currentPoint.explanation}
          </p>

          {/* Examples */}
          <div className="space-y-3 mb-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              Examples
            </h3>
            {currentPoint.examples.map((example, index) => {
              const exampleId = `ex-${currentIndex}-${index}`;
              const isPlaying = speakingId === exampleId;

              return (
                <div key={index} className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-lg font-medium text-gray-900">
                      {example.original}
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        speak(example.original, exampleId); console.log("CLICKED SPEAK:", example.original, exampleId);
                      }}
                      className={`p-2 rounded-full transition-colors flex-shrink-0 ${
                        isPlaying
                          ? "bg-primary text-white"
                          : "bg-primary/10 hover:bg-primary/20 text-primary"
                      }`}
                    >
                      <Volume2 className={`w-4 h-4 ${isPlaying ? "animate-pulse" : ""}`} />
                    </button>
                  </div>
                  <p className="text-gray-600">{example.translation}</p>
                  {example.breakdown && (
                    <p className="text-sm text-primary mt-2 italic">
                      💡 {example.breakdown}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Table (if exists) */}
          {currentPoint.table && (
            <div className="mb-6 overflow-x-auto">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Reference
              </h3>
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    {currentPoint.table.headers.map((header, index) => (
                      <th
                        key={index}
                        className="bg-primary/10 text-primary text-left px-4 py-2 text-sm font-semibold first:rounded-tl-lg last:rounded-tr-lg"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {currentPoint.table.rows.map((row, rowIndex) => (
                    <tr key={rowIndex} className="border-b border-gray-100 last:border-0">
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex} className="px-4 py-2 text-gray-700">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Common Mistakes (collapsible) */}
          {currentPoint.commonMistakes && currentPoint.commonMistakes.length > 0 && (
            <div className="border-t border-gray-100 pt-4">
              <button
                onClick={() => setExpandedMistakes(!expandedMistakes)}
                className="flex items-center justify-between w-full text-left"
              >
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-orange-500" />
                  Common Mistakes
                </h3>
                {expandedMistakes ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </button>

              {expandedMistakes && (
                <div className="mt-3 space-y-2">
                  {currentPoint.commonMistakes.map((mistake, index) => (
                    <p
                      key={index}
                      className={`text-sm p-2 rounded-lg ${
                        mistake.startsWith("❌")
                          ? "bg-red-50 text-red-700"
                          : mistake.startsWith("✅")
                          ? "bg-green-50 text-green-700"
                          : "bg-gray-50 text-gray-700"
                      }`}
                    >
                      {mistake}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="px-4 py-4 border-t border-gray-100 bg-white">
        <div className="flex gap-3">
          {currentIndex > 0 && (
            <Button variant="outline" onClick={goToPrevious} className="flex-1">
              Previous
            </Button>
          )}
          <Button onClick={goToNext} className="flex-1">
            {isLastPoint ? "Continue" : "Next"}
          </Button>
        </div>
      </div>
    </div>
  );
}
