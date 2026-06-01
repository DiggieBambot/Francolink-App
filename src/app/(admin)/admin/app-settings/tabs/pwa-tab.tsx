'use client';

import { useState, useRef } from 'react';
import { useSettingsSave, SaveBar } from '../use-settings-save';
import { Upload } from 'lucide-react';

interface Props {
  getSetting: (key: string) => string;
  rawSettings: any[];
}

export function PwaTab({ getSetting }: Props) {
  const [pwaName, setPwaName] = useState(getSetting('pwa_name') || 'FrancoLink - Language Learning');
  const [pwaShortName, setPwaShortName] = useState(getSetting('pwa_short_name') || 'FrancoLink');
  const [pwaDescription, setPwaDescription] = useState(getSetting('pwa_description') || 'Learn French, Spanish, English, and German');
  const [startUrl, setStartUrl] = useState(getSetting('pwa_start_url') || '/dashboard');
  const [display, setDisplay] = useState(getSetting('pwa_display') || 'standalone');
  const [orientation, setOrientation] = useState(getSetting('pwa_orientation') || 'portrait-primary');
  const [themeColor, setThemeColor] = useState(getSetting('pwa_theme_color') || '#1e3a5f');
  const [bgColor, setBgColor] = useState(getSetting('pwa_bg_color') || '#ffffff');
  const [icon192, setIcon192] = useState(getSetting('pwa_icon_192') || '/icons/icon-192.png');
  const [icon512, setIcon512] = useState(getSetting('pwa_icon_512') || '/icons/icon-512.png');
  const [uploading192, setUploading192] = useState(false);
  const [uploading512, setUploading512] = useState(false);
  const [uploadedMsg, setUploadedMsg] = useState('');
  const icon192Ref = useRef<HTMLInputElement>(null);
  const icon512Ref = useRef<HTMLInputElement>(null);
  const { save, saving, saved, error } = useSettingsSave();

  const uploadIcon = async (file: File, size: 192 | 512) => {
    if (size === 192) setUploading192(true); else setUploading512(true);
    setUploadedMsg('');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', `pwa_icon_${size}`);
    try {
      const res = await fetch('/api/admin/app-settings/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.url) {
        // Update state with new URL
        if (size === 192) setIcon192(data.url);
        else setIcon512(data.url);
        setUploadedMsg(`Icon ${size}×${size} uploaded ✓ — click "Save PWA Settings" to apply`);
        setTimeout(() => setUploadedMsg(''), 4000);
      } else {
        console.error('Upload failed:', data.error);
      }
    } catch (e) {
      console.error('Upload failed', e);
    } finally {
      if (size === 192) setUploading192(false); else setUploading512(false);
    }
  };

  const handleSave = () => save({
    pwa_name: pwaName, pwa_short_name: pwaShortName, pwa_description: pwaDescription,
    pwa_start_url: startUrl, pwa_display: display, pwa_orientation: orientation,
    pwa_theme_color: themeColor, pwa_bg_color: bgColor,
    pwa_icon_192: icon192, pwa_icon_512: icon512,
  });

  return (
    <div className="space-y-8">
      <section className="bg-white border rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-1">PWA Identity</h2>
        <p className="text-sm text-gray-500 mb-6">Used in the browser install prompt and home screen.</p>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">App Name (Full)</label>
            <input type="text" value={pwaName} onChange={(e) => setPwaName(e.target.value)}
              className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Short Name (≤12 chars)</label>
            <input type="text" value={pwaShortName} onChange={(e) => setPwaShortName(e.target.value)}
              className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea value={pwaDescription} onChange={(e) => setPwaDescription(e.target.value)} rows={2}
              className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start URL</label>
            <input type="text" value={startUrl} onChange={(e) => setStartUrl(e.target.value)}
              className="w-full border rounded-lg px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
      </section>

      <section className="bg-white border rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-1">Display & Colors</h2>
        <p className="text-sm text-gray-500 mb-6">Controls how the app looks when installed.</p>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Display Mode</label>
            <div className="flex flex-wrap gap-2">
              {['standalone','fullscreen','minimal-ui','browser'].map((d) => (
                <button key={d} onClick={() => setDisplay(d)}
                  className={`px-3 py-1.5 rounded-lg border text-sm transition-colors ${display === d ? 'border-blue-600 bg-blue-50 text-blue-700' : 'hover:bg-gray-50'}`}>
                  {d}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Orientation</label>
            <div className="flex flex-wrap gap-2">
              {['portrait-primary','landscape-primary','any','natural'].map((o) => (
                <button key={o} onClick={() => setOrientation(o)}
                  className={`px-3 py-1.5 rounded-lg border text-sm transition-colors ${orientation === o ? 'border-blue-600 bg-blue-50 text-blue-700' : 'hover:bg-gray-50'}`}>
                  {o}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Theme Color</label>
            <div className="flex items-center gap-3">
              <input type="color" value={themeColor} onChange={(e) => setThemeColor(e.target.value)}
                className="w-10 h-10 rounded border cursor-pointer" />
              <input type="text" value={themeColor} onChange={(e) => setThemeColor(e.target.value)}
                className="w-28 border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <p className="text-xs text-gray-400 mt-1">Browser toolbar color</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Background Color</label>
            <div className="flex items-center gap-3">
              <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)}
                className="w-10 h-10 rounded border cursor-pointer" />
              <input type="text" value={bgColor} onChange={(e) => setBgColor(e.target.value)}
                className="w-28 border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <p className="text-xs text-gray-400 mt-1">Splash screen background</p>
          </div>
        </div>
      </section>

      <section className="bg-white border rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-1">App Icons</h2>
        <p className="text-sm text-gray-500 mb-2">PNG format required. After uploading, click Save below to apply.</p>

        {uploadedMsg && (
          <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-2.5 text-sm mb-4">
            <CheckCircle className="w-4 h-4" />
            {uploadedMsg}
          </div>
        )}

        <div className="grid grid-cols-2 gap-8 mt-4">
          {[
            { size: 192 as const, label: '192×192 (Standard)', url: icon192, setUrl: setIcon192, uploading: uploading192, ref: icon192Ref },
            { size: 512 as const, label: '512×512 (High-res)',  url: icon512, setUrl: setIcon512, uploading: uploading512, ref: icon512Ref },
          ].map(({ size, label, url, setUrl, uploading, ref }) => (
            <div key={size}>
              <p className="text-sm font-medium text-gray-700 mb-3">{label}</p>
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 border-2 border-dashed rounded-2xl flex items-center justify-center bg-gray-50 overflow-hidden flex-shrink-0">
                  {url
                    ? <img src={`${url}?t=${Date.now()}`} alt={`${size} icon`} className="w-full h-full object-cover" />
                    : <span className="text-xs text-gray-400">{size}×{size}</span>}
                </div>
                <div className="flex flex-col gap-2 flex-1">
                  <input ref={ref} type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
                    onChange={(e) => e.target.files?.[0] && uploadIcon(e.target.files[0], size)} />
                  <button onClick={() => ref.current?.click()} disabled={uploading}
                    className="flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50">
                    <Upload className="w-4 h-4" />
                    {uploading ? 'Uploading...' : 'Upload PNG'}
                  </button>
                  <input type="text" value={url} onChange={(e) => setUrl(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={`/icons/icon-${size}.png`} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white border rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-1">Manifest</h2>
        <p className="text-sm text-gray-500">
          The PWA manifest is served at <code className="bg-gray-100 px-1 rounded">/manifest.webmanifest</code> and reads these settings on every request. Save below and your changes are live immediately — no regeneration step.
        </p>
      </section>

      <SaveBar saving={saving} saved={saved} error={error} onSave={handleSave} label="Save PWA Settings" />
    </div>
  );
}
