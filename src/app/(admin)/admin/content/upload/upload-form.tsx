// src/app/(admin)/admin/content/upload/upload-form.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, FileText, Loader2, AlertCircle, Check } from 'lucide-react';
import type { LessonCategory, CEFRLevel, SupportedLanguage } from '@/types/lesson-content';

type AIProvider = 'openai' | 'anthropic-sonnet' | 'anthropic-haiku';
type LevelTier = 'beginner' | 'intermediate' | 'advanced';

const AVAILABLE_LANGUAGES: { code: SupportedLanguage; name: string; flag: string }[] = [
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
];

const LEVEL_TIERS: Record<LevelTier, {
  name: string;
  shortName: string;
  levels: CEFRLevel[];
  description: string;
}> = {
  beginner: {
    name: 'Beginner',
    shortName: 'A1',
    levels: ['A1'],
    description: 'For those just starting their French journey',
  },
  intermediate: {
    name: 'Intermediate',
    shortName: 'A2-B1',
    levels: ['A2', 'B1'],
    description: 'For learners with basic knowledge looking to improve',
  },
  advanced: {
    name: 'Advanced',
    shortName: 'B2-C1',
    levels: ['B2', 'C1'],
    description: 'For proficient speakers refining their skills',
  },
};

export function UploadForm() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingStatus, setProcessingStatus] = useState<string>('');

  // Form state
  const [sourceLanguage, setSourceLanguage] = useState<SupportedLanguage>('fr');
  const [targetLanguages, setTargetLanguages] = useState<SupportedLanguage[]>(['en']);
  const [tier, setTier] = useState<LevelTier>('beginner');
  const [level, setLevel] = useState<CEFRLevel>('A1');
  const [category, setCategory] = useState<LessonCategory>('daily_conversations');
  const [aiProvider, setAiProvider] = useState<AIProvider>('openai');

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === 'application/pdf') {
      setFile(droppedFile);
      setError(null);
    } else {
      setError('Please upload a PDF file');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        setError('Please upload a PDF file');
        return;
      }
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };

  const toggleLanguage = (lang: SupportedLanguage) => {
    if (lang === sourceLanguage) return;
    
    setTargetLanguages(prev => {
      if (prev.includes(lang)) {
        return prev.filter(l => l !== lang);
      } else {
        return [...prev, lang];
      }
    });
  };

  const handleTierChange = (newTier: LevelTier) => {
    setTier(newTier);
    // Auto-select first level in tier
    setLevel(LEVEL_TIERS[newTier].levels[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      setError('Please select a file');
      return;
    }

    if (targetLanguages.length === 0) {
      setError('Please select at least one translation language');
      return;
    }

    setIsUploading(true);
    setError(null);
    setProcessingStatus('Uploading PDF...');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('language', sourceLanguage);
      formData.append('level', level);
      formData.append('category', category);
      formData.append('aiProvider', aiProvider);
      formData.append('targetLanguages', targetLanguages.join(','));

      const response = await fetch('/api/admin/content/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setProcessingStatus('Processing with AI...');

      const processResponse = await fetch('/api/admin/content/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          draftId: data.draftId,
          targetLanguages: [...targetLanguages, sourceLanguage]
        }),
      });

      const processData = await processResponse.json();

      if (!processResponse.ok) {
        console.error('Processing failed:', processData.error);
        setProcessingStatus('Processing failed - redirecting to draft...');
      } else {
        setProcessingStatus('Processing complete!');
      }

      setTimeout(() => {
        router.push(`/admin/content/drafts/${data.draftId}`);
      }, 1500);

    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Upload failed');
      setProcessingStatus('');
    } finally {
      setIsUploading(false);
    }
  };

  const estimatedCost = () => {
    const baseCost = 0.03;
    const perLanguageCost = 0.01;
    const totalLanguages = targetLanguages.length + 1;
    return (baseCost + (perLanguageCost * Math.max(0, totalLanguages - 2))).toFixed(3);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* File Upload Area */}
      <div className="rounded-lg border-2 border-dashed border-border bg-card p-8">
        <div
          className={`relative ${isDragging ? 'border-primary bg-primary/5' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            type="file"
            id="file-upload"
            accept="application/pdf"
            onChange={handleFileChange}
            className="sr-only"
            disabled={isUploading}
          />

          <label
            htmlFor="file-upload"
            className="flex flex-col items-center justify-center py-12 cursor-pointer"
          >
            {file ? (
              <div className="text-center space-y-2">
                <FileText className="w-12 h-12 mx-auto text-green-600" />
                <p className="font-medium text-foreground">{file.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(file.size / 1024).toFixed(2)} KB
                </p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setFile(null);
                  }}
                  className="text-sm text-muted-foreground hover:text-foreground underline"
                  disabled={isUploading}
                >
                  Choose a different file
                </button>
              </div>
            ) : (
              <div className="text-center space-y-2">
                <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground">Drop PDF here or click to browse</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Maximum file size: 10MB
                  </p>
                </div>
              </div>
            )}
          </label>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950 p-4">
          <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Processing Status */}
      {processingStatus && (
        <div className="rounded-lg border border-blue-300 bg-blue-50 dark:border-blue-800 dark:bg-blue-950 p-4">
          <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
            <Loader2 className="w-5 h-5 animate-spin flex-shrink-0" />
            <p className="text-sm font-medium">{processingStatus}</p>
          </div>
        </div>
      )}

      {/* Language Selection */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Source Language (PDF Language)
          </label>
          <select
            value={sourceLanguage}
            onChange={(e) => {
              const newSource = e.target.value as SupportedLanguage;
              setSourceLanguage(newSource);
              setTargetLanguages(prev => prev.filter(l => l !== newSource));
            }}
            className="w-full rounded-lg border border-input bg-background text-foreground px-3 py-2"
            disabled={isUploading}
          >
            {AVAILABLE_LANGUAGES.map(lang => (
              <option key={lang.code} value={lang.code}>
                {lang.flag} {lang.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Translation Languages (Select Multiple)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {AVAILABLE_LANGUAGES.filter(lang => lang.code !== sourceLanguage).map(lang => {
              const isSelected = targetLanguages.includes(lang.code);
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => toggleLanguage(lang.code)}
                  disabled={isUploading}
                  className={`
                    flex items-center justify-between px-3 py-2 rounded-lg border transition-colors cursor-pointer
                    ${isSelected 
                      ? 'bg-green-600 text-white border-green-600' 
                      : 'bg-background text-foreground hover:bg-muted border-input'
                    }
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                >
                  <span className="flex items-center gap-2">
                    <span>{lang.flag}</span>
                    <span className="text-sm font-medium">{lang.name}</span>
                  </span>
                  {isSelected && <Check className="w-4 h-4" />}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Selected: {targetLanguages.length === 0 ? 'None' : targetLanguages.map(code => 
              AVAILABLE_LANGUAGES.find(l => l.code === code)?.name
            ).join(', ')}
          </p>
        </div>
      </div>

      {/* Level Tier Selection */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-3">Level</label>
        <div className="grid grid-cols-3 gap-3">
          {(Object.entries(LEVEL_TIERS) as [LevelTier, typeof LEVEL_TIERS.beginner][]).map(([tierKey, tierInfo]) => (
            <button
              key={tierKey}
              type="button"
              onClick={() => handleTierChange(tierKey)}
              disabled={isUploading}
              className={`
                relative p-4 rounded-lg border-2 transition-all cursor-pointer text-left
                ${tier === tierKey 
                  ? 'border-foreground bg-foreground/5' 
                  : 'border-border hover:border-foreground/50 bg-card'
                }
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-foreground">{tierInfo.name}</span>
                <span className={`
                  text-xs px-2 py-0.5 rounded-full font-medium
                  ${tierKey === 'beginner' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : ''}
                  ${tierKey === 'intermediate' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : ''}
                  ${tierKey === 'advanced' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' : ''}
                `}>
                  {tierInfo.shortName}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{tierInfo.description}</p>
              
              {tier === tierKey && (
                <div className="absolute top-3 right-3">
                  <Check className="w-4 h-4 text-foreground" />
                </div>
              )}
            </button>
          ))}
        </div>
        
        {/* Sub-level selection for tiers with multiple levels */}
        {LEVEL_TIERS[tier].levels.length > 1 && (
          <div className="mt-3">
            <label className="block text-xs text-muted-foreground mb-2">
              Specific Level
            </label>
            <div className="flex gap-2">
              {LEVEL_TIERS[tier].levels.map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setLevel(lvl)}
                  disabled={isUploading}
                  className={`
                    px-4 py-2 rounded-lg border text-sm font-medium transition-all cursor-pointer
                    ${level === lvl 
                      ? 'border-foreground bg-foreground text-background' 
                      : 'border-border bg-background text-foreground hover:border-foreground/50'
                    }
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Category</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as LessonCategory)}
          className="w-full rounded-lg border border-input bg-background text-foreground px-3 py-2"
          disabled={isUploading}
        >
          <option value="daily_conversations">Daily Conversations</option>
          <option value="business">Business French</option>
          <option value="travel_culture">Travel & Culture</option>
          <option value="kids">French for Kids</option>
          <option value="grammar">Grammar</option>
          <option value="vocabulary">Vocabulary</option>
        </select>
      </div>

      {/* AI Provider */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">AI Model</label>
        <select
          value={aiProvider}
          onChange={(e) => setAiProvider(e.target.value as AIProvider)}
          className="w-full rounded-lg border border-input bg-background text-foreground px-3 py-2"
          disabled={isUploading}
        >
          <option value="openai">GPT-4o (Recommended)</option>
          <option value="anthropic-sonnet">Claude Sonnet (Best Quality)</option>
          <option value="anthropic-haiku">Claude Haiku (Cheapest)</option>
        </select>
        <p className="text-xs text-muted-foreground mt-1">
          Estimated cost: ~${estimatedCost()} for {targetLanguages.length + 1} languages
        </p>
      </div>

      {/* Submit Button */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <div className="text-sm text-muted-foreground">
          <p>Processing time: 30-60 seconds</p>
          <p>
            {LEVEL_TIERS[tier].name} ({level}) • {sourceLanguage.toUpperCase()} → {targetLanguages.map(l => l.toUpperCase()).join(', ') || 'Select languages'}
          </p>
        </div>
        <button
          type="submit"
          disabled={!file || isUploading || targetLanguages.length === 0}
          className="px-6 py-2.5 bg-foreground text-background rounded-lg font-medium hover:bg-foreground/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors cursor-pointer"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Upload & Process
            </>
          )}
        </button>
      </div>
    </form>
  );
}