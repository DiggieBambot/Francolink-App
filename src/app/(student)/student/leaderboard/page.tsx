// src/app/(student)/student/leaderboard/page.tsx
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Trophy, Medal, Flame, TrendingUp, Crown } from 'lucide-react';

export default async function StudentLeaderboardPage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }

  // Get current user profile
  const { data: currentProfile } = await supabase
    .from('users')
    .select('id, name, total_xp, current_streak, avatar_url, referred_by_tutor_id')
    .eq('id', user.id)
    .single();

  // Get leaderboard - students of the same tutor
  let leaderboardQuery = supabase
    .from('users')
    .select('id, name, email, total_xp, current_streak, avatar_url, current_level')
    .not('total_xp', 'is', null)
    .order('total_xp', { ascending: false })
    .limit(50);

  // If student has a tutor, show classmates
  if (currentProfile?.referred_by_tutor_id) {
    leaderboardQuery = leaderboardQuery.eq('referred_by_tutor_id', currentProfile.referred_by_tutor_id);
  }

  const { data: leaderboard } = await leaderboardQuery;

  // Find current user's rank
  const currentUserRank = leaderboard?.findIndex(u => u.id === user.id) ?? -1;

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 0:
        return (
          <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
            <Crown className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
          </div>
        );
      case 1:
        return (
          <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
            <Medal className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </div>
        );
      case 2:
        return (
          <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
            <Medal className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 font-bold">
            {rank + 1}
          </div>
        );
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Leaderboard</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          {currentProfile?.referred_by_tutor_id 
            ? 'See how you rank among your classmates'
            : 'Top French learners this week'}
        </p>
      </div>

      {/* Current User Card */}
      {currentUserRank >= 0 && (
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 mb-8 text-white">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold overflow-hidden">
              {currentProfile?.avatar_url ? (
                <img src={currentProfile.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                currentProfile?.name?.charAt(0) || 'Y'
              )}
            </div>
            <div className="flex-1">
              <p className="text-blue-100 text-sm">Your Rank</p>
              <p className="text-3xl font-bold">#{currentUserRank + 1}</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 justify-end mb-1">
                <Trophy className="w-5 h-5" />
                <span className="text-2xl font-bold">{currentProfile?.total_xp || 0}</span>
              </div>
              <p className="text-blue-100 text-sm">Total XP</p>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Top Learners
          </h2>
        </div>

        {leaderboard && leaderboard.length > 0 ? (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {leaderboard.map((learner, index) => {
              const isCurrentUser = learner.id === user.id;
              return (
                <div 
                  key={learner.id}
                  className={`p-4 flex items-center gap-4 transition-colors ${
                    isCurrentUser 
                      ? 'bg-blue-50 dark:bg-blue-900/20' 
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  {/* Rank Badge */}
                  {getRankBadge(index)}

                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold overflow-hidden">
                    {learner.avatar_url ? (
                      <img src={learner.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      learner.name?.charAt(0) || learner.email?.charAt(0).toUpperCase()
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-medium truncate ${
                      isCurrentUser 
                        ? 'text-blue-600 dark:text-blue-400' 
                        : 'text-gray-900 dark:text-white'
                    }`}>
                      {learner.name || 'Anonymous'}
                      {isCurrentUser && ' (You)'}
                    </h3>
                    <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                      <span>{learner.current_level || 'A1'}</span>
                      <span className="flex items-center gap-1">
                        <Flame className="w-4 h-4 text-orange-500" />
                        {learner.current_streak || 0} day streak
                      </span>
                    </div>
                  </div>

                  {/* XP */}
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {(learner.total_xp || 0).toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">XP</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center">
            <Trophy className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No learners on the leaderboard yet</p>
          </div>
        )}
      </div>
    </div>
  );
}