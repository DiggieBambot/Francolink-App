'use client';

import { useState } from 'react';
import { useSettingsSave, SaveBar } from '../use-settings-save';

interface Props {
  getSetting: (key: string) => string;
  rawSettings: any[];
}

const FONT_OPTIONS = [
  { value: 'Inter', label: 'Inter (Default)' },
  { value: 'Poppins', label: 'Poppins' },
  { value: 'Nunito', label: 'Nunito' },
  { value: 'DM Sans', label: 'DM Sans' },
  { value: 'Plus Jakarta Sans', label: 'Plus Jakarta Sans' },
  { value: 'Geist', label: 'Geist' },
];

const RADIUS_OPTIONS = [
  { value: '0', label: 'None' },
  { value: '4px', label: 'Small' },
  { value: '8px', label: 'Medium' },
  { value: '12px', label: 'Large' },
  { value: '16px', label: 'XL' },
];

function ColorInput({ label, value, onChange, description }: {
  label: string; value: string; onChange: (v: string) => void; description?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {description && <p className="text-xs text-gray-400 mb-2">{description}</p>}
      <div className="flex items-center gap-3">
        <input type="color" value={value || '#000000'} onChange={(e) => onChange(e.target.value)}
          className="w-12 h-10 rounded-lg border cursor-pointer p-0.5" />
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)}
          className="w-32 border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="#1e3a5f" />
        <div className="w-10 h-10 rounded-lg border shadow-inner" style={{ backgroundColor: value || '#ffffff' }} />
      </div>
    </div>
  );
}

export function ThemeTab({ getSetting }: Props) {
  const [primaryColor, setPrimaryColor] = useState(getSetting('theme_primary_color') || '#1e3a5f');
  const [secondaryColor, setSecondaryColor] = useState(getSetting('theme_secondary_color') || '#3b82f6');
  const [accentColor, setAccentColor] = useState(getSetting('theme_accent_color') || '#f59e0b');
  const [bgColor, setBgColor] = useState(getSetting('theme_bg_color') || '#ffffff');
  const [font, setFont] = useState(getSetting('theme_font') || 'Inter');
  const [radius, setRadius] = useState(getSetting('theme_border_radius') || '8px');
  const [darkMode, setDarkMode] = useState(getSetting('theme_dark_mode') || 'system');

  const { save, saving, saved, error } = useSettingsSave();

  const handleSave = () => save({
    theme_primary_color: primaryColor,
    theme_secondary_color: secondaryColor,
    theme_accent_color: accentColor,
    theme_bg_color: bgColor,
    theme_font: font,
    theme_border_radius: radius,
    theme_dark_mode: darkMode,
  });

  return (
    <div className="space-y-8">
      <section className="bg-white border rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-1">Colors</h2>
        <p className="text-sm text-gray-500 mb-6">Brand colors used across the app.</p>
        <div className="grid grid-cols-2 gap-6">
          <ColorInput label="Primary Color" description="Main brand color — buttons, links" value={primaryColor} onChange={setPrimaryColor} />
          <ColorInput label="Secondary Color" description="Supporting brand color" value={secondaryColor} onChange={setSecondaryColor} />
          <ColorInput label="Accent Color" description="Badges, tags, highlights" value={accentColor} onChange={setAccentColor} />
          <ColorInput label="Background Color" description="Default page background" value={bgColor} onChange={setBgColor} />
        </div>
        <div className="mt-6 p-4 rounded-xl border bg-gray-50">
          <p className="text-xs text-gray-400 mb-3 font-medium uppercase tracking-wide">Live Preview</p>
          <div className="flex items-center gap-3 flex-wrap">
            <button className="px-4 py-2 rounded-lg text-white text-sm font-medium" style={{ backgroundColor: primaryColor }}>Primary</button>
            <button className="px-4 py-2 rounded-lg text-white text-sm font-medium" style={{ backgroundColor: secondaryColor }}>Secondary</button>
            <span className="px-3 py-1 rounded-full text-white text-xs font-medium" style={{ backgroundColor: accentColor }}>Badge</span>
            <div className="px-4 py-2 rounded-lg border text-sm" style={{ backgroundColor: bgColor }}>Background</div>
          </div>
        </div>
      </section>

      <section className="bg-white border rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-1">Typography</h2>
        <p className="text-sm text-gray-500 mb-6">Font family used throughout the app.</p>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Font Family</label>
            <select value={font} onChange={(e) => setFont(e.target.value)}
              className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {FONT_OPTIONS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
            <p className="text-xs text-gray-400 mt-2" style={{ fontFamily: font }}>
              The quick brown fox jumps over the lazy dog — {font}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Border Radius</label>
            <div className="flex gap-2 flex-wrap">
              {RADIUS_OPTIONS.map((r) => (
                <button key={r.value} onClick={() => setRadius(r.value)}
                  className={`px-4 py-2 border text-sm font-medium transition-colors ${radius === r.value ? 'border-blue-600 bg-blue-50 text-blue-700' : 'hover:bg-gray-50'}`}
                  style={{ borderRadius: r.value || '4px' }}>
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white border rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-1">Color Mode</h2>
        <p className="text-sm text-gray-500 mb-4">Default color mode for users.</p>
        <div className="flex gap-3">
          {['light', 'dark', 'system'].map((mode) => (
            <button key={mode} onClick={() => setDarkMode(mode)}
              className={`px-5 py-2.5 rounded-lg border text-sm font-medium capitalize transition-colors ${darkMode === mode ? 'border-blue-600 bg-blue-50 text-blue-700' : 'hover:bg-gray-50'}`}>
              {mode === 'light' ? '☀️' : mode === 'dark' ? '🌙' : '💻'} {mode}
            </button>
          ))}
        </div>
      </section>

      <SaveBar saving={saving} saved={saved} error={error} onSave={handleSave} />
    </div>
  );
}
