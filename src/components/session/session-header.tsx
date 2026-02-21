// src/components/session/session-header.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Play, 
  Square, 
  Users, 
  MessageSquare,
  MessageSquareOff,
  Copy,
  Check,
  Radio
} from 'lucide-react';
import type { TutorSession, SessionStatus } from '@/types/session';

interface SessionHeaderProps {
  session: TutorSession;
  isTutor: boolean;
  onStatusChange: (status: SessionStatus) => void;
  onToggleChat: () => void;
  isChatOpen: boolean;
}

export function SessionHeader({ 
  session, 
  isTutor, 
  onStatusChange, 
  onToggleChat,
  isChatOpen 
}: SessionHeaderProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    const link = `${window.location.origin}/student/sessions/${session.id}`;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStartSession = () => {
    onStatusChange('active');
  };

  const handleEndSession = () => {
    if (confirm('Are you sure you want to end this session?')) {
      onStatusChange('completed');
    }
  };

  const getStatusBadge = () => {
    switch (session.status) {
      case 'active':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            Live
          </span>
        );
      case 'scheduled':
        return (
          <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
            Scheduled
          </span>
        );
      case 'completed':
        return (
          <span className="px-3 py-1 bg-primary-100 text-primary rounded-full text-sm font-medium">
            Completed
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <header className="bg-white border-b px-4 py-3 flex items-center justify-between">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        <Link 
          href="/tutor/sessions"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-gray-900">
              {session.title}
            </h1>
            {getStatusBadge()}
          </div>
          <p className="text-sm text-gray-500">
            Page {session.current_page}
          </p>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2">
        {/* Copy Invite Link - Tutor Only */}
        {isTutor && session.status !== 'completed' && (
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-green-600" />
                <span className="text-green-600">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Invite Link</span>
              </>
            )}
          </button>
        )}

        {/* Toggle Chat */}
        <button
          onClick={onToggleChat}
          className={`p-2 rounded-lg transition-colors ${
            isChatOpen 
              ? 'bg-primary-100 text-primary' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
          title={isChatOpen ? 'Hide Chat' : 'Show Chat'}
        >
          {isChatOpen ? (
            <MessageSquare className="w-5 h-5" />
          ) : (
            <MessageSquareOff className="w-5 h-5" />
          )}
        </button>

        {/* Session Control Buttons - Tutor Only */}
        {isTutor && (
          <>
            {session.status === 'scheduled' && (
              <button
                onClick={handleStartSession}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Play className="w-4 h-4" />
                Start Session
              </button>
            )}
            
            {session.status === 'active' && (
              <button
                onClick={handleEndSession}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Square className="w-4 h-4" />
                End Session
              </button>
            )}
          </>
        )}

        {/* Student View - Session Status */}
        {!isTutor && session.status === 'active' && (
          <span className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg">
            <Radio className="w-4 h-4 animate-pulse" />
            Session in Progress
          </span>
        )}
      </div>
    </header>
  );
}