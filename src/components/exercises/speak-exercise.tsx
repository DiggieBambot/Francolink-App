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
      targetText: string;        // What they should say
      targetTranslation?: string; // English translation
      acceptableVariants?: string[]; // Other acceptable answers
    };
    hint?: string;
  };
  language?: string;
  onSubmit: (correct: boolean, userAnswer?: any, correctAnswer?: any) => void;
  disabled?: boolean;
}

export default function SpeakExercise({
  exercise,
  language = "fr-FR",
  onSubmit,
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

  // Check browser support
  useEffect(() => {
    const SpeechRecognition = 
      (window as any).SpeechRecognition || 
      (window as any).webkitSpeechRecognition;
    
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
      const latestResult = results[results.length - 1];
      const transcriptText = latestResult[0].transcript;
      setTranscript(transcriptText);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.abort();
    };
  }, [language]);

  // Play the target text
  const playTarget = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(targetText);
    const voices = window.speechSynthesis.getVoices();
    const langVoice = voices.find(v => v.lang.startsWith(language.split('-')[0]));
    if (langVoice) utterance.voice = langVoice;
    
    utterance.lang = language;
    utterance.rate = 0.85;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    
    window.speechSynthesis.speak(utterance);
  };

  // Start listening
  const startListening = () => {
    if (!recognitionRef.current || isListening) return;
    
    setTranscript("");
    setIsListening(true);
    recognitionRef.current.start();
  };

  // Stop listening
  const stopListening = () => {
    if (!recognitionRef.current) return;
    
    recognitionRef.current.stop();
    setIsListening(false);
  };

  // Compare answers (fuzzy matching)
  const compareText = (spoken: string, target: string): boolean => {
    const normalize = (text: string) => 
      text.toLowerCase()
        .replace(/[.,!?;:'"]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    
    const normalizedSpoken = normalize(spoken);
    const normalizedTarget = normalize(target);
    
    // Exact match
    if (normalizedSpoken === normalizedTarget) return true;
    
    // Check acceptable variants
    if (content.acceptableVariants) {
      for (const variant of content.acceptableVariants) {
        if (normalizedSpoken === normalize(variant)) return true;
      }
    }
    
    // Fuzzy match - allow 80% similarity
    const similarity = calculateSimilarity(normalizedSpoken, normalizedTarget);
    return similarity >= 0.8;
  };

  // Simple similarity calculation
  const calculateSimilarity = (str1: string, str2: string): number => {
    const words1 = str1.split(' ');
    const words2 = str2.split(' ');
    
    let matches = 0;
    for (const word of words1) {
      if (words2.includes(word)) matches++;
    }
    
    return matches / Math.max(words1.length, words2.length);
  };

  // Submit answer
  const handleSubmit = () => {
    if (!transcript.trim()) return;
    
    const correct = compareText(transcript, targetText);
    setIsCorrect(correct);
    setSubmitted(true);
    onSubmit(correct, transcript, targetText);
  };

  // Reset
  const handleRetry = () => {
    setTranscript("");
    setSubmitted(false);
    setIsCorrect(false);
  };

  // Not supported fallback
  if (!isSupported) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {exercise.question}
        </h3>
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
          <p className="text-yellow-800">
            😔 Speech recognition is not supported in your browser. 
            Please try Chrome or Edge for the best experience.
          </p>
        </div>
        <Button onClick={() => onSubmit(true)} className="w-full">
          Skip this exercise
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Question */}
      <h3 className="text-lg font-semibold text-gray-900">
        {exercise.question}
      </h3>

      {/* Target phrase card */}
      <div 
        className="p-4 rounded-xl"
        style={{ background: "linear-gradient(135deg, #0f2744, #0a1e35)" }}
      >
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
            <Volume2 
              className={`w-5 h-5 text-white ${isSpeaking ? 'animate-pulse' : ''}`} 
            />
          </button>
        </div>
      </div>

      {/* Microphone area */}
      {!submitted && (
        <div className="flex flex-col items-center py-6">
          {/* Mic button */}
          <button
            onClick={isListening ? stopListening : startListening}
            disabled={disabled}
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
              isListening 
                ? 'bg-red-500 animate-pulse scale-110' 
                : 'bg-primary hover:bg-primary-600'
            }`}
          >
            {isListening ? (
              <MicOff className="w-8 h-8 text-white" />
            ) : (
              <Mic className="w-8 h-8 text-white" />
            )}
          </button>
          
          <p className="text-sm text-gray-500 mt-3">
            {isListening ? "Listening... Tap to stop" : "Tap to speak"}
          </p>

          {/* Transcript */}
          {transcript && (
            <div className="mt-4 p-3 bg-gray-100 rounded-xl w-full text-center">
              <p className="text-gray-500 text-xs mb-1">You said:</p>
              <p className="text-gray-900 font-medium">{transcript}</p>
            </div>
          )}
        </div>
      )}

      {/* Result */}
      {submitted && (
        <div className={`p-4 rounded-xl ${
          isCorrect ? 'bg-green-50 border-2 border-green-200' : 'bg-red-50 border-2 border-red-200'
        }`}>
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-full ${isCorrect ? 'bg-green-100' : 'bg-red-100'}`}>
              {isCorrect ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : (
                <XCircle className="w-6 h-6 text-red-600" />
              )}
            </div>
            <div>
              <p className={`font-bold ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
                {isCorrect ? "Great pronunciation!" : "Not quite right"}
              </p>
              <p className={`text-sm mt-1 ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                You said: "{transcript}"
              </p>
              {!isCorrect && (
                <p className="text-sm text-green-700 mt-1">
                  Expected: "{targetText}"
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Hint */}
      {exercise.hint && !submitted && (
        <p className="text-sm text-gray-500 italic">💡 {exercise.hint}</p>
      )}

      {/* Actions */}
      {!submitted ? (
        <Button
          onClick={handleSubmit}
          disabled={!transcript.trim() || disabled}
          className="w-full"
        >
          Check Pronunciation
        </Button>
      ) : (
        <div className="flex gap-3">
          <Button
            onClick={handleRetry}
            variant="outline"
            className="flex-1 gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Try Again
          </Button>
          <Button
            onClick={() => onSubmit(isCorrect, transcript, targetText)}
            className="flex-1"
          >
            Continue
          </Button>
        </div>
      )}
    </div>
  );
}
