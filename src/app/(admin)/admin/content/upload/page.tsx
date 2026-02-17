// src/app/(admin)/admin/content/upload/page.tsx

import { Metadata } from 'next';
import { UploadForm } from './upload-form';

export const metadata: Metadata = {
  title: 'Upload Lesson Content | Admin',
  description: 'Upload PDF lessons to process into structured content',
};

export default function UploadLessonPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Upload Lesson Content</h1>
        <p className="text-muted-foreground mt-2">
          Upload PDF lesson files to automatically convert them into structured, interactive content.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <UploadForm />
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-semibold mb-2">📋 Supported Format</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• PDF files only</li>
              <li>• Max size: 10MB</li>
              <li>• 2-20 pages recommended</li>
            </ul>
          </div>

          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-semibold mb-2">⚡ Processing</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• AI-powered extraction</li>
              <li>• ~30-60 seconds per PDF</li>
              <li>• Cost: ~$0.03 per lesson</li>
            </ul>
          </div>

          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-semibold mb-2">🎯 What Gets Extracted</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Learning objectives</li>
              <li>• Vocabulary with translations</li>
              <li>• Exercise sections</li>
              <li>• Dialogues & role-plays</li>
              <li>• Teacher instructions</li>
              <li>• Student instructions</li>
            </ul>
          </div>

          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-semibold mb-2">✅ After Upload</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Review extracted content</li>
              <li>• Edit any section</li>
              <li>• Preview student/tutor views</li>
              <li>• Publish to course</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}