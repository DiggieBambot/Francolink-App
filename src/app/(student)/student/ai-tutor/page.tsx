"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Send,
  Bot,
  Clock,
  Sparkles,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Crown,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isPlaying?: boolean;
}

interface UsageData {
  hasAccess: boolean;
  plan: string;
  minutesUsed: number;
  dailyLimit: number;
  remainingMinutes: number;
  isPrivileged: boolean;
}

export default function AITutorPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [usageLoading, setUsageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);

  const fetchUsage = useCallback(async () => {
    try {
      const res = await fetch("/api/ai-tutor/usage");
      if (res.ok) {
        const data = await res.json();
        setUsage(data);
      }
    } catch (err) {
      console.error("Failed to fetch AI usage:", err);
    } finally {
      setUsageLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = "fr-FR";

        recognition.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((result: any) => result[0].transcript)
            .join("");
          setInput(transcript);
        };

        recognition.onend = () => {
          setIsRecording(false);
        };

        recognition.onerror = () => {
          setIsRecording(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      setError("Speech recognition is not supported in your browser.");
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      setInput("");
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  const speakText = (text: string, messageId: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    // Stop any current speech
    window.speechSynthesis.cancel();

    if (isSpeaking) {
      setIsSpeaking(false);
      setMessages((prev) =>
        prev.map((m) => ({ ...m, isPlaying: false }))
      );
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "fr-FR";
    utterance.rate = 0.9;
    utterance.pitch = 1;

    // Try to find a French voice
    const voices = window.speechSynthesis.getVoices();
    const frenchVoice = voices.find(
      (v) => v.lang.startsWith("fr") && v.name.includes("Female")
    ) || voices.find((v) => v.lang.startsWith("fr"));
    if (frenchVoice) utterance.voice = frenchVoice;

    utterance.onstart = () => {
      setIsSpeaking(true);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, isPlaying: true } : { ...m, isPlaying: false }
        )
      );
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setMessages((prev) =>
        prev.map((m) => ({ ...m, isPlaying: false }))
      );
    };

    synthRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  };

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    setError(null);
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmed,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }

    try {
      const apiMessages = [...messages, userMessage].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("/api/ai-tutor/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.code === "LIMIT_REACHED") {
          setError(data.error);
          setUsage((prev) =>
            prev ? { ...prev, remainingMinutes: 0, minutesUsed: data.minutesUsed } : prev
          );
        } else if (data.code === "NO_ACCESS") {
          setError(data.error);
        } else {
          setError(data.error || "Something went wrong. Please try again.");
        }
        return;
      }

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.reply,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Auto-speak the response
      if (autoSpeak && data.reply) {
        setTimeout(() => speakText(data.reply, assistantMessage.id), 300);
      }

      if (data.remainingMinutes !== undefined) {
        setUsage((prev) =>
          prev
            ? {
                ...prev,
                minutesUsed: data.minutesUsed,
                remainingMinutes: data.remainingMinutes,
              }
            : prev
        );
      }
    } catch (err) {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const isLimitReached = usage && !usage.isPrivileged && usage.remainingMinutes <= 0;
  const noAccess = usage && !usage.hasAccess;

  // Loading state
  if (usageLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-3" />
          <p className="text-gray-500">Loading AI Tutor...</p>
        </div>
      </div>
    );
  }

  // No access (free user)
  if (noAccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Crown className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Premium Feature</h1>
          <p className="text-gray-600 mb-6">
            The AI Tutor is available with Premium and Premium Plus plans. Practice
            conversations, get instant corrections, and improve your skills with
            AI-powered tutoring.
          </p>
          <div className="space-y-3">
            <div className="bg-gray-50 rounded-xl p-4 text-left">
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium text-gray-900">Premium</span>
                <span className="text-primary font-bold">15 min/day</span>
              </div>
              <p className="text-sm text-gray-500">Daily AI tutor practice sessions</p>
            </div>
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-left">
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium text-gray-900">Premium Plus</span>
                <span className="text-primary font-bold">60 min/day</span>
              </div>
              <p className="text-sm text-gray-500">Extended AI tutor sessions + priority</p>
            </div>
          </div>
          <div className="mt-6 space-y-2">
            <Link
              href="/upgrade-plus"
              className="block w-full bg-primary text-white font-medium py-3 rounded-xl hover:bg-primary/90 transition-colors text-center"
            >
              Upgrade Now
            </Link>
            <Link
              href="/dashboard"
              className="block w-full text-gray-500 hover:text-gray-700 py-2 text-sm text-center"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const displayLimit = usage?.isPrivileged
    ? "Unlimited"
    : usage?.dailyLimit === Infinity
    ? "Unlimited"
    : `${usage?.remainingMinutes} / ${usage?.dailyLimit} min`;

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center">
                  <img
                    src="/images/ai-tutor-avatar.svg"
                    alt="AI Tutor"
                    className="w-9 h-9 object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                      (e.target as HTMLImageElement).parentElement!.innerHTML =
                        '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-primary"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>';
                    }}
                  />
                </div>
                <div>
                  <h1 className="font-bold text-gray-900 text-sm">AI Tutor</h1>
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                    Online
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Auto-speak toggle */}
              <button
                onClick={() => setAutoSpeak(!autoSpeak)}
                className={`p-2 rounded-lg transition-colors ${
                  autoSpeak ? "bg-primary/10 text-primary" : "bg-gray-100 text-gray-400"
                }`}
                title={autoSpeak ? "Auto-speak on" : "Auto-speak off"}
              >
                {autoSpeak ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>

              {/* Usage indicator */}
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-gray-400" />
                <span
                  className={`font-medium ${
                    usage && !usage.isPrivileged && usage.remainingMinutes <= 3
                      ? "text-red-600"
                      : "text-gray-900"
                  }`}
                >
                  {displayLimit}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <div className="w-20 h-20 rounded-full overflow-hidden mx-auto mb-4 bg-primary/10 flex items-center justify-center">
                <img
                  src="/images/ai-tutor-avatar.svg"
                  alt="AI Tutor"
                  className="w-20 h-20 object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Start a Conversation
              </h2>
              <p className="text-gray-500 max-w-sm mx-auto mb-2">
                Practice your language skills with your AI tutor. Type or use the
                microphone to speak!
              </p>
              <p className="text-xs text-gray-400 mb-6">
                🎤 Tap the mic to speak &nbsp;·&nbsp; 🔊 Responses are read aloud automatically
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {[
                  "Bonjour! Comment allez-vous?",
                  "Help me practice ordering food",
                  "Can we do a role-play?",
                  "Explain the past tense",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => {
                      setInput(suggestion);
                      inputRef.current?.focus();
                    }}
                    className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                    <img
                      src="/images/ai-tutor-avatar.svg"
                      alt="AI"
                      className="w-8 h-8 object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                        (e.target as HTMLImageElement).parentElement!.innerHTML =
                          '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-primary"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>';
                      }}
                    />
                  </div>
                )}
                <div className="max-w-[80%]">
                  <div
                    className={`rounded-2xl px-4 py-3 ${
                      msg.role === "user"
                        ? "bg-primary text-white rounded-br-md"
                        : "bg-white border border-gray-200 text-gray-900 rounded-bl-md shadow-sm"
                    }`}
                  >
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">
                      {msg.content}
                    </p>
                  </div>
                  <div className={`flex items-center gap-2 mt-1 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <p className="text-xs text-gray-400">
                      {msg.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    {msg.role === "assistant" && (
                      <button
                        onClick={() => speakText(msg.content, msg.id)}
                        className={`p-1 rounded transition-colors ${
                          msg.isPlaying
                            ? "text-primary bg-primary/10"
                            : "text-gray-400 hover:text-gray-600"
                        }`}
                        title="Listen"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                {msg.role === "user" && (
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0 mt-1 overflow-hidden">
                    <img
                      src="/api/auth/avatar"
                      alt="You"
                      className="w-8 h-8 object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                        (e.target as HTMLImageElement).parentElement!.innerHTML =
                          '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-gray-500"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';
                      }}
                    />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                  <img
                    src="/images/ai-tutor-avatar.svg"
                    alt="AI"
                    className="w-8 h-8 object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-red-50 border-t border-red-200 px-4 py-3">
          <div className="max-w-3xl mx-auto flex items-center gap-2 text-sm text-red-700">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <p className="flex-1">{error}</p>
            {isLimitReached && (
              <Link
                href="/upgrade-plus"
                className="text-primary font-medium hover:underline whitespace-nowrap"
              >
                Upgrade
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="bg-white border-t border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-end gap-2">
            {/* Microphone button */}
            <button
              onClick={toggleRecording}
              disabled={!!isLimitReached}
              className={`p-3 rounded-xl transition-all flex-shrink-0 ${
                isRecording
                  ? "bg-red-500 text-white animate-pulse"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              title={isRecording ? "Stop recording" : "Start speaking"}
            >
              {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            <textarea
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={
                isLimitReached
                  ? "Daily limit reached. Upgrade for more time!"
                  : isRecording
                  ? "Listening..."
                  : "Type or speak a message..."
              }
              disabled={isLoading || !!isLimitReached}
              rows={1}
              className="flex-1 resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50 disabled:bg-gray-50"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading || !!isLimitReached}
              className="p-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2 text-center">
            🎤 Speak or type · 🔊 Auto-read is {autoSpeak ? "on" : "off"} · AI may make mistakes
          </p>
        </div>
      </div>
    </div>
  );
}
