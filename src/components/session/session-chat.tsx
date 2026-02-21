// src/components/session/session-chat.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare } from 'lucide-react';
import type { SessionEvent, ChatData } from '@/types/session';

interface SessionChatProps {
  events: SessionEvent[];
  currentUserId: string | undefined;
  onSendMessage: (message: string) => void;
}

export function SessionChat({ events, currentUserId, onSendMessage }: SessionChatProps) {
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedMessage = message.trim();
    if (!trimmedMessage) return;
    
    onSendMessage(trimmedMessage);
    setMessage('');
    inputRef.current?.focus();
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b bg-gray-50">
        <h3 className="font-medium text-gray-900 flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          Chat
        </h3>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {events.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No messages yet</p>
            <p className="text-xs text-gray-400 mt-1">Start the conversation!</p>
          </div>
        ) : (
          events.map((event) => {
            const data = event.data as ChatData;
            const isOwnMessage = event.user_id === currentUserId;
            const isTutor = data.sender_role === 'tutor';

            return (
              <div
                key={event.id}
                className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`}
              >
                {/* Sender Name (not shown for own messages) */}
                {!isOwnMessage && (
                  <span className={`text-xs mb-1 px-1 ${
                    isTutor ? 'text-primary font-medium' : 'text-gray-500'
                  }`}>
                    {data.sender_name}
                    {isTutor && ' (Tutor)'}
                  </span>
                )}
                
                {/* Message Bubble */}
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-2xl ${
                    isOwnMessage
                      ? 'bg-primary text-white rounded-br-md'
                      : isTutor
                      ? 'bg-primary-100 text-primary-900 rounded-bl-md'
                      : 'bg-gray-100 text-gray-900 rounded-bl-md'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {data.message}
                  </p>
                </div>
                
                {/* Timestamp */}
                <span className="text-[10px] text-gray-400 mt-1 px-1">
                  {formatTime(event.created_at)}
                </span>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 border-t bg-white">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 border rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent"
            maxLength={500}
          />
          <button
            type="submit"
            disabled={!message.trim()}
            className="p-2 bg-primary text-white rounded-full hover:bg-primary-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}