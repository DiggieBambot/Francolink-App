// src/app/(tutor)/tutor/lessons/page.tsx

import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { BookOpen, Clock, Users, FileText } from 'lucide-react';

export default async function TutorLessonsPage() {
  const supabase = await createClient();

  // Fetch all available lessons (from drafts that are ready)
  const { data: drafts } = await supabase
    .from('lesson_drafts')
    .select('*')
    .eq('status', 'review')
    .order('created_at', { ascending: false });

  // Group by category
  const lessonsByCategory = drafts?.reduce((acc, draft) => {
    const category = draft.category || 'uncategorized';
    if (!acc[category]) acc[category] = [];
    acc[category].push(draft);
    return acc;
  }, {} as Record<string, typeof drafts>);

  const categoryLabels: Record<string, string> = {
    daily_conversations: '💬 Daily Conversations',
    business: '💼 Business French',
    travel_culture: '✈️ Travel & Culture',
    kids: '🧒 French for Kids',
    grammar: '📝 Grammar',
    vocabulary: '📚 Vocabulary',
    uncategorized: '📁 Other',
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Lesson Library</h1>
        <p className="text-muted-foreground mt-1">
          Browse lessons and view teaching materials
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="p-4 bg-card border border-border rounded-lg">
          <div className="flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <div>
              <div className="text-2xl font-bold">{drafts?.length || 0}</div>
              <div className="text-sm text-muted-foreground">Total Lessons</div>
            </div>
          </div>
        </div>
        <div className="p-4 bg-card border border-border rounded-lg">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-green-600" />
            <div>
              <div className="text-2xl font-bold">
                {Object.keys(lessonsByCategory || {}).length}
              </div>
              <div className="text-sm text-muted-foreground">Categories</div>
            </div>
          </div>
        </div>
        <div className="p-4 bg-card border border-border rounded-lg">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-purple-600" />
            <div>
              <div className="text-2xl font-bold">
                {drafts?.reduce((acc, d) => acc + (d.content?.estimatedMinutes || 0), 0)} min
              </div>
              <div className="text-sm text-muted-foreground">Total Content</div>
            </div>
          </div>
        </div>
      </div>

      {/* Lessons by Category */}
      {lessonsByCategory && Object.keys(lessonsByCategory).length > 0 ? (
        <div className="space-y-8">
          {Object.entries(lessonsByCategory).map(([category, lessons]) => (
            <div key={category}>
              <h2 className="text-xl font-semibold text-foreground mb-4">
                {categoryLabels[category] || category}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {lessons?.map((lesson) => {
                  const content = lesson.content as any;
                  return (
                    <Link
                      key={lesson.id}
                      href={`/tutor/lessons/${lesson.id}`}
                      className="p-5 bg-card border border-border rounded-lg hover:border-foreground/20 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <span className={`
                          text-xs px-2 py-1 rounded-full font-medium
                          ${lesson.level === 'A1' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : ''}
                          ${lesson.level === 'A2' || lesson.level === 'B1' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : ''}
                          ${lesson.level === 'B2' || lesson.level === 'C1' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' : ''}
                        `}>
                          {lesson.level}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {content?.pageCount || 0} pages
                        </span>
                      </div>

                      <h3 className="font-semibold text-foreground mb-2 line-clamp-2">
                        {content?.title?.en || content?.title?.fr || lesson.original_file_name}
                      </h3>

                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {content?.subtitle?.en || content?.subtitle?.fr || 'No description'}
                      </p>

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {content?.estimatedMinutes || 15} min
                        </span>
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-3 h-3" />
                          {content?.vocabulary?.length || 0} words
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-card border border-border rounded-lg">
          <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No lessons available yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Lessons will appear here after admin uploads them
          </p>
        </div>
      )}
    </div>
  );
}