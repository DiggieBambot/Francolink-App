// src/components/lesson/lesson-viewer.tsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Languages,
  CheckCircle2,
  Star,
  Download,
  Volume2,
  GraduationCap
} from 'lucide-react';
import { 
  LessonContent, 
  HtmlLessonContent, 
  isHtmlContent, 
  getTranslation, 
  SupportedLanguage 
} from '@/types/lesson-content';

interface LessonViewerProps {
  lesson: {
    id: string;
    title: string;
    slug: string;
    content: LessonContent;
    xp_reward: number;
    is_premium: boolean;
  };
  user: {
    id: string;
    native_language?: string;
    total_xp: number;
  };
  language: string;
  level: string;
}

export function LessonViewer({ lesson, user, language, level }: LessonViewerProps) {
  const router = useRouter();
  const content = lesson.content;
  
  // Determine user's preferred UI language
  const getPreferredLanguage = (): SupportedLanguage => {
    const native = user.native_language?.toLowerCase();
    if (native === 'english') return 'en';
    if (native === 'german') return 'de';
    if (native === 'spanish') return 'es';
    if (native === 'arabic') return 'ar';
    return 'en'; // default
  };
  
  const [uiLanguage, setUiLanguage] = useState<SupportedLanguage>(getPreferredLanguage());
  const [isCompleting, setIsCompleting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  // Handle lesson completion
  const handleComplete = async () => {
    setIsCompleting(true);
    
    try {
      const response = await fetch('/api/lessons/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId: lesson.id }),
      });

      if (response.ok) {
        setIsCompleted(true);
      }
    } catch (error) {
      console.error('Failed to complete lesson:', error);
    } finally {
      setIsCompleting(false);
    }
  };

  // Check if content is HTML type (with PDF)
  const isHtml = isHtmlContent(content);

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href={`/learn/${language}/${level}`}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="font-semibold text-foreground truncate max-w-md">
                {getTranslation(content.title, uiLanguage) || lesson.title}
              </h1>
              <div className="text-sm text-muted-foreground">
                {content.estimatedMinutes} min • {content.targetLevel}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Language Selector */}
            {content.availableLanguages && content.availableLanguages.length > 1 && (
              <div className="flex items-center gap-2 px-3 py-1.5 border border-border rounded-lg">
                <Languages className="w-4 h-4 text-muted-foreground" />
                <select
                  value={uiLanguage}
                  onChange={(e) => setUiLanguage(e.target.value as SupportedLanguage)}
                  className="bg-transparent text-sm font-medium border-none outline-none cursor-pointer"
                >
                  {content.availableLanguages.map(lang => (
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
            )}

            {/* XP Reward */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-50 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300 rounded-lg">
              <Star className="w-4 h-4" />
              <span className="text-sm font-medium">+{lesson.xp_reward} XP</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Learning Objectives */}
        {content.objectives && content.objectives.length > 0 && (
          <div className="mb-6 p-4 bg-primary-50 dark:bg-primary-900 border border-primary-200 dark:border-primary-800 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-5 h-5 text-primary dark:text-primary-400" />
              <h2 className="font-semibold text-primary-900 dark:text-primary-100">
                {uiLanguage === 'fr' ? 'Objectifs d\'apprentissage' :
                 uiLanguage === 'de' ? 'Lernziele' :
                 uiLanguage === 'es' ? 'Objetivos de aprendizaje' :
                 'Learning Objectives'}
              </h2>
            </div>
            <ul className="space-y-2">
              {content.objectives.map((obj, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-primary-800 dark:text-primary-200">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{getTranslation(obj, uiLanguage)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* PDF Viewer for HTML Content */}
        {isHtml && (content as HtmlLessonContent).pdfUrl && (
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            {/* PDF Controls */}
            <div className="p-3 border-b border-border flex items-center justify-between bg-muted/50">
              <span className="text-sm text-muted-foreground">
                {(content as HtmlLessonContent).pageCount} pages
              </span>
              <div className="flex gap-2">
                <a
                  href={(content as HtmlLessonContent).pdfUrl}
                  download
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                  title="Download"
                >
                  <Download className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Embedded PDF */}
            <iframe
              src={`${(content as HtmlLessonContent).pdfUrl}#toolbar=0&navpanes=0`}
              className="w-full"
              style={{ height: 'calc(100vh - 300px)', minHeight: '500px' }}
              title="Lesson Content"
            />
          </div>
        )}

        {/* Vocabulary Section */}
        {isHtml && (content as HtmlLessonContent).vocabulary && 
         (content as HtmlLessonContent).vocabulary!.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <GraduationCap className="w-6 h-6" />
              {uiLanguage === 'fr' ? 'Vocabulaire' :
               uiLanguage === 'de' ? 'Vokabeln' :
               uiLanguage === 'es' ? 'Vocabulario' :
               'Vocabulary'}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(content as HtmlLessonContent).vocabulary!.map((item, idx) => (
                <div 
                  key={idx} 
                  className="p-4 bg-card border border-border rounded-lg hover:border-foreground/20 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-semibold text-foreground">{item.term}</div>
                    <button className="p-1 hover:bg-muted rounded transition-colors">
                      <Volume2 className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {getTranslation(item.translation, uiLanguage)}
                  </div>
                  {item.pronunciation && (
                    <div className="text-xs text-muted-foreground mt-1 italic">
                      [{item.pronunciation}]
                    </div>
                  )}
                  {item.partOfSpeech && (
                    <div className="mt-2">
                      <span className="text-xs px-2 py-0.5 bg-muted rounded-full">
                        {item.partOfSpeech}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Complete Button */}
        <div className="mt-8 flex justify-center">
          {isCompleted ? (
            <div className="flex items-center gap-3 px-6 py-3 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-lg">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-medium">
                {uiLanguage === 'fr' ? 'Leçon terminée !' :
                 uiLanguage === 'de' ? 'Lektion abgeschlossen!' :
                 uiLanguage === 'es' ? '¡Lección completada!' :
                 'Lesson Complete!'}
              </span>
              <span className="font-bold">+{lesson.xp_reward} XP</span>
            </div>
          ) : (
            <button
              onClick={handleComplete}
              disabled={isCompleting}
              className="px-8 py-3 bg-foreground text-background rounded-lg font-medium hover:bg-foreground/90 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {isCompleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-background"></div>
                  <span>Completing...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>
                    {uiLanguage === 'fr' ? 'Terminer la leçon' :
                     uiLanguage === 'de' ? 'Lektion abschließen' :
                     uiLanguage === 'es' ? 'Completar lección' :
                     'Mark as Complete'}
                  </span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Next Lesson Navigation */}
        <div className="mt-8 flex justify-between">
          <Link
            href={`/learn/${language}/${level}`}
            className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Course</span>
          </Link>
        </div>
      </main>
    </div>
  );
}