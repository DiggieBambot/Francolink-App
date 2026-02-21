// src/app/(student)/student/practice/page.tsx
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { 
  BookOpen, 
  Brain, 
  Headphones, 
  Pen, 
  MessageSquare,
  ChevronRight,
  Star,
  Clock,
  Target,
  Zap
} from 'lucide-react';

export default async function StudentPracticePage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }

  // Get student profile
  const { data: profile } = await supabase
    .from('users')
    .select('current_level, total_xp, current_streak')
    .eq('id', user.id)
    .single();

  const practiceCategories = [
    {
      id: 'vocabulary',
      title: 'Vocabulary',
      description: 'Learn and review words',
      icon: BookOpen,
      color: 'blue',
      xpReward: 10,
      exercises: 24
    },
    {
      id: 'grammar',
      title: 'Grammar',
      description: 'Master French grammar rules',
      icon: Brain,
      color: 'purple',
      xpReward: 15,
      exercises: 18
    },
    {
      id: 'listening',
      title: 'Listening',
      description: 'Improve comprehension',
      icon: Headphones,
      color: 'green',
      xpReward: 20,
      exercises: 12
    },
    {
      id: 'writing',
      title: 'Writing',
      description: 'Practice writing French',
      icon: Pen,
      color: 'orange',
      xpReward: 25,
      exercises: 10
    },
    {
      id: 'conversation',
      title: 'Conversation',
      description: 'Practice speaking scenarios',
      icon: MessageSquare,
      color: 'pink',
      xpReward: 30,
      exercises: 8
    }
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'bg-primary-100 dark:bg-primary-900 text-primary dark:text-primary-400 border-primary-200 dark:border-primary-800',
      purple: 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800',
      green: 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800',
      orange: 'bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800',
      pink: 'bg-pink-100 dark:bg-pink-900 text-pink-600 dark:text-pink-400 border-pink-200 dark:border-pink-800'
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Practice</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Strengthen your French skills with exercises
        </p>
      </div>

      {/* Daily Goal Banner */}
      <div className="bg-gradient-to-r from-primary to-primary-600 rounded-xl p-6 mb-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold mb-2">Daily Practice Goal</h2>
            <p className="text-primary-100">Complete 3 exercises to maintain your streak!</p>
          </div>
          <div className="text-center">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-6 h-6" />
              <span className="text-3xl font-bold">{profile?.current_streak || 0}</span>
            </div>
            <p className="text-sm text-primary-100">day streak</p>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex justify-between text-sm mb-1">
            <span>Progress today</span>
            <span>0/3 exercises</span>
          </div>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-white rounded-full w-0 transition-all" />
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Star className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total XP</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {(profile?.total_xp || 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <Target className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Current Level</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {profile?.current_level || 'A1'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
              <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Today's Time</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">0 min</p>
            </div>
          </div>
        </div>
      </div>

      {/* Practice Categories */}
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        Choose a category
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {practiceCategories.map((category) => {
          const Icon = category.icon;
          return (
            <Link
              key={category.id}
              href={`/student/practice/${category.id}`}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all group"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${getColorClasses(category.color)}`}>
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-primary dark:group-hover:text-primary-400 transition-colors">
                {category.title}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                {category.description}
              </p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">
                  {category.exercises} exercises
                </span>
                <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400 font-medium">
                  +{category.xpReward} XP
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}