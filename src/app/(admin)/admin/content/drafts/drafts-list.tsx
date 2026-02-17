// src/app/(admin)/admin/content/drafts/drafts-list.tsx

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  Eye,
  Trash2,
  AlertCircle
} from 'lucide-react';

type DraftStatus = 'pending' | 'processing' | 'review' | 'completed' | 'failed';

interface Draft {
  id: string;
  original_file_name: string;
  status: DraftStatus;
  category: string;
  level: string;
  progress: number;
  error_message?: string;
  created_at: string;
  processed_at?: string;
  tokens_used?: number;
  processing_cost_usd?: number;
  content?: any;
}

interface DraftsListProps {
  initialDrafts: Draft[];
}

export function DraftsList({ initialDrafts }: DraftsListProps) {
  const [drafts, setDrafts] = useState(initialDrafts);
  const [filter, setFilter] = useState<DraftStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter drafts
  const filteredDrafts = drafts.filter(draft => {
    const matchesFilter = filter === 'all' || draft.status === filter;
    const matchesSearch = draft.original_file_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Status badge component
  const StatusBadge = ({ status, progress }: { status: DraftStatus; progress: number }) => {
    const config = {
      pending: { 
        icon: Clock, 
        label: 'Pending', 
        className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' 
      },
      processing: { 
        icon: Loader2, 
        label: `Processing ${progress}%`, 
        className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
        animate: true 
      },
      review: { 
        icon: CheckCircle2, 
        label: 'Ready to Review', 
        className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
      },
      completed: { 
        icon: CheckCircle2, 
        label: 'Published', 
        className: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200' 
      },
      failed: { 
        icon: XCircle, 
        label: 'Failed', 
        className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' 
      },
    };

    const { icon: Icon, label, className, animate } = config[status];

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${className}`}>
        <Icon className={`w-3.5 h-3.5 ${animate ? 'animate-spin' : ''}`} />
        {label}
      </span>
    );
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Delete draft
  const handleDelete = async (draftId: string) => {
    if (!confirm('Are you sure you want to delete this draft?')) return;

    try {
      const response = await fetch(`/api/admin/content/drafts/${draftId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setDrafts(drafts.filter(d => d.id !== draftId));
      } else {
        alert('Failed to delete draft');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete draft');
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <input
          type="text"
          placeholder="Search by filename..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 px-4 py-2 border border-border rounded-lg bg-background text-foreground"
        />

        {/* Status Filter */}
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as DraftStatus | 'all')}
          className="px-4 py-2 border border-border rounded-lg bg-background text-foreground"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="review">Ready to Review</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {/* Drafts List */}
      {filteredDrafts.length === 0 ? (
        <div className="text-center py-12 bg-card border border-border rounded-lg">
          <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">
            {searchQuery || filter !== 'all' 
              ? 'No drafts match your filters' 
              : 'No drafts yet. Upload your first lesson!'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredDrafts.map((draft) => (
            <div
              key={draft.id}
              className="p-4 bg-card border border-border rounded-lg hover:border-foreground/20 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                {/* Left: Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <FileText className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    <h3 className="font-semibold text-foreground truncate">
                      {draft.original_file_name}
                    </h3>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                    <span className="capitalize">{draft.category.replace('_', ' ')}</span>
                    <span>•</span>
                    <span>{draft.level}</span>
                    <span>•</span>
                    <span>{formatDate(draft.created_at)}</span>
                    {draft.tokens_used && (
                      <>
                        <span>•</span>
                        <span>{draft.tokens_used.toLocaleString()} tokens</span>
                      </>
                    )}
                    {draft.processing_cost_usd && (
                      <>
                        <span>•</span>
                        <span>${draft.processing_cost_usd.toFixed(4)}</span>
                      </>
                    )}
                  </div>

                  {/* Error message */}
                  {draft.status === 'failed' && draft.error_message && (
                    <div className="mt-2 flex items-start gap-2 text-sm text-red-600 dark:text-red-400">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>{draft.error_message}</span>
                    </div>
                  )}
                </div>

                {/* Right: Status & Actions */}
                <div className="flex items-center gap-3">
                  <StatusBadge status={draft.status} progress={draft.progress || 0} />

                  <div className="flex gap-2">
                    {draft.status === 'review' && (
                      <Link
                        href={`/admin/content/drafts/${draft.id}`}
                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                        title="Review"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                    )}

                    <button
                      onClick={() => handleDelete(draft.id)}
                      className="p-2 hover:bg-red-50 dark:hover:bg-red-950 text-red-600 dark:text-red-400 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}