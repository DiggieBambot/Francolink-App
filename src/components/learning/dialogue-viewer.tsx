// src/components/learning/dialogue-viewer.tsx
"use client";

import { useState } from "react";
import { Volume2, ChevronRight, Play } from "lucide-react";
import { Button } from "@/components/ui";
import { useInworldTTS } from "@/hooks/use-inworld-tts";

interface DialogueLine {
  speaker: string;
  text: string;
  translation: string;
  audio?: string;
  speakerType?: string;
}

interface DialogueProps {
  title: string;
  context: string;
  lines: DialogueLine[];
  image?: string;
  language?: string;
  onComplete: () => void;
}

// Brand colors
const NAVY = "#0f2744";
const NAVY_LIGHT = "#1a3a5c";
const ORANGE = "#f97316";
const ORANGE_LIGHT = "#fb923c";

// Avatar mapping - alternating between navy and orange
const AVATAR_MAP: Record<string, { emoji: string; bg: string }> = {
  // Female characters - Orange
  young_woman: { emoji: "👩", bg: ORANGE },
  sophie: { emoji: "👩", bg: ORANGE },
  léa: { emoji: "👩", bg: ORANGE_LIGHT },
  clara: { emoji: "👩", bg: ORANGE },
  marie: { emoji: "👩‍💼", bg: ORANGE_LIGHT },
  anne: { emoji: "👩‍💼", bg: ORANGE },
  camille: { emoji: "👧", bg: ORANGE_LIGHT },
  emma: { emoji: "👧", bg: ORANGE },
  mamie: { emoji: "👵", bg: ORANGE_LIGHT },
  boulangère: { emoji: "👩‍🍳", bg: ORANGE },
  serveuse: { emoji: "👩‍🍳", bg: ORANGE_LIGHT },
  vendeuse: { emoji: "👩‍💼", bg: ORANGE },
  guichetière: { emoji: "👩‍💼", bg: ORANGE_LIGHT },
  réceptionniste: { emoji: "👩‍💼", bg: ORANGE },

  // Male characters - Navy
  young_man: { emoji: "👨", bg: NAVY },
  pierre: { emoji: "👨", bg: NAVY },
  hugo: { emoji: "👨", bg: NAVY_LIGHT },
  thomas: { emoji: "👨", bg: NAVY },
  jean: { emoji: "👨‍💼", bg: NAVY_LIGHT },
  marc: { emoji: "👨‍💼", bg: NAVY },
  julien: { emoji: "👦", bg: NAVY_LIGHT },
  lucas: { emoji: "👦", bg: NAVY },
  papi: { emoji: "👴", bg: NAVY_LIGHT },
  boulanger: { emoji: "👨‍🍳", bg: NAVY },
  serveur: { emoji: "🧑‍🍳", bg: NAVY_LIGHT },
  vendeur: { emoji: "🧑‍💼", bg: NAVY },
};

const getAvatar = (speaker: string, speakerType?: string, index?: number) => {
  // Try speakerType first
  if (speakerType) {
    const typeKey = speakerType.toLowerCase().replace(/\s+/g, '_');
    if (AVATAR_MAP[typeKey]) return AVATAR_MAP[typeKey];
  }
  
  // Try speaker name (exact match)
  const nameKey = speaker.toLowerCase().replace(/\s+/g, '_');
  if (AVATAR_MAP[nameKey]) return AVATAR_MAP[nameKey];
  
  // Try partial match
  const lowerName = speaker.toLowerCase();
  for (const [key, value] of Object.entries(AVATAR_MAP)) {
    if (lowerName.includes(key) || key.includes(lowerName)) {
      return value;
    }
  }
  
  // Gender detection from common French names
  const femaleNames = ['sophie', 'marie', 'emma', 'chloé', 'léa', 'camille', 'clara', 'anne', 'julie', 'lucie'];
  const maleNames = ['pierre', 'jean', 'lucas', 'hugo', 'marc', 'thomas', 'julien', 'paul', 'nicolas'];
  
  if (femaleNames.some(n => lowerName.includes(n))) return { emoji: "👩", bg: ORANGE };
  if (maleNames.some(n => lowerName.includes(n))) return { emoji: "👨", bg: NAVY };
  
  // Detect profession keywords
  if (lowerName.includes('serv')) return { emoji: "🧑‍🍳", bg: NAVY_LIGHT };
  if (lowerName.includes('boulang')) return { emoji: "👨‍🍳", bg: ORANGE };
  if (lowerName.includes('vend')) return { emoji: "🧑‍💼", bg: NAVY_LIGHT };
  
  // Final fallback - alternate based on speaker index
  if (index !== undefined && index % 2 === 0) {
    return { emoji: "👤", bg: NAVY };
  }
  return { emoji: "👤", bg: ORANGE };
};

export default function DialogueViewer({
  title,
  context,
  lines,
  image,
  language = "fr-FR",
  onComplete,
}: DialogueProps) {
  const [currentLine, setCurrentLine] = useState(0);
  const [revealedLines, setRevealedLines] = useState<number[]>([0]);
  const [showTranslation, setShowTranslation] = useState<Set<number>>(new Set());
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);

  const { speak: ttsSpeak, stop: ttsStop } = useInworldTTS({ language });

  const isComplete = revealedLines.length === lines.length;

  // Colors
  const navyGradient = "linear-gradient(135deg, #0f2744, #0a1e35)";
  const orangeLight = "#fdba74";

  const speak = async (text: string, index: number) => {
    setSpeakingIndex(index);
    try {
      await ttsSpeak(text);
    } finally {
      setSpeakingIndex(null);
    }
  };

  // Play all revealed lines in sequence
  const playAll = async () => {
    ttsStop();
    for (const lineIndex of revealedLines) {
      setSpeakingIndex(lineIndex);
      await ttsSpeak(lines[lineIndex].text);
    }
    setSpeakingIndex(null);
  };

  const handleNext = () => {
    if (currentLine < lines.length - 1) {
      const nextLine = currentLine + 1;
      setCurrentLine(nextLine);
      if (!revealedLines.includes(nextLine)) {
        setRevealedLines(prev => [...prev, nextLine]);
        // Audio plays only when the user taps the speaker icon — no autoplay.
      }
    }
  };

  const toggleTranslation = (index: number) => {
    setShowTranslation(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  // Assign speakers to sides and track their index
  const speakers = [...new Set(lines.map(l => l.speaker))];
  const getSpeakerSide = (speaker: string) => {
    return speakers.indexOf(speaker) % 2 === 0 ? 'left' : 'right';
  };
  const getSpeakerIndex = (speaker: string) => {
    return speakers.indexOf(speaker);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-4 border-b border-gray-100 bg-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{title}</h2>
            <p className="text-sm text-gray-500 mt-1">{context}</p>
          </div>
          {/* Play all button */}
          {revealedLines.length > 1 && (
            <button
              onClick={playAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all"
              style={{ backgroundColor: ORANGE, color: "#fff" }}
            >
              <Play className="w-4 h-4" />
              Play All
            </button>
          )}
        </div>
      </div>

      {/* Dialogue area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-gray-50">
        {lines.map((line, index) => {
          const isRevealed = revealedLines.includes(index);
          const isActive = index === currentLine;
          const side = getSpeakerSide(line.speaker);
          const speakerIdx = getSpeakerIndex(line.speaker);
          const avatar = getAvatar(line.speaker, line.speakerType, speakerIdx);
          const isSpeaking = speakingIndex === index;

          if (!isRevealed) return null;

          const isNavySide = side === 'right';

          return (
            <div
              key={index}
              className={`flex items-end gap-2 ${
                side === 'right' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0 shadow-md transition-transform ${
                  isSpeaking ? 'scale-110' : ''
                }`}
                style={{ backgroundColor: avatar.bg }}
              >
                {avatar.emoji}
              </div>

              {/* Message bubble */}
              <div
                className={`max-w-[78%] rounded-2xl shadow-sm transition-all ${
                  isActive ? 'ring-2 ring-offset-2' : ''
                } ${isSpeaking ? 'scale-[1.02]' : ''}`}
                style={{
                  background: isNavySide ? navyGradient : '#ffffff',
                  borderRadius: side === 'right' ? '1rem 1rem 0.25rem 1rem' : '1rem 1rem 1rem 0.25rem',
                  ringColor: isActive ? ORANGE : 'transparent',
                }}
              >
                <div className="px-4 py-3">
                  {/* Speaker name + Audio button */}
                  <div className="flex items-center justify-between mb-1">
                    <p
                      className="text-xs font-semibold"
                      style={{ color: isNavySide ? 'rgba(255,255,255,0.7)' : '#6b7280' }}
                    >
                      {line.speaker}
                    </p>
                    
                    {/* Audio button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        speak(line.text, index);
                      }}
                      className={`p-1.5 rounded-full flex-shrink-0 transition-all ${
                        isSpeaking ? 'scale-110' : 'hover:scale-110'
                      }`}
                      style={{
                        backgroundColor: isSpeaking 
                          ? ORANGE 
                          : isNavySide 
                            ? 'rgba(255,255,255,0.2)' 
                            : 'rgba(0,0,0,0.05)',
                      }}
                    >
                      <Volume2
                        className={`w-4 h-4 ${isSpeaking ? 'animate-pulse' : ''}`}
                        style={{ color: isNavySide || isSpeaking ? '#ffffff' : '#6b7280' }}
                      />
                    </button>
                  </div>

                  {/* French text */}
                  <p
                    className="font-medium text-base"
                    style={{ color: isNavySide ? '#ffffff' : '#111827' }}
                  >
                    {line.text}
                  </p>

                  {/* Translation (tap to reveal) */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleTranslation(index);
                    }}
                    className="mt-2 text-sm text-left w-full"
                    style={{ color: isNavySide ? orangeLight : ORANGE }}
                  >
                    {showTranslation.has(index) ? (
                      <span>{line.translation}</span>
                    ) : (
                      <span className="italic" style={{ opacity: 0.8 }}>
                        ↳ Tap to see translation
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        <div className="h-4" />
      </div>

      {/* Bottom controls */}
      <div className="px-4 py-4 border-t border-gray-100 bg-white">
        {!isComplete ? (
          <Button onClick={handleNext} className="w-full gap-2">
            Next Line
            <ChevronRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button onClick={onComplete} className="w-full">
            Continue
          </Button>
        )}
        
        {/* Progress indicator */}
        <div className="flex justify-center gap-1.5 mt-3">
          {lines.map((_, index) => (
            <div
              key={index}
              className="w-2 h-2 rounded-full transition-all"
              style={{
                backgroundColor: revealedLines.includes(index)
                  ? index === currentLine
                    ? ORANGE
                    : 'rgba(249, 115, 22, 0.4)'
                  : '#d1d5db',
                transform: index === currentLine ? 'scale(1.3)' : 'scale(1)',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
