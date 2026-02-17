// src/types/session.ts

export type SessionStatus = 'scheduled' | 'active' | 'completed' | 'cancelled';
export type EventType = 'chat' | 'draw' | 'page_change' | 'cursor' | 'clear_canvas';

export interface TutorSession {
  id: string;
  tutor_id: string;
  lesson_id: string | null;
  title: string;
  scheduled_at: string | null;
  started_at: string | null;
  ended_at: string | null;
  status: SessionStatus;
  current_page: number;
  created_at: string;
  updated_at: string;
}

export interface SessionParticipant {
  session_id: string;
  student_id: string;
  joined_at: string;
  left_at: string | null;
}

export interface SessionEvent {
  id: string;
  session_id: string;
  user_id: string;
  event_type: EventType;
  data: ChatData | DrawData | PageChangeData | CursorData | ClearCanvasData;
  created_at: string;
}

// Event data types
export interface ChatData {
  message: string;
  sender_name: string;
  sender_role: 'tutor' | 'student';
}

export interface DrawData {
  points: Array<{ x: number; y: number }>;
  color: string;
  width: number;
  tool: 'pen' | 'highlighter' | 'eraser';
}

export interface PageChangeData {
  page: number;
  total_pages?: number;
}

export interface CursorData {
  x: number;
  y: number;
  page: number;
}

export interface ClearCanvasData {
  cleared_by: string;
  timestamp: string;
}

// Extended session with participants
export interface SessionWithParticipants extends TutorSession {
  participants: SessionParticipant[];
  participant_count: number;
}