// src/app/(tutor)/tutor/sessions/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSession } from '@/hooks/use-session';
import { createBrowserClient } from '@/lib/supabase/client';
import { SessionHeader } from '@/components/session/session-header';
import { SessionViewer } from '@/components/session/session-viewer';
import { SessionChat } from '@/components/session/session-chat';
import { SessionControls } from '@/components/session/session-controls';
import type { ChatData } from '@/types/session';

interface Props {
  params: { id: string };
}

export default function SessionRoomPage({ params }: Props) {
  const { session, events, isLoading, sendEvent, updatePage, updateStatus } = useSession(params.id);
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
      }
    };
    getUser();
  }, [supabase]);

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
      sender_name: currentUser.profile.full_name || 'Anonymous',
      sender_role: currentUser.profile.role === 'TUTOR' ? 'tutor' : 'student'
    };
    
    await sendEvent('chat', chatData);
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Session Not Found</h2>
          <p className="text-gray-500">This session may have been deleted or you don't have access.</p>
        </div>
      </div>
    );
  }

  const isTutor = currentUser?.profile?.role === 'TUTOR';
  const chatEvents = events.filter(e => e.event_type === 'chat');
  const drawEvents = events.filter(e => e.event_type === 'draw');
  const cursorEvents = events.filter(e => e.event_type === 'cursor');

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <SessionHeader 
        session={session}
        isTutor={isTutor}
        onStatusChange={updateStatus}
        onToggleChat={() => setIsChatOpen(!isChatOpen)}
        isChatOpen={isChatOpen}
      />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Viewer Area */}
        <div className="flex-1 flex flex-col">
          {/* Controls - Only for Tutor */}
          {isTutor && (
            <SessionControls 
              session={session}
              onPageChange={updatePage}
              onClearCanvas={() => sendEvent('clear_canvas', { 
                cleared_by: currentUser?.profile?.full_name,
                timestamp: new Date().toISOString()
              })}
            />
          )}
          
          {/* PDF Viewer with Whiteboard */}
          <SessionViewer 
            session={session}
            pdfUrl={pdfUrl}
            drawEvents={drawEvents}
            cursorEvents={cursorEvents}
            currentUserId={currentUser?.id}
            isTutor={isTutor}
            onDraw={(data) => sendEvent('draw', data)}
            onCursorMove={(data) => sendEvent('cursor', data)}
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