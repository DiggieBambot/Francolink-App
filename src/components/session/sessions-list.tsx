// src/components/session/sessions-list.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Plus, 
  Video, 
  Calendar, 
  Users, 
  Play, 
  Clock,
  CheckCircle,
  XCircle,
  MoreVertical,
  Trash2
} from 'lucide-react';
import { CreateSessionModal } from './create-session-modal';
import type { TutorSession } from '@/types/session';

interface SessionWithDetails extends TutorSession {
  lessons?: { id: string; title: string } | null;
  participant_count: number;
}

interface SessionsListProps {
  sessions: SessionWithDetails[];
}

const statusConfig = {
  scheduled: { 
    label: 'Scheduled', 
    icon: Clock, 
    color: 'text-yellow-600 bg-yellow-50' 
  },
  active: { 
    label: 'Live', 
    icon: Play, 
    color: 'text-green-600 bg-green-50' 
  },
  completed: { 
    label: 'Completed', 
    icon: CheckCircle, 
    color: 'text-primary bg-primary-50' 
  },
  cancelled: { 
    label: 'Cancelled', 
    icon: XCircle, 
    color: 'text-gray-600 bg-gray-50' 
  }
};

export function SessionsList({ sessions }: SessionsListProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState<string>('all');

  const filteredSessions = sessions.filter(session => {
    if (filter === 'all') return true;
    return session.status === filter;
  });

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not scheduled';
    return new Date(dateString).toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  };

  const handleDelete = async (sessionId: string) => {
    if (!confirm('Are you sure you want to delete this session?')) return;
    
    try {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        window.location.reload();
      }
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Live Sessions</h1>
          <p className="text-gray-500 mt-1">
            Manage your teaching sessions
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-800 transition-colors"
        >
          <Plus className="w-5 h-5" />
          New Session
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {['all', 'scheduled', 'active', 'completed'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === status
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Sessions Grid */}
      {filteredSessions.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <Video className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No sessions yet
          </h3>
          <p className="text-gray-500 mb-4">
            Create your first session to start teaching!
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-800"
          >
            Create Session
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredSessions.map((session) => {
            const status = statusConfig[session.status];
            const StatusIcon = status.icon;
            
            return (
              <div
                key={session.id}
                className="bg-white border rounded-xl p-4 hover:shadow-md transition-shadow"
              >
                {/* Status Badge */}
                <div className="flex items-center justify-between mb-3">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
                    <StatusIcon className="w-3.5 h-3.5" />
                    {status.label}
                  </span>
                  <button
                    onClick={() => handleDelete(session.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Title */}
                <h3 className="font-semibold text-gray-900 mb-2">
                  {session.title}
                </h3>

                {/* Lesson */}
                {session.lessons && (
                  <p className="text-sm text-gray-500 mb-2">
                    📚 {session.lessons.title}
                  </p>
                )}

                {/* Details */}
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {formatDate(session.scheduled_at)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {session.participant_count}
                  </span>
                </div>

                {/* Action Button */}
                <Link
                  href={`/tutor/sessions/${session.id}`}
                  className={`block w-full text-center py-2 rounded-lg font-medium transition-colors ${
                    session.status === 'active'
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : session.status === 'scheduled'
                      ? 'bg-primary text-white hover:bg-primary-800'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {session.status === 'active' 
                    ? 'Join Live' 
                    : session.status === 'scheduled'
                    ? 'Start Session'
                    : 'View Details'}
                </Link>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      <CreateSessionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
}