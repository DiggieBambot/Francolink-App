// src/components/tutor/student-progress-dashboard.tsx
'use client';

import { useState } from 'react';
import { 
  Users, 
  Search, 
  Trophy, 
  Flame, 
  BookOpen,
  TrendingUp,
  Calendar,
  ChevronRight,
  Star
} from 'lucide-react';

interface Student {
  id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
  xp: number;
  level: number;
  streak_days: number;
  lessons_completed: number;
  last_activity_date: string | null;
  created_at: string;
}

interface StudentProgressDashboardProps {
  students: Student[];
}

export function StudentProgressDashboard({ students }: StudentProgressDashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'xp' | 'streak' | 'recent'>('xp');

  const filteredStudents = students
    .filter(student => 
      student.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'xp':
          return b.xp - a.xp;
        case 'streak':
          return b.streak_days - a.streak_days;
        case 'recent':
          return new Date(b.last_activity_date || 0).getTime() - 
                 new Date(a.last_activity_date || 0).getTime();
        default:
          return 0;
      }
    });

  // Calculate stats
  const totalXP = students.reduce((sum, s) => sum + s.xp, 0);
  const avgLevel = students.length > 0 
    ? (students.reduce((sum, s) => sum + s.level, 0) / students.length).toFixed(1)
    : 0;
  const activeToday = students.filter(s => {
    if (!s.last_activity_date) return false;
    const today = new Date().toDateString();
    return new Date(s.last_activity_date).toDateString() === today;
  }).length;
  const totalLessons = students.reduce((sum, s) => sum + s.lessons_completed, 0);

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

  const getLevelBadgeColor = (level: number) => {
    if (level >= 20) return 'bg-purple-100 text-purple-700 border-purple-200';
    if (level >= 10) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    if (level >= 5) return 'bg-primary-100 text-primary border-primary-200';
    return 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getXPForNextLevel = (currentLevel: number) => {
    // Match the formula in the database function
    const currentLevelXP = (currentLevel * (currentLevel - 1) / 2) * 100;
    const nextLevelXP = (currentLevel * (currentLevel + 1) / 2) * 100;
    return nextLevelXP - currentLevelXP;
  };

  const getProgressToNextLevel = (xp: number, level: number) => {
    const currentLevelXP = (level * (level - 1) / 2) * 100;
    const xpInCurrentLevel = xp - currentLevelXP;
    const xpNeeded = getXPForNextLevel(level);
    return Math.min((xpInCurrentLevel / xpNeeded) * 100, 100);
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Students</h1>
        <p className="text-gray-500 mt-1">
          Track your students' progress and engagement
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Total Students</span>
            <Users className="w-5 h-5 text-primary" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{students.length}</p>
        </div>

        <div className="bg-white rounded-xl border p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Active Today</span>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{activeToday}</p>
        </div>

        <div className="bg-white rounded-xl border p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Avg. Level</span>
            <Star className="w-5 h-5 text-yellow-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{avgLevel}</p>
        </div>

        <div className="bg-white rounded-xl border p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Lessons Completed</span>
            <BookOpen className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalLessons}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search students..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-secondary"
          />
        </div>
        <div className="flex gap-2">
          {[
            { id: 'xp', label: 'Top XP', icon: Trophy },
            { id: 'streak', label: 'Best Streak', icon: Flame },
            { id: 'recent', label: 'Recent Activity', icon: Calendar }
          ].map((option) => (
            <button
              key={option.id}
              onClick={() => setSortBy(option.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                sortBy === option.id
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
        <div className="bg-white rounded-xl border p-12 text-center">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="font-medium text-gray-900 mb-2">
            {students.length === 0 ? 'No students yet' : 'No students found'}
          </h3>
          <p className="text-gray-500 text-sm">
            {students.length === 0 
              ? 'Share your invite link to get students!'
              : 'Try a different search term'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="divide-y">
            {filteredStudents.map((student, index) => (
              <div 
                key={student.id}
                className="p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  {/* Rank */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    index === 0 ? 'bg-yellow-100 text-yellow-700' :
                    index === 1 ? 'bg-gray-200 text-gray-700' :
                    index === 2 ? 'bg-orange-100 text-orange-700' :
                    'bg-gray-100 text-gray-500'
                  }`}>
                    {index + 1}
                  </div>

                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary-600 flex items-center justify-center text-white font-semibold text-lg">
                    {student.full_name?.charAt(0) || student.email.charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-gray-900 truncate">
                        {student.full_name || 'Unnamed Student'}
                      </h3>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getLevelBadgeColor(student.level)}`}>
                        Lvl {student.level}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 truncate">{student.email}</p>
                    
                    {/* Progress bar */}
                    <div className="mt-2 w-full max-w-xs">
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>{student.xp.toLocaleString()} XP</span>
                        <span>{getXPForNextLevel(student.level)} XP to next level</span>
                      </div>
                      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-primary to-primary-600 rounded-full transition-all"
                          style={{ width: `${getProgressToNextLevel(student.xp, student.level)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="hidden md:flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <div className="flex items-center gap-1 text-orange-500">
                        <Flame className="w-4 h-4" />
                        <span className="font-semibold">{student.streak_days}</span>
                      </div>
                      <span className="text-gray-400 text-xs">day streak</span>
                    </div>
                    
                    <div className="text-center">
                      <div className="flex items-center gap-1 text-purple-600">
                        <BookOpen className="w-4 h-4" />
                        <span className="font-semibold">{student.lessons_completed}</span>
                      </div>
                      <span className="text-gray-400 text-xs">lessons</span>
                    </div>
                    
                    <div className="text-center min-w-[80px]">
                      <span className="text-gray-600 font-medium">
                        {formatDate(student.last_activity_date)}
                      </span>
                      <span className="text-gray-400 text-xs block">last active</span>
                    </div>
                  </div>

                  {/* Action */}
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
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