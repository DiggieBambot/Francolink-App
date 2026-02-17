// src/lib/ai/pdf-extractor.ts

import pdf from 'pdf-parse';

export async function extractTextFromPDF(pdfBuffer: Buffer): Promise<{
  text: string;
  numPages: number;
  error?: string;
}> {
  try {
    const data = await pdf(pdfBuffer);
    
    // Clean up the text
    let text = data.text;
    
    // Remove excessive whitespace
    text = text.replace(/\s+/g, ' ');
    
    // Preserve line breaks for better structure
    text = text.replace(/\.\s+/g, '.\n');
    
    // Remove page numbers if they appear as standalone numbers
    text = text.replace(/^\d+$/gm, '');
    
    return {
      text: text.trim(),
      numPages: data.numpages,
    };
  } catch (error) {
    console.error('PDF extraction error:', error);
    return {
      text: '',
      numPages: 0,
      error: error instanceof Error ? error.message : 'Failed to extract PDF text',
    };
  }
}