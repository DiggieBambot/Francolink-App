// src/types/lesson-content.ts

export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export type LessonCategory = 
  | 'daily_conversations'
  | 'business'
  | 'travel_culture'
  | 'kids'
  | 'grammar'
  | 'vocabulary';

export type SectionType =
  | 'warmup'
  | 'vocabulary'
  | 'grammar'
  | 'dialogue'
  | 'exercise'
  | 'roleplay'
  | 'discussion'
  | 'reflection'
  | 'cultural_note'
  | 'listening'
  | 'reading';

export type ExerciseType =
  | 'multiple_choice'
  | 'fill_blank'
  | 'matching'
  | 'translation'
  | 'ordering'
  | 'true_false'
  | 'free_response';

export type SupportedLanguage = 'fr' | 'en' | 'de' | 'es' | 'ar';

// Multi-language string type
export type MultiLangString = {
  fr: string;      // French (always required - source language)
  en?: string;     // English
  de?: string;     // German
  es?: string;     // Spanish
  ar?: string;     // Arabic
};

// Helper type for full translations (all languages required)
export type FullMultiLangString = {
  fr: string;
  en: string;
  de: string;
  es: string;
  ar: string;
};

// Main lesson content structure
export interface LessonContent {
  version: '2.0';  // Updated version for multi-lang support
  
  // Metadata
  title: MultiLangString;
  subtitle?: MultiLangString;
  category: LessonCategory;
  targetLevel: CEFRLevel;
  estimatedMinutes: number;
  
  // Languages this lesson is available in
  availableLanguages: SupportedLanguage[];
  sourceLanguage: SupportedLanguage; // Original language (usually 'fr')
  
  // Learning objectives
  objectives: MultiLangString[];
  
  // Main content sections
  sections: LessonSection[];
  
  // Tutor-only content
  tutorNotes?: TutorNotes;
}

export interface TutorNotes {
  overview?: MultiLangString;
  commonMistakes?: MultiLangString[];
  extensionActivities?: MultiLangString[];
  assessmentTips?: MultiLangString[];
  culturalContext?: MultiLangString;
}

export interface LessonSection {
  id: string;
  type: SectionType;
  title: MultiLangString;
  order: number;
  
  // Different instructions for each role (multi-language)
  tutorInstructions?: MultiLangString;
  studentInstructions?: MultiLangString;
  
  // Content depends on section type
  content: SectionContent;
}

// Union type for all possible section contents
export type SectionContent =
  | VocabularyContent
  | DialogueContent
  | ExerciseContent
  | DiscussionContent
  | GrammarContent
  | RoleplayContent
  | TextContent
  | ListeningContent
  | ReadingContent;

// Vocabulary section
export interface VocabularyContent {
  type: 'vocabulary';
  items: VocabularyItem[];
}

export interface VocabularyItem {
  id?: string;
  term: string;  // Keep in target language (French)
  
  // Translations in all languages
  translation: MultiLangString;
  
  pronunciation?: string;
  audioUrl?: string;
  partOfSpeech?: string;
  gender?: 'masculine' | 'feminine' | 'neutral';
  
  // Example usage (multi-language)
  exampleSentence?: string;  // In French
  exampleTranslation?: MultiLangString;
  
  imageUrl?: string;
  
  // Additional context
  notes?: MultiLangString;
  difficulty?: 'easy' | 'medium' | 'hard';
}

// Dialogue section
export interface DialogueContent {
  type: 'dialogue';
  context?: MultiLangString;
  setting?: MultiLangString;
  speakers: DialogueSpeaker[];
  lines: DialogueLine[];
}

export interface DialogueSpeaker {
  id: string;
  name: string;
  role?: MultiLangString;
  avatar?: string;
}

export interface DialogueLine {
  speakerId: string;
  text: string;  // In target language (French)
  translation?: MultiLangString;
  
  // Performance notes for tutor
  notes?: MultiLangString;
  
  // Pronunciation tips
  pronunciation?: string;
  emphasis?: string[];  // Words to emphasize
  
  // Emotion/tone
  tone?: 'neutral' | 'happy' | 'sad' | 'angry' | 'surprised' | 'questioning';
}

// Exercise section
export interface ExerciseContent {
  type: 'exercise';
  exerciseType: ExerciseType;
  instructions: MultiLangString;
  
  items: ExerciseItem[];
  
  // Tutor-only information
  answerKey?: AnswerKey[];
  gradingNotes?: MultiLangString;
  commonErrors?: MultiLangString[];
  
  // Difficulty and timing
  difficulty?: 'easy' | 'medium' | 'hard';
  estimatedMinutes?: number;
}

export interface ExerciseItem {
  id: string;
  
  // The main prompt (multi-language)
  prompt: MultiLangString | string;  // string for backward compat
  
  // For multiple choice
  options?: string[] | MultiLangString[];
  
  // Correct answer(s) - hidden from students
  correctAnswer?: string | string[];
  
  // Explanation shown after answer (multi-language)
  explanation?: MultiLangString;
  
  // For fill-in-blank exercises
  blanks?: BlankItem[];
  
  // For matching exercises
  pairs?: MatchingPair[];
  
  // Points value
  points?: number;
  
  // Hint (shown on request)
  hint?: MultiLangString;
}

export interface AnswerKey {
  itemId: string;
  answer: string | string[];
  explanation?: MultiLangString;
  partialCredit?: { answer: string; points: number }[];
}

export interface BlankItem {
  id: string;
  beforeText: string;
  afterText: string;
  correctAnswer: string;
  alternatives?: string[];  // Accept these as correct too
  hint?: string;
}

export interface MatchingPair {
  id: string;
  left: string;
  right: string;
  leftTranslation?: MultiLangString;
  rightTranslation?: MultiLangString;
}

// Discussion section
export interface DiscussionContent {
  type: 'discussion';
  mainPrompt: MultiLangString;
  
  guideQuestions?: MultiLangString[];
  vocabularyHints?: VocabularyHint[];
  
  // Tutor guidance
  expectedResponses?: MultiLangString[];
  followUpQuestions?: MultiLangString[];
  assessmentCriteria?: MultiLangString[];
  
  // Discussion settings
  minParticipants?: number;
  maxParticipants?: number;
  estimatedMinutes?: number;
}

export interface VocabularyHint {
  term: string;
  translation: MultiLangString;
  usage?: string;
}

// Roleplay section
export interface RoleplayContent {
  type: 'roleplay';
  scenario: MultiLangString;
  
  roles: RoleplayRole[];
  objectives: MultiLangString[];
  
  // Helpful phrases for students
  usefulPhrases?: UsefulPhrase[];
  
  // Tutor guidance
  evaluationCriteria?: MultiLangString[];
  commonMistakes?: MultiLangString[];
  
  // Settings
  estimatedMinutes?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export interface RoleplayRole {
  id: string;
  name: MultiLangString;
  description: MultiLangString;
  goals?: MultiLangString[];
  characterTraits?: MultiLangString[];
  restrictions?: MultiLangString[];
}

export interface UsefulPhrase {
  phrase: string;  // In French
  translation: MultiLangString;
  context?: MultiLangString;
  formality?: 'informal' | 'neutral' | 'formal';
}

// Grammar section
export interface GrammarContent {
  type: 'grammar';
  concept: MultiLangString;
  explanation: MultiLangString;
  
  examples: GrammarExample[];
  rules?: GrammarRule[];
  
  // Common errors
  commonMistakes?: CommonMistake[];
  
  // Related concepts
  relatedConcepts?: MultiLangString[];
  
  // Practice exercises
  practiceExercises?: ExerciseItem[];
}

export interface GrammarExample {
  french: string;
  translation: MultiLangString;
  
  // Grammatical breakdown
  breakdown?: MultiLangString;
  
  // Highlight specific parts
  highlight?: string[];
  
  // Grammar notes
  notes?: MultiLangString;
  
  // Correct vs incorrect
  isCorrect?: boolean;
  correctedVersion?: string;
}

export interface GrammarRule {
  rule: MultiLangString;
  examples: string[];
  exceptions?: MultiLangString[];
}

export interface CommonMistake {
  incorrect: string;
  correct: string;
  explanation: MultiLangString;
}

// Text/reading section
export interface TextContent {
  type: 'text';
  
  // Main text content
  body: string;  // In French
  translation?: MultiLangString;
  
  // Text metadata
  author?: string;
  source?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  
  // Annotations for difficult terms
  annotations?: TextAnnotation[];
  
  // Reading aids
  glossary?: VocabularyItem[];
  culturalNotes?: MultiLangString[];
}

export interface TextAnnotation {
  term: string;
  definition: MultiLangString;
  startIndex?: number;
  endIndex?: number;
  category?: 'vocabulary' | 'grammar' | 'culture' | 'idiom';
}

// Listening section
export interface ListeningContent {
  type: 'listening';
  
  // Audio information
  audioUrl?: string;
  duration?: number;  // seconds
  
  // Transcript
  transcript?: string;  // In French
  transcriptTranslation?: MultiLangString;
  showTranscript?: boolean;
  showTranscriptAfter?: boolean;
  
  // Pre-listening
  preListeningQuestions?: MultiLangString[];
  preListeningVocabulary?: VocabularyItem[];
  
  // Comprehension questions
  questions?: ExerciseItem[];
  
  // Post-listening
  discussionQuestions?: MultiLangString[];
}

// Reading section
export interface ReadingContent {
  type: 'reading';
  
  // Main text
  text: string;  // In French
  translation?: MultiLangString;
  
  // Text metadata
  title?: MultiLangString;
  author?: string;
  source?: string;
  wordCount?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  
  // Pre-reading
  preReadingQuestions?: MultiLangString[];
  preReadingVocabulary?: VocabularyItem[];
  
  // Comprehension questions
  comprehensionQuestions?: ExerciseItem[];
  
  // Vocabulary from text
  vocabularyHighlights?: VocabularyItem[];
  
  // Post-reading
  discussionQuestions?: MultiLangString[];
  writingPrompts?: MultiLangString[];
  
  // Cultural context
  culturalNotes?: MultiLangString[];
}

// Processing and draft types
export interface ProcessingStatus {
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'review';
  progress?: number;
  error?: string;
  processedAt?: string;
}

export interface LessonDraft extends ProcessingStatus {
  id: string;
  originalFileName: string;
  pdfUrl: string;
  
  // Categorization
  language: string;
  level: CEFRLevel;
  category: LessonCategory;
  
  // Multi-language settings
  targetLanguages: SupportedLanguage[];
  
  // Content (once processed)
  content?: LessonContent;
  
  // Processing metadata
  aiProvider?: 'openai' | 'anthropic-sonnet' | 'anthropic-haiku';
  tokensUsed?: number;
  processingCostUsd?: number;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  
  // Publishing
  publishedToLessonId?: string;
  publishedAt?: string;
}

// Utility functions for working with multi-language content
export const getTranslation = (
  multiLang: MultiLangString | undefined,
  lang: SupportedLanguage,
  fallback: string = ''
): string => {
  if (!multiLang) return fallback;
  return multiLang[lang] || multiLang.fr || fallback;
};

export const hasTranslation = (
  multiLang: MultiLangString | undefined,
  lang: SupportedLanguage
): boolean => {
  return !!(multiLang && multiLang[lang]);
};

export const getAvailableLanguages = (
  content: LessonContent
): SupportedLanguage[] => {
  const languages = new Set<SupportedLanguage>();
  
  if (content.title) {
    Object.keys(content.title).forEach(lang => {
      languages.add(lang as SupportedLanguage);
    });
  }
  
  return Array.from(languages);
};

// Type guards
export const isHtmlContent = (content: LessonContent): content is HtmlLessonContent => {
  return content.type === 'html';
};

export const isStructuredContent = (content: LessonContent): content is StructuredLessonContent => {
  return content.type === 'structured';
};

export const isMultiLangString = (value: any): value is MultiLangString => {
  return typeof value === 'object' && ('fr' in value || 'en' in value);
};

export const isVocabularyContent = (content: SectionContent): content is VocabularyContent => {
  return content.type === 'vocabulary';
};

export const isDialogueContent = (content: SectionContent): content is DialogueContent => {
  return content.type === 'dialogue';
};

export const isExerciseContent = (content: SectionContent): content is ExerciseContent => {
  return content.type === 'exercise';
};

// Export all types
export type {
  SupportedLanguage as Language,
  MultiLangString as Translation,
  FullMultiLangString as FullTranslation,
};
// Add these missing interfaces
export interface HtmlLessonContent extends Omit<LessonContent, 'sections'> {
  type: 'html';
  htmlContent: string;
}

export interface StructuredLessonContent extends LessonContent {
  type: 'structured';
}