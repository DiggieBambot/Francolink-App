// src/app/(admin)/admin/content/drafts/[id]/draft-viewer.tsx

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Eye, 
  Code, 
  Book,
  CheckCircle2,
  Download,
  Maximize2,
  Languages
} from 'lucide-react';
import { HtmlLessonContent, isHtmlContent, getTranslation, SupportedLanguage } from '@/types/lesson-content';

interface DraftViewerProps {
  draft: {
    id: string;
    original_file_name: string;
    status: string;
    category: string;
    level: string;
    content?: any;
    tokens_used?: number;
    processing_cost_usd?: number;
    created_at: string;
    processed_at?: string;
  };
}

type ViewMode = 'preview' | 'json' | 'metadata';

export function DraftViewer({ draft }: DraftViewerProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('preview');
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>('en');

  const content = draft.content as HtmlLessonContent;
  
  if (!content) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <p className="text-muted-foreground">No content available</p>
      </div>
    );
  }

  const isHtml = isHtmlContent(content);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/content/drafts"
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {getTranslation(content.title, selectedLanguage) || draft.original_file_name}
            </h1>
            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
              <span className="capitalize">{draft.category.replace('_', ' ')}</span>
              <span>•</span>
              <span>{draft.level}</span>
              <span>•</span>
              <span>{content.pageCount || 0} pages</span>
              {isHtml && (
                <>
                  <span>•</span>
                  <span className="text-green-600 dark:text-green-400">Media Preserved</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Language Selector */}
          {content.availableLanguages && content.availableLanguages.length > 1 && (
            <div className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg">
              <Languages className="w-4 h-4 text-muted-foreground" />
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value as SupportedLanguage)}
                className="bg-transparent text-sm font-medium border-none outline-none cursor-pointer"
              >
                {content.availableLanguages.map(lang => (
                  <option key={lang} value={lang}>
                    {lang.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            className="px-4 py-2 bg-foreground text-background rounded-lg font-medium hover:bg-foreground/90 transition-colors flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            Publish to Course
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="p-4 bg-card border border-border rounded-lg">
          <div className="text-2xl font-bold text-foreground">{content.estimatedMinutes}</div>
          <div className="text-sm text-muted-foreground">Minutes</div>
        </div>
        <div className="p-4 bg-card border border-border rounded-lg">
          <div className="text-2xl font-bold text-foreground">{content.objectives?.length || 0}</div>
          <div className="text-sm text-muted-foreground">Objectives</div>
        </div>
        <div className="p-4 bg-card border border-border rounded-lg">
          <div className="text-2xl font-bold text-foreground">{content.vocabulary?.length || 0}</div>
          <div className="text-sm text-muted-foreground">Vocabulary</div>
        </div>
        <div className="p-4 bg-card border border-border rounded-lg">
          <div className="text-2xl font-bold text-foreground">{content.exercises?.length || 0}</div>
          <div className="text-sm text-muted-foreground">Exercises</div>
        </div>
      </div>

      {/* View Mode Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-4">
          <button
            onClick={() => setViewMode('preview')}
            className={`px-4 py-2 border-b-2 transition-colors flex items-center gap-2 ${
              viewMode === 'preview'
                ? 'border-foreground text-foreground font-medium'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Eye className="w-4 h-4" />
            Preview
          </button>
          <button
            onClick={() => setViewMode('metadata')}
            className={`px-4 py-2 border-b-2 transition-colors flex items-center gap-2 ${
              viewMode === 'metadata'
                ? 'border-foreground text-foreground font-medium'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Book className="w-4 h-4" />
            Metadata
          </button>
          <button
            onClick={() => setViewMode('json')}
            className={`px-4 py-2 border-b-2 transition-colors flex items-center gap-2 ${
              viewMode === 'json'
                ? 'border-foreground text-foreground font-medium'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Code className="w-4 h-4" />
            JSON
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="bg-card border border-border rounded-lg p-6">
        {viewMode === 'preview' && isHtml && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Lesson Preview</h3>
              <div className="flex gap-2">
                <a
                  href={content.pdfUrl}
                  download
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                  title="Download PDF"
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
              </div>
            </div>

            {/* Embedded PDF Viewer */}
            <iframe
              src={`${content.pdfUrl}#toolbar=0&navpanes=0&scrollbar=1`}
              className="w-full rounded-lg border border-border"
              style={{ height: '80vh', minHeight: '600px' }}
              title="Lesson PDF Preview"
            />
          </div>
        )}

        {viewMode === 'metadata' && (
          <div className="space-y-6">
            {/* Objectives */}
            {content.objectives && content.objectives.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Learning Objectives</h3>
                <ul className="space-y-2">
                  {content.objectives.map((obj, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-foreground">{getTranslation(obj, selectedLanguage)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Vocabulary */}
            {content.vocabulary && content.vocabulary.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Vocabulary ({content.vocabulary.length} items)</h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {content.vocabulary.slice(0, 12).map((item, idx) => (
                    <div key={idx} className="p-3 bg-background border border-border rounded-lg">
                      <div className="font-medium text-foreground">{item.term}</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {getTranslation(item.translation, selectedLanguage)}
                      </div>
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <span>Page {item.pageNumber}</span>
                        {item.partOfSpeech && (
                          <>
                            <span>•</span>
                            <span className="capitalize">{item.partOfSpeech}</span>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {content.vocabulary.length > 12 && (
                  <p className="text-sm text-muted-foreground mt-3">
                    +{content.vocabulary.length - 12} more vocabulary items
                  </p>
                )}
              </div>
            )}

            {/* Exercises */}
            {content.exercises && content.exercises.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Exercises ({content.exercises.length} items)</h3>
                <div className="space-y-3">
                  {content.exercises.slice(0, 5).map((exercise, idx) => (
                    <div key={idx} className="p-4 bg-background border border-border rounded-lg">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full capitalize">
                              {exercise.type.replace('_', ' ')}
                            </span>
                            <span className="text-sm text-muted-foreground">Page {exercise.pageNumber}</span>
                          </div>
                          <p className="text-sm text-foreground">{exercise.question}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {content.exercises.length > 5 && (
                  <p className="text-sm text-muted-foreground mt-3">
                    +{content.exercises.length - 5} more exercises
                  </p>
                )}
              </div>
            )}

            {/* Tutor Notes */}
            {content.tutorNotes && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Tutor Notes</h3>
                <div className="space-y-4">
                  {content.tutorNotes.overview && (
                    <div>
                      <h4 className="font-medium mb-2">Overview</h4>
                      <p className="text-sm text-muted-foreground">
                        {getTranslation(content.tutorNotes.overview, selectedLanguage)}
                      </p>
                    </div>
                  )}
                  {content.tutorNotes.commonMistakes && content.tutorNotes.commonMistakes.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Common Mistakes</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        {content.tutorNotes.commonMistakes.map((mistake, idx) => (
                          <li key={idx}>{getTranslation(mistake, selectedLanguage)}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {viewMode === 'json' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Raw JSON Content</h3>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(content, null, 2));
                  alert('JSON copied to clipboard!');
                }}
                className="px-3 py-1 text-sm border border-border rounded hover:bg-muted transition-colors"
              >
                Copy JSON
              </button>
            </div>
            <pre className="p-4 bg-gray-900 text-gray-100 rounded-lg overflow-auto text-xs">
              {JSON.stringify(content, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Processing Info */}
      <div className="p-4 bg-muted rounded-lg text-sm">
        <div className="grid gap-2 sm:grid-cols-2">
          <div>
            <span className="text-muted-foreground">Uploaded:</span>{' '}
            <span className="text-foreground">{new Date(draft.created_at).toLocaleString()}</span>
          </div>
          {draft.processed_at && (
            <div>
              <span className="text-muted-foreground">Processed:</span>{' '}
              <span className="text-foreground">{new Date(draft.processed_at).toLocaleString()}</span>
            </div>
          )}
          {draft.tokens_used && (
            <div>
              <span className="text-muted-foreground">Tokens Used:</span>{' '}
              <span className="text-foreground">{draft.tokens_used.toLocaleString()}</span>
            </div>
          )}
          {draft.processing_cost_usd && (
            <div>
              <span className="text-muted-foreground">Processing Cost:</span>{' '}
              <span className="text-foreground">${draft.processing_cost_usd.toFixed(4)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}