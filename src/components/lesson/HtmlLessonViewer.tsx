// src/components/lesson/HtmlLessonViewer.tsx

'use client';

import { useState } from 'react';
import { HtmlLessonContent, SupportedLanguage } from '@/types/lesson-content';
import { ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import { getTranslation } from '@/types/lesson-content';

interface HtmlLessonViewerProps {
  content: HtmlLessonContent;
  userLanguage?: SupportedLanguage;
  onComplete?: () => void;
}

export function HtmlLessonViewer({ 
  content, 
  userLanguage = 'en',
  onComplete 
}: HtmlLessonViewerProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const totalPages = content.pages.length;

  const handleNext = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (onComplete) {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const currentPageData = content.pages[currentPage];

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          {getTranslation(content.title, userLanguage)}
        </h1>
        {content.subtitle && (
          <p className="text-lg text-muted-foreground">
            {getTranslation(content.subtitle, userLanguage)}
          </p>
        )}
        
        {/* Objectives */}
        {content.objectives && content.objectives.length > 0 && (
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                Learning Objectives
              </h3>
            </div>
            <ul className="list-disc list-inside space-y-1 text-sm text-blue-800 dark:text-blue-200">
              {content.objectives.map((obj, idx) => (
                <li key={idx}>{getTranslation(obj, userLanguage)}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Page Content */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 mb-6">
        <div className="relative">
          {/* Page Image */}
          <img
            src={currentPageData.imageUrl}
            alt={`Page ${currentPage + 1}`}
            className="w-full h-auto rounded-lg"
            style={{
              maxHeight: '80vh',
              objectFit: 'contain',
            }}
          />
          
          {/* Page Number Indicator */}
          <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
            {currentPage + 1} / {totalPages}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={handlePrevious}
          disabled={currentPage === 0}
          className="flex items-center gap-2 px-6 py-3 rounded-lg bg-background border border-border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>Previous</span>
        </button>

        {/* Progress Dots */}
        <div className="flex gap-2">
          {content.pages.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentPage(idx)}
              className={`w-2 h-2 rounded-full transition-all ${
                idx === currentPage 
                  ? 'bg-foreground w-8' 
                  : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
              }`}
              aria-label={`Go to page ${idx + 1}`}
            />
          ))}
        </div>

        <button
          onClick={handleNext}
          className="flex items-center gap-2 px-6 py-3 rounded-lg bg-foreground text-background hover:bg-foreground/90 transition-colors"
        >
          <span>{currentPage === totalPages - 1 ? 'Complete' : 'Next'}</span>
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}