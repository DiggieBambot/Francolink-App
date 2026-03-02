'use client';

import { useState, useRef } from 'react';
import { useSettingsSave, SaveBar } from '../use-settings-save';
import { Upload, X } from 'lucide-react';

interface Props {
  getSetting: (key: string) => string;
  rawSettings: any[];
}

export function BrandingTab({ getSetting }: Props) {
  const [appName, setAppName] = useState(getSetting('app_name') || 'FrancoLink');
  const [tagline, setTagline] = useState(getSetting('app_tagline') || 'Learn French, Spanish & more');
  const [logoUrl, setLogoUrl] = useState(getSetting('app_logo_url') || '');
  const [faviconUrl, setFaviconUrl] = useState(getSetting('app_favicon_url') || '');
  const [uploading, setUploading] = useState<string | null>(null);
  const logoRef = useRef<HTMLInputElement>(null);
  const faviconRef = useRef<HTMLInputElement>(null);

  const { save, saving, saved, error } = useSettingsSave();

  const uploadFile = async (file: File, type: 'logo' | 'favicon') => {
    setUploading(type);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    try {
      const res = await fetch('/api/admin/app-settings/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.url) {
        if (type === 'logo') setLogoUrl(data.url);
        else setFaviconUrl(data.url);
      }
    } catch (e) {
      console.error('Upload failed', e);
    } finally {
      setUploading(null);
    }
  };

  const handleSave = () => save({
    app_name: appName,
    app_tagline: tagline,
    app_logo_url: logoUrl,
    app_favicon_url: faviconUrl,
  });

  return (
    <div className="space-y-8">
      <section className="bg-white border rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-1">App Identity</h2>
        <p className="text-sm text-gray-500 mb-6">Your app name and tagline shown across the platform.</p>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">App Name</label>
            <input type="text" value={appName} onChange={(e) => setAppName(e.target.value)}
              className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tagline</label>
            <input type="text" value={tagline} onChange={(e) => setTagline(e.target.value)}
              className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
      </section>

      <section className="bg-white border rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-1">Logo</h2>
        <p className="text-sm text-gray-500 mb-6">Recommended: SVG or PNG, 200×60px.</p>
        <div className="flex items-start gap-6">
          <div className="w-48 h-20 border-2 border-dashed rounded-xl flex items-center justify-center bg-gray-50">
            {logoUrl ? <img src={logoUrl} alt="Logo" className="max-w-full max-h-full object-contain p-2" />
              : <span className="text-xs text-gray-400">No logo</span>}
          </div>
          <div className="flex flex-col gap-3">
            <input ref={logoRef} type="file" accept="image/*,.svg" className="hidden"
              onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0], 'logo')} />
            <button onClick={() => logoRef.current?.click()} disabled={uploading === 'logo'}
              className="flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50">
              <Upload className="w-4 h-4" />
              {uploading === 'logo' ? 'Uploading...' : 'Upload Logo'}
            </button>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Or paste URL</label>
              <input type="text" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)}
                className="w-72 border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://..." />
            </div>
            {logoUrl && <button onClick={() => setLogoUrl('')} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700">
              <X className="w-3 h-3" /> Remove
            </button>}
          </div>
        </div>
      </section>

      <section className="bg-white border rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-1">Favicon</h2>
        <p className="text-sm text-gray-500 mb-6">Browser tab icon. Recommended: 32×32px ICO or PNG.</p>
        <div className="flex items-start gap-6">
          <div className="w-16 h-16 border-2 border-dashed rounded-xl flex items-center justify-center bg-gray-50">
            {faviconUrl ? <img src={faviconUrl} alt="Favicon" className="w-8 h-8 object-contain" />
              : <span className="text-xs text-gray-400 text-center">No icon</span>}
          </div>
          <div className="flex flex-col gap-3">
            <input ref={faviconRef} type="file" accept="image/*,.ico" className="hidden"
              onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0], 'favicon')} />
            <button onClick={() => faviconRef.current?.click()} disabled={uploading === 'favicon'}
              className="flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50">
              <Upload className="w-4 h-4" />
              {uploading === 'favicon' ? 'Uploading...' : 'Upload Favicon'}
            </button>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Or paste URL</label>
              <input type="text" value={faviconUrl} onChange={(e) => setFaviconUrl(e.target.value)}
                className="w-72 border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://..." />
            </div>
          </div>
        </div>
      </section>

      <SaveBar saving={saving} saved={saved} error={error} onSave={handleSave} />
    </div>
  );
}
