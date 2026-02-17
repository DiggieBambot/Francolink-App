// src/hooks/use-session.ts
'use client';

import { useEffect, useState, useCallback } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import type { 
  TutorSession, 
  SessionEvent, 
  EventType,
  ChatData,
  DrawData,
  PageChangeData,
  CursorData 
} from '@/types/session';

export function useSession(sessionId: string) {
  const [session, setSession] = useState<TutorSession | null>(null);
  const [events, setEvents] = useState<SessionEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const supabase = createBrowserClient();

  // Fetch initial session data
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const { data, error } = await supabase
          .from('tutor_sessions')
          .select('*')
          .eq('id', sessionId)
          .single();
        
        if (error) throw error;
        if (data) setSession(data);
      } catch (err) {
        console.error('Error fetching session:', err);
        setError('Failed to load session');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSession();
  }, [sessionId, supabase]);

  // Fetch initial events
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const { data, error } = await supabase
          .from('session_events')
          .select('*')
          .eq('session_id', sessionId)
          .order('created_at', { ascending: true });
        
        if (error) throw error;
        if (data) setEvents(data);
      } catch (err) {
        console.error('Error fetching events:', err);
      }
    };

    fetchEvents();
  }, [sessionId, supabase]);

  // Subscribe to real-time changes
  useEffect(() => {
    const channel = supabase
      .channel(`session:${sessionId}`)
      // Listen to session updates (page changes, status changes)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tutor_sessions',
          filter: `id=eq.${sessionId}`
        },
        (payload) => {
          console.log('Session updated:', payload);
          setSession(payload.new as TutorSession);
        }
      )
      // Listen to new events (chat, drawings, cursor)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'session_events',
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          console.log('New event:', payload);
          setEvents((prev) => [...prev, payload.new as SessionEvent]);
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });

    return () => {
      console.log('Cleaning up realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [sessionId, supabase]);

  // Send a new event
  const sendEvent = useCallback(async (
    eventType: EventType, 
    data: ChatData | DrawData | PageChangeData | CursorData
  ) => {
    try {
      const { error } = await supabase.from('session_events').insert({
        session_id: sessionId,
        event_type: eventType,
        data
      });
      
      if (error) throw error;
    } catch (err) {
      console.error('Error sending event:', err);
    }
  }, [sessionId, supabase]);

  // Update current page
  const updatePage = useCallback(async (page: number) => {
    try {
      const { error } = await supabase
        .from('tutor_sessions')
        .update({ current_page: page })
        .eq('id', sessionId);
      
      if (error) throw error;
      
      // Also send a page_change event
      await sendEvent('page_change', { page });
    } catch (err) {
      console.error('Error updating page:', err);
    }
  }, [sessionId, supabase, sendEvent]);

  // Update session status
  const updateStatus = useCallback(async (status: TutorSession['status']) => {
    try {
      const updates: Partial<TutorSession> = { status };
      
      if (status === 'active' && !session?.started_at) {
        updates.started_at = new Date().toISOString();
      }
      if (status === 'completed' && !session?.ended_at) {
        updates.ended_at = new Date().toISOString();
      }
      
      const { error } = await supabase
        .from('tutor_sessions')
        .update(updates)
        .eq('id', sessionId);
      
      if (error) throw error;
    } catch (err) {
      console.error('Error updating status:', err);
    }
  }, [sessionId, session, supabase]);

  return { 
    session, 
    events, 
    isLoading, 
    error,
    sendEvent, 
    updatePage, 
    updateStatus 
  };
}