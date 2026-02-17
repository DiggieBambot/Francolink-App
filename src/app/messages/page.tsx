// src/app/messages/page.tsx
import { MessageSquare } from 'lucide-react';

export default function MessagesPage() {
  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <MessageSquare className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
          Messages Coming Soon
        </h2>
        <p className="text-gray-500 dark:text-gray-400">
          Chat with your tutor and classmates will be available soon!
        </p>
      </div>
    </div>
  );
}