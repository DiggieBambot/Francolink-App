// src/lib/ai/html-processor.ts

import { HtmlLessonContent, SupportedLanguage } from '@/types/lesson-content';
import { chatCompletion } from '../ai/client';
import { convertPdfToHtml } from '../pdf/pdf-to-html';
import { uploadPageImages } from '../pdf/image-uploader';

export async function processHtmlLesson(
  pdfBuffer: Buffer,
  lessonId: string,
  options: {
    targetLanguages: SupportedLanguage[];
    category: string;
    level: string;
  }
): Promise<{
  content: HtmlLessonContent;
  tokensUsed: number;
  cost: number;
  error?: string;
}> {
  try {
    console.log('Converting PDF to HTML...');
    
    // Step 1: Convert PDF to images and text
    const { pages, fullText, metadata } = await convertPdfToHtml(pdfBuffer);
    
    console.log(`Converted ${pages.length} pages`);
    
    // Step 2: Upload page images to storage
    console.log('Uploading images to storage...');
    const uploadedImages = await uploadPageImages(pages, lessonId);
    
    console.log(`Uploaded ${uploadedImages.length} images`);
    
    // Step 3: Use AI to extract metadata from text
    const languages = options.targetLanguages.join(', ');
    
    const metadataPrompt = `Analyze this French lesson content and extract metadata.

PDF Text Content:
${fullText.substring(0, 10000)} ${fullText.length > 10000 ? '...' : ''}

Provide translations in: ${languages}

Output JSON with:
{
  "title": { "fr": "...", "en": "...", ... },
  "subtitle": { "fr": "...", "en": "...", ... } (if found),
  "category": "${options.category}",
  "targetLevel": "${options.level}",
  "estimatedMinutes": (number, estimate based on content),
  "objectives": [
    { "fr": "...", "en": "...", ... }
  ],
  "tutorNotes": {
    "overview": { "fr": "...", "en": "..." },
    "commonMistakes": [{ "fr": "...", "en": "..." }],
    "assessmentTips": [{ "fr": "...", "en": "..." }]
  }
}`;

    const { content: metadataJson, inputTokens, outputTokens, cost } = await chatCompletion({
      messages: [
        {
          role: 'system',
          content: 'You are an expert at analyzing educational content. Extract metadata accurately and provide translations in all requested languages.'
        },
        {
          role: 'user',
          content: metadataPrompt
        }
      ],
      temperature: 0.3,
      jsonMode: true,
    });

    const metadata = JSON.parse(metadataJson);

    // Step 4: Build HTML lesson content
    const htmlContent: HtmlLessonContent = {
      type: 'html',
      version: '2.0',
      ...metadata,
      availableLanguages: options.targetLanguages,
      sourceLanguage: 'fr',
      pages: uploadedImages.map(img => ({
        pageNumber: img.pageNumber,
        imageUrl: img.url,
        width: img.width,
        height: img.height,
        textContent: pages.find(p => p.pageNumber === img.pageNumber)?.textContent,
      })),
    };

    console.log('HTML lesson processing complete');

    return {
      content: htmlContent,
      tokensUsed: inputTokens + outputTokens,
      cost,
    };
  } catch (error) {
    console.error('HTML processing error:', error);
    return {
      content: {} as HtmlLessonContent,
      tokensUsed: 0,
      cost: 0,
      error: error instanceof Error ? error.message : 'Processing failed',
    };
  }
}