// src/components/exercises/speak-exercise.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, MicOff, Volume2, RotateCcw, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui";

interface SpeakExerciseProps {
  exercise: {
    id: string;
    question: string;
    content: {
      targetText: string;
      targetTranslation?: string;
      acceptableVariants?: string[];
    };
    hint?: string;
    explanation?: string;
  };
  language?: string;
  onSubmit: (correct: boolean, userAnswer?: any, correctAnswer?: any) => void;
  onMicStart?: () => void; // ← new: called when mic activates (for sound)
  disabled?: boolean;
}

export default function SpeakExercise({
  exercise,
  language = "fr-FR",
  onSubmit,
  onMicStart,
  disabled,
}: SpeakExerciseProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const recognitionRef = useRef<any>(null);
  const { content } = exercise;
  const targetText = content.targetText || "";

  // Reset when exercise changes
  useEffect(() => {
    setTranscript("");
    setSubmitted(false);
    setIsCorrect(false);
    setIsListening(false);
    if (recognitionRef.current) recognitionRef.current.abort();
  }, [exercise.id]);

  // Setup speech recognition
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = language;

    recognition.onresult = (event: any) => {
      const results = event.results;
      const latest = results[results.length - 1];
      setTranscript(latest[0].transcript);
    };

    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognitionRef.current = recognition;
    return () => recognition.abort();
  }, [language]);

  const playTarget = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(targetText);
    const voices = window.speechSynthesis.getVoices();
    const langVoice = voices.find((v) => v.lang.startsWith(language.split("-")[0]));
    if (langVoice) utterance.voice = langVoice;
    utterance.lang = language;
    utterance.rate = 0.85;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const startListening = () => {
    if (!recognitionRef.current || isListening) return;
    setTranscript("");
    setIsListening(true);
    onMicStart?.(); // ← trigger mic_on sound in parent
    recognitionRef.current.start();
  };

  const stopListening = () => {
    if (!recognitionRef.current) return;
    recognitionRef.current.stop();
    setIsListening(false);
  };

  const compareText = (spoken: string, target: string): boolean => {
    const normalize = (t: string) =>
      t.toLowerCase().replace(/[.,!?;:'"]/g, "").replace(/\s+/g, " ").trim();
    const ns = normalize(spoken);
    const nt = normalize(target);
    if (ns === nt) return true;
    if (content.acceptableVariants) {
      for (const v of content.acceptableVariants) {
        if (ns === normalize(v)) return true;
      }
    }
    return calculateSimilarity(ns, nt) >= 0.8;
  };

  const calculateSimilarity = (s1: string, s2: string): number => {
    const w1 = s1.split(" ");
    const w2 = s2.split(" ");
    let matches = 0;
    for (const w of w1) if (w2.includes(w)) matches++;
    return matches / Math.max(w1.length, w2.length);
  };

  const handleSubmit = () => {
    if (!transcript.trim()) return;
    const correct = compareText(transcript, targetText);
    setIsCorrect(correct);
    setSubmitted(true);
    // 1st call — records result, shows inline feedback, does NOT advance
    onSubmit(correct, transcript, targetText);
  };

  const handleRetry = () => {
    setTranscript("");
    setSubmitted(false);
    setIsCorrect(false);
  };

  if (!isSupported) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">{exercise.question}</h3>
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
          <p className="text-yellow-800">
            😔 Speech recognition is not supported in your browser. Please try Chrome or Edge.
          </p>
        </div>
        <Button onClick={() => onSubmit(true)} className="w-full">Skip this exercise</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Question */}
      <h3 className="text-lg font-semibold text-gray-900">{exercise.question}</h3>

      {/* Target phrase */}
      <div className="p-4 rounded-xl" style={{ background: "linear-gradient(135deg, #0f2744, #0a1e35)" }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white font-medium text-lg">{targetText}</p>
            {content.targetTranslation && (
              <p className="text-white/70 text-sm mt-1">{content.targetTranslation}</p>
            )}
          </div>
          <button
            onClick={playTarget}
            disabled={isSpeaking}
            className="p-3 bg-white/20 hover:bg-white/30 rounded-full transition-all"
          >
            <Volume2 className={`w-5 h-5 text-white ${isSpeaking ? "animate-pulse" : ""}`} />
          </button>
        </div>
      </div>

      {/* Mic area */}
      {!submitted && (
        <div className="flex flex-col items-center py-6">
          {/* Mic button */}
          <button
            onClick={isListening ? stopListening : startListening}
            disabled={disabled}
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-lg ${
              isListening
                ? "bg-red-500 scale-110 shadow-red-200 shadow-xl"
                : "bg-primary hover:bg-primary/90 hover:scale-105"
            }`}
            style={
              isListening
                ? { animation: "mic-pulse 1s ease-in-out infinite" }
                : {}
            }
          >
            {isListening ? (
              <MicOff className="w-8 h-8 text-white" />
            ) : (
              <Mic className="w-8 h-8 text-white" />
            )}
          </button>

          {/* Listening ring animation */}
          {isListening && (
            <div className="absolute w-24 h-24 rounded-full border-4 border-red-400 opacity-50 animate-ping pointer-events-none" />
          )}

          <p className="text-sm text-gray-500 mt-4">
            {isListening ? "🎙️ Listening... Tap to stop" : "Tap to speak"}
          </p>

          {/* Live transcript */}
          {transcript && (
            <div className="mt-4 p-3 bg-gray-100 rounded-xl w-full text-center">
              <p className="text-gray-500 text-xs mb-1">You said:</p>
              <p className="text-gray-900 font-medium">{transcript}</p>
            </div>
          )}
        </div>
      )}

      {/* Result feedback */}
      {submitted && (
        <div
          className={`p-4 rounded-xl border-2 ${
            isCorrect ? "bg-green-50 border-green-300" : "bg-red-50 border-red-300"
          }`}
        >
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-full flex-shrink-0 ${isCorrect ? "bg-green-100" : "bg-red-100"}`}>
              {isCorrect ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : (
                <XCircle className="w-6 h-6 text-red-600" />
              )}
            </div>
            <div className="flex-1">
              <p className={`font-bold ${isCorrect ? "text-green-800" : "text-red-800"}`}>
                {isCorrect ? "Great pronunciation! 🎉" : "Not quite right"}
              </p>
              <p className={`text-sm mt-1 ${isCorrect ? "text-green-700" : "text-red-700"}`}>
                You said: &quot;{transcript}&quot;
              </p>

              {/* Show correct answer on wrong */}
              {!isCorrect && (
                <div className="mt-2 bg-white rounded-lg px-3 py-2 border border-red-200">
                  <p className="text-xs text-gray-500 mb-0.5">Correct answer:</p>
                  <p className="text-green-700 font-semibold text-sm">&quot;{targetText}&quot;</p>
                </div>
              )}

              {/* Hint */}
              {exercise.hint && !isCorrect && (
                <p className="text-xs text-gray-500 italic mt-2">💡 {exercise.hint}</p>
              )}

              {/* Explanation */}
              {exercise.explanation && !isCorrect && (
                <p className="text-xs text-blue-700 mt-1 bg-blue-50 rounded px-2 py-1">
                  📖 {exercise.explanation}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Hint before submission */}
      {exercise.hint && !submitted && (
        <p className="text-sm text-gray-500 italic">💡 {exercise.hint}</p>
      )}

      {/* Actions */}
      {!submitted ? (
        <Button onClick={handleSubmit} disabled={!transcript.trim() || disabled} className="w-full">
          Check Pronunciation
        </Button>
      ) : (
        <div className="flex gap-3">
          <Button onClick={handleRetry} variant="outline" className="flex-1 gap-2">
            <RotateCcw className="w-4 h-4" />
            Try Again
          </Button>
          {/* 2nd call — advances to next exercise */}
          <Button onClick={() => onSubmit(isCorrect, transcript, targetText)} className="flex-1">
            Continue
          </Button>
        </div>
      )}

      <style>{`
        @keyframes mic-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.4); }
          50% { box-shadow: 0 0 0 16px rgba(239,68,68,0); }
        }
      `}</style>
    </div>
  );
}