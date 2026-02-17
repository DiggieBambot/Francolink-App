// src/lib/ai/pdf-processor.ts

import { LessonContent, SupportedLanguage } from '@/types/lesson-content';
import { chatCompletion, getAIConfig, estimateTokens, calculateCost } from './client';

export type ProcessingOptions = {
  targetLanguages: SupportedLanguage[];
  aiProvider: 'openai' | 'anthropic-sonnet' | 'anthropic-haiku';
  includeTeacherNotes: boolean;
};

const SYSTEM_PROMPT = `You are an expert language teacher and curriculum designer specializing in creating structured, interactive language learning content. You excel at analyzing educational PDFs and extracting them into well-organized JSON structures.

Your task is to analyze a French language lesson PDF and convert it into a structured JSON format that will be used for both student learning and teacher guidance.

IMPORTANT REQUIREMENTS:
1. Preserve ALL content from the PDF - do not skip or summarize anything
2. Identify and categorize each section appropriately (warmup, vocabulary, exercises, dialogues, etc.)
3. Extract teacher instructions separately from student instructions
4. For vocabulary: include pronunciation guides and gender markers
5. For exercises: include answer keys and explanations
6. Provide translations in the requested languages for all instructional text
7. Maintain the pedagogical flow and learning objectives

OUTPUT LANGUAGES:
Provide all instructions, titles, and explanations in these languages:
- French (fr) - always required as this is the source
- English (en) - always required
- German (de) - if requested
- Spanish (es) - if requested  
- Arabic (ar) - if requested

For vocabulary terms and exercise content in French, keep them in French but provide translations in the translation field.`;

const USER_PROMPT_TEMPLATE = `Please analyze the following French lesson PDF content and convert it to the specified JSON structure.

Target languages for translations: {{LANGUAGES}}

PDF CONTENT:
{{PDF_CONTENT}}

Please output a JSON object following this exact structure:
{
  "version": "2.0",
  "title": { "fr": "...", "en": "...", ... },
  "subtitle": { "fr": "...", "en": "...", ... } (if applicable),
  "category": "daily_conversations|business|travel_culture|kids|grammar|vocabulary",
  "targetLevel": "A1|A2|B1|B2|C1|C2",
  "estimatedMinutes": number,
  "availableLanguages": ["fr", "en", ...],
  "sourceLanguage": "fr",
  "objectives": [
    { "fr": "...", "en": "...", ... }
  ],
  "sections": [
    {
      "id": "unique-id",
      "type": "warmup|vocabulary|exercise|dialogue|roleplay|discussion|grammar|reading",
      "title": { "fr": "...", "en": "...", ... },
      "order": number,
      "studentInstructions": { "fr": "...", "en": "...", ... },
      "tutorInstructions": { "fr": "...", "en": "...", ... },
      "content": {
        // Content structure based on section type - see examples below
      }
    }
  ],
  "tutorNotes": {
    "overview": { "fr": "...", "en": "...", ... },
    "commonMistakes": [{ "fr": "...", "en": "...", ... }],
    "extensionActivities": [{ "fr": "...", "en": "...", ... }],
    "assessmentTips": [{ "fr": "...", "en": "...", ... }]
  }
}

SECTION CONTENT TYPES:

For vocabulary sections:
{
  "type": "vocabulary",
  "items": [
    {
      "term": "French term",
      "translation": { "en": "English", "de": "German", "es": "Spanish", "ar": "Arabic" },
      "pronunciation": "IPA or phonetic",
      "partOfSpeech": "noun|verb|adjective|adverb|preposition|etc",
      "gender": "masculine|feminine" (for nouns),
      "exampleSentence": "French example sentence",
      "exampleTranslation": { "en": "...", "de": "...", "es": "...", "ar": "..." }
    }
  ]
}

For exercise sections:
{
  "type": "exercise",
  "exerciseType": "multiple_choice|fill_blank|translation|matching|true_false",
  "instructions": { "fr": "...", "en": "...", ... },
  "items": [
    {
      "id": "item-1",
      "prompt": { "fr": "...", "en": "..." },
      "options": ["option1", "option2", "option3", "option4"],
      "correctAnswer": "correct option",
      "explanation": { "fr": "...", "en": "..." }
    }
  ]
}

For dialogue sections:
{
  "type": "dialogue",
  "context": { "fr": "...", "en": "..." },
  "speakers": [
    { "id": "speaker1", "name": "Marie", "role": { "fr": "La cliente", "en": "The customer" } }
  ],
  "lines": [
    {
      "speakerId": "speaker1",
      "text": "French dialogue line",
      "translation": { "en": "...", "de": "...", "es": "...", "ar": "..." }
    }
  ]
}

Ensure all text that needs translation has entries for all requested languages.`;

export async function processLessonPDF(
  pdfText: string,
  options: ProcessingOptions
): Promise<{
  content: LessonContent;
  tokensUsed: number;
  cost: number;
  error?: string;
}> {
  try {
    // Get AI config
    const config = await getAIConfig();

    if (!config.features.contentProcessingEnabled) {
      throw new Error('AI content processing is disabled. Enable it in Admin > Settings.');
    }

    // Prepare languages list
    const languages = ['fr', 'en', ...options.targetLanguages.filter(l => l !== 'fr' && l !== 'en')];
    const languagesList = languages.join(', ');

    // Build the user prompt
    const userPrompt = USER_PROMPT_TEMPLATE
      .replace('{{LANGUAGES}}', languagesList)
      .replace('{{PDF_CONTENT}}', pdfText);

    console.log('Processing PDF with AI...');
    console.log(`Target languages: ${languagesList}`);
    console.log(`Model: ${config.openai.defaultModel}`);

    // Use unified chat completion
    const { content: responseContent, inputTokens, outputTokens, cost } = await chatCompletion({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      model: config.openai.defaultModel,
      temperature: 0.3,
      maxTokens: 16000,
      jsonMode: true,
    });

    if (!responseContent) {
      throw new Error('No response content from AI');
    }

    // Parse the JSON response
    const lessonContent = JSON.parse(responseContent) as LessonContent;

    const totalTokens = inputTokens + outputTokens;

    console.log(`Input tokens: ${inputTokens}`);
    console.log(`Output tokens: ${outputTokens}`);
    console.log(`Total tokens: ${totalTokens}`);
    console.log(`Cost: $${cost.toFixed(4)}`);

    // Validate the content structure
    validateLessonContent(lessonContent);

    return {
      content: lessonContent,
      tokensUsed: totalTokens,
      cost,
    };
  } catch (error) {
    console.error('PDF processing error:', error);

    let errorMessage = 'Failed to process PDF';
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return {
      content: {} as LessonContent,
      tokensUsed: 0,
      cost: 0,
      error: errorMessage,
    };
  }
}

function validateLessonContent(content: LessonContent) {
  if (!content.title || !content.sections || content.sections.length === 0) {
    throw new Error('Invalid lesson content structure');
  }

  if (!content.version || content.version !== '2.0') {
    content.version = '2.0';
  }

  if (!content.availableLanguages) {
    content.availableLanguages = Object.keys(content.title) as SupportedLanguage[];
  }

  if (!content.sourceLanguage) {
    content.sourceLanguage = 'fr';
  }

  content.sections.forEach((section, index) => {
    if (!section.id) {
      section.id = `section-${index + 1}`;
    }
    if (typeof section.order !== 'number') {
      section.order = index + 1;
    }
  });
}