// src/app/(tutor)/tutor/lessons/[id]/page.tsx

import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { TutorLessonViewer } from './tutor-lesson-viewer';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function TutorLessonPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch lesson
  const { data: lesson, error } = await supabase
    .from('lesson_drafts')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !lesson) {
    notFound();
  }

  // Fetch tutor's students for session dropdown
  const { data: students } = await supabase
    .from('tutor_students')
    .select(`
      student:users!student_id(id, name, email, avatar_url)
    `)
    .eq('tutor_id', user?.id)
    .eq('status', 'active');

  return (
    <TutorLessonViewer
      lesson={lesson}
      students={students?.map(s => s.student) || []}
    />
  );
}