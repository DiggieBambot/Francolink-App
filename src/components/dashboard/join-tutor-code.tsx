// src/components/dashboard/join-tutor-code.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserPlus, Check, AlertCircle } from 'lucide-react';

interface JoinTutorCodeProps {
  userId?: string;
}

export function JoinTutorCode({ userId }: JoinTutorCodeProps) {
  const router = useRouter();
  const [inviteCode, setInviteCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [showInput, setShowInput] = useState(false);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const code = inviteCode.trim();
    if (!code) {
      setMessage({ type: 'error', text: 'Please enter an invite code' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      // Call the join API
      const response = await fetch('/api/auth/join-tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          code,
          studentId: userId 
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Successfully joined tutor!' });
        setInviteCode('');
        setShowInput(false);
        
        // Refresh the page after 1.5 seconds
        setTimeout(() => {
          router.refresh();
        }, 1500);
      } else {
        setMessage({ 
          type: 'error', 
          text: data.error || 'Failed to join tutor' 
        });
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: 'Something went wrong. Please try again.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!showInput) {
    return (
      <button
        onClick={() => setShowInput(true)}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 bg-white rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
      >
        <UserPlus className="w-4 h-4" />
        <span>I have an invite code</span>
      </button>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-gray-900">Enter Invite Code</h4>
        <button
          onClick={() => {
            setShowInput(false);
            setInviteCode('');
            setMessage(null);
          }}
          className="text-gray-400 hover:text-gray-600 text-sm"
        >
          Cancel
        </button>
      </div>

      <form onSubmit={handleJoin} className="space-y-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
            placeholder="e.g., T_ABC123"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={isLoading}
            autoFocus
          />
          <button
            type="submit"
            disabled={isLoading || !inviteCode.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                <span>Joining...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Join</span>
              </>
            )}
          </button>
        </div>

        {message && (
          <div className={`flex items-start gap-2 p-3 rounded-lg text-sm ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message.type === 'success' ? (
              <Check className="w-4 h-4 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 mt-0.5" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        <p className="text-xs text-gray-500">
          Get this code from your teacher or find a tutor on{' '}
          <a 
            href="https://www.francolink.net/teachers"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            FrancoLink Teachers
          </a>
        </p>
      </form>
    </div>
  );
}