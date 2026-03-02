'use client';

import { useState } from 'react';

export function useSettingsSave() {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const save = async (data: Record<string, string>, endpoint = '/api/admin/app-settings') => {
    setSaving(true);
    setError('');
    setSaved(false);

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: data }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save');
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return { save, saving, saved, error };
}

export function SaveBar({
  saving,
  saved,
  error,
  onSave,
  label = 'Save Changes',
}: {
  saving: boolean;
  saved: boolean;
  error: string;
  onSave: () => void;
  label?: string;
}) {
  return (
    <div className="flex items-center gap-4 pt-6 border-t mt-8">
      <button
        onClick={onSave}
        disabled={saving}
        className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {saving ? 'Saving...' : label}
      </button>
      {saved && (
        <span className="text-green-600 text-sm font-medium">✓ Saved successfully</span>
      )}
      {error && <span className="text-red-600 text-sm">{error}</span>}
    </div>
  );
}
