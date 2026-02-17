// src/app/(admin)/admin/content/drafts/page.tsx

import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { DraftsList } from './drafts-list';

export const metadata: Metadata = {
  title: 'Content Drafts | Admin',
  description: 'Manage lesson drafts',
};

export default async function DraftsPage() {
  const supabase = await createClient();

  // Fetch all drafts
  const { data: drafts, error } = await supabase
    .from('lesson_drafts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch drafts:', error);
  }

  // Get counts by status
  const counts = {
    total: drafts?.length || 0,
    pending: drafts?.filter(d => d.status === 'pending').length || 0,
    processing: drafts?.filter(d => d.status === 'processing').length || 0,
    review: drafts?.filter(d => d.status === 'review').length || 0,
    failed: drafts?.filter(d => d.status === 'failed').length || 0,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Content Drafts</h1>
          <p className="text-muted-foreground mt-2">
            Manage and review uploaded lesson content
          </p>
        </div>
        <a
          href="/admin/content/upload"
          className="px-4 py-2 bg-foreground text-background rounded-lg font-medium hover:bg-foreground/90 transition-colors"
        >
          Upload New
        </a>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <div className="p-4 bg-card border border-border rounded-lg">
          <div className="text-2xl font-bold text-foreground">{counts.total}</div>
          <div className="text-sm text-muted-foreground">Total Drafts</div>
        </div>
        <div className="p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">{counts.pending}</div>
          <div className="text-sm text-yellow-700 dark:text-yellow-300">Pending</div>
        </div>
        <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{counts.processing}</div>
          <div className="text-sm text-blue-700 dark:text-blue-300">Processing</div>
        </div>
        <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="text-2xl font-bold text-green-900 dark:text-green-100">{counts.review}</div>
          <div className="text-sm text-green-700 dark:text-green-300">Ready to Review</div>
        </div>
        <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="text-2xl font-bold text-red-900 dark:text-red-100">{counts.failed}</div>
          <div className="text-sm text-red-700 dark:text-red-300">Failed</div>
        </div>
      </div>

      {/* Drafts List */}
      <DraftsList initialDrafts={drafts || []} />
    </div>
  );
}