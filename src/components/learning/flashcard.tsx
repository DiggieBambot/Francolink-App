// src/components/learning/flashcard.tsx
"use client";

import { useState, useEffect } from "react";
import { Volume2, Lightbulb } from "lucide-react";

interface FlashcardProps {
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
  language?: string;
  level?: string;
}

export default function Flashcard({
  term,
  translation,
  pronunciation,
  partOfSpeech,
  gender,
  exampleSentence,
  tip,
  image,
  language = "fr-FR",
  level = "A1",
}: FlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Load voices on mount (needed for some browsers)
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    
    const loadVoices = () => {
      window.speechSynthesis.getVoices();
    };
    
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const speak = (text: string) => {
    if (typeof window === "undefined") return;
    
    if (!("speechSynthesis" in window)) {
      alert("Sorry, your browser doesn't support text-to-speech.");
      return;
    }
    
    try {
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();
      const langVoice = voices.find(v => v.lang.startsWith(language.split('-')[0]));
      
      if (langVoice) utterance.voice = langVoice;
      
      utterance.lang = language;
      utterance.rate = 0.85;
      utterance.pitch = 1;
      utterance.volume = 1;
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error("TTS error:", error);
      setIsSpeaking(false);
    }
  };

  const handleFlip = () => setIsFlipped(!isFlipped);
  
  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    speak(term);
  };
  
  const handleSpeakExample = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (exampleSentence) speak(exampleSentence.original);
  };

  // Level-aware colors
  const levelMap: Record<string, { gradient: string; accent: string; accentLight: string }> = {
    A1: { gradient: "linear-gradient(135deg, #1e3a6e, #1a3060)", accent: "#3B82F6", accentLight: "#93C5FD" },
    A2: { gradient: "linear-gradient(135deg, #0e3a45, #0a2d38)", accent: "#06B6D4", accentLight: "#67E8F9" },
    B1: { gradient: "linear-gradient(135deg, #3d2e00, #2e2200)", accent: "#F59E0B", accentLight: "#FCD34D" },
    B2: { gradient: "linear-gradient(135deg, #3d1a00, #2e1300)", accent: "#F97316", accentLight: "#FDBA74" },
    C1: { gradient: "linear-gradient(135deg, #3d0000, #2e0000)", accent: "#EF4444", accentLight: "#FCA5A5" },
    C2: { gradient: "linear-gradient(135deg, #2d0a4e, #200739)", accent: "#A855F7", accentLight: "#D8B4FE" },
  };
  const lv = levelMap[level?.toUpperCase()] || levelMap["B2"];
  const navyGradient = lv.gradient;
  const panelBg = "rgba(255,255,255,0.15)";
  const orange = lv.accent;
  const orangeLight = lv.accentLight;

  return (
    <>
      {/* Inline CSS for 3D flip — guaranteed regardless of Tailwind config */}
      <style>{`
        .fc-scene {
          perspective: 1000px;
        }
        .fc-card {
          position: relative;
          width: 100%;
          height: 100%;
          transition: transform 0.5s;
          transform-style: preserve-3d;
        }
        .fc-card.flipped {
          transform: rotateY(180deg);
        }
        .fc-face {
          position: absolute;
          inset: 0;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          border-radius: 1.5rem;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0,0,0,0.25);
        }
        .fc-face-back {
          transform: rotateY(180deg);
        }
      `}</style>

      <div
        className="w-full max-w-sm mx-auto cursor-pointer fc-scene"
        style={{ aspectRatio: "3/4" }}
        onClick={handleFlip}
      >
        <div className={`fc-card ${isFlipped ? "flipped" : ""}`}>

          {/* ══════════════════════════════════════════════════════════ */}
          {/* FRONT — Navy blue background, white text, orange button   */}
          {/* ══════════════════════════════════════════════════════════ */}
          <div
            className="fc-face flex flex-col items-center justify-center p-6"
            style={{ background: navyGradient }}
          >
            {/* Image (only if exists and loads) */}
            {image && !imageError && (
              <div
                className="w-20 h-20 mb-4 rounded-2xl flex items-center justify-center overflow-hidden"
                style={{ background: "rgba(255,255,255,0.2)" }}
              >
                <img
                  src={image}
                  alt={term}
                  className="w-full h-full object-cover"
                  onError={() => setImageError(true)}
                />
              </div>
            )}

            {/* Term — WHITE */}
            <h2
              className="text-3xl md:text-4xl font-bold text-center mb-2"
              style={{ color: "#ffffff" }}
            >
              {term}
            </h2>

            {/* Pronunciation — WHITE (muted) */}
            {pronunciation && (
              <p
                className="text-lg mb-6"
                style={{ color: "rgba(255,255,255,0.75)" }}
              >
                /{pronunciation}/
              </p>
            )}

            {/* Listen button — ORANGE */}
            <button
              onClick={handleSpeak}
              disabled={isSpeaking}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full font-medium text-sm transition-all"
              style={{
                background: orange,
                color: "#ffffff",
                opacity: isSpeaking ? 0.75 : 1,
                transform: isSpeaking ? "scale(0.98)" : "scale(1)",
              }}
            >
              <Volume2 className={`w-5 h-5 ${isSpeaking ? "animate-pulse" : ""}`} />
              {isSpeaking ? "Playing..." : "Listen"}
            </button>

            {/* Tap hint */}
            <p
              className="absolute bottom-6 text-sm"
              style={{ color: "rgba(255,255,255,0.5)" }}
            >
              Tap to flip
            </p>
          </div>

          {/* ══════════════════════════════════════════════════════════ */}
          {/* BACK — Navy blue background                               */}
          {/*   Translation: WHITE                                      */}
          {/*   Part-of-speech badge: ORANGE background                 */}
          {/*   Example sentence: WHITE text                            */}
          {/*   Example translation: WHITE (slightly muted)             */}
          {/*   Tip: ORANGE text                                        */}
          {/* ══════════════════════════════════════════════════════════ */}
          <div
            className="fc-face fc-face-back flex flex-col p-6 overflow-y-auto"
            style={{ background: navyGradient }}
          >
            {/* Translation — WHITE */}
            <div className="text-center mb-4">
              <h2
                className="text-2xl md:text-3xl font-bold mb-2"
                style={{ color: "#ffffff" }}
              >
                {translation}
              </h2>
              
              {/* Part of speech badge — ORANGE */}
              {(partOfSpeech || gender) && (
                <span
                  className="inline-block px-3 py-1 rounded-full text-sm font-medium"
                  style={{ background: orange, color: "#ffffff" }}
                >
                  {partOfSpeech}
                  {gender && ` • ${gender}`}
                </span>
              )}
            </div>

            {/* Divider */}
            <div
              className="w-16 h-0.5 mx-auto my-3"
              style={{ background: "rgba(255,255,255,0.3)" }}
            />

            {/* Example sentence panel */}
            {exampleSentence && (
              <div className="flex-1 flex flex-col justify-center my-3">
                <div
                  className="rounded-2xl p-4"
                  style={{ background: panelBg }}
                >
                  {/* Original sentence — WHITE */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p
                      className="text-base font-medium italic"
                      style={{ color: "#ffffff" }}
                    >
                      &ldquo;{exampleSentence.original}&rdquo;
                    </p>
                    <button
                      onClick={handleSpeakExample}
                      className="p-2 rounded-full flex-shrink-0 transition-opacity hover:opacity-80"
                      style={{ background: "rgba(255,255,255,0.2)" }}
                    >
                      <Volume2 className="w-4 h-4" style={{ color: "#ffffff" }} />
                    </button>
                  </div>
                  
                  {/* Translation — WHITE (slightly muted) */}
                  <p
                    className="text-sm"
                    style={{ color: "rgba(255,255,255,0.8)" }}
                  >
                    &ldquo;{exampleSentence.translation}&rdquo;
                  </p>
                </div>
              </div>
            )}

            {/* Tip panel — ORANGE text */}
            {tip && (
              <div
                className="flex items-start gap-2 rounded-xl p-3 mt-auto"
                style={{ background: panelBg }}
              >
                <Lightbulb
                  className="w-5 h-5 flex-shrink-0 mt-0.5"
                  style={{ color: orangeLight }}
                />
                <p className="text-sm" style={{ color: orangeLight }}>
                  {tip}
                </p>
              </div>
            )}

            {/* Tap hint */}
            <p
              className="text-center text-sm mt-4"
              style={{ color: "rgba(255,255,255,0.5)" }}
            >
              Tap to flip back
            </p>
          </div>

        </div>
      </div>
    </>
  );
}
