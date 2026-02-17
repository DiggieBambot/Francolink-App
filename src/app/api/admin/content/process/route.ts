// src/app/api/admin/content/process/route.ts

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { SupportedLanguage, HtmlLessonContent } from '@/types/lesson-content';
import { chatCompletion } from '@/lib/ai/client';

// Use pdf-parse for text extraction
const pdfParse = require('pdf-parse');

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication and admin role
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check admin role
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (userData?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Get request body
    const body = await request.json();
    const { draftId, targetLanguages: requestedLanguages } = body;
    
    if (!draftId) {
      return NextResponse.json({ error: 'Draft ID required' }, { status: 400 });
    }
    
    // Fetch draft
    const { data: draft, error: draftError } = await supabase
      .from('lesson_drafts')
      .select('*')
      .eq('id', draftId)
      .single();
    
    if (draftError || !draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }
    
    // Update status to processing
    await supabase
      .from('lesson_drafts')
      .update({
        status: 'processing',
        progress: 10,
        updated_at: new Date().toISOString(),
      })
      .eq('id', draftId);
    
    // Get PDF path from uploaded file
    // The pdf_url contains the full public URL, we need to extract the path
    const urlParts = draft.pdf_url.split('/');
    const bucketIndex = urlParts.findIndex((part: string) => part === 'lesson-pdfs');
    const pdfPath = urlParts.slice(bucketIndex + 1).join('/');
    
    console.log('Downloading PDF from path:', pdfPath);
    
    // Download PDF from storage
    const { data: pdfData, error: downloadError } = await supabase.storage
      .from('lesson-pdfs')
      .download(pdfPath);
    
    if (downloadError || !pdfData) {
      console.error('Download error:', downloadError);
      throw new Error('Failed to download PDF from storage');
    }
    
    // Update progress
    await supabase
      .from('lesson_drafts')
      .update({ progress: 20 })
      .eq('id', draftId);
    
    // Convert to buffer
    const pdfBuffer = Buffer.from(await pdfData.arrayBuffer());
    
    // Extract text and page count using pdf-parse
    console.log('Extracting text from PDF...');
    let pdfInfo;
    try {
      pdfInfo = await pdfParse(pdfBuffer);
    } catch (parseError) {
      console.error('PDF parse error:', parseError);
      throw new Error('Failed to parse PDF file');
    }
    
    const pdfText = pdfInfo.text;
    const pageCount = pdfInfo.numpages;
    
    console.log(`Extracted ${pdfText.length} characters from ${pageCount} pages`);
    
    // Update progress
    await supabase
      .from('lesson_drafts')
      .update({ progress: 40 })
      .eq('id', draftId);
    
    // Determine target languages
    let targetLanguages: SupportedLanguage[] = ['fr', 'en'];
    
    if (requestedLanguages && Array.isArray(requestedLanguages)) {
      targetLanguages = requestedLanguages;
      console.log('Using requested languages:', targetLanguages);
    } else {
      targetLanguages = ['fr', 'en', 'de', 'es'];
      console.log('Using default languages:', targetLanguages);
    }
    
    // Ensure source language is always included
    if (!targetLanguages.includes('fr')) {
      targetLanguages.unshift('fr');
    }
    
    // Update progress
    await supabase
      .from('lesson_drafts')
      .update({ progress: 50 })
      .eq('id', draftId);
    
    // Build AI prompt for metadata extraction
    const languages = targetLanguages.join(', ');
    
    const metadataPrompt = `Analyze this French lesson content and extract comprehensive metadata.

PDF Text Content:
${pdfText.substring(0, 8000)}${pdfText.length > 8000 ? '...[content truncated]' : ''}

This lesson has ${pageCount} pages with embedded images and media that will be preserved.

Provide translations in these languages: ${languages}

Output a JSON object with:
{
  "title": { "fr": "...", "en": "...", "de": "...", "es": "...", "ar": "..." },
  "subtitle": { "fr": "...", "en": "...", "de": "...", "es": "...", "ar": "..." },
  "category": "${draft.category}",
  "targetLevel": "${draft.level}",
  "estimatedMinutes": (number based on content),
  "objectives": [
    { "fr": "...", "en": "...", "de": "...", "es": "...", "ar": "..." }
  ],
  "pages": [
    {
      "pageNumber": 1,
      "pageType": "cover|instruction|exercise|vocabulary|dialogue|content",
      "description": { "fr": "...", "en": "..." },
      "hasExercises": boolean,
      "hasVocabulary": boolean,
      "hasImages": true
    }
  ],
  "vocabulary": [
    {
      "term": "French term",
      "translation": { "en": "...", "de": "...", "es": "...", "ar": "..." },
      "pageNumber": 1,
      "pronunciation": "phonetic",
      "partOfSpeech": "noun|verb|etc",
      "gender": "masculine|feminine|neutral"
    }
  ],
  "exercises": [
    {
      "id": "ex-1",
      "type": "fill_blank|multiple_choice|translation|matching",
      "pageNumber": 1,
      "question": "...",
      "answer": "..."
    }
  ],
  "tutorNotes": {
    "overview": { "fr": "...", "en": "...", "de": "...", "es": "...", "ar": "..." },
    "commonMistakes": [{ "fr": "...", "en": "...", "de": "...", "es": "...", "ar": "..." }],
    "extensionActivities": [{ "fr": "...", "en": "...", "de": "...", "es": "...", "ar": "..." }],
    "assessmentTips": [{ "fr": "...", "en": "...", "de": "...", "es": "...", "ar": "..." }]
  }
}

Important:
- Extract ALL vocabulary items found in the lesson
- Identify ALL exercises with their types and answers
- Provide translations in ALL requested languages
- Each page should be described with its content type`;

    console.log('Sending to AI for metadata extraction...');
    
    // Call AI for metadata extraction
    const { content: metadataJson, inputTokens, outputTokens, cost } = await chatCompletion({
      messages: [
        {
          role: 'system',
          content: 'You are an expert educational content analyst. Extract all metadata accurately and provide complete translations in all requested languages. Pay special attention to identifying exercises, vocabulary, and the structure of each page.'
        },
        {
          role: 'user',
          content: metadataPrompt
        }
      ],
      temperature: 0.3,
      jsonMode: true,
      maxTokens: 8000,
    });

    // Update progress
    await supabase
      .from('lesson_drafts')
      .update({ progress: 80 })
      .eq('id', draftId);

    // Parse AI response
    let metadata;
    try {
      metadata = JSON.parse(metadataJson);
    } catch (parseError) {
      console.error('Failed to parse AI response:', metadataJson);
      throw new Error('Failed to parse AI response as JSON');
    }

    // Build HTML lesson content structure
    const htmlContent: HtmlLessonContent = {
      type: 'html',
      version: '2.0',
      
      // Metadata from AI
      title: metadata.title || { fr: draft.original_file_name },
      subtitle: metadata.subtitle,
      category: draft.category,
      targetLevel: draft.level,
      estimatedMinutes: metadata.estimatedMinutes || 15,
      objectives: metadata.objectives || [],
      availableLanguages: targetLanguages,
      sourceLanguage: 'fr',
      
      // PDF storage - use the original uploaded URL
      pdfUrl: draft.pdf_url,
      pageCount: pageCount,
      
      // Page metadata from AI
      pages: metadata.pages || Array.from({ length: pageCount }, (_, i) => ({
        pageNumber: i + 1,
        pageType: 'content' as const,
        hasImages: true,
      })),
      
      // Extracted content
      vocabulary: metadata.vocabulary || [],
      exercises: metadata.exercises || [],
      
      // Tutor notes
      tutorNotes: metadata.tutorNotes,
    };

    const tokensUsed = inputTokens + outputTokens;

    console.log(`Processing complete. Tokens: ${tokensUsed}, Cost: $${cost.toFixed(4)}`);

    // Update progress
    await supabase
      .from('lesson_drafts')
      .update({ progress: 90 })
      .eq('id', draftId);

    // Save processed content
    const { error: updateError } = await supabase
      .from('lesson_drafts')
      .update({
        content: htmlContent,
        status: 'review',
        progress: 100,
        tokens_used: tokensUsed,
        processing_cost_usd: cost,
        processed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', draftId);

    if (updateError) {
      console.error('Failed to save content:', updateError);
      throw new Error('Failed to save processed content');
    }

    // Update monthly stats (optional)
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      
      await supabase.rpc('increment_processing_stats', {
        p_year: year,
        p_month: month,
        p_provider: draft.ai_provider || 'openai',
        p_tokens: tokensUsed,
        p_cost: cost,
        p_success: true,
      });
    } catch (statsError) {
      console.error('Stats update failed:', statsError);
    }

    return NextResponse.json({
      success: true,
      draftId,
      tokensUsed,
      cost,
      contentType: 'html',
      pageCount,
      vocabularyCount: htmlContent.vocabulary?.length || 0,
      exerciseCount: htmlContent.exercises?.length || 0,
      languagesProcessed: targetLanguages,
      message: `PDF processed successfully with ${pageCount} pages preserved in ${targetLanguages.length} languages`,
    });

  } catch (error) {
    console.error('Processing error:', error);

    // Try to update draft status to failed
    try {
      const bodyForError = await request.clone().json();
      const { draftId } = bodyForError;

      if (draftId) {
        const supabase = await createClient();

        await supabase
          .from('lesson_drafts')
          .update({
            status: 'failed',
            error_message: error instanceof Error ? error.message : 'Processing failed',
            updated_at: new Date().toISOString(),
          })
          .eq('id', draftId);
      }
    } catch (updateError) {
      console.error('Failed to update draft status:', updateError);
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Processing failed' },
      { status: 500 }
    );
  }
}