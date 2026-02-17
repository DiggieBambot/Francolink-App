// src/components/tutor/students-list.tsx
'use client';

import { useState } from 'react';
import { 
  Search, 
  Trophy, 
  Flame, 
  BookOpen,
  Calendar,
  ChevronRight,
  Star,
  Mail,
  UserPlus,
  Copy,
  Check,
  User
} from 'lucide-react';

interface Student {
  id: string;
  name: string | null;
  email: string;
  avatar_url: string | null;
  total_xp: number | null;
  current_streak: number | null;
  current_level: string | null;
  last_activity_date: string | null;
  subscription_plan: string | null;
  created_at: string;
}

interface StudentsListProps {
  students: Student[];
  inviteLink: string | null;
}

export function StudentsList({ students, inviteLink }: StudentsListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'xp' | 'streak' | 'recent'>('xp');
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    if (inviteLink) {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const filteredStudents = students
    .filter(student => 
      student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'xp':
          return (b.total_xp || 0) - (a.total_xp || 0);
        case 'streak':
          return (b.current_streak || 0) - (a.current_streak || 0);
        case 'recent':
          return new Date(b.last_activity_date || 0).getTime() - 
                 new Date(a.last_activity_date || 0).getTime();
        default:
          return 0;
      }
    });

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const today = new Date();
    const diffDays = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getLevelColor = (level: string | null) => {
    switch (level) {
      case 'C2':
      case 'C1': return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300';
      case 'B2':
      case 'B1': return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
      case 'A2':
      case 'A1': 
      default: return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
    }
  };

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search students..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-2">
          {[
            { id: 'xp', label: 'Top XP', icon: Trophy },
            { id: 'streak', label: 'Best Streak', icon: Flame },
            { id: 'recent', label: 'Recent', icon: Calendar }
          ].map((option) => (
            <button
              key={option.id}
              onClick={() => setSortBy(option.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                sortBy === option.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <option.icon className="w-4 h-4" />
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Students List */}
      {filteredStudents.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <UserPlus className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="font-medium text-gray-900 dark:text-white mb-2">
            {students.length === 0 ? 'No students yet' : 'No students found'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
            {students.length === 0 
              ? 'Share your invite link to get students!'
              : 'Try a different search term'}
          </p>
          {inviteLink && students.length === 0 && (
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy Invite Link'}
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredStudents.map((student, index) => (
              <div 
                key={student.id}
                className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  {/* Rank */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    index === 0 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' :
                    index === 1 ? 'bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-300' :
                    index === 2 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300' :
                    'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                  }`}>
                    {index + 1}
                  </div>

                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg overflow-hidden">
                    {student.avatar_url ? (
                      <img src={student.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      student.name?.charAt(0) || student.email.charAt(0).toUpperCase()
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-medium text-gray-900 dark:text-white truncate">
                        {student.name || 'Unnamed Student'}
                      </h3>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getLevelColor(student.current_level)}`}>
                        {student.current_level || 'A1'}
                      </span>
                      {student.subscription_plan && student.subscription_plan !== 'FREE' && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300 rounded-full">
                          ⭐ Premium
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {student.email}
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="hidden md:flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <div className="flex items-center gap-1 text-purple-600 dark:text-purple-400">
                        <Trophy className="w-4 h-4" />
                        <span className="font-semibold">{(student.total_xp || 0).toLocaleString()}</span>
                      </div>
                      <span className="text-gray-400 dark:text-gray-500 text-xs">XP</span>
                    </div>
                    
                    <div className="text-center">
                      <div className="flex items-center gap-1 text-orange-500">
                        <Flame className="w-4 h-4" />
                        <span className="font-semibold">{student.current_streak || 0}</span>
                      </div>
                      <span className="text-gray-400 dark:text-gray-500 text-xs">streak</span>
                    </div>
                    
                    <div className="text-center min-w-[80px]">
                      <span className="text-gray-600 dark:text-gray-300 font-medium">
                        {formatDate(student.last_activity_date)}
                      </span>
                      <span className="text-gray-400 dark:text-gray-500 text-xs block">last active</span>
                    </div>
                  </div>

                  {/* Action */}
                  <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors">
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}