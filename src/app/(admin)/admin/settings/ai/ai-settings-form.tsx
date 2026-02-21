// src/app/(admin)/admin/settings/ai/ai-settings-form.tsx

'use client';

import { useState } from 'react';
import { 
  Save, 
  Loader2, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle2,
  Bot,
  Mic,
  Zap,
  Shield
} from 'lucide-react';

interface AppSetting {
  id: string;
  category: string;
  key: string;
  value: string;
  value_type: string;
  is_secret: boolean;
  description?: string;
}

interface AISettingsFormProps {
  initialSettings: AppSetting[];
}

const SETTING_LABELS: Record<string, { label: string; description: string; group: string }> = {
  // Provider Selection
  ai_provider: { 
    label: 'Primary AI Provider', 
    description: 'Choose the default AI provider for all features',
    group: 'provider'
  },
  
  // OpenAI
  openai_api_key: { 
    label: 'OpenAI API Key', 
    description: 'Your OpenAI API key (starts with sk-)',
    group: 'openai'
  },
  openai_default_model: { 
    label: 'Default Processing Model', 
    description: 'Model used for PDF processing',
    group: 'openai'
  },
  openai_tutor_model: { 
    label: 'Tutor Conversation Model', 
    description: 'Model used for AI tutor chat',
    group: 'openai'
  },
  openai_tts_model: { 
    label: 'Text-to-Speech Model', 
    description: 'Model for voice generation',
    group: 'openai'
  },
  openai_tts_voice: { 
    label: 'Default TTS Voice', 
    description: 'Voice for AI tutor speech',
    group: 'openai'
  },
  
  // Anthropic
  anthropic_api_key: { 
    label: 'Anthropic API Key', 
    description: 'Your Anthropic API key (optional)',
    group: 'anthropic'
  },
  anthropic_default_model: { 
    label: 'Default Anthropic Model', 
    description: 'Model used when Anthropic is selected',
    group: 'anthropic'
  },
  
  // Features
  ai_tutor_enabled: { 
    label: 'Enable AI Tutor', 
    description: 'Allow students to use AI conversation tutor',
    group: 'features'
  },
  ai_content_processing_enabled: { 
    label: 'Enable Content Processing', 
    description: 'Allow PDF to lesson conversion',
    group: 'features'
  },
  
  // Limits
  free_ai_minutes_per_day: { 
    label: 'Free Tier Daily Minutes', 
    description: 'AI minutes for free users (0 = disabled)',
    group: 'limits'
  },
  premium_ai_minutes_per_day: { 
    label: 'Premium Daily Minutes', 
    description: 'AI minutes for Premium subscribers',
    group: 'limits'
  },
  premium_plus_ai_minutes_per_day: { 
    label: 'Premium+ Daily Minutes', 
    description: 'AI minutes for Premium Plus subscribers',
    group: 'limits'
  },
};

const MODEL_OPTIONS = {
  openai: [
    { value: 'gpt-4o', label: 'GPT-4o (Recommended)' },
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini (Cheaper)' },
    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
  ],
  anthropic: [
    { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet' },
    { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku (Cheaper)' },
  ],
  tts: [
    { value: 'tts-1', label: 'TTS-1 (Standard)' },
    { value: 'tts-1-hd', label: 'TTS-1 HD (Higher Quality)' },
  ],
  voice: [
    { value: 'alloy', label: 'Alloy (Neutral)' },
    { value: 'echo', label: 'Echo (Male)' },
    { value: 'fable', label: 'Fable (British)' },
    { value: 'onyx', label: 'Onyx (Deep Male)' },
    { value: 'nova', label: 'Nova (Female)' },
    { value: 'shimmer', label: 'Shimmer (Soft Female)' },
  ],
};

export function AISettingsForm({ initialSettings }: AISettingsFormProps) {
  // Debug check
  if (!initialSettings || initialSettings.length === 0) {
    return (
      <div className="rounded-lg border border-border p-6 bg-card">
        <p className="text-muted-foreground">No settings to display. Please initialize AI settings first.</p>
      </div>
    );
  }

  const [settings, setSettings] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    initialSettings.forEach(s => {
      map[s.key] = s.value;
    });
    return map;
  });

  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setSaveStatus('idle');
  };

  const toggleSecret = (key: string) => {
    setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus('idle');
    setErrorMessage('');

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: 'ai',
          settings: Object.entries(settings).map(([key, value]) => ({
            key,
            value,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      setSaveStatus('success');

      // Clear AI config cache
      await fetch('/api/admin/ai/clear-cache', { method: 'POST' });

      // Clear success message after 3 seconds
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      setSaveStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const renderSettingInput = (key: string, isSecret: boolean) => {
    const value = settings[key] || '';

    // Boolean toggles
    if (key.includes('enabled')) {
      return (
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={value === 'true'}
            onChange={(e) => handleChange(key, e.target.checked ? 'true' : 'false')}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-300 dark:bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
        </label>
      );
    }

    // Number inputs
    if (key.includes('minutes') || key.includes('per_day')) {
      return (
        <input
          type="number"
          value={value}
          onChange={(e) => handleChange(key, e.target.value)}
          min="0"
          max="1440"
          className="w-32 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      );
    }

    // Model selects
    if (key.includes('model')) {
      const options = key.includes('tts_model') 
        ? MODEL_OPTIONS.tts
        : key.includes('anthropic')
          ? MODEL_OPTIONS.anthropic
          : MODEL_OPTIONS.openai;

      return (
        <select
          value={value}
          onChange={(e) => handleChange(key, e.target.value)}
          className="w-64 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
        >
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      );
    }

    // Voice select
    if (key.includes('voice')) {
      return (
        <select
          value={value}
          onChange={(e) => handleChange(key, e.target.value)}
          className="w-64 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
        >
          {MODEL_OPTIONS.voice.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      );
    }

    // Provider select
    if (key === 'ai_provider') {
      return (
        <select
          value={value}
          onChange={(e) => handleChange(key, e.target.value)}
          className="w-64 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
        >
          <option value="openai">OpenAI (GPT-4o)</option>
          <option value="anthropic">Anthropic (Claude)</option>
        </select>
      );
    }

    // Secret inputs (API keys)
    if (isSecret) {
      return (
        <div className="flex items-center gap-2">
          <input
            type={showSecrets[key] ? 'text' : 'password'}
            value={value}
            onChange={(e) => handleChange(key, e.target.value)}
            placeholder="Enter API key..."
            className="w-96 rounded-lg border border-input bg-background px-3 py-2 font-mono text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            type="button"
            onClick={() => toggleSecret(key)}
            className="p-2 rounded-lg hover:bg-muted transition-colors cursor-pointer"
            aria-label={showSecrets[key] ? 'Hide' : 'Show'}
          >
            {showSecrets[key] ? 
              <EyeOff className="w-4 h-4 text-muted-foreground" /> : 
              <Eye className="w-4 h-4 text-muted-foreground" />
            }
          </button>
        </div>
      );
    }

    // Default text input
    return (
      <input
        type="text"
        value={value}
        onChange={(e) => handleChange(key, e.target.value)}
        className="w-64 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      />
    );
  };

  // Group settings by category
  const settingsByGroup = initialSettings.reduce((acc, s) => {
    const group = SETTING_LABELS[s.key]?.group || 'other';
    if (!acc[group]) acc[group] = [];
    acc[group].push(s);
    return acc;
  }, {} as Record<string, AppSetting[]>);

  return (
    <div className="space-y-8">
      {/* Provider Selection */}
      {settingsByGroup.provider && (
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-yellow-500/10">
              <Zap className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">AI Provider</h2>
          </div>
          {settingsByGroup.provider.map(s => (
            <div key={s.key} className="flex items-center justify-between py-3">
              <div className="flex-1">
                <p className="font-medium text-foreground">{SETTING_LABELS[s.key]?.label || s.key}</p>
                <p className="text-sm text-muted-foreground">
                  {SETTING_LABELS[s.key]?.description}
                </p>
              </div>
              <div className="ml-4">
                {renderSettingInput(s.key, s.is_secret)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* OpenAI Settings */}
      {settingsByGroup.openai && (
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-green-500/10">
              <Bot className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">OpenAI Configuration</h2>
          </div>
          <div className="space-y-4">
            {settingsByGroup.openai.map(s => (
              <div key={s.key} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                <div className="flex-1">
                  <p className="font-medium text-foreground">{SETTING_LABELS[s.key]?.label || s.key}</p>
                  <p className="text-sm text-muted-foreground">
                    {SETTING_LABELS[s.key]?.description}
                  </p>
                </div>
                <div className="ml-4">
                  {renderSettingInput(s.key, s.is_secret)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Anthropic Settings */}
      {settingsByGroup.anthropic && (
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-orange-500/10">
              <Bot className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">Anthropic Configuration (Optional)</h2>
          </div>
          <div className="space-y-4">
            {settingsByGroup.anthropic.map(s => (
              <div key={s.key} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                <div className="flex-1">
                  <p className="font-medium text-foreground">{SETTING_LABELS[s.key]?.label || s.key}</p>
                  <p className="text-sm text-muted-foreground">
                    {SETTING_LABELS[s.key]?.description}
                  </p>
                </div>
                <div className="ml-4">
                  {renderSettingInput(s.key, s.is_secret)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Feature Toggles */}
      {settingsByGroup.features && (
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary-500/10">
              <Shield className="w-5 h-5 text-primary dark:text-primary-400" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">Features</h2>
          </div>
          <div className="space-y-4">
            {settingsByGroup.features.map(s => (
              <div key={s.key} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                <div className="flex-1">
                  <p className="font-medium text-foreground">{SETTING_LABELS[s.key]?.label || s.key}</p>
                  <p className="text-sm text-muted-foreground">
                    {SETTING_LABELS[s.key]?.description}
                  </p>
                </div>
                <div className="ml-4">
                  {renderSettingInput(s.key, s.is_secret)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Usage Limits */}
      {settingsByGroup.limits && (
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <Mic className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">AI Tutor Limits</h2>
          </div>
          <div className="space-y-4">
            {settingsByGroup.limits.map(s => (
              <div key={s.key} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                <div className="flex-1">
                  <p className="font-medium text-foreground">{SETTING_LABELS[s.key]?.label || s.key}</p>
                  <p className="text-sm text-muted-foreground">
                    {SETTING_LABELS[s.key]?.description}
                  </p>
                </div>
                <div className="ml-4">
                  {renderSettingInput(s.key, s.is_secret)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Save Button and Status */}
      <div className="sticky bottom-0 bg-background/95 backdrop-blur border-t border-border py-4 -mx-8 px-8">
        <div className="flex items-center justify-between">
          <div>
            {saveStatus === 'success' && (
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-sm font-medium">Settings saved successfully!</span>
              </div>
            )}
            {saveStatus === 'error' && (
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400 animate-in fade-in">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-medium">{errorMessage}</span>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2.5 bg-foreground text-background rounded-lg font-medium hover:bg-foreground/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all cursor-pointer"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Settings</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}