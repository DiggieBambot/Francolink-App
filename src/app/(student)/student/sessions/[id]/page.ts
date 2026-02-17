// src/app/(student)/student/sessions/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSession } from '@/hooks/use-session';
import { createBrowserClient } from '@/lib/supabase/client';
import { SessionHeader } from '@/components/session/session-header';
import { SessionViewer } from '@/components/session/session-viewer';
import { SessionChat } from '@/components/session/session-chat';
import type { ChatData } from '@/types/session';

interface Props {
  params: { id: string };
}

export default function StudentSessionPage({ params }: Props) {
  const { session, events, isLoading } = useSession(params.id);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [isChatOpen, setIsChatOpen] = useState(true);
  const supabase = createBrowserClient();

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        setCurrentUser({ ...user, profile });

        // Mark student as joined
        if (session) {
          await supabase
            .from('session_participants')
            .upsert({
              session_id: session.id,
              student_id: user.id,
              joined_at: new Date().toISOString()
            });
        }
      }
    };
    getUser();
  }, [supabase, session]);

  // Fetch lesson PDF URL
  useEffect(() => {
    const fetchLesson = async () => {
      if (!session?.lesson_id) return;
      
      const { data } = await supabase
        .from('lessons')
        .select('pdf_url')
        .eq('id', session.lesson_id)
        .single();
      
      if (data?.pdf_url) {
        setPdfUrl(data.pdf_url);
      }
    };
    
    if (session?.lesson_id) {
      fetchLesson();
    }
  }, [session?.lesson_id, supabase]);

  // Handle sending chat messages
  const handleSendMessage = async (message: string) => {
    if (!currentUser?.profile) return;
    
    const chatData: ChatData = {
      message,
      sender_name: currentUser.profile.full_name || 'Student',
      sender_role: 'student'
    };
    
    // We need sendEvent from useSession
    const { sendEvent } = useSession(params.id);
    await sendEvent('chat', chatData);
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500">Joining session...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Session Not Found</h2>
          <p className="text-gray-500">This session may have ended or you don't have access.</p>
        </div>
      </div>
    );
  }

  if (session.status === 'completed') {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Session Ended</h2>
          <p className="text-gray-500">This session has been completed.</p>
        </div>
      </div>
    );
  }

  if (session.status === 'scheduled') {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Session Not Started</h2>
          <p className="text-gray-500 mb-4">Please wait for your tutor to start the session.</p>
          <div className="animate-pulse flex items-center justify-center gap-2 text-blue-600">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    );
  }

  const chatEvents = events.filter(e => e.event_type === 'chat');
  const drawEvents = events.filter(e => e.event_type === 'draw');
  const cursorEvents = events.filter(e => e.event_type === 'cursor');

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <SessionHeader 
        session={session}
        isTutor={false}
        onStatusChange={() => {}}
        onToggleChat={() => setIsChatOpen(!isChatOpen)}
        isChatOpen={isChatOpen}
      />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Viewer Area - Students can only view, not draw */}
        <div className="flex-1 flex flex-col">
          <SessionViewer 
            session={session}
            pdfUrl={pdfUrl}
            drawEvents={drawEvents}
            cursorEvents={cursorEvents}
            currentUserId={currentUser?.id}
            isTutor={false}
            onDraw={() => {}}
            onCursorMove={() => {}}
          />
        </div>

        {/* Chat Sidebar */}
        {isChatOpen && (
          <div className="w-80 bg-white border-l flex flex-col">
            <SessionChat 
              events={chatEvents}
              currentUserId={currentUser?.id}
              onSendMessage={handleSendMessage}
            />
          </div>
        )}
      </div>
    </div>
  );
}