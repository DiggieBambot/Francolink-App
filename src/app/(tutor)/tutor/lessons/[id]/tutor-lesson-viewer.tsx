// src/app/(tutor)/tutor/lessons/[id]/tutor-lesson-viewer.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Eye,
  EyeOff,
  BookOpen,
  Languages,
  Video,
  Download,
  Maximize2,
  GraduationCap,
  AlertCircle,
  CheckCircle2,
  Users,
  Lightbulb,
  Target
} from 'lucide-react';
import {
  HtmlLessonContent,
  isHtmlContent,
  getTranslation,
  SupportedLanguage
} from '@/types/lesson-content';

interface Student {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
}

interface TutorLessonViewerProps {
  lesson: {
    id: string;
    original_file_name: string;
    category: string;
    level: string;
    content: any;
  };
  students: Student[];
}

export function TutorLessonViewer({ lesson, students }: TutorLessonViewerProps) {
  const router = useRouter();
  const content = lesson.content as HtmlLessonContent;

  const [uiLanguage, setUiLanguage] = useState<SupportedLanguage>('en');
  const [showTeacherNotes, setShowTeacherNotes] = useState(true);
  const [showAnswers, setShowAnswers] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [isStartingSession, setIsStartingSession] = useState(false);

  const isHtml = content?.type === 'html';

  // Start live session
  const handleStartSession = async () => {
    if (!selectedStudent) {
      alert('Please select a student');
      return;
    }

    setIsStartingSession(true);

    try {
      const response = await fetch('/api/tutor/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: selectedStudent,
          lessonId: lesson.id,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        router.push(`/tutor/sessions/${data.sessionId}`);
      } else {
        alert(data.error || 'Failed to start session');
      }
    } catch (error) {
      console.error('Start session error:', error);
      alert('Failed to start session');
    } finally {
      setIsStartingSession(false);
    }
  };

  if (!content) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No content available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/tutor/lessons"
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {getTranslation(content.title, uiLanguage) || lesson.original_file_name}
            </h1>
            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
              <span className="capitalize">{lesson.category.replace('_', ' ')}</span>
              <span>•</span>
              <span>{lesson.level}</span>
              <span>•</span>
              <span>{content.estimatedMinutes} min</span>
              <span>•</span>
              <span>{content.pageCount} pages</span>
            </div>
          </div>
        </div>

        {/* Language Selector */}
        <div className="flex items-center gap-2 px-3 py-1.5 border border-border rounded-lg">
          <Languages className="w-4 h-4 text-muted-foreground" />
          <select
            value={uiLanguage}
            onChange={(e) => setUiLanguage(e.target.value as SupportedLanguage)}
            className="bg-transparent text-sm font-medium border-none outline-none cursor-pointer"
          >
            {content.availableLanguages?.map(lang => (
              <option key={lang} value={lang}>
                {lang === 'fr' ? '🇫🇷 FR' :
                 lang === 'en' ? '🇬🇧 EN' :
                 lang === 'de' ? '🇩🇪 DE' :
                 lang === 'es' ? '🇪🇸 ES' :
                 lang === 'ar' ? '🇸🇦 AR' : lang.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Start Session Card */}
      <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Video className="w-5 h-5 text-green-600 dark:text-green-400" />
            <div>
              <h3 className="font-semibold text-green-900 dark:text-green-100">
                Start Live Session
              </h3>
              <p className="text-sm text-green-700 dark:text-green-300">
                Teach this lesson with a student in real-time
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              className="px-3 py-2 border border-green-300 dark:border-green-700 rounded-lg bg-white dark:bg-green-900 text-sm"
            >
              <option value="">Select student...</option>
              {students.map(student => (
                <option key={student.id} value={student.id}>
                  {student.name || student.email}
                </option>
              ))}
            </select>
            <button
              onClick={handleStartSession}
              disabled={!selectedStudent || isStartingSession}
              className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isStartingSession ? (
                <span>Starting...</span>
              ) : (
                <>
                  <Video className="w-4 h-4" />
                  Start
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Toggle Controls */}
      <div className="flex gap-3">
        <button
          onClick={() => setShowTeacherNotes(!showTeacherNotes)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
            showTeacherNotes
              ? 'bg-primary-100 dark:bg-primary-900 border-primary-300 dark:border-primary-700 text-primary-800 dark:text-primary-200'
              : 'bg-background border-border text-muted-foreground hover:text-foreground'
          }`}
        >
          {showTeacherNotes ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          Teacher Notes
        </button>
        <button
          onClick={() => setShowAnswers(!showAnswers)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
            showAnswers
              ? 'bg-purple-100 dark:bg-purple-900 border-purple-300 dark:border-purple-700 text-purple-800 dark:text-purple-200'
              : 'bg-background border-border text-muted-foreground hover:text-foreground'
          }`}
        >
          {showAnswers ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          Answer Keys
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content - PDF Viewer */}
        <div className="lg:col-span-2">
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="p-3 border-b border-border flex items-center justify-between bg-muted/50">
              <span className="text-sm text-muted-foreground">
                Lesson Content
              </span>
              <div className="flex gap-2">
                {isHtml && content.pdfUrl && (
                  <>
                    <a
                      href={content.pdfUrl}
                      download
                      className="p-2 hover:bg-muted rounded-lg transition-colors"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => window.open(content.pdfUrl, '_blank')}
                      className="p-2 hover:bg-muted rounded-lg transition-colors"
                      title="Open in new tab"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {isHtml && content.pdfUrl ? (
              <iframe
                src={`${content.pdfUrl}#toolbar=0&navpanes=0`}
                className="w-full"
                style={{ height: '70vh', minHeight: '500px' }}
                title="Lesson Content"
              />
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                No PDF content available
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - Teacher Notes & Info */}
        <div className="space-y-6">
          {/* Learning Objectives */}
          {content.objectives && content.objectives.length > 0 && (
            <div className="p-4 bg-card border border-border rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">Objectives</h3>
              </div>
              <ul className="space-y-2">
                {content.objectives.map((obj, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">{getTranslation(obj, uiLanguage)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Teacher Notes (Toggleable) */}
          {showTeacherNotes && content.tutorNotes && (
            <div className="p-4 bg-primary-50 dark:bg-primary-900 border border-primary-200 dark:border-primary-800 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <GraduationCap className="w-5 h-5 text-primary dark:text-primary-400" />
                <h3 className="font-semibold text-primary-900 dark:text-primary-100">Teacher Notes</h3>
              </div>

              {content.tutorNotes.overview && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-primary-800 dark:text-primary-200 mb-1">Overview</h4>
                  <p className="text-sm text-primary dark:text-primary-300">
                    {getTranslation(content.tutorNotes.overview, uiLanguage)}
                  </p>
                </div>
              )}

              {content.tutorNotes.commonMistakes && content.tutorNotes.commonMistakes.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-primary-800 dark:text-primary-200 mb-2 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    Common Mistakes
                  </h4>
                  <ul className="space-y-1">
                    {content.tutorNotes.commonMistakes.map((mistake, idx) => (
                      <li key={idx} className="text-sm text-primary dark:text-primary-300 pl-4 border-l-2 border-primary-300 dark:border-primary">
                        {getTranslation(mistake, uiLanguage)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {content.tutorNotes.extensionActivities && content.tutorNotes.extensionActivities.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-primary-800 dark:text-primary-200 mb-2 flex items-center gap-1">
                    <Lightbulb className="w-4 h-4" />
                    Extension Activities
                  </h4>
                  <ul className="space-y-1">
                    {content.tutorNotes.extensionActivities.map((activity, idx) => (
                      <li key={idx} className="text-sm text-primary dark:text-primary-300 pl-4 border-l-2 border-primary-300 dark:border-primary">
                        {getTranslation(activity, uiLanguage)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Vocabulary with Answers */}
          {content.vocabulary && content.vocabulary.length > 0 && (
            <div className="p-4 bg-card border border-border rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold text-foreground">
                  Vocabulary ({content.vocabulary.length})
                </h3>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {content.vocabulary.map((item, idx) => (
                  <div key={idx} className="p-2 bg-background rounded border border-border">
                    <div className="font-medium text-foreground">{item.term}</div>
                    <div className="text-sm text-muted-foreground">
                      {getTranslation(item.translation, uiLanguage)}
                    </div>
                    {item.pronunciation && (
                      <div className="text-xs text-muted-foreground italic">
                        [{item.pronunciation}]
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Exercises with Answers (Toggleable) */}
          {content.exercises && content.exercises.length > 0 && (
            <div className="p-4 bg-card border border-border rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-foreground">
                  Exercises ({content.exercises.length})
                </h3>
              </div>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {content.exercises.map((exercise, idx) => (
                  <div key={idx} className="p-2 bg-background rounded border border-border">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs px-2 py-0.5 bg-muted rounded-full capitalize">
                        {exercise.type.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-muted-foreground">Page {exercise.pageNumber}</span>
                    </div>
                    <div className="text-sm text-foreground">{exercise.question}</div>
                    {showAnswers && (
                      <div className="mt-2 p-2 bg-green-50 dark:bg-green-950 rounded text-sm text-green-800 dark:text-green-200">
                        <span className="font-medium">Answer: </span>
                        {exercise.answer}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}