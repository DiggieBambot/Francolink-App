'use client';

import { useState, useEffect } from 'react';
import { Check, Copy, AlertCircle } from 'lucide-react';

interface InviteBoxProps {
  inviteCode: string;
}

export function InviteBox({ inviteCode }: InviteBoxProps) {
  const [copied, setCopied] = useState(false);
  const [fullLink, setFullLink] = useState('');
  const [displayLink, setDisplayLink] = useState('');

  useEffect(() => {
    // Get the actual origin (e.g., http://localhost:3000 or https://francolink.com)
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    
    // Set the full link for copying/linking
    setFullLink(`${origin}/join/${inviteCode}`);
    
    // Set a nicer display link (remove http://)
    const displayHost = origin.replace(/^https?:\/\//, '');
    setDisplayLink(`${displayHost}/join/${inviteCode}`);
  }, [inviteCode]);

  const handleCopy = async () => {
    if (!fullLink) return;
    
    try {
      await navigator.clipboard.writeText(fullLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="bg-gradient-to-br from-primary to-primary-800 rounded-xl p-6 text-white shadow-lg h-full">
      <h2 className="text-xl font-bold mb-2">Grow Your Class</h2>
      <p className="mb-6 opacity-90 text-sm">
        Share your unique invite link with students. When they join and upgrade, 
        you earn 10% monthly commission.
      </p>
      
      <div className="bg-white/10 backdrop-blur rounded-lg p-3 flex items-center gap-3 mb-4 border border-white/20">
        <code className="font-mono text-xs sm:text-sm truncate flex-1 text-primary-50 h-5">
          {displayLink || 'Loading...'}
        </code>
        <button 
          onClick={handleCopy}
          disabled={!fullLink}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-primary rounded-md text-xs font-bold hover:bg-primary-50 transition-all active:scale-95 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3" />
              Copied
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              Copy
            </>
          )}
        </button>
      </div>
      
      <div className="text-xs opacity-75 flex items-start gap-2 bg-black/20 p-3 rounded-lg">
        <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
        <span>Commission applies to Student Premium ($9.99) & Premium+ ($19.99) plans.</span>
      </div>
    </div>
  );
}