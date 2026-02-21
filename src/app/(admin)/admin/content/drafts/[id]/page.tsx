// src/app/(admin)/admin/content/drafts/[id]/page.tsx

import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { DraftViewer } from './draft-viewer';

export const metadata: Metadata = {
  title: 'Review Draft | Admin',
  description: 'Review and edit lesson draft',
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DraftDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch draft with content
  const { data: draft, error } = await supabase
    .from('lesson_drafts')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !draft) {
    notFound();
  }

  // Check if processing is still ongoing
  if (draft.status === 'processing' || draft.status === 'pending') {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900 mb-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Processing Lesson</h2>
          <p className="text-muted-foreground mb-4">
            {draft.original_file_name}
          </p>
          <div className="max-w-md mx-auto">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${draft.progress || 0}%` }}
              />
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {draft.progress || 0}% complete
            </p>
          </div>
          <p className="text-sm text-muted-foreground mt-6">
            This page will automatically refresh when processing is complete.
          </p>
        </div>
      </div>
    );
  }

  // Check if processing failed
  if (draft.status === 'failed') {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900 mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Processing Failed</h2>
          <p className="text-muted-foreground mb-4">
            {draft.original_file_name}
          </p>
          {draft.error_message && (
            <div className="max-w-md mx-auto p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-200">
                {draft.error_message}
              </p>
            </div>
          )}
          <div className="mt-6 flex gap-3 justify-center">
            <a
              href="/admin/content/drafts"
              className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
            >
              Back to Drafts
            </a>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-foreground text-background rounded-lg hover:bg-foreground/90 transition-colors"
            >
              Retry Processing
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <DraftViewer draft={draft} />;
}