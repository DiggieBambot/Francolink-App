// src/components/learning/vocabulary-cards.tsx
"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Check, RotateCcw } from "lucide-react";
import Flashcard from "./flashcard";
import { Button } from "@/components/ui";

interface VocabularyWord {
  term: string;
  translation: string;
  pronunciation?: string;
  partOfSpeech?: string;
  gender?: string;
  exampleSentence?: {
    original: string;
    translation: string;
  };
  tip?: string;
  image?: string;
}

interface VocabularyCardsProps {
  vocabulary: VocabularyWord[];
  language?: string;
  level?: string;
  onComplete: () => void;
  onProgress: (progress: number) => void;
}

export default function VocabularyCards({
  vocabulary,
  language = "fr-FR",
  level = "A1",
  onComplete,
  onProgress,
}: VocabularyCardsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [knownWords, setKnownWords] = useState<Set<number>>(new Set());

  const totalCards = vocabulary.length;
  const currentWord = vocabulary[currentIndex];

  const updateProgress = (index: number) => {
    const newProgress = ((index + 1) / totalCards) * 100;
    onProgress(newProgress);
  };

  const goToNext = () => {
    if (currentIndex < totalCards - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      updateProgress(newIndex);
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      updateProgress(newIndex);
    }
  };

  const markAsKnown = () => {
    setKnownWords((prev) => new Set(prev).add(currentIndex));
    goToNext();
  };

  const handleComplete = () => {
    onProgress(100);
    onComplete();
  };

  const isLastCard = currentIndex === totalCards - 1;
  const isFirstCard = currentIndex === 0;

  return (
    <div className="flex flex-col h-full">
      {/* Card counter */}
      <div className="text-center mb-4">
        <span className="text-sm text-gray-500">
          Card {currentIndex + 1} of {totalCards}
        </span>
        {knownWords.has(currentIndex) && (
          <span className="ml-2 inline-flex items-center gap-1 text-sm text-green-600">
            <Check className="w-4 h-4" />
            Known
          </span>
        )}
      </div>

      {/* Progress dots */}
      <div className="flex justify-center gap-1.5 mb-6 flex-wrap max-w-xs mx-auto">
        {vocabulary.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setCurrentIndex(index);
              updateProgress(index);
            }}
            className="w-2.5 h-2.5 rounded-full transition-all"
            style={{
              backgroundColor:
                index === currentIndex
                  ? "#f97316"
                  : knownWords.has(index)
                  ? "#22c55e"
                  : index < currentIndex
                  ? "rgba(249, 115, 22, 0.4)"
                  : "#d1d5db",
              transform: index === currentIndex ? "scale(1.25)" : "scale(1)",
            }}
          />
        ))}
      </div>

      {/* Flashcard */}
      <div className="flex-1 flex items-center justify-center px-4 min-h-0">
        <Flashcard
          key={currentIndex}
          term={currentWord.term}
          translation={currentWord.translation}
          pronunciation={currentWord.pronunciation}
          partOfSpeech={currentWord.partOfSpeech}
          gender={currentWord.gender}
          exampleSentence={currentWord.exampleSentence}
          tip={currentWord.tip}
          image={currentWord.image}
          language={language}
        />
      </div>

      {/* Navigation */}
      <div className="mt-6 px-4">
        <div className="flex items-center justify-center gap-3 mb-4">
          <button
            onClick={goToPrevious}
            disabled={isFirstCard}
            className="p-3 rounded-full transition-all"
            style={{
              backgroundColor: isFirstCard ? "#f3f4f6" : "#f3f4f6",
              color: isFirstCard ? "#d1d5db" : "#4b5563",
              opacity: isFirstCard ? 0.5 : 1,
            }}
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {!knownWords.has(currentIndex) && (
            <button
              onClick={markAsKnown}
              className="flex items-center gap-2 px-4 py-2 rounded-full transition-all"
              style={{ backgroundColor: "#dcfce7", color: "#166534" }}
            >
              <Check className="w-5 h-5" />
              <span className="text-sm font-medium">I know this</span>
            </button>
          )}

          <button
            onClick={goToNext}
            disabled={isLastCard}
            className="p-3 rounded-full transition-all"
            style={{
              backgroundColor: isLastCard ? "#f3f4f6" : "#f97316",
              color: isLastCard ? "#d1d5db" : "#ffffff",
              opacity: isLastCard ? 0.5 : 1,
            }}
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        {/* Complete button */}
        {isLastCard && (
          <Button onClick={handleComplete} className="w-full">
            Continue to Next Section
          </Button>
        )}

        {/* Restart option */}
        {currentIndex > 0 && (
          <button
            onClick={() => {
              setCurrentIndex(0);
              updateProgress(0);
            }}
            className="flex items-center justify-center gap-2 w-full mt-3 py-2 text-sm text-gray-500 hover:text-gray-700"
          >
            <RotateCcw className="w-4 h-4" />
            Start over
          </button>
        )}
      </div>
    </div>
  );
}
